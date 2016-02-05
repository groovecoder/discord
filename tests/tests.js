'use strict';

// Process Redis tasks
require('../worker');

var fs = require('fs');

var chai = require('chai');
var request = require('request');
var assert = chai.assert;

var config = require('../lib/config');
var www = require('../bin/www');
var models = require('../models');

var testUtils = require('./test-utils');

var notFoundURL = testUtils.appHost + '/page-that-will-never-exist';

describe('Discord Tests', function() {
    this.timeout(5000); // Travis can be a little slow

    beforeEach(function() {
        // Truncate the Ping table before each test
        models.Ping.truncate();
    });

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
                assert.include(body, config.trackingID);

                request(notFoundURL, function(error, response, body) {
                    assert.include(body, config.trackingID);
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
            sendHookPayload(testUtils.recordedFixturesDir + '1', function(error, response, body) {
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
        getDirectories(testUtils.recordedFixturesDir).forEach(function(testDir, index) {

            var plainIndex = index + 1;
            var manifest = testUtils.getFileContents(testUtils.recordedFixturesDir + plainIndex.toString(), 'manifest');

            // Start the test definition
            it('Recorded test ' + plainIndex + ': ' + manifest.description, function(done) {
                testUtils.setupNocksForManifest(manifest, plainIndex, done);

                // Kick the test off
                sendHookPayload(testUtils.recordedFixturesDir + plainIndex.toString());
            });

        });
    });

    /**
     * Test that errors are handled correctly
     */
    describe('Error Tests', function() {
        it('Server returns a 404 when non-existent pages are requested', function(done) {
            request(notFoundURL, function(error, response, body) {
                assert.equal(response.statusCode, 404);
                done();
            });
        });
    });

    /**
     * Test that the database is updated correctly
     */
    describe('Database Tests', function() {
        describe('Ping', function() {

            it('Ping events are recorded', function(done) {
                models.Ping.count().then(function(countBeforePing) {
                    assert.equal(countBeforePing, 0);

                    // Send a ping
                    sendHookPayload(testUtils.nonRecordedFixturesDir + '1', function(error, response, body) {
                        models.Ping.count().then(function(countAfterPing) {
                            assert.equal(countAfterPing, 1);

                            // Send another ping
                            sendHookPayload(testUtils.nonRecordedFixturesDir + '1', function(error, response, body) {
                                models.Ping.count().then(function(countAfterPing) {
                                    assert.equal(countAfterPing, 2);
                                    done();
                                });
                            });
                        });
                    });
                });
            });

            it('Date is correct', function(done) {
                var timeBeforePing = Date.now();

                sendHookPayload(testUtils.nonRecordedFixturesDir + '1', function(error, response, body) {
                    models.Ping.findOne({
                        id: 1
                    }).then(function(ping) {
                        var timeAfterPing = Date.parse(ping.dataValues.createdAt);
                        assert.isAbove(timeBeforePing, timeAfterPing);
                        done();
                    });
                });
            });

            it('Repository is correct', function(done) {
                sendHookPayload(testUtils.nonRecordedFixturesDir + '1', function(error, response, body) {
                    models.Ping.findOne({
                        id: 1
                    }).then(function(ping) {
                        assert.equal(ping.dataValues.repo, 'openjck/discord-test');
                        done();
                    });
                });
            });

        }); // End Ping tests
    }); // End Database tests

    /**
     * We need to do cleanup so that the tests don't hang
     * TODO: move test cleanup to a "tearDown" method?
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
function sendHookPayload(testDir, cb) {
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
