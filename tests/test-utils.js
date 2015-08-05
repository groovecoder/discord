'use strict';

var fs = require('fs');
var path = require('path');

var config = require('../config');

module.exports = {

    // The host for local Discord
    appHost: [config.protocol, '//', config.host, ':', config.port].join(''),

    // Track hostname for GitHub
    githubHost: 'https://api.github.com',

    // Directory for fixtures
    fixturesDir: path.join(__dirname, 'fixtures/'),

    // Builds a file path to a local test fixture JSON file
    getFileContents: function(testNumber, fixture) {
        var split = fixture.split('.');
        if (split.pop().toLowerCase() === 'json') {
            fixture = split.join('.');
        }

        return JSON.parse(fs.readFileSync(this.fixturesDir + testNumber + '/' + fixture + '.json'));
    }

};
