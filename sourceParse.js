'use strict';

var doiuse = require('doiuse');
var postcss = require('postcss');
var request = require('request');
var sourceMap = require('source-map');
var style = require('stylus');

var stylus = function(file, config, addFeature) {
    var rawURL = file.raw_url;
    request({
        url: rawURL,
        headers: {
            'User-Agent': 'YouShouldUse'
        }
    }, function(error, response, body) {
        var contents = body;
        var stylize = style(contents)
            .set('filename', file.filename)
            .set('sourcemap', {});
        stylize.render(function(error, css) {
            var source = new sourceMap.SourceMapConsumer(stylize.sourcemap);
            var onFeatureUsage = function(feature) {
                var newPos = source.originalPositionFor(feature.usage.source.start);
                feature.usage.source.start.line = newPos.line;
                feature.usage.source.start.column = newPos.column;
                addFeature(feature);
            };
            postcss(doiuse({
                    browsers: config,
                    onFeatureUsage: onFeatureUsage
                })).process(css, {
                    from: '/' + file.filename
                })
                .then(function(response) {});
        });
    });
};

module.exports.stylus = stylus;
