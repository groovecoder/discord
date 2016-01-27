'use strict';

/**
 * NOTE: This module won't be necessary once octonode implements
 * create_pull_request_comment.
 */

var Q = require('q');
var request = require('request');

var config = require('./config');
var models = require('../models');

/**
 * Post a line comment on a particular pull request. commentURL should be an
 * instance of review_comments_url.
 * https://developer.github.com/v3/activity/events/types/#pullrequestevent
 */
function postPullRequestComment(commentURL, commitSHA, repo, pr, filename, line, comment, incompatibleFeature, done) {
    var alreadyCommented = commentExists(repo, pr, filename, line, incompatibleFeature);
    alreadyCommented.then(function(alreadyCommented) {
        if (!alreadyCommented) {
            request({
                url: commentURL,
                method: 'POST',
                headers: {
                    'User-Agent': config.brand,
                    'Authorization': 'token ' + config.token
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
                    models.Comment.create({
                        repo: repo,
                        pr: pr,
                        filename: filename,
                        line: line,
                        feature: incompatibleFeature
                    }).then(function() {
                        done();
                    });
                }
            });

        }
    });
}

/**
 * Return true if a comment has already been posted about this incompatibility.
 */
function commentExists(repo, pr, filename, line, incompatibleFeature) {
    var deferred = Q.defer();

    models.Comment.count({
        where: {
            repo: repo,
            pr: pr,
            filename: filename,
            line: line,
            feature: incompatibleFeature
        }
    }).then(
        // Success callback (a matching comment was found)
        function(count) {
            if (count > 0) {
                deferred.resolve(true);
            } else {
                deferred.resolve(false);
            }
        },

        // Failure callback (no matching comments were found)
        function(error) {
            deferred.reject(error);
        }
    );

    return deferred.promise;
}

exports.postPullRequestComment = postPullRequestComment;
