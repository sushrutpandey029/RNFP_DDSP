import { DataTypes } from 'sequelize';
import sequelize from '../DB_Connection/MySql_Connect.js';

const ProductionDetails = sequelize.define('ProductionDetails', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    farmerID: {
        type: DataTypes.STRING, // Matching the farmerID type from FarmerInfo
        allowNull: false,
    },
    cropName: {
        type: DataTypes.JSON,  // Use JSONB for PostgreSQL or JSON for MySQL
        allowNull: true,
    },

}, {
    tableName: 'production_details',
    timestamps: true,
});

export default ProductionDetails;
