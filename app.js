'use strict';

var path = require('path');

var express = require('express');
var bodyParser = require('body-parser');

var hook = require('./hook');
var config = require('./config');
var logger = require('./logger');

var port = process.env.PORT || config.port;

// Set up Express
var app = express();
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

// Serve the homepage
app.use(express.static(path.join(__dirname, 'build/www')));

// Handle webhook POSTs
app.post('/hook', hook.handle);

exports.listener = app.listen(port);
logger.info('Listening at port:', port);
