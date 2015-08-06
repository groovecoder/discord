'use strict';

var gulp = require('gulp');
var beautify = require('gulp-jsbeautifier');
var jshint = require('gulp-jshint');
var mocha = require('gulp-mocha');

var js = ['**/*.js', '!node_modules/**/*.js'];
var json = ['**/*.json', '!node_modules/**/*.json', '!tests/fixtures/**/*.json'];

gulp.task('beautify', ['beautify:javascript']);

gulp.task('beautify:javascript', function() {
    gulp.src(js.concat(json), {
            base: './'
        })
        .pipe(beautify({
            indentSize: 4,
            keepFunctionIndentation: true
        }))
        .pipe(gulp.dest('./'));
});

gulp.task('test', ['test:jshint', 'test:mocha']);

gulp.task('test:jshint', function() {
    return gulp.src(js)
        .pipe(jshint())
        .pipe(jshint.reporter('default'));
});

// Make the Mocha task depend on the JSHint task. Otherwise, the tasks will be
// run in parallel and will print to console simultaneously.
gulp.task('test:mocha', ['test:jshint'], function() {
    gulp.src('tests/tests.js')
        .pipe(mocha())
        .once('end', function() {
            process.exit();
        });
});
