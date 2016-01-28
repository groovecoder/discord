'use strict';
module.exports = function(sequelize, DataTypes) {
    var Comment = sequelize.define('Comment', {
        repo: DataTypes.TEXT,
        pr: DataTypes.INTEGER,
        filename: DataTypes.TEXT,
        line: DataTypes.INTEGER,
        feature: DataTypes.TEXT
    }, {
        classMethods: {
            associate: function(models) {
                // associations can be defined here
            }
        }
    });
    return Comment;
};
