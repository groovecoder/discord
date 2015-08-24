'use strict';

var fs = require('fs');
var path = require('path');

var config = require('../lib/config');

module.exports = {

    // The host for local Discord
    appHost: 'http://localhost:' + config.port,

    // Track hostname for GitHub
    githubHost: 'https://api.github.com',

    // Directory for fixtures
    fixturesDir: path.join(__dirname, 'fixtures/'),

    // Directory for recorded fixtures
    recordedFixturesDir: path.join(__dirname, 'fixtures/recorded/'),

    // Directory for non-recorded fixtures
    nonRecordedFixturesDir: path.join(__dirname, 'fixtures/non-recorded/'),

    // Builds a file path to a local test fixture JSON file
    getFileContents: function(directory, fixture) {
        var split = fixture.split('.');
        if (split.pop().toLowerCase() === 'json') {
            fixture = split.join('.');
        }

        return JSON.parse(fs.readFileSync(directory + '/' + fixture + '.json'));
    },

};
