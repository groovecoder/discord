'use strict';

var hook = require('./hook');

// Set up Express
var express = require('express');
var bodyParser = require('body-parser');
var app = express();
app.use(bodyParser());

app.use(express.static('build/www'));
app.post('/hook', hook.handle);

app.listen(process.env.PORT);
