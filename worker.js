'use strict';

var kue = require('kue');

var commenter = require('./lib/commenter');
var config = require('./lib/config');

var redisQueue = kue.createQueue({
    redis: config.redisURL
});
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
        commenter.postPullRequestComment(job.data.commentURL, job.data.sha, job.data.repo, job.data.pr, job.data.filename, job.data.line, job.data.comment, job.data.incompatibleFeature, done);
        lastCommentTimestamp = Date.now(); // Use a new, fresh timestamp
    }, waitRemaining);
});
