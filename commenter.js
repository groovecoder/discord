'use strict';

var doiuse = require('doiuse');
var path = require('path');
var postcss = require('postcss');
var sendRequest = require('request');
var diff = require('./diffParse');
var parseSource = require('./sourceParse');

var token = 'token ' + process.env.OAUTH_TOKEN;
var productName = 'Discord';

var comment = function(request, response) {
    var payload = request.body;
    var configMetadataURL = payload.repository.contents_url.replace('{+path}', '.doiuse');


    response.status(200).send('ok');

    // We only support pull requests at this time
    if (request.headers['x-github-event'] !== 'pull_request') {
        return;
    }

    // TODO: Only acknowledge pushes to the "Master" branch.
    console.log('Repo: ' + payload.repository.full_name);
    console.log('Payload:');
    console.log(payload);

    sendRequest({
        url: configMetadataURL,
        headers: {
            'User-Agent': productName
        }
    }, function(error, response, body) {
        var configMetadata = JSON.parse(body);
        var config = ['last 2 versions'];
        var commitsURL = payload.pull_request.commits_url;
        var commentURL = payload.pull_request.review_comments_url;
        var configMetadataContent;

        if (configMetadata.content) {
            configMetadataContent = new Buffer(configMetadata.content, 'base64').toString();

            // Consider text separated by commas and linebreaks to be individual
            // options
            config = configMetadataContent.replace(/\r?\n|\r/g, ', ').split(/,\s*/);
        }

        sendRequest({
            url: commitsURL,
            headers: {
                'User-Agent': productName
            }
        }, function(error, response, body) {
            var commits = JSON.parse(body);

            commits.forEach(function(element, index) {
                sendRequest({
                    url: element.url,
                    headers: {
                        'User-Agent': productName
                    }
                }, function(error, response, body) {
                    var commitMeta = JSON.parse(body);
                    var commitFiles = commitMeta.files;
                    var commitSHA = commitMeta.sha;
                    parseCSS(commitFiles, config, commentURL, token, function(usageInfo) {}, commitSHA);
                });
            });
        });
    });
};

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
        console.error(error);
    });
};

var parseDiff = function(feature, file) {
    return diff.lineToIndex(file.patch, feature.usage.source.start.line);
};

exports.comment = comment;
