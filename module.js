'use strict';

var doiuse = require('doiuse');
var path = require('path');
var postcss = require('postcss');
var request = require('request');
var diff = require('./diffParse');
var parseSource = require('./sourceParse');

var token = 'token ' + process.env.OAUTH_TOKEN;
var productName = 'Discord';

var hook = function(request, response) {
    var localToken = token;
    response.status(200).send('ok');
    github(request.body, localToken);
};

var github = function(payload, localToken) {
    var headCommitURL = payload.repository.commits_url.replace('{/sha}', '/' + payload.head_commit.id);

    console.log("Repo: " + payload.repository.full_name);

    request({
        url: headCommitURL,
        headers: {
            'User-Agent': productName
        }
    }, function(error, response, body) {
        var parsedBody = JSON.parse(body);
        var files = parsedBody.files;
        var configMetadataURL = payload.repository.contents_url.replace('{+path}', '.doiuse');
        request({
            url: configMetadataURL,
            headers: {
                'User-Agent': productName
            }
        }, function(error, response, body) {
            var configMetadata = JSON.parse(body);
            var config = ['last 2 versions'];

            if (configMetadata.content) {
                var configMetadataContent = new Buffer(configMetadata.content, 'base64').toString();
                config = configMetadataContent.replace(/\r?\n|\r/g, '').split(/,\s*/);
            }

            parseCSS(files, config, headCommitURL, localToken, function(usageInfo) {});
        });
    });
};

var parseCSS = function(files, config, headCommitURL, token, cb) {
    var commentURL = headCommitURL + '/comments';

    files.forEach(function(file, index) {
        var addFeature = function(feature) {
            var diffIndex = parseDiff(feature, file);
            var comment = feature.featureData.title + ' not supported by: ' + feature.featureData.missing;
            renderComment(commentURL, file.filename, comment, diffIndex, token);
        };
        if (path.extname(file.filename) === '.styl') {
            parseSource.stylus(file, config, addFeature);
        }
        if (path.extname(file.filename) === '.css') {
            var rawURL = file.raw_url;
            request({
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
                }).then(function(response) {
                });
            });
        }
    });
};

var renderComment = function(url, file, comment, position, token) {
    request({
        url: url,
        method: 'POST',
        headers: {
            'User-Agent': productName,
            'Authorization': token
        },
        body: JSON.stringify({
            body: comment,
            path: file,
            position: position
        })
    }, function(error, response, body) {
        console.error(error);
    });
};

var parseDiff = function(feature, file) {
    return diff.lineToIndex(file.patch, feature.usage.source.start.line);
};

exports.hook = hook;
