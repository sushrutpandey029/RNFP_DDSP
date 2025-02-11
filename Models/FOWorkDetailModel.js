import { DataTypes } from 'sequelize';
import sequelize from "../DB_Connection/MySql_Connect.js"; // Make sure to import your Sequelize instance

// Define the FieldWorkerWorkDetail model
const FieldWorkerWorkDetail = sequelize.define('FieldWorkerWorkDetail', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    userid:{
        type: DataTypes.STRING,
        allowNull: false,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    address: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    qualifications: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    mobileNumber: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    emailID: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    ownLandCultivatedUnderNaturalFarming: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    clusterID: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    workDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
    },
    villagesVisited: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    travelInKms: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    farmersContactedIndividually: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    groupMeetingsConducted: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    farmersContactedInGroupMeetings: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    clusterTrainingPlace: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    farmersAttendedTraining: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    inputSupplied: {
        type: DataTypes.JSON, 
        allowNull: true,
    },
    observationinbrif:{
        type: DataTypes.TEXT,
        allowNull: true,
    },
    consultancyTelephone: {
        type: DataTypes.INTEGER,
        defaultValue: 0, 
    },
    consultancyWhatsApp: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    totalConsultancy: {
        type: DataTypes.INTEGER,
        defaultValue: 0, 
    },
    totalcostinputsuplied:{
        type: DataTypes.STRING,
        allowNull: true,
    }
}, {
    timestamps: true,  
    tableName: 'field_worker_work_details', 
});


export default FieldWorkerWorkDetail;
