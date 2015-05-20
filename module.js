var request = require('request');
var diff = require('./diffParse');
var postcss = require('postcss');
var doiuse = require('doiuse');
var path = require('path');
var token = "token " + process.env.OAUTH_TOKEN;

var hook = function(req, res) {
    var localToken = token;
    res.send(200, '{"message":"ok","result":"ok"}');
    github(req.body, localToken);
};

var github = function(payload, localToken) {
    // TODO: Only acknowledge pushes to the "Master" branch.
    console.log(payload);
    var commitUrl = payload.repository.commits_url.replace('{/sha}', '/' + payload.head_commit.id);
    request({
        url: commitUrl,
        headers: {
            'User-Agent': 'shouldiuse'
        }
    }, function(err, res, body) {
        var parsedBody = JSON.parse(body);
        var files = parsedBody.files;
        parseCSS(files, commitUrl, localToken, function(usageInfo) {
            console.log(usageInfo);
        });
    });
};

var parseCSS = function(files, commitUrl, token, cb) {
    var commentUrl = commitUrl + '/comments';
    files.forEach(function(file, index) {
        if (path.extname(file.filename) == '.css') {
            var rawUrl = file.raw_url;
            request({
                url: rawUrl,
                headers: {
                    'User-Agent': 'shouldiuse'
                }
            }, function(err, res, body) {
                var addFeature = function(feature) {
                    var diffIndex = parseDiff(feature, file);
                    console.log(diffIndex);
                    renderComment(commentUrl, file.filename, feature.message, diffIndex, token);
                };
                contents = body;
                postcss(doiuse({
                    browserSelection: ['ie >= 8', '> 1%'],
                    onFeatureUsage: addFeature
                })).process(contents, {
                    from: "/" + file.filename
                }).then(function(res) {
                    //renderComment(commentUrl, commit, featureMessage, 0, token);
                });
            });
        }
    });
};

var renderComment = function(url, file, comment, position, token) {
    console.log('renderingcomment');
    console.log(url);
    console.log(file);
    console.log(comment);
    console.log(position);
    console.log(token);
    request({
        url: url,
        method: "POST",
        headers: {
            "User-Agent": "github-cleanpr",
            "Authorization": token
        },
        body: JSON.stringify({
            body: comment,
            path: file,
            position: position
        })
    }, function(err, res, body) {
        console.log(err);
        console.log(body);
    });
};

var parseDiff = function(feature, file) {
    return diff.lineToIndex(file.patch, feature.usage.source.start.line);
};
exports.hook = hook;
