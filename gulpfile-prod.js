'use strict';

var gulp = require('gulp');
var marked = require('gulp-marked');

gulp.task('build', ['build:readme-html']);

gulp.task('build:readme-html', function() {
    return gulp.src('README.md')
        .pipe(marked())
        .pipe(gulp.dest('views/includes'));
});
