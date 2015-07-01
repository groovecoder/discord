'use strict';

var github = require('octonode');
var path = require('path');
var Q = require('q');
var commenter = require('./commenter');
var diff = require('./diffParse');
var logger = require('./logger');
var processor = require('./processor');

var configFilename = '.doiuse';
var githubClient = github.client();

function handle(request, response) {
    var eventType = request.headers['x-github-event'];
    var metadata = request.body;
    var originRepo;

    response.status(200).send('OK');

    // React to pull requests only
    if (eventType === 'pull_request') {
        originRepo = metadata.pull_request.head.repo.full_name;

        logger.log('Compatibility test requested from:', originRepo);

        processPullRequest(
            metadata.repository.full_name,
            originRepo,
            metadata.pull_request.head.ref,
            metadata.number,
            metadata.pull_request.review_comments_url
        );
    }
}

function processPullRequest(destinationRepo, originRepo, originBranch, prNumber, commentURL) {
    var commits = getPullRequestCommits(destinationRepo, prNumber);
    var config = getConfig(originRepo, originBranch);

    // Once we pull down commit metadata and configuration...
    Q.all([commits, config]).spread(function(commits, config) {

        // Go through each commit...
        commits.forEach(function(currentCommit) {

            // And each file of each commit... and process the files.
            currentCommit.files.forEach(function(file) {
                var process;

                function handleIncompatibility(incompatibility) {
                    var line = diff.lineToIndex(file.patch, incompatibility.usage.source.start.line);
                    var comment = incompatibility.featureData.title + ' not supported by: ' + incompatibility.featureData.missing;
                    commenter.postPullRequestComment(commentURL, comment, file.filename, currentCommit.sha, line);
                }

                switch (path.extname(file.filename).toLowerCase()) {
                    case '.css':
                        process = processor.processCSS;
                        break;
                    case '.styl':
                        process = processor.processStylus;
                        break;
                }

                process(originRepo, originBranch, file, config, handleIncompatibility);
            });
        });
    }).catch(function(error) {
        logger.error(error);
    });
}

function getConfig(repo, branch) {
    var deferred = Q.defer();
    var repoClient = githubClient.repo(repo);

    repoClient.contents(configFilename, branch, function(error, configFileMetadata) {
        var config = ['last 2 versions']; // Default configuration

        // If the file is found, massage the file contents and use that configuration
        if (!error) {
            // Consider text separated by commas and linebreaks to be individual options
            config = new Buffer(configFileMetadata.content, 'base64').toString()
                .replace(/\r?\n|\r/g, ', ')
                .split(/,\s*/);
        }

        deferred.resolve(config);
    });

    return deferred.promise;
}

function getPullRequestCommits(repo, number) {
    var deferred = Q.defer();

    var prClient = githubClient.pr(repo, number);

    prClient.commits(function(error, commits) {
        var promises = [];

        if (error) {
            deferred.reject('Error fetching commits from pull request ' + number + ' of ' + repo + ':', error);
        } else {

            // Build an array of commit detail promises
            commits.forEach(function(currentCommit) {
                promises.push(getCommitDetail(repo, currentCommit.sha));
            });

            // When all of the commit detail promises have been resolved,
            // resolve an array of commit detail
            Q.all(promises).spread(function() {
                deferred.resolve(Array.prototype.slice.call(arguments));
            });

        }
    });

    return deferred.promise;
}

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

exports.handle = handle;
