import { DataTypes } from "sequelize";

import sequelize from "../DB_Connection/MySql_Connect.js";
import cluster from "cluster";

const users = sequelize.define('users', {
    profileimage: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: true // Ensures the field is not empty
        }
    },
    fullname: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: true // Ensures the field is not empty
        }
    },
    emailid: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true, // Ensures unique email addresses
        validate: {
            isEmail: true, // Ensures valid email format
            notEmpty: true // Ensures the field is not empty
        }
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: true // Ensures the field is not empty
        }
    },
    planepassword: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: true // Ensures the field is not empty
        }
    },
    phonenumber: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: true, // Ensures the field is not empty
            isNumeric: true // Ensures only numeric values
        }
    },
    distic: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    block: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    village: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    cultivatedland: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    clusterid:{
        type: DataTypes.STRING,
        allowNull: false,
    },
    role: {
        type: DataTypes.STRING,
        allowNull: false,
        values: ['Project Coordinator', 'Assistant Project Coordinator', 'Field Officer'],
        allowNull: false,
        validate: {
            notEmpty: true // Ensures the field is not empty
        },
        enum: ["Project Coardinate", "Assistant Project Coordinator", "Field Officer"],
    },

    dob: {
        type: DataTypes.DATEONLY, // Use DATEONLY for date of birth
        allowNull: false,
        validate: {
            notEmpty: true // Ensures the field is not empty
        }
    },

    qualification: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: true // Ensures the field is not empty
        }
    },
    refreshToken: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null, // Keeps it nullable by default until a token is assigned
    }
})

export default users;
