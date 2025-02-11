import { DataTypes } from "sequelize";
import sequelize from "../DB_Connection/MySql_Connect.js";

const Location = sequelize.define('user_location', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    userId: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    fullname: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: true 
        }
    },
    role: {
        type: DataTypes.STRING,
        allowNull: false,
        values: ['Project Coordinator', 'Assistant Project Coordinator', 'Field Officer'],
        allowNull: false,
        validate: {
            notEmpty: true
        },
    },
    latitude: {
        type: DataTypes.FLOAT,
        allowNull: false,
    },
    longitude: {
        type: DataTypes.FLOAT,
        allowNull: false,
    },
    address:{
        type: DataTypes.STRING,
        allowNull : true
    },
    timestamp: {
        type: DataTypes.DATE,
        defaultValue: sequelize.NOW,
    },
}, {
    tableName: 'user_location',
    timestamps: true,
});

export default Location;
