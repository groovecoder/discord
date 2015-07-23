'use strict';

var express = require('express');
var bodyParser = require('body-parser');
var nunjucks = require('nunjucks');
var path = require('path');

var hook = require('./hook');
var config = require('./config');

// Set up Express
var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

// Set up views
app.set('views', path.join(__dirname, 'views'));
nunjucks.configure('views', {
    autoescape: true,
    express: app
});

// Homepage
app.get('/', function(request, response) {
    var context = {
        title: config.brand
    };
    response.render('index.html', context);
});

// Hook
app.post('/hook', hook.handle);

// Catch 404s and forward them to the error handler
app.use(function(request, response, next) {
    var error = new Error('Not Found');
    error.status = 404;
    next(error);
});

// Error handler
// The callback needs to have four arguments, even if some are unused, for
// Express to correctly identify it as error middleware.
app.use(function(error, request, response, next) {
    var context = {
        title: error.message + ' | ' + config.brand,
        message: error.message
    };

    response.status(error.status || 500);
    response.render('error.html', context);
});

module.exports = app;
