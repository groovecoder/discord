'use strict';

var request = require('request');
var diff = require('./diffParse');
var parseSource = require('./sourceParse');
var postcss = require('postcss');
var doiuse = require('doiuse');
var path = require('path');
var token = 'token ' + process.env.OAUTH_TOKEN;

var hook = function(req, res) {
    var localToken = token;
    res.send(200, '{"message":"ok","result":"ok"}');
    github(req.body, localToken);
};

var github = function(payload, localToken) {
    // TODO: Only acknowledge pushes to the "Master" branch.
    var commitUrl = payload.repository.commits_url.replace('{/sha}', '/' + payload.head_commit.id);
    request({
        url: commitUrl,
        headers: {
            'User-Agent': 'YouShouldUse'
        }
    }, function(err, res, body) {
        var parsedBody = JSON.parse(body);
        var files = parsedBody.files;
        var configMetadataURL = payload.repository.contents_url.replace('{+path}', '.doiuse');
        request({
            url: configMetadataURL,
            headers: {
                'User-Agent': 'YouShouldUse'
            }
        }, function(err, res, body) {
            var configMetadata = JSON.parse(body);
            var config = ['last 2 versions'];

            if (configMetadata.content) {
                var configMetadataContent = new Buffer(configMetadata.content, 'base64').toString();
                config = configMetadataContent.replace(/\r?\n|\r/g, '').split(/,\s*/);
            }

            parseCSS(files, config, commitUrl, localToken, function(usageInfo) {});
        });
    });
};

var parseCSS = function(files, config, commitUrl, token, cb) {
    var commentUrl = commitUrl + '/comments';

    files.forEach(function(file, index) {
        var addFeature = function(feature) {
            var diffIndex = parseDiff(feature, file);
            var comment = feature.featureData.title + ' not supported by: ' + feature.featureData.missing;
            renderComment(commentUrl, file.filename, comment, diffIndex, token);
        };
        if (path.extname(file.filename) === '.styl') {
            parseSource.stylus(file, config, addFeature);
        }
        if (path.extname(file.filename) === '.css') {
            var rawUrl = file.raw_url;
            request({
                url: rawUrl,
                headers: {
                    'User-Agent': 'YouShouldUse'
                }
            }, function(err, res, body) {
                var contents = body;
                postcss(doiuse({
                    browsers: config,
                    onFeatureUsage: addFeature
                })).process(contents, {
                    from: '/' + file.filename
                }).then(function(res) {
                    //renderComment(commentUrl, commit, featureMessage, 0, token);
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
            'User-Agent': 'YouShouldUse',
            'Authorization': token
        },
        body: JSON.stringify({
            body: comment,
            path: file,
            position: position
        })
    }, function(err, res, body) {
        console.log(err);
    });
};

var parseDiff = function(feature, file) {
    return diff.lineToIndex(file.patch, feature.usage.source.start.line);
};
exports.hook = hook;
