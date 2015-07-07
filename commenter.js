'use strict';

/**
 * NOTE: This module won't be necessary once octonode implements
 * create_pull_request_comment.
 */

var sendRequest = require('request');

var logger = require('./logger');

/**
 * Post a line comment on a particular pull request. commentURL should be an
 * instance of review_comments_url.
 * https://developer.github.com/v3/activity/events/types/#pullrequestevent
 */
function postPullRequestComment(commentURL, comment, filename, commitSHA, line) {
    sendRequest({
        url: commentURL,
        method: 'POST',
        headers: {
            'User-Agent': 'Discord',
            'Authorization': 'token ' + process.env.OAUTH_TOKEN
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
