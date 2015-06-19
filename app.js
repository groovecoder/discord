'use strict';

var homepage = require('./homepage');
var module = require('./module');

// Set up Express
var express = require('express');
var bodyParser = require('body-parser');
var app = express();
app.use(bodyParser());

app.get('/', homepage);
app.post('/hook', module.hook);

app.listen(process.env.PORT);
