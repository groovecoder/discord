'use strict';

var config = {
    brand: 'Discord',
    token: process.env.OAUTH_TOKEN,
    port: process.env.PORT || 3000,
    trackingID: process.env.TRACKING_ID || '000000',
    commentWait: process.env.COMMENT_WAIT || 0,
    commentAttempts: process.env.COMMENT_ATTEMPTS || 10,
    redisURL: process.env.REDIS_URL || 'redis://localhost',
    databaseURL: process.env.DATABASE_URL || 'postgres://localhost/discord_test',
};

module.exports = config;
