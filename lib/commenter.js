'use strict';

/**
 * NOTE: This module won't be necessary once octonode implements
 * create_pull_request_comment.
 */

var request = require('request');

var config = require('./config');

/**
 * Post a line comment on a particular pull request. commentURL should be an
 * instance of review_comments_url.
 * https://developer.github.com/v3/activity/events/types/#pullrequestevent
 */
function postPullRequestComment(commentURL, comment, filename, commitSHA, line, done) {

    request({
        url: commentURL,
        method: 'POST',
        headers: {
            'User-Agent': config('brand'),
            'Authorization': 'token ' + config('token')
        },
        body: JSON.stringify({
            body: comment,
            path: filename,
            commit_id: commitSHA,
            position: line
        })
    }, function(error, response) {
        // If the comment could not be submitted, notify Redis so that the job
        // can be re-attempted later. Otherwise, mark the job as done.
        if (error || response.statusCode === 403) {
            return done(new Error('Comment could not be submitted'));
        } else {
            done();
        }
    });
}

exports.postPullRequestComment = postPullRequestComment;
