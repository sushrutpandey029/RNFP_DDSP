import { DataTypes } from "sequelize";

import sequelize from "../DB_Connection/MySql_Connect.js";

const admin = sequelize.define('admin',{
    fullname:{
        type:DataTypes.STRING,
        allowNull:false,
    },
    email:{
        type:DataTypes.STRING,
        allowNull:false,
    },
    password:{
        type:DataTypes.STRING,
        allowNull: false
    },
    refreshToken: {  // Add this field
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: 'accesstoken',
    }
},{
    tableName: 'admins',
    timestamps: true,
})

export default admin;