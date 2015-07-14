var config = {
    userAgent: 'Discord',
    token: process.env.OAUTH_TOKEN,
    commentWait: process.env.COMMENT_WAIT || 50,

    // Used when no environment variable (process.env.PORT) is set
    port: 3000,
    host: 'localhost',
    protocol: 'http:'
};

module.exports = config;
