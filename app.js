'use strict';

if (process.env.NEW_RELIC_LICENSE_KEY) require('newrelic');

var express = require('express');
var bodyParser = require('body-parser');
var nunjucks = require('nunjucks');
var path = require('path');

var hook = require('./hook');
var config = require('./config');

var env;

// Set up Express
var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

// Set up Nunjucks
app.set('views', path.join(__dirname, 'views'));
env = nunjucks.configure('views', {
    autoescape: true,
    express: app
});

// Global template variables
env.addGlobal('brand', config.brand);
env.addGlobal('trackingID', config.trackingID);
env.addGlobal('NODE_ENV', process.env.NODE_ENV);

// Homepage
app.get('/', function(request, response) {
    response.render('index.html');
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
        title: error.message,
        message: error.message
    };

    response.status(error.status || 500);
    response.render('error.html', context);
});

module.exports = app;
