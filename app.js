'use strict';

var path = require('path');

var hook = require('./hook');
var config = require('./config');
var logger = require('./logger');

// Set up Express
var express = require('express');
var bodyParser = require('body-parser');
var port = process.env.PORT || config.port;

var app = express();
app.use(bodyParser());
app.use(express.static(path.join(__dirname, 'build/www')));
app.post('/hook', hook.handle);

exports.listener = app.listen(port);

logger.info('Listening at port:', port);
