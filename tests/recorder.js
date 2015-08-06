'use strict';

/*
    What is recorder:

        Recorder takes a given payload and headers set and replays all of the requests involved, storing
        them for simulated testing later on.

    Usage:

        node recorder --test={#} --description="This test describes {xyz} conditions"

    Requirements:

        -  The `{#}` directory must exist within the `fixtures` directory
        -  The `{#}` directory must contain `payload.json` and `headers.json` files, representing info POSTed from GitHub.
           This information is available within the webhooks' recent transactions screen

*/

var nock = require('nock');
var fs = require('fs');
var request = require('request');
var yargs = require('yargs').argv;

var testUtils = require('./test-utils');
var logger = require('../lib/logger');

// Run the server
require('../bin/www');
// Process Redis tasks
require('../worker');

var timeout = 10000; // 10 seconds
var testNumber;

// Require that a user provide the test number (which represents the fixtures/{testno})
// via the command line.  If none provided, bail.
if (yargs.test && !isNaN(yargs.test)) {
    testNumber = yargs.test;
} else {
    logAndQuit('No test provided, exiting.', process.argv);
}

if (!yargs.description) {
    logAndQuit('No description provided, exiting.', process.argv);
}

// Start recording the requests sent to GitHub as well as the responses sent back
nock.recorder.rec({
    output_objects: true
});

// Kick off!  Simulates us receiving a POST from GitHub!
request.post({
    url: testUtils.appHost + '/hook',
    headers: testUtils.getFileContents(testNumber, 'headers'),
    form: testUtils.getFileContents(testNumber, 'payload')
}, function(error) {
    if (error) logAndQuit('Post for kicking off the recording could not be completed: ', error);
});

// Since we go into this recording "blindly", the only way we know it's done is
// by setting a timeout which cuts the testing off after a given point.
// If the test doesn't resolve in this timeout, GitHub must be very slow or
// the test is too complex, in which case it's best to simply change the timeout
// value on your local machine
setTimeout(function() {

    var filepath = testUtils.fixturesDir + testNumber + '/';
    var manifest = {
        urls: {},
        description: yargs.description || '',
        posts: 0 // Will increment as we POST comments
    };

    // Calling play() provides an array of recorded URL calls with their payload
    nock.recorder.play().forEach(function(obj) {

        var filename = obj.path.replace(/\//g, '-').substr(1) + '.json';
        var contents;

        // Don't bother recording the initial request to the hook
        if (obj.scope.indexOf(testUtils.appHost) !== -1) return;

        // Add this to the registry
        manifest.urls[obj.path] = {
            file: filename,
            method: obj.method
        };

        // Increment posts if need be
        if (obj.method.toLowerCase() === 'post') manifest.posts++;

        // Generate the file contents; not all are JSON (file contents)
        // so we'll use a try/catch
        try {
            contents = toJson(obj.response);
        } catch (ex) {
            contents = obj;
        }
        fs.writeFileSync(filepath + filename, contents);
    });

    // Write the manifest file
    fs.writeFileSync(filepath + 'manifest.json', toJson(manifest));

    // All done, cut the server
    process.exit();
}, timeout);

// Logs and quits
function logAndQuit() {
    logger.error(arguments);
    process.exit(1);
}

function toJson(json) {
    return JSON.stringify(json, null, 2);
}
