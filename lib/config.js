'use strict';

var config = {
    def: {
        brand: 'Discord',
        token: process.env.OAUTH_TOKEN,
        commentAttempts: process.env.COMMENT_ATTEMPTS || 10,
    },
    development: {
        port: 3000,
        redisURL: 'redis://localhost'
    },
    test: {
        protocol: 'http:',
        host: 'localhost',
        port: 3000,
        trackingID: '654321',
        commentWait: 0,
        redisURL: 'redis://localhost'
    },
    production: {
        port: process.env.PORT,
        trackingID: process.env.TRACKING_ID,
        commentWait: process.env.COMMENT_WAIT || 250,
        redisURL: process.env.REDIS_URL
    }
};

function getConfigValue(name) {
    var env = process.env.NODE_ENV || 'development';

    if (config[env][name]) {
        return config[env][name];
    } else {
        return config.def[name];
    }
}

module.exports = getConfigValue;
