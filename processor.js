'use strict';

var path = require('path');

var doiuse = require('doiuse');
var postcss = require('postcss');
var sourceMap = require('source-map');
var stylus = require('stylus');

var logger = require('./logger');
var utils = require('./utils');



/**
 * Router for processing files CSS and Stylus
 */
function process(githubClient, repo, branch, file, config, handleIncompatibility) {
    var processor;

    switch (path.extname(file.filename).toLowerCase()) {
        case '.css':
            processor = processCSS;
            break;
        case '.styl':
            processor = processStylus;
            break;
        default:
            return;
    }

    return processor.apply(null, arguments);
}


/**
 * Test and report on changes to the given CSS stylesheet.
 */
function processCSS(githubClient, repo, branch, file, config, handleIncompatibility) {
    var filename = file.filename;

    // Fetch the contents of the stylesheet
    githubClient.repo(repo).contents(filename, branch, function(error, fileContentsMetadata) {
        var fileContents;

        if (error) return logger.error('Error reading contents from ' + repo + ' / ' + branch + ' / ' + filename + ':', error);

        fileContents = utils.prepareContent(fileContentsMetadata.content);

        return _postcss(config, fileContents, handleIncompatibility, filename);
    });
}


/**
 * Test and report on changes to the given Stylus stylesheet.
 */
function processStylus(githubClient, repo, branch, file, config, handleIncompatibility) {
    var filename = file.filename;

    // Fetch the contents of the stylesheet
    githubClient.repo(repo).contents(filename, branch, function(error, fileContentsMetadata) {
        var fileContents, compiler;

        if (error) return logger.error('Error reading contents from ' + repo + ' / ' + branch + ' / ' + filename + ':', error);

        fileContents = utils.prepareContent(fileContentsMetadata.content);
        compiler = stylus(fileContents)
            .set('filename', filename)
            .set('sourcemap', {});

        compiler.render(function(error, compiledCSS) {
            if (error) return logger.error('Error compiling Stylus of ' + repo + ' / ' + branch + ' / ' + filename + ':', error);

            // React to an incompatible line of Stylus. Compile the stylus with
            // a source map to get an accurate line number for the
            // incompatibility.
            function handleStylusIncompatibility(incompatibility) {
                var sourceMapConsumer = new sourceMap.SourceMapConsumer(compiler.sourcemap);
                var position = incompatibility.usage.source.start;
                var stylusPosition = sourceMapConsumer.originalPositionFor(position);

                position.line = stylusPosition.line;
                position.column = stylusPosition.column;

                handleIncompatibility(incompatibility);
            }

            return _postcss(config, fileContents, handleStylusIncompatibility, filename);
        });
    });
}


/**
 * Runs postcss for each of the processors
 */
function _postcss(config, contents, handle, filename) {
    // Test the stylesheet with doiuse and call handleIncompatibility for
    // any incompatibilities that are found
    return postcss(doiuse({
        browsers: config,
        onFeatureUsage: handle
    })).process(contents, {
        from: '/' + filename
    }).then(); // onFeatureUsage won't be called unless then() is called.
}


exports.process = process;
