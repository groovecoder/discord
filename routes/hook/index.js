'use strict';

var express = require('express');
var router = express.Router();

var github = require('octonode');
var kue = require('kue');
var Q = require('q');

var processor = require('./processor');
var diff = require('./diffParse');

var logger = require('../../lib/logger');
var utils = require('../../lib/utils');
var config = require('../../lib/config');
var models = require('../../models');

var configFilename = '.discord';
var githubClient = github.client(config.token);

router.post('/', function(request, response) {
    var eventType = request.headers['x-github-event'];
    var metadata = request.body;
    var pr, originRepo;

    response.status(200).send('OK');

    if (eventType === 'ping') {
        originRepo = metadata.repository.full_name;

        // Record that someone installed Discord
        models.Ping.create({
            repo: originRepo
        });
    } else if (eventType === 'pull_request') {
        pr = metadata.pull_request;
        originRepo = pr.head.repo.full_name;

        logger.log('Compatibility test requested from:', originRepo);

        processPullRequest(
            metadata.repository.full_name,
            originRepo,
            pr.head.ref,
            metadata.number,
            pr.review_comments_url
        );
    } else {
        logger.info('Invalid event type (', eventType, ') requested by:', originRepo);
    }
});

/**
 * React to a new pull request. Go through all changes to stylesheets, test
 * those changes, and report any incompatibilities.
 */
function processPullRequest(destinationRepo, originRepo, originBranch, prNumber, commentURL) {
    var commits = getPullRequestCommits(destinationRepo, prNumber);
    var discordConfig = getConfig(originRepo, originBranch);

    // Once we have pulled down commit metadata and Discord configuration...
    Q.all([commits, discordConfig]).spread(function(commits, discordConfig) {

        // Go through each commit...
        commits.forEach(function(currentCommit) {

            // And each file of each commit... and report on the changes.
            currentCommit.files.forEach(function(file) {

                processor.process(githubClient, originRepo, originBranch, file, discordConfig, function(incompatibility) {
                    // Callback for handling an incompatible line of code
                    var line = diff.lineToIndex(file.patch, incompatibility.usage.source.start.line);
                    var comment = incompatibility.featureData.title + ' not supported by: ' + incompatibility.featureData.missing;

                    var redisQueue = kue.createQueue({
                        redis: config.redisURL
                    });

                    // Create a Redis job that will submit the comment
                    var commentJob = redisQueue.create('comment', {
                        commentURL: commentURL,
                        sha: currentCommit.sha,
                        repo: destinationRepo,
                        pr: prNumber,
                        filename: file.filename,
                        line: line,
                        comment: comment,
                        incompatibleFeature: incompatibility.featureData.title
                    });

                    // If the comment is rejected, re-attempt several times with
                    // exponentially longer waits between each attempt.
                    commentJob.attempts(config.commentAttempts);
                    commentJob.backoff({
                        type: 'exponential'
                    });

                    // If the comment is rejected after several attempts, log an
                    // error.
                    commentJob.on('failed', function() {
                        logger.error('Error posting comment to line ' + line + ' of ' + file.filename + ' in ' + originRepo + ' pull request #' + prNumber);
                    });

                    commentJob.save(function(error) {
                        if (error) return logger.error(error);
                    });
                });

            });

        });
    }).catch(logger.error);
}

/**
 * Get the Discord configuration for a repository at a particular branch.
 */
function getConfig(repo, branch) {
    var deferred = Q.defer();

    githubClient.repo(repo).contents(configFilename, branch, function(error, configFileMetadata) {
        var discordConfig = ['last 2 versions']; // Default configuration

        // Only replace the default config if the configuration file exists and has content
        if (!error && configFileMetadata.content) {
            // Consider text separated by commas and linebreaks to be individual options
            discordConfig = utils.prepareContent(configFileMetadata.content).replace(/\r?\n|\r/g, ', ').split(/,\s*/);
        }

        deferred.resolve(discordConfig);
    });

    return deferred.promise;
}

/**
 * Get an array of detailed metadata about the commits of a given pull request.
 * Metadata format: https://developer.github.com/v3/repos/commits/#get-a-single-commit
 */
function getPullRequestCommits(repo, number) {
    var deferred = Q.defer();

    githubClient.pr(repo, number).commits(function(error, commits) {
        var promises = [];

        if (error) return deferred.reject('Error fetching commits from pull request ' + number + ' of ' + repo + ':', error);

        // Build an array of commit detail promises
        commits.forEach(function(currentCommit) {
            promises.push(getCommitDetail(repo, currentCommit.sha));
        });

        // When all of the commit detail promises have been resolved,
        // resolve an array of commit detail
        Q.all(promises).spread(function() {
            deferred.resolve(Array.prototype.slice.call(arguments));
        });

    });

    return deferred.promise;
}

/**
 * Get detailed metadata about a single commit.
 * Metadata format: https://developer.github.com/v3/repos/commits/#get-a-single-commit
 */
function getCommitDetail(repo, sha) {
    var deferred = Q.defer();
    var repoClient = githubClient.repo(repo);

    repoClient.commit(sha, function(error, commitDetail) {
        if (error) {
            deferred.reject('Error fetching detail of commit ' + sha + ' from ' + repo + ':', error);
        } else {
            deferred.resolve(commitDetail);
        }
    });

    return deferred.promise;
}

module.exports = router;
