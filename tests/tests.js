'use strict';

// Set environment variables that will be needed during testing. These values
// will be read in config.js, so they need to be set before the file is loaded.
var testedTrackingID = '654321';
process.env.TRACKING_ID = testedTrackingID;
process.env.REDIS_URL = 'redis://localhost';
process.env.COMMENT_WAIT = 0; // The comment wait is only needed in production to avoid tripping a GitHub spam protection system

// Pretend that we're running in production mode so that we can test
// production-only features like Google Analytics tracking. This value is read
// in app.js, so it needs to be set before the file is loaded.
process.env.NODE_ENV = 'production';

// Process Redis tasks
require('../worker');

var fs = require('fs');

var chai = require('chai');
var request = require('request');
var nock = require('nock');
var assert = chai.assert;

var testUtils = require('./test-utils');
var config = require('../config');
var www = require('../bin/www');

var notFoundURL = testUtils.appHost + '/page-that-will-never-exist';

// Announce that automated tests are being run just in case other parts of the
// application want to behave differently
process.env.RUNNING_TESTS = true;


describe('Discord Tests', function() {

    /**
     * Test that the homepage returns the index.html static content
     */
    describe('Landing Page Tests', function() {
        it('Should confirm homepage is working properly', function(done) {
            request(testUtils.appHost, function(error, response, body) {
                assert.ok(!error && response.statusCode === 200);
                done();
            });
        });

        // The title of the homepage should be the brand name. All other pages
        // should have a unique title and the brand name separated by a pipe.
        it('Page titles are set correctly', function(done) {
            request(testUtils.appHost, function(error, response, body) {
                assert.include(body, '<title>' + config.brand + '</title>');

                request(notFoundURL, function(error, response, body) {
                    assert.include(body, ' | ' + config.brand + '</title>');
                    done();
                });
            });

        });

        it('The Google Analytics tracking code is present in pages', function(done) {
            request(testUtils.appHost, function(error, response, body) {
                assert.include(body, testedTrackingID);

                request(notFoundURL, function(error, response, body) {
                    assert.include(body, testedTrackingID);
                    done();
                });
            });
        });
    });

    /**
     * Tests related to pull requests sent to the hook
     */
    describe('Basic Hook Tests', function() {

        /**
         * Test that the hook returns a 200 when posted to
         */
        it('Hook returns a 200 OK when posted to', function(done) {
            sendPost('1', function(error, response, body) {
                assert.ok(!error && response.statusCode === 200 && body === 'OK');
                done();
            });
        });

    });

    /**
     * Run tests on recorded PRs
     */
    describe('Recorded Hook Tests', function() {

        // Recurse through each recorded test
        // Ultimate pass/fail measure is dependant upon number of comments POSTed
        getDirectories(testUtils.fixturesDir).forEach(function(testDir, index) {

            var plainIndex = index + 1;
            var manifest = testUtils.getFileContents(plainIndex, 'manifest');

            // Start the test definition
            it('Recorded test ' + plainIndex + ': ' + manifest.description, function(done) {
                this.timeout(5000);

                var item;

                for (var url in manifest.urls) {
                    if (manifest.urls.hasOwnProperty(url)) {

                        item = manifest.urls[url];

                        setupNock(
                            url,
                            item,
                            item.method.toLowerCase(),
                            testUtils.getFileContents(plainIndex, item.file),
                            manifest
                        );
                    }
                }

                // Kick the test off
                sendPost(plainIndex);

                // Utility to setup the nock and lock variables into place
                function setupNock(url, item, requestType, payload, manifest) {
                    var completedPosts = 0;

                    nock(testUtils.githubHost).persist()[requestType](url).reply(function() {
                        if (requestType === 'post') completedPosts++;

                        if (completedPosts === manifest.posts) {
                            done();
                            nock.cleanAll(); // Cleanup so there's no interfering with other tests
                        }

                        return [200, payload];
                    });
                }
            });

        });
    });

    /**
     * Test that errors are handled correctly
     */
    describe('Error Tests', function() {
        it('Server returns a 404 when non-existent pages are requested', function(done) {
            request(notFoundURL, function(error, response, body) {
                assert.ok(response.statusCode === 404);
                done();
            });
        });
    });

    /**
     * We need to do cleanup so that the tests don't hang
     */
    describe('Test Cleanup', function() {
        it('Server closes properly', function() {
            www.server.close();
        });
    });
});

/**
 * Sends a basic POST to the discord hook endpoint
 */
function sendPost(testDir, cb) {
    request.post({
        url: testUtils.appHost + '/hook',
        headers: testUtils.getFileContents(testDir, 'headers'),
        form: testUtils.getFileContents(testDir, 'payload')
    }, cb || function() {});
}

/**
 * Reads a directory and finds immeidate subdirectories
 */
function getDirectories(path) {
    return fs.readdirSync(path).filter(function(file) {
        return fs.statSync(path + '/' + file).isDirectory();
    });
}
