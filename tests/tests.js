'use strict';

var fs = require('fs');
var path = require('path');

var chai = require('chai');
var request = require('request');
var nock = require('nock');
var assert = chai.assert;

var config = require('../config');
var hook = require('../hook');
var app = require('../app');

var appHost = [config.protocol, '//', config.host, ':', config.port].join('');
var githubHost = 'https://api.github.com';
var urlPatterns = {
    pr: '/repos/{repo}/pulls/{number}',
    comment: '/repos/{repo}/pulls/{number}/comments',
    commits: '/repos/{repo}/pulls/{number}/commits',
    commit: '/repos/{repo}/commits/{sha}',
    contents: '/repos/{repo}/contents/{path}?ref={branch}'
};

/*
    How to scrub the payloads taken from test repo/user:

    -  Change username to `x_user`
    -  Change respository name to `x_repo`
    -  Change sender.id to `8675309`
    -  Change user's real name to `Test User`
    -  Change user's real email to `testuser@somewhere.com`

    How to run tests:

    -  In bash shell:  mocha tests
*/

describe('Discord Tests', function() {

    /**
     * Test that the homepage returns the index.html static content
     */
    describe('Homepage Tests', function() {
        it('Should confirm homepage is working properly', function(done) {
            request(appHost + '/', function(error, response, body) {
                assert.ok(!error && response.statusCode === 200);
                done();
            });
        });
    });

    /**
     * Tests related to pull requests sent to the hook
     */
    describe('Hook Tests', function() {

        var samplePayload = getFileContents('test1', 'payload');
        var sampleHeaders = getFileContents('test1', 'headers');

        /**
         * Test that the hook returns a 200 when posted to
         */
        it('Hook returns a 200 OK when posted to', function(done) {
            sendPost(function(error, response, body) {
                assert.ok(!error && response.statusCode === 200 && body === 'OK');
                done();
            });
        });

        /**
         * Tests that the "test1" PR performs the functions which its conditions match:
         *      -  A pull request with 1 commit
         *      -  The commit has one file
         *      -  The file has one CSS property which should trigger a warning
         *      -  If everything runs its course, there should be one call to the commenting endpoint
         */
        it('Running simplest Discord case: 1 commit, 1 file, 1 expected comment', function(done) {
            var repoFullName = samplePayload.pull_request.base.repo.full_name;

            var commitsPayload = getFileContents('test1', 'commits');
            var commit1Payload = getFileContents('test1', 'commit1');
            var commit1Contents = getFileContents('test1', 'commit1-contents');
            var prNumber = samplePayload.pull_request.number;

            setupNock(urlPatterns.commits, {
                repo: repoFullName,
                number: prNumber
            }, commitsPayload);

            setupNock(urlPatterns.commit, {
                repo: repoFullName,
                sha: commit1Payload.sha
            }, commit1Payload);

            setupNock(urlPatterns.contents, {
                repo: repoFullName,
                path: commit1Payload.files[0].filename,
                branch: samplePayload.pull_request.head.ref
            }, commit1Contents);

            // Since the goal (success) is posting one comment, if this URL is matched, we've succeeded
            setupNock(urlPatterns.comment, {
                repo: repoFullName,
                number: prNumber
            }, '', done, 'post');

            sendPost();
        });

        /**
         * Sends a basic POST to the discord hook endpoint
         */
        function sendPost(cb) {
            request.post({
                url: appHost + '/hook',
                headers: sampleHeaders,
                form: samplePayload
            }, cb);
        }

        /**
         * Creates an intercepter for the GitHub API endpoints that discord uses
         */
        function setupNock(urlPattern, data, payload, done, method) {
            return nock(githubHost)
                [method || 'get'](substitute(urlPattern, data))
                .reply(function() {
                    if(done) done();
                    return [200, payload];
                });
        }
    });

    /**
     * We need to do cleanup so that the tests don't hang
     */
    describe('Test Cleanup', function() {
        it('Server closes properly', function() {
            app.listener.close();
        });
    });
});


/**
 * Grabs fixture content and returns their contents in JSON format
 */
function getFileContents(testNumber, fixture) {
    return JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/' + testNumber + '/' + fixture + '.json')));
}

/**
 * Simple substitution of ${propName} from an object
 */
function substitute(str, data) {
    return str.replace((/\\?\{([^{}]+)\}/g), function(match, name){
        if (match.charAt(0) == '\\') return match.slice(1);
        return (data[name] != null) ? data[name] : '';
    });
}
