'use strict';

function log(data, title, logger) {
    logger = logger || console.log;

    logger(title || 'Debug:');
    logger(data);
}

function logError(error, title) {
    title = title || 'Error:';
    log(error.stack, title, console.error);
}

exports.log = log;
exports.logError = logError;
