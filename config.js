var config = {
    brand: 'Discord',
    token: process.env.OAUTH_TOKEN,

    // Used when no environment variable (process.env.PORT) is set
    port: 3000,
    host: 'localhost',
    protocol: 'http:'
};

module.exports = config;
