'use strict';

var child_process = require('child_process');

var gulp = require('gulp');

var models = require('./models');
var config = require('./lib/config');
var logger = require('./lib/logger');

var js = ['**/*.js', '!node_modules/**/*.js'];
var json = ['**/*.json', '!node_modules/**/*.json', '!tests/fixtures/**/*.json'];

gulp.task('run', ['build'], function() {
    child_process.exec('node bin/www');
});

gulp.task('build', ['build:migrate', 'build:readme-html']);

gulp.task('build:migrate', function() {
    // Create database tables (if needed) and run migrations
    return models.sequelize.sync().then(function() {
        child_process.execSync('node_modules/.bin/sequelize db:migrate --url ' + config.databaseURL, function(error, stdout) {
            if (error) return logger.error(error);
            logger.log(stdout);
        });
    });
});

gulp.task('build:readme-html', function() {
    var marked = require('gulp-marked');

    return gulp.src('README.md')
        .pipe(marked())
        .pipe(gulp.dest('views/includes'));
});

gulp.task('beautify', ['beautify:javascript']);

gulp.task('beautify:javascript', function() {
    var beautify = require('gulp-jsbeautifier');

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
    var jshint = require('gulp-jshint');

    return gulp.src(js)
        .pipe(jshint())
        .pipe(jshint.reporter('default'));
});

// Make the Mocha task depend on the JSHint task. Otherwise, the tasks will be
// run in parallel and will print to console simultaneously.
gulp.task('test:mocha', ['build', 'test:jshint'], function() {
    var mocha = require('gulp-mocha');

    process.env.NODE_ENV = 'test';

    // Create database tables from scratch and run the tests
    models.sequelize.sync({
        force: true
    }).then(function() {
        gulp.src('tests/tests.js')
            .pipe(mocha())
            .once('end', function() {
                process.exit();
            });
    });
});
