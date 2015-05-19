var gulp = require('gulp');
var jshint = require('gulp-jshint');

gulp.task('test', ['test:jshint']);

gulp.task('test:jshint', function() {
    gulp.src('*.js')
        .pipe(jshint())
        .pipe(jshint.reporter('default'));
});
