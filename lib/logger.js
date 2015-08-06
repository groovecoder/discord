'use strict';

['log', 'warn', 'error', 'info'].forEach(function(level) {
    exports[level] = function() {
        // Don't log anything during automated tests
        if (process.env.RUNNING_TESTS) return;

        var args = Array.prototype.slice.call(arguments);
        args.unshift('[' + level + ']');

        console[level].apply(console, args);
    };
});
