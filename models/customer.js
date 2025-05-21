const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/mysql');

const Customer = sequelize.define('Customer', {
  name: { type: DataTypes.STRING, allowNull: false },
  phoneNumber: { type: DataTypes.STRING, allowNull: false, unique: true },
  email: {type: DataTypes.STRING, allowNull: true },
  address: { type: DataTypes.STRING, allowNull: true }
}, 
{
  timestamps: true,
});

module.exports = Customer;
