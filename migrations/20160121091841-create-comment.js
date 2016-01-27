'use strict';
module.exports = {
    up: function(queryInterface, Sequelize) {
        return queryInterface.createTable('Comments', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            repo: {
                type: Sequelize.TEXT
            },
            pr: {
                type: Sequelize.INTEGER
            },
            filename: {
                type: Sequelize.TEXT
            },
            line: {
                type: Sequelize.INTEGER
            },
            feature: {
                type: Sequelize.TEXT
            },
            createdAt: {
                allowNull: false,
                type: Sequelize.DATE
            },
            updatedAt: {
                allowNull: false,
                type: Sequelize.DATE
            }
        });
    },
    down: function(queryInterface, Sequelize) {
        return queryInterface.dropTable('Comments');
    }
};
