'use strict';

function log() {
    return _log(arguments);
}

function error() {
    return _log(arguments, 'error');
}

function warn() {
    return _log(arguments, 'warn');
}

function _log(data, logger) {
    return console[logger || 'log'].apply(console, data);
}

exports.log = log;
exports.error = error;
exports.warn = warn;
