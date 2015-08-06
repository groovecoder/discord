var config = {
    brand: 'Discord',
    token: process.env.OAUTH_TOKEN,
    trackingID: process.env.TRACKING_ID,
    commentWait: process.env.COMMENT_WAIT || 250,
    commentAttempts: process.env.COMMENT_ATTEMPTS || 10,

    // Used when no environment variable (process.env.PORT) is set
    port: 3000,
    host: 'localhost',
    protocol: 'http:'
};

module.exports = config;
