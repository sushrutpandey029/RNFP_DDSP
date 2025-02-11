import { DataTypes } from 'sequelize';
import sequelize from "../DB_Connection/MySql_Connect.js"; 

const CultivationCost = sequelize.define('CultivationCost', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    farmerID: {
        type: DataTypes.STRING, // Matching the farmerID type from FarmerInfo
        allowNull: false,
    },
    crops: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: {}  // Default to an empty object if no data is provided
    },
    totalCost: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0.0,
    },
}, {
    tableName: 'CultivationCosts', // Table name for the model
    timestamps: true, // Automatically handle createdAt and updatedAt fields
});

export default CultivationCost;
