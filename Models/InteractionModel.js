import { DataTypes } from 'sequelize';
import sequelize from "../DB_Connection/MySql_Connect.js";

const Interaction = sequelize.define('Interaction', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    user_id: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    userrole: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    
    village: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    farmer: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
    },
    observationInBrief: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
}, {
    tableName: 'interactions',
    timestamps: true,
});

export default Interaction