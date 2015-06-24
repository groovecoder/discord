'use strict';

var doiuse = require('doiuse');
var github = require('octonode');
var path = require('path');
var postcss = require('postcss');
var sendRequest = require('request');
var diff = require('./diffParse');
var logger = require('./logger');
var parseSource = require('./sourceParse');

var token = 'token ' + process.env.OAUTH_TOKEN;
var productName = 'Discord';
var githubClient = github.client();

function handle(request, response) {
    var eventType = request.headers['x-github-event'];
    var metadata = request.body;

    response.status(200).send('OK');

    // React to pull requests only
    if (eventType === 'pull_request') {
        logger.log(metadata);
        comment(metadata);
    }
}

function comment(metadata) {
    var pullRequestNumber = metadata.number;
    var destinationRepo = metadata.repository.full_name;
    var originRepo = metadata.pull_request.head.repo.full_name;
    var originBranch = metadata.pull_request.head.ref;

    trackUsage(originRepo);

    getConfiguration(originRepo, originBranch, function(config) {
        var prClient = githubClient.pr(destinationRepo, pullRequestNumber);

        prClient.commits(function(error, commits) {
            if (error) return logger.logError(error);

            commits.forEach(function(currentCommit) {
                var originRepoClient = githubClient.repo(originRepo);
                originRepoClient.commit(currentCommit.sha, function(error, currentCommitDetail) {
                    if (error) return logger.logError(error);
                    parseCSS(currentCommitDetail.files, config, metadata.pull_request.review_comments_url, token, function(usageInfo) {}, currentCommit.sha);
                });
            });
        });
    });
}

function getConfiguration(repo, branch, callback) {
    var repoClient = githubClient.repo(repo);
    var configFilename = '.doiuse';

    repoClient.contents(configFilename, branch, function(error, configFileMetadata) {
        var defaultConfig = ['last 2 versions'];
        var configFileContent, config;

        if (error) {
            // The configuration file does not exist
            config = defaultConfig;
        } else {
            configFileContent = new Buffer(configFileMetadata.content, 'base64').toString();

            // Consider text separated by commas and linebreaks to be individual options
            config = configFileContent.replace(/\r?\n|\r/g, ', ').split(/,\s*/);
        }

        callback(config);
    });
}

function trackUsage(repo) {
    logger.log(repo, 'Compatibility test requested from:');
}

var parseCSS = function(files, config, commentURL, token, cb, sha) {
    files.forEach(function(file, index) {
        var addFeature = function(feature) {
            var diffIndex = parseDiff(feature, file);
            var comment = feature.featureData.title + ' not supported by: ' + feature.featureData.missing;
            renderComment(commentURL, file.filename, comment, diffIndex, token, sha);
        };
        if (path.extname(file.filename) === '.styl') {
            parseSource.stylus(file, config, addFeature);
        }
        if (path.extname(file.filename) === '.css') {
            var rawURL = file.raw_url;
            sendRequest({
                url: rawURL,
                headers: {
                    'User-Agent': productName
                }
            }, function(error, response, body) {
                var contents = body;
                postcss(doiuse({
                    browsers: config,
                    onFeatureUsage: addFeature
                })).process(contents, {
                    from: '/' + file.filename
                }).then(function(response) {});
            });
        }
    });
};

var renderComment = function(url, file, comment, position, token, sha) {
    sendRequest({
        url: url,
        method: 'POST',
        headers: {
            'User-Agent': productName,
            'Authorization': token
        },
        body: JSON.stringify({
            body: comment,
            path: file,
            commit_id: sha,
            position: position
        })
    }, function(error, response, body) {
        if (error) return logger.logError(error);
    });
};

var parseDiff = function(feature, file) {
    return diff.lineToIndex(file.patch, feature.usage.source.start.line);
};

exports.handle = handle;
