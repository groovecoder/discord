'use strict';

// NOTE: This module won't be necessary once octonode implements
// create_pull_request_comment.

var logger = require('./logger');
var sendRequest = require('request');

var productName = 'Discord';
var token = 'token ' + process.env.OAUTH_TOKEN;

function postPullRequestComment(commentURL, comment, filename, commitSHA, line) {
    sendRequest({
        url: commentURL,
        method: 'POST',
        headers: {
            'User-Agent': productName,
            'Authorization': token
        },
        body: JSON.stringify({
            body: comment,
            path: filename,
            commit_id: commitSHA,
            position: line
        })
    }, function(error) {
        if (error) return logger.error('Error posting pull request comment to ' + commentURL + ' regarding commit ' + commitSHA + ':', error);
    });
}

exports.postPullRequestComment = postPullRequestComment;
