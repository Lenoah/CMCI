require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME || 'cmci_db',
  process.env.DB_USER || 'root',
  process.env.DB_PASS || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    dialect: 'mariadb',
    dialectOptions: {
      timezone: 'local',
    },
    logging: false,
    define: {
      underscored: true,
      timestamps: true,
      freezeTableName: true,
    },
  }
);

module.exports = sequelize;
