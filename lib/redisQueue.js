/**
 * Return an instance of the Kue queue singleton.
 *
 * This file is only needed to work around bug #681 of Kue:
 * https://github.com/Automattic/kue/issues/681
 *
 * Once the bugfix is shipped, we'll be able to get the queue with much less
 * code, making this file unnecessary:
 *
 *     var kue = require('kue');
 *     var redisQueue = kue.createQueue({
 *         redis: config.redisURL
 *     });
 */

var kue = require('kue');
var url = require('url');

var config = require('./config');

var parsedRedisURL = url.parse(config.redisURL);

var config = {
    redis: {
        port: parseInt(parsedRedisURL.port),
        host: parsedRedisURL.hostname
    }
};

if (parsedRedisURL.auth) {
    config.redis.auth = parsedRedisURL.auth.replace(/.*?:/, '');
}

module.exports = kue.createQueue(config);
