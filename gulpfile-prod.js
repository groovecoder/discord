'use strict';

var gulp = require('gulp');
var fileinclude = require('gulp-file-include');
var marked = require('gulp-marked');

var buildDirectory = 'build/';

gulp.task('build', ['build:homepage']);

gulp.task('build:homepage', ['build:readme-html'], function() {
    gulp.src(['html/index.html'])
        .pipe(fileinclude())
        .pipe(gulp.dest(buildDirectory + 'www'));
});

gulp.task('build:readme-html', function() {
    return gulp.src('README.md')
        .pipe(marked())
        .pipe(gulp.dest(buildDirectory + 'html/includes'));
});
