'use strict';

/**
 * NOTE: This module won't be necessary once octonode implements
 * create_pull_request_comment.
 */

var sendRequest = require('request');

var config = require('./config');
var logger = require('./logger');

var commentQueue = [];
var queueDelay = 3;
var limitResetDelay = 20;

/**
 * Post a line comment on a particular pull request. commentURL should be an
 * instance of review_comments_url.
 * https://developer.github.com/v3/activity/events/types/#pullrequestevent */
function postPullRequestComment(commentURL, comment, filename, commitSHA, line) {

    addCommentQueue(function(cb){
        sendRequest({
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
        }, function(error,response,body) {
            if (error) logger.error('Error posting pull request comment to ' + commentURL + ' regarding commit ' + commitSHA + ':', error);
            if (body) logger.info('comment post accepted for ' + commitSHA +'.  Responded with '+body);
            if (response.statusCode === 403) {
                cb(false);
            }else{
                cb(true);
            }
        });
    });
}

function addCommentQueue(cb){
    commentQueue.push(cb);
}


function processCommentQueue(){
    if(commentQueue.length > 0){
        commentQueue[0](function(res){
            if(res){
                commentQueue.shift();
	        setTimeout(processCommentQueue,queueDelay*1000);
            }else{
	        setTimeout(processCommentQueue,queueDelay*limitResetDelay*1000);
            }
        });
    }else{
        setTimeout(processCommentQueue,queueDelay*500);
    }
}

processCommentQueue();

exports.postPullRequestComment = postPullRequestComment;
