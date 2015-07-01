'use strict';

var doiuse = require('doiuse');
var github = require('octonode');
var postcss = require('postcss');
var sourceMap = require('source-map');
var stylus = require('stylus');
var logger = require('./logger');

function processCSS(repo, branch, file, config, handleIncompatibility) {
    var repoClient = github.client().repo(repo);

    repoClient.contents(file.filename, branch, function(error, fileContentsMetadata) {
        var fileContents;

        if (error) return logger.error('Error reading contents from ' + repo + ' / ' + branch + ' / ' + file.filename + ':', error);

        fileContents = new Buffer(fileContentsMetadata.content, 'base64').toString();

        postcss(doiuse({
            browsers: config,
            onFeatureUsage: handleIncompatibility
        })).process(fileContents, {
            from: '/' + file.filename
        }).then(); // onFeatureUsage won't be called unless then() is called.
    });
}

function processStylus(repo, branch, file, config, handleIncompatibility) {
    var repoClient = github.client().repo(repo);

    repoClient.contents(file.filename, branch, function(error, fileContentsMetadata) {
        var fileContents, compiler;

        if (error) return logger.error('Error reading contents from ' + repo + ' / ' + branch + ' / ' + file.filename + ':', error);

        fileContents = new Buffer(fileContentsMetadata.content, 'base64').toString();
        compiler = stylus(fileContents)
            .set('filename', file.filename)
            .set('sourcemap', {});

        compiler.render(function(error, compiledCSS) {
            if (error) return logger.error('Error compiling Stylus of ' + repo + ' / ' + branch + ' / ' + file.filename + ':', error);

            function handleStylusIncompatibility(incompatibility) {
                var sourceMapConsumer = new sourceMap.SourceMapConsumer(compiler.sourcemap);
                var position = incompatibility.usage.source.start;
                var stylusPosition = sourceMapConsumer.originalPositionFor(position);

                position.line = stylusPosition.line;
                position.column = stylusPosition.column;

                handleIncompatibility(incompatibility);
            }

            postcss(doiuse({
                browsers: config,
                onFeatureUsage: handleStylusIncompatibility
            })).process(compiledCSS, {
                from: '/' + file.filename
            }).then(); // onFeatureUsage won't be called unless then() is called.
        });
    });
}

exports.processCSS = processCSS;
exports.processStylus = processStylus;
