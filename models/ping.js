'use strict';
module.exports = function(sequelize, DataTypes) {
    var Ping = sequelize.define('Ping', {
        repo: DataTypes.TEXT
    }, {
        classMethods: {
            associate: function(models) {
                // associations can be defined here
            }
        }
    });
    return Ping;
};
