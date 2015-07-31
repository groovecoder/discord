'use strict';

var commenter = require('./commenter');
var config = require('./config');
var redisQueue = require('./redisQueue');

var lastCommentTimestamp = 0;

// Process comment jobs
// Pause for commentWait milleseconds between comment submissions
redisQueue.process('comment', function(job, done) {
    var now = Date.now();
    var waitRemaining = 0;

    var nextCommentTimestamp = lastCommentTimestamp + parseInt(config.commentWait);

    if (nextCommentTimestamp > now) {
        waitRemaining = nextCommentTimestamp - now;
    }

    setTimeout(function() {
        commenter.postPullRequestComment(job.data.commentURL, job.data.comment, job.data.filename, job.data.sha, job.data.line, done);
        lastCommentTimestamp = Date.now(); // Use a new, fresh timestamp
    }, waitRemaining);
});
