'use strict';

var commenter = require('./commenter');

// Set up Express
var express = require('express');
var bodyParser = require('body-parser');
var app = express();
app.use(bodyParser());

app.use(express.static('build/www'));
app.post('/hook', commenter.comment);

app.listen(process.env.PORT);
