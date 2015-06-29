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
    var originRepo;

    response.status(200).send('OK');

    // React to pull requests only
    if (eventType === 'pull_request') {
        originRepo = metadata.pull_request.head.repo.full_name;

        logger.log('Pull request received:', metadata);
        trackUsage(originRepo);

        addPullRequestComments(
            metadata.repository.full_name,
            originRepo,
            metadata.pull_request.head.ref,
            metadata.number,
            metadata.pull_request.review_comments_url
        );
    }
}

// TODO: Remove the commentURL parameter once parseCSS is refactored
function addPullRequestComments(destinationRepo, originRepo, originBranch, prNumber, commentURL) {
    getConfig(originRepo, originBranch, function(config) {

        getPullRequestCommits(destinationRepo, prNumber, function(error, commits) {

            if (error) return logger.error('getPullRequestCommits failed:', error);
            commits.forEach(function(currentCommit) {
                getCommitDetail(originRepo, currentCommit.sha, function(error, currentCommitDetail) {
                    if (error) return logger.error('getCommitDetail failed:', error);
                    parseCSS(currentCommitDetail.files, config, commentURL, token, function(usageInfo) {}, currentCommit.sha);
                });
            });

        });

    });
}

function getConfig(repo, branch, callback) {
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

function getPullRequestCommits(repo, number, callback) {
    var prClient = githubClient.pr(repo, number);
    prClient.commits(callback);
}

function getCommitDetail(repo, sha, callback) {
    var repoClient = githubClient.repo(repo);
    repoClient.commit(sha, callback);
}

function trackUsage(repo) {
    logger.log('Compatibility test requested from:', repo);
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
        if (error) return logger.error('renderComment/sendRequest failed:', error);
    });
};

var parseDiff = function(feature, file) {
    return diff.lineToIndex(file.patch, feature.usage.source.start.line);
};

exports.handle = handle;
