/**
 * New Relic agent configuration.
 *
 * See lib/config.defaults.js in the agent distribution for a more complete
 * description of configuration variables and their potential values.
 * https://devcenter.heroku.com/articles/newrelic#node-js-installation-and-configuration
 */
exports.config = {
    /**
     * Array of application names.
     */
    app_name: ['mdn-discord.herokuapp.com'],
    /**
     * Your New Relic license key.
     */
    license_key: process.env.NEW_RELIC_LICENSE_KEY, // Overriden by environment vars
    logging: {
        /**
         * Level at which to log. 'trace' is most useful to New Relic when diagnosing
         * issues with the agent, 'info' and higher will impose the least overhead on
         * production applications.
         */
        level: 'info'
    }
};
