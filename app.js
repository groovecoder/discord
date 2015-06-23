'use strict';

var homepage = require('./homepage');
var commenter = require('./commenter');

// Set up Express
var express = require('express');
var bodyParser = require('body-parser');
var app = express();
app.use(bodyParser());

app.get('/', homepage);
app.post('/hook', commenter.comment);

app.listen(process.env.PORT);
