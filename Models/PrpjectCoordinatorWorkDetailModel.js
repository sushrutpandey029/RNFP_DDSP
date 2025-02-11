import { DataTypes } from 'sequelize';
import sequelize from "../DB_Connection/MySql_Connect.js";

const CoordinatorWorkDetail = sequelize.define('CoordinatorWorkDetail', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    coordinatorID: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    trainingProgrammes: {
        type: DataTypes.JSON,
        allowNull: true,
    },
    reviewMeetings: {
        type: DataTypes.JSON,
        allowNull: true,
    },
    monitoringVisits: {
        type: DataTypes.JSON,
        allowNull: true,
    },
    reports: {
        type: DataTypes.JSON,
        allowNull: true,
    },
}, {
    tableName: 'CoordinatorWorkDetail', // Table name for the model
    timestamps: true, // Automatically handle createdAt and updatedAt fields
});

export default CoordinatorWorkDetail;
