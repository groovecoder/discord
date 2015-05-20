'use strict';

var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var module = require('./module.js');
var landingPage = require('./landingPage.js');

app.use(bodyParser());

app.get('/', landingPage);
app.post('/hook', module.hook);

app.listen(process.env.PORT);
