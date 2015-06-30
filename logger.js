'use strict';

['log', 'warn', 'error'].forEach(function(level) {
    exports[level] = function() {
        var args = Array.prototype.slice.call(arguments);
        args.unshift('[' + level + ']');

        console[level].apply(console, args);
    };
});
