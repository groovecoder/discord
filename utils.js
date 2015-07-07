'use strict';

/**
 * Format blob content received by GitHub for processing within Discord
 */
function prepareContent(content) {
    return new Buffer(content, 'base64').toString();
}

exports.prepareContent = prepareContent;
