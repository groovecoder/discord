'use strict';

var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var module = require('./module.js');
var homepage = require('./homepage.js');

app.use(bodyParser());

app.get('/', homepage);
app.post('/hook', module.hook);

app.listen(process.env.PORT);
