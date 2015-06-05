'use strict';

var sourceMap = require('source-map');
var style = require('stylus');
var request = require('request');
var doiuse = require('doiuse');
var postcss = require('postcss');

var stylus = function(file, config, addFeature) {
    var rawUrl = file.raw_url;
    request({
        url: rawUrl,
        headers: {
            'User-Agent': 'YouShouldUse'
        }
    }, function(err, res, body) {
        var contents = body;
        var stylize = style(contents)
            .set('filename', file.filename)
            .set('sourcemap', {});
        stylize.render(function(err, css) {
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
                .then(function(res) {});
        });
    });
};

module.exports.stylus = stylus;
