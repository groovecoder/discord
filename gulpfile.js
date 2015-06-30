'use strict';

var gulp = require('gulp');
var beautify = require('gulp-jsbeautifier');
var jshint = require('gulp-jshint');

gulp.task('beautify', ['beautify:javascript']);

gulp.task('beautify:javascript', function() {
    gulp.src(['*.js', '*.json']).pipe(beautify({
        indentSize: 4,
        keepFunctionIndentation: true
    })).pipe(gulp.dest('./'));
});

gulp.task('test', ['test:jshint']);

gulp.task('test:jshint', function() {
    gulp.src('*.js')
        .pipe(jshint())
        .pipe(jshint.reporter('default'));
});
