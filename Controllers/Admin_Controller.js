import Adminmodel from '../Models/AdminModel.js'
import UserModel from '../Models/UserModel.js'
import farmers from '../Models/FarmerInfoModel.js'
import CultivationCost from '../Models/CultivationCostModel.js'
import ProductionDetails from '../Models/ProductionDetailsModel.js'
import FieldWorkerWorkDetail from '../Models/FOWorkDetailModel.js'
import CoordinatorWorkDetail from '../Models/PrpjectCoordinatorWorkDetailModel.js'
import Interactions from '../Models/InteractionModel.js'
import userattendance from '../Models/UserLocationModel.js'
import path from 'path'
import bcrypt from "bcrypt";
import jwt from 'jsonwebtoken';
import Op from 'sequelize'; 
import sequelize from 'sequelize';
import { Sequelize } from 'sequelize';

import XLSX from 'xlsx';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { data } from './ProjectManager_Controller.js'

// Fix for __dirname in ES6 modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// import sequelize from '../DB_Connection/MySql_Connect.js'

export const Adminlogin = async (req, res) => {
    res.render('index');

};
export const AdminRegister = async (req, res) => {
    try {
        const { fullname, email, password } = req.body;

        // Validate input
        if (!fullname || !email || !password) {
            return res.status(400).send({ errormessage: "All fields are required" });
        }

        // Validate email format
        const emailRegex = /^\w+([\.-]?\w+)@\w+([\. -]?\w+)(\.\w{2,3})+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).send({ message: "Email is not valid" });
        }

        // Check for duplicate email
        const isDuplicateEmail = await Adminmodel.findOne({ where: { email } });
        if (isDuplicateEmail) {
            return res.status(400).send({ errormessage: "Email already exists" });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new admin
        const newAdmin = await Adminmodel.create({ ...req.body, password: hashedPassword });
        console.log('New Admin:', newAdmin);

        return res.status(201).send({
            status: true,
            message: "Admin created successfully",
            admin: { id: newAdmin.id, fullname: newAdmin.fullname, email: newAdmin.email }
        });

    } catch (err) {
        console.error(err);
        return res.status(500).send({ message: 'Error creating admin', err: err.message });
    }
};
export const AdminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            req.flash('error', 'All fields are required');
            return res.status(400).redirect('/');
        }

        // Check if the user exists
        const user = await Adminmodel.findOne({ where: { email } });
        if (!user) {
            req.flash('error', 'User not found');
            return res.status(401).redirect('/');
        }

        // Check if the password is correct
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            req.flash('error', 'Invalid password');
            return res.status(401).redirect('/');
        }

        // Generate access and refresh tokens (optional)
        const token = jwt.sign({ id: user.id }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
        const refreshToken = jwt.sign({ id: user.id }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '7d' });

        // Save refresh token in the database
        user.refreshToken = refreshToken;
        await user.save();

        // Store user info in session
        req.session.user = {
            id: user.id,
            fullname: user.fullname,
            email: user.email,
            token,
            refreshToken: user.refreshToken
        };

        // Redirect to the dashboard
        return res.status(200).redirect('/dashboard');
    } catch (error) {
        console.error(error);
        req.flash('error', 'Error logging in');
        return res.status(500).redirect('/');
    }
};
// Logout API
export const AdminLogout = (req, res) => {
    // Set flash message before destroying the session
    req.flash('success', 'You have been logged out successfully');

    // Destroy the session
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
            return res.status(500).redirect('/dashboard'); // Redirect to dashboard if logout fails
        }
        // Clear cookies (optional)
        res.clearCookie('session_cookie_name');
        return res.redirect('/'); // Redirect to login page
    });
};
// AdminDashboard Controller
export const AdminDashboard = async (req, res) => {
    try {
        if (req.session.user) {
            // Fetch all farmers and users
            const farmersList = await farmers.findAll();
            const userList = await UserModel.findAll();

            // Count different user roles
            const fieldOfficerCount = await UserModel.count({ where: { Role: 'Field Officer' } });
            const assistantCoordinatorCount = await UserModel.count({ where: { Role: 'Assistant Project Coordinator' } });
            const projectCoordinatorCount = await UserModel.count({ where: { Role: 'Project Coordinator' } });

            // Count total farmers and users
            const farmerCount = farmersList.length;
            const userCount = userList.length;

            // Extract filters from query parameters
            const village = req.query.village || "Borjai";
            const cluster = req.query.cluster || "Bori Chandra"; // Default to "Borjai" // Default to current year
            const year = req.query.year || new Date().getFullYear();
            let error = null;

            // Filtered farmer count
            const filteredFarmerCount = await farmers.count({
                where: {
                    villageName: village,
                    clusterName: cluster,
                    [sequelize.Op.and]: sequelize.where(
                        sequelize.fn('YEAR', sequelize.col('createdAt')),
                        year
                    ),
                },
            });

            // Monthly farmer data
            const monthlyFarmerData = await getMonthlyFarmerData(village, year);

            // Set error message if no data is found
            if (filteredFarmerCount === 0) {
                error = `No data found for the selected filters: Village - ${village}, Year - ${year}.`;
            }

            // Adjust monthly farmer data to include the month numbers
            const adjustedMonthlyFarmerData = monthlyFarmerData.map((val, index) => ({
                month: index + 1,  // Month number added here
                count: val         // The count for that month
            }));

            // List of villages and years for dropdowns
            const villageslist = [
                "Aajani",
                "Aajanti",
                "Aashti",
                "Aasola",
                "Adani",
                "Adani Pod",
                "Amala Gav",
                "Amala Tanda",
                "Amshet",
                "Anji",
                "Anuppod",
                "Arambhi",
                "Athmurdi",
                "Banayat",
                "Bandar",
                "Baradgaon",
                "Bechkheda",
                "Belora",
                "Bhamb Raja",
                "Bhurkipod",
                "Bodgavhan",
                "Borgaon",
                "Bori Chandra",
                "Bori Gosavi",
                "Bori Sinha",
                "Borjai",
                "Bramhanpur",
                "Bramhanwada",
                "Bramhanwada Purv",
                "Bramhanwada Tanda",
                "Bramhi",
                "Chandapur",
                "Chani",
                "Chauki",
                "Chauki Zuli",
                "Chikani",
                "Chikhali",
                "Chinchala",
                "Chinchamandal",
                "Chopan",
                "Churkuta",
                "Dabha",
                "Daheli",
                "Dahifal",
                "Deurwadi",
                "Devala",
                "Devdharui",
                "Dhaipod",
                "Dhanaj",
                "Dharanpod",
                "Domaga",
                "Dongargaon",
                "Dudhgav",
                "Echora",
                "Fulwadi",
                "Gadegao",
                "Gajipur",
                "Garpod",
                "Gaulpend",
                "Gaurala",
                "Gavpod",
                "Ghubadheti",
                "Gondegaon",
                "Gondgavhan",
                "Gunj",
                "Haru",
                "Hatgaon",
                "Hivara",
                "Indrathana",
                "Jambhora",
                "Jamwadi",
                "Jankai",
                "Kamathwada",
                "Kanada",
                "Kanala",
                "Kanzara",
                "Kapshi",
                "Karamala",
                "Khairgaon",
                "Khairgaon Pod",
                "Khairgaon Tanda",
                "Khandani",
                "Khatara",
                "Kinhi Walashi",
                "Krushnapur",
                "Kumbhari",
                "Kumbhipod",
                "Ladkhed",
                "Lakhmapur",
                "Lohatwadi",
                "Loni",
                "Majara",
                "Malkhed Bu.",
                "Malkinho",
                "Mangla Devi",
                "Mangrul",
                "Manikwada",
                "Manjarda",
                "Mardi",
                "Maregaon",
                "Masola",
                "Mendhala",
                "Mendhani",
                "Morath",
                "Morgavhan",
                "Mozar",
                "Mukindpur",
                "Munjhala",
                "Murli",
                "Nababpur",
                "Nagai",
                "Nageshvar",
                "Nait",
                "Naka Pardi",
                "Narkund",
                "Narsapur",
                "Ner",
                "Pahapal",
                "Palaskund",
                "Pandharkawada",
                "Pandhurbna",
                "Pandhurna Budruk",
                "Pandhurna Khurd",
                "Pangari",
                "Pangari Tanda",
                "Paradhi Beda",
                "Pardhi Tanda",
                "Pathari",
                "Pathrad Gole",
                "Pendhara",
                "Pimpalgaon",
                "Pimpari Ijara",
                "Pisgaon",
                "Prathrad Devi",
                "Ramnagar Tanda",
                "Rui",
                "Sajegaon",
                "Salaipod",
                "Salod",
                "Sarangpur",
                "Sarkinhi",
                "Satefal",
                "Savangi",
                "Sawala",
                "Sawana",
                "Sawanga",
                "Sawargaon",
                "Sawargaon Kale",
                "Saykheda",
                "Sevadas Nagar",
                "Shakalgaon",
                "Shankarpur",
                "Shelodi",
                "Shindi",
                "Shirpurwadi",
                "Shivani",
                "Shivpod",
                "Singaldip",
                "Sonegaon",
                "Sonupod",
                "Sonurli",
                "Surdevi",
                "Takali",
                "Tembhi",
                "Thalegaon",
                "Tiwasa",
                "Uchegaon",
                "Udapur",
                "Ujona",
                "Umari",
                "Umartha",
                "Vasantnagar",
                "Veni",
                "Virgavhan",
                "Vyahali",
                "Wadgaon",
                "Wadgaon Gadhave",
                "Wadgaon Poste",
                "Wai",
                "Wakodi",
                "Walki",
                "Waradh",
                "Warjai",
                "Warud",
                "Watfal",
                "Yelguda",
                "Zombhadi",
            ];

            const clusterName = [
                "Masola",
                "Bori Chandra",
                "Bramhi",
                "Chaani (Ka)",
                "Malkhed Bu.",
                "Pathrad Devi",
                "Arambhi",
                "Murali",
                "Umari",
                "Adani",
                "Veni",
                "Chinchala",
                "Khandani",
                "Mardi",
                "Ner",
                "Pathrad Gole",
                "Tembhi",
                "Palaskund",
                "Bori Sinha",
                "Rui",
            ];

            // Use the selected year or default to the current year
            const yearsList = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);

            // Render admin dashboard
            return res.render('admindashboard', {
                user: req.session.user,
                farmerCount,
                userCount,
                fieldOfficerCount,
                assistantCoordinatorCount,
                projectCoordinatorCount,
                filteredFarmerCount,
                selectedVillage: village,
                selectedCluster: cluster,
                villageslist,
                clusterName,
                selectedYear: parseInt(year, 10), // Make sure it's a number
                yearsList, // Pass the list of years
                monthlyFarmerData: JSON.stringify(adjustedMonthlyFarmerData),  // Pass the adjusted data
                roleDistributionData: JSON.stringify({
                    fieldOfficer: fieldOfficerCount,
                    assistantCoordinator: assistantCoordinatorCount,
                    projectCoordinator: projectCoordinatorCount
                }),
                farmersList,
                error,
            });
        } else {
            req.flash('error', 'Please log in first');
            return res.redirect('/');
        }
    } catch (error) {
        console.error('Error in AdminDashboard:', error);
        req.flash('error', 'Internal server error');
        return res.redirect('/');
    }
};

// Function to get monthly farmer data
const getMonthlyFarmerData = async (village, year) => {
    const data = await farmers.findAll({
        attributes: [
            [sequelize.fn('MONTH', sequelize.col('createdAt')), 'month'],
            [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        ],
        where: {
            villageName: village,
            [sequelize.Op.and]: sequelize.where(
                sequelize.fn('YEAR', sequelize.col('createdAt')),
                year
            ),
        },
        group: ['month'],
        order: ['month'],
    });

    // Initialize data for all months with 0
    const monthlyData = Array(12).fill(0);
    data.forEach((item) => {
        monthlyData[item.dataValues.month - 1] = item.dataValues.count; // Month is 1-indexed
    });

    return monthlyData;
};

export const changepassword = async (req, res) => {
    const { id } = req.params;
    res.render('changepassword');
};

export const UpdatePassword = async (req, res) => {
    try {
        const { id: userId } = req.params;
        const { oldpassword, newpassword, cpassword } = req.body;

        console.log('Request Body:', req.body);
        console.log('User ID:', userId);

        // Validate input
        if (!oldpassword || !newpassword || !cpassword) {
            req.flash('error', 'All fields are required.');
            return res.redirect(`/changepassword/${userId}`);
        }

        if (newpassword !== cpassword) {
            req.flash('error', 'New password and confirm password do not match.');
            return res.redirect(`/changepassword/${userId}`);
        }

        // Fetch user from database
        const user = await Adminmodel.findByPk(userId);
        if (!user) {
            req.flash('error', 'User not found.');
            return res.redirect(`/changepassword/${userId}`);
        }

        // Verify old password
        const isMatch = await bcrypt.compare(oldpassword, user.password);
        if (!isMatch) {
            req.flash('error', 'Old password is incorrect.');
            return res.redirect(`/changepassword/${userId}`);
        }
        const hashedPassword = await bcrypt.hash(newpassword, 10);
        user.password = hashedPassword;
        await user.save();

        req.flash('success', 'Password changed successfully.');
        res.redirect(`/changepassword/${userId}`);
    } catch (error) {
        console.error('Error changing password:', error);
        req.flash('error', 'An error occurred while changing the password.');
        res.redirect(`/changepassword/${userId}`);
    }
};

export const adduser = async (req, res) => {

    const newvillageslist = [
        "Aajani",
        "Aajanti",
        "Aashti",
        "Aasola",
        "Adani",
        "Adani Pod",
        "Amala Gav",
        "Amala Tanda",
        "Amshet",
        "Anji",
        "Anuppod",
        "Arambhi",
        "Athmurdi",
        "Banayat",
        "Bandar",
        "Baradgaon",
        "Bechkheda",
        "Belora",
        "Bhamb Raja",
        "Bhurkipod",
        "Bodgavhan",
        "Borgaon",
        "Bori Chandra",
        "Bori Gosavi",
        "Bori Sinha",
        "Borjai",
        "Bramhanpur",
        "Bramhanwada",
        "Bramhanwada Purv",
        "Bramhanwada Tanda",
        "Bramhi",
        "Chandapur",
        "Chani",
        "Chauki",
        "Chauki Zuli",
        "Chikani",
        "Chikhali",
        "Chinchala",
        "Chinchamandal",
        "Chopan",
        "Churkuta",
        "Dabha",
        "Daheli",
        "Dahifal",
        "Deurwadi",
        "Devala",
        "Devdharui",
        "Dhaipod",
        "Dhanaj",
        "Dharanpod",
        "Domaga",
        "Dongargaon",
        "Dudhgav",
        "Echora",
        "Fulwadi",
        "Gadegao",
        "Gajipur",
        "Garpod",
        "Gaulpend",
        "Gaurala",
        "Gavpod",
        "Ghubadheti",
        "Gondegaon",
        "Gondgavhan",
        "Gunj",
        "Haru",
        "Hatgaon",
        "Hivara",
        "Indrathana",
        "Jambhora",
        "Jamwadi",
        "Jankai",
        "Kamathwada",
        "Kanada",
        "Kanala",
        "Kanzara",
        "Kapshi",
        "Karamala",
        "Khairgaon",
        "Khairgaon Pod",
        "Khairgaon Tanda",
        "Khandani",
        "Khatara",
        "Kinhi Walashi",
        "Krushnapur",
        "Kumbhari",
        "Kumbhipod",
        "Ladkhed",
        "Lakhmapur",
        "Lohatwadi",
        "Loni",
        "Majara",
        "Malkhed Bu.",
        "Malkinho",
        "Mangla Devi",
        "Mangrul",
        "Manikwada",
        "Manjarda",
        "Mardi",
        "Maregaon",
        "Masola",
        "Mendhala",
        "Mendhani",
        "Morath",
        "Morgavhan",
        "Mozar",
        "Mukindpur",
        "Munjhala",
        "Murli",
        "Nababpur",
        "Nagai",
        "Nageshvar",
        "Nait",
        "Naka Pardi",
        "Narkund",
        "Narsapur",
        "Ner",
        "Pahapal",
        "Palaskund",
        "Pandharkawada",
        "Pandhurbna",
        "Pandhurna Budruk",
        "Pandhurna Khurd",
        "Pangari",
        "Pangari Tanda",
        "Paradhi Beda",
        "Pardhi Tanda",
        "Pathari",
        "Pathrad Gole",
        "Pendhara",
        "Pimpalgaon",
        "Pimpari Ijara",
        "Pisgaon",
        "Prathrad Devi",
        "Ramnagar Tanda",
        "Rui",
        "Sajegaon",
        "Salaipod",
        "Salod",
        "Sarangpur",
        "Sarkinhi",
        "Satefal",
        "Savangi",
        "Sawala",
        "Sawana",
        "Sawanga",
        "Sawargaon",
        "Sawargaon Kale",
        "Saykheda",
        "Sevadas Nagar",
        "Shakalgaon",
        "Shankarpur",
        "Shelodi",
        "Shindi",
        "Shirpurwadi",
        "Shivani",
        "Shivpod",
        "Singaldip",
        "Sonegaon",
        "Sonupod",
        "Sonurli",
        "Surdevi",
        "Takali",
        "Tembhi",
        "Thalegaon",
        "Tiwasa",
        "Uchegaon",
        "Udapur",
        "Ujona",
        "Umari",
        "Umartha",
        "Vasantnagar",
        "Veni",
        "Virgavhan",
        "Vyahali",
        "Wadgaon",
        "Wadgaon Gadhave",
        "Wadgaon Poste",
        "Wai",
        "Wakodi",
        "Walki",
        "Waradh",
        "Warjai",
        "Warud",
        "Watfal",
        "Yelguda",
        "Zombhadi",
    ];

    res.render('adduser', {
        village: newvillageslist
    });

};

// export const UserRegister = async (req, res) => {
//     try {
//         const { fullname, emailid, password, phonenumber,distic,block,village,role, dob, qualification } = req.body;
//         let profileimage = null;

//         // Validate input
//         if (!fullname || !emailid || !password || !phonenumber || !distic || !block || !village ||  !role || !dob || !qualification) {
//             req.flash('error', 'All fields are required');
//             return res.status(400).redirect('/adduser');
//         }

//         // Validate email format
//         const emailRegex = /^\w+([\.-]?\w+)@\w+([\. -]?\w+)(\.\w{2,3})+$/;
//         if (!emailRegex.test(emailid)) {
//             req.flash('error', 'Email is not valid');
//             return res.status(400).redirect('/adduser');
//         }

//         // Check for duplicate email
//         const isDuplicateEmail = await UserModel.findOne({ where: { emailid } });
//         if (isDuplicateEmail) {
//             req.flash('error', 'Email already exists');
//             return res.status(400).redirect('/adduser');
//         }

//         // Hash password
//         const salt = await bcrypt.genSalt(10);
//         const hashedPassword = await bcrypt.hash(password, salt);

//         // If a profile image is uploaded, store only the file name
//         if (req.file) {
//             profileimage = path.basename(req.file.path);  // Save only the file name (e.g., 'image-xyz.jpg')
//         }

//         // Create new user
//         const newUser = await UserModel.create({
//             profileimage,
//             fullname,
//             emailid,
//             password: hashedPassword,
//             planepassword:password,
//             phonenumber,
//             distic,
//             block,
//             village,
//             cultivatedland,
//             role,
//             dob,
//             qualification
//         });

//         req.flash('success', 'User created successfully');
//         return res.redirect('/userlist');

//     } catch (err) {
//         console.error(err);
//         req.flash('error', 'Error creating user');
//         return res.status(500).redirect('/adduser');
//     }
// };

export const UserRegister = async (req, res) => {
    try {
        const { fullname, emailid, password, phonenumber, distic, block, cultivatedland, village, role, dob, qualification } = req.body;
        let profileimage = null;

        // Validate input
        if (!fullname || !emailid || !password || !phonenumber || !cultivatedland || !distic || !block || !village || !role || !dob || !qualification) {
            req.flash('error', 'All fields are required');
            return res.status(400).redirect('/adduser');
        }

        // Validate email format
        const emailRegex = /^\w+([\.-]?\w+)@\w+([\. -]?\w+)(\.\w{2,3})+$/;
        if (!emailRegex.test(emailid)) {
            req.flash('error', 'Email is not valid');
            return res.status(400).redirect('/adduser');
        }

        // Check for duplicate email
        const isDuplicateEmail = await UserModel.findOne({ where: { emailid } });
        if (isDuplicateEmail) {
            req.flash('error', 'Email already exists');
            return res.status(400).redirect('/adduser');
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // If a profile image is uploaded, store only the file name
        if (req.file) {
            profileimage = path.basename(req.file.path); // Save only the file name (e.g., 'image-xyz.jpg')
        }

        // Generate clusterid
        const generateClusterId = (distic, block, village) => {
            // Get first two characters of each field
            const disticAbbr = distic.slice(0, 2).toUpperCase();
            const blockAbbr = block.slice(0, 2).toUpperCase();
            const villageAbbr = village.slice(0, 2).toUpperCase();

            // Generate a 4-digit random number
            const randomNumber = Math.floor(1000 + Math.random() * 9000);

            return `${disticAbbr}${blockAbbr}${villageAbbr}${randomNumber}`;
        };

        const clusterid = generateClusterId(distic, block, village);


        // Create new user
        const newUser = await UserModel.create({
            profileimage,
            fullname,
            emailid,
            password: hashedPassword,
            planepassword: password,
            phonenumber,
            distic,
            block,
            village,
            cultivatedland,
            clusterid,
            role,
            dob,
            qualification,
        });

        req.flash('success', 'User created successfully');
        return res.redirect('/userlist');
    } catch (err) {
        console.error(err);
        req.flash('error', 'Error creating user');
        return res.status(500).redirect('/adduser');
    }
};

export const AdminupdateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            fullname,
            emailid,
            phonenumber,
            distic,
            block,
            village,
            cultivatedland,
            role,
            dob,
            qualification
        } = req.body;

        // Validate input (removed address)
        if (!fullname || !emailid || !phonenumber || !distic || !block || !village || !cultivatedland || !role || !dob || !qualification) {
            req.flash('error', 'All fields are required');
            return res.status(400).redirect(`/updateuser/${id}`);
        }

        // Validate email format
        const emailRegex = /^\w+([\.-]?\w+)@\w+([\. -]?\w+)(\.\w{2,3})+$/;
        if (!emailRegex.test(emailid)) {
            req.flash('error', 'Email is not valid');
            return res.status(400).redirect(`/updateuser/${id}`);
        }

        // Check if user exists
        const user = await UserModel.findByPk(id);
        if (!user) {
            req.flash('error', 'User not found');
            return res.status(404).redirect('/userlist');
        }

        // Check for duplicate email (exclude the current user)
        const duplicateEmailUser = await UserModel.findOne({ where: { emailid, id: { [Op.ne]: id } } });
        if (duplicateEmailUser) {
            req.flash('error', 'Email already exists');
            return res.status(400).redirect(`/updateuser/${id}`);
        }

        // Handle profile image upload
        let profileimage = user.profileimage; // Retain the current profile image
        if (req.file) {
            profileimage = path.basename(req.file.path); // Use new image if uploaded
        }

        // Update user details (removed address)
        user.fullname = fullname;
        user.emailid = emailid;
        user.phonenumber = phonenumber;
        user.distic = distic;
        user.block = block;
        user.village = village;
        user.cultivatedland = cultivatedland;
        user.role = role;
        user.dob = dob;
        user.qualification = qualification;
        user.profileimage = profileimage;

        await user.save();

        req.flash('success', 'User updated successfully');
        return res.redirect('/userlist');
    } catch (err) {
        console.error('Error updating user:', err);
        req.flash('error', 'An error occurred while updating the user');
        return res.status(500).redirect(`/updateuser/${id}`);
    }
};

export const userlist = async (req, res) => {
    try {
        const user = await UserModel.findAll();

        if (user.length === 0) {

            return res.render('userlist', { message: 'User not found' });
        }


        res.render('userlist', { users: user });
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const fieldofficerlist = async (req, res) => {
    try {
        const fieldOfficers = await UserModel.findAll({
            where: { role: 'Field Officer' },
        });

        if (fieldOfficers.length === 0) {
            return res.render('fieldofficerlist', { message: 'No Field Officers found' });
        }
        res.render('userlist', { users: fieldOfficers });
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const PClist = async (req, res) => {
    try {
        const ProcjectCoardinater = await UserModel.findAll({
            where: { role: 'Project Coordinator' },
        });

        if (ProcjectCoardinater.length === 0) {
            return res.render('PClist', { message: 'No Procject Coardinater found' });
        }
        res.render('PClist', { users: ProcjectCoardinater });
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const AsstPClist = async (req, res) => {
    try {
        const AsstProcjectCoardinater = await UserModel.findAll({
            where: { role: 'Assistant Project Coordinator' },
        });

        if (AsstProcjectCoardinater.length === 0) {
            return res.render('AsstPClist', { message: 'No Assistant Procject Coardinater found' });
        }
        res.render('AsstPClist', { users: AsstProcjectCoardinater });
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const farmerlist = async (req, res) => {
    try {
        const farmersList = await farmers.findAll({
            order: [['id', 'DESC']],
        });

        if (farmersList.length === 0) {
            return res.render('farmerlist', { message: 'No farmers found' });
        }

        res.render('farmerlist', { farmers: farmersList });
    } catch (error) {
        console.error("Error fetching farmers:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const DeleteFarmerById = async (req, res) => {
    try {
        const farmerID = req.params.id;


        const deletedUser = await farmers.destroy({
            where: { id: farmerID }
        });

        if (!deletedUser) {

            req.flash('error', 'Farmer not found');
            return res.redirect('/farmerlist');
        }
        req.flash('success', 'Farmer deleted successfully');
        return res.redirect('/farmerlist');
    } catch (error) {
        console.error("Error deleting Farmer:", error);
        req.flash('error', 'Internal server error');
        return res.status(500).redirect('/farmerlist');
    }
};

export const DeleteUserById = async (req, res) => {
    try {
        const userId = req.params.id;


        const deletedUser = await UserModel.destroy({
            where: { id: userId }
        });

        if (!deletedUser) {

            req.flash('error', 'User not found');
            return res.redirect('/userlist');
        }
        req.flash('success', 'User deleted successfully');
        return res.redirect('/userlist');
    } catch (error) {
        console.error("Error deleting user:", error);
        req.flash('error', 'Internal server error');
        return res.status(500).redirect('/userlist');
    }
};

export const DeleteFieldOfficerWorkDetailById = async (req, res) => {
    try {
        const userId = req.params.id;
        console.log("Deleting work detail for ID:", userId); // Log the ID being deleted

        const deletedUser = await FieldWorkerWorkDetail.destroy({
            where: { id: userId }
        });

        if (!deletedUser) {
            console.log("Work detail not found for ID:", userId); // Log if no record was deleted
            req.flash('error', 'Work Detail not found');
            return res.redirect('/getAllFieldWorkerWorkDetails');
        }

        console.log("Work detail deleted successfully for ID:", userId); // Log successful deletion
        req.flash('success', 'Work Detail deleted successfully');
        return res.redirect('/getAllFieldWorkerWorkDetails');
    } catch (error) {
        console.error("Error deleting Work Detail:", error); // Log the error
        req.flash('error', 'Internal server error');
        return res.status(500).redirect('/getAllFieldWorkerWorkDetails');
    }
};

export const getuserbyid = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await UserModel.findByPk(id);
        if (!user) {
            return res.render('edituser', { message: 'User not found', user: null });
        }
        res.render('edituser', { user });
    } catch (error) {
        console.error("Error fetching user:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const UserLogin = async (req, res) => {
    try {
        const { emailid, password } = req.body;

        // Validate input
        if (!emailid || !password) {
            return res.status(400).json({
                errors: [{
                    errormessage: "All fields are required",
                    status: false
                }],
                emailid,
                password
            });
        }

        // Find the user by email
        const user = await UserModel.findOne({ where: { emailid } });
        if (!user) {
            return res.status(404).json({
                errors: [{
                    errormessage: "User not found",
                    status: false
                }],
                emailid
            });
        }

        // Check if the password is valid
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            return res.status(401).json({
                errors: [{
                    errormessage: "Invalid password",
                    status: false
                }],
                password
            });
        }

        // Generate access and refresh tokens
        const token = jwt.sign({ id: user.id }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
        const refreshToken = jwt.sign({ id: user.id }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '7d' });

        // Save refresh token in the database
        user.refreshToken = refreshToken;
        await user.save();

        // Store user data in the session
        req.session.user = {
            id: user.id,
            profileimage: user.profileimage,
            fullname: user.fullname,
            emailid: user.emailid,
            phonenumber: user.phonenumber,
            block: user.block,
            distic: user.distic,
            village: user.village,
            cultivatedland: user.cultivatedland,
            clusterid: user.clusterid,
            role: user.role,
            dob: user.dob,
            qualification: user.qualification,
            refreshToken: user.refreshToken,
            token
        };

        // Send success response
        return res.status(200).json({
            status: true,
            message: "User logged in successfully",
            refreshToken,
            token,
            user: {
                id: user.id,
                profileimage: user.profileimage,
                fullname: user.fullname,
                emailid: user.emailid,
                phonenumber: user.phonenumber,
                block: user.block,
                distic: user.distic,
                village: user.village,
                cultivatedland: user.cultivatedland,
                clusterid: user.clusterid,
                role: user.role,
                dob: user.dob,
                qualification: user.qualification
            }
        });

    } catch (errors) {
        console.error(errors);
        return res.status(500).json({
            errors: [{
                errormessage: "Error logging in",
                status: false,
                errors: errors.message
            }],
        });
    }
};

export const details = async (req, res) => {
    res.render('detailofproductionandcultivation')
}

export const DeleteUserLocation = async (req, res) => {
    try {
        const locationId = req.params.id; // Get the location ID from the URL

        // Deleting the user attendance record
        const deletedLocation = await userattendance.destroy({
            where: { id: locationId }
        });

        if (!deletedLocation) {
            // Flash message for error when location is not found
            req.flash('error', 'Location not found');
            return res.status(404).json({ success: false, message: 'Location not found' });
        }

        // Flash message for successful deletion
        req.flash('success', 'Location deleted successfully');
        return res.json({ success: true, id: locationId });
    } catch (error) {
        console.error("Error deleting Location:", error);
        req.flash('error', 'Internal server error');
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};


export const getProductionAndCultivationById = async (req, res) => {
    try {
        const { farmerID } = req.params;

        const rawCultivationCosts = await CultivationCost.findAll({ where: { farmerID } });
        const rawProductionDetails = await ProductionDetails.findAll({ where: { farmerID } });

        const cultivationCosts = rawCultivationCosts.map(cost => ({
            ...cost.toJSON(),
            crops: JSON.parse(cost.crops),
        }));

        const productionDetails = rawProductionDetails.map(detail => {
            let parsedCropName;
            try {
                parsedCropName = JSON.parse(detail.cropName);
            } catch {
                parsedCropName = detail.cropName;
            }
            return {
                ...detail.toJSON(),
                cropName: parsedCropName,
            };
        });

        // Calculate profit/loss for each crop
        const profitLossData = [];

        cultivationCosts.forEach(cultivation => {
            const cropDetails = cultivation.crops;
            const matchingProduction = productionDetails.find(production =>
                production.cropName.name === cropDetails.crop &&
                production.cropName.season === cropDetails.season &&
                production.cropName.irrigationType === cropDetails.category
            );

            if (matchingProduction) {
                const { totalCost: cultivationCost } = cropDetails;
                const { totalCost: productionCost } = matchingProduction.cropName;

                const profitOrLoss = productionCost - cultivationCost;
                const profitOrLossPercentage = ((profitOrLoss / cultivationCost) * 100).toFixed(2);

                profitLossData.push({
                    season: cropDetails.season,
                    irrigationType: cropDetails.category,
                    crop: cropDetails.crop,
                    cultivationCost,
                    productionCost,
                    profitOrLoss,
                    profitOrLossPercentage: `${profitOrLossPercentage}%`,
                });
            }
        });

        const responseData = {
            cultivationCosts,
            productionDetails,
            profitLossData,
        };

        console.log("Response Data:", JSON.stringify(responseData, null, 2)); // Debugging
        // Render the Handlebars template with data
        res.render('detailofproductionandcultivation', { data: responseData });

    } catch (error) {
        console.error("Error fetching farmer details:", error);
        res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
};

export const getAllFieldWorkerWorkDetails = async (req, res) => {
    try {
        // Fetch all work details
        const allWorkDetails = await FieldWorkerWorkDetail.findAll();

        if (allWorkDetails.length === 0) {
            return res.render('farmerworkdetails', {
                success: false,
                message: "No work details found.",
                data: []
            });
        }

        // res.status(200).json({
        //     data:allWorkDetails
        // })

        return res.render('farmerworkdetails', {
            success: true,
            message: "All field worker work details fetched successfully.",
            data: allWorkDetails
        });
    } catch (error) {
        console.error("Error fetching all work details:", error);
        return res.status(500).render('error', {
            success: false,
            message: "Error fetching work details.",
            error: error.message
        });
    }
};

export const editFieldWorkerWorkDetailsById = async (req, res) => {
    const { id } = req.params;

    try {
        const workDetails = await FieldWorkerWorkDetail.findOne({ where: { id } });

        if (!workDetails) {
            return res.render('editfiledworkerdtail', {
                success: false,
                message: `No work details found for ID: ${id}`,
                data: []
            });
        }

        // res.status(200).json({
        //     data:workDetails
        // });

        return res.render('editfiledworkerdtail', {
            success: true,
            message: `Work details for ID: ${id} fetched successfully.`,
            data: workDetails
        });
    } catch (error) {
        console.error(`Error fetching work details for ID: ${id}`, error);
        return res.status(500).render('error', {
            success: false,
            message: `Error fetching work details for ID: ${id}.`,
            error: error.message
        });
    }
};

export const AdminupdateFieldWorkerWorkDetails = async (req, res) => {
    const { id } = req.params; // Get the field worker ID from the URL parameter
    const {
        name,
        address,
        qualifications,
        mobileNumber,
        emailID,
        workDate,
        villagesVisited,
        travelInKms,
        farmersContactedIndividually,
        groupMeetingsConducted,
        farmersContactedInGroupMeetings,
        clusterTrainingPlace,
        farmersAttendedTraining,
        inputSupplied,  // Make sure this is an array of objects
        consultancyTelephone,
        consultancyWhatsApp,
        totalConsultancy
    } = req.body; // Get the updated data from the request body

    try {
        // Check if required fields are provided
        if (!name || !address || !mobileNumber || !emailID || !workDate) {
            return res.status(400).render('editfiledworkerdtail', {
                success: false,
                message: 'Please provide all the required fields.',
                data: []
            });
        }

        // Find the work details by ID
        const workDetails = await FieldWorkerWorkDetail.findOne({ where: { id } });

        if (!workDetails) {
            return res.status(404).render('editfiledworkerdtail', {
                success: false,
                message: `No work details found for ID: ${id}`,
                data: []
            });
        }

        // Update the work details with the provided data
        workDetails.name = name;
        workDetails.address = address;
        workDetails.qualifications = qualifications;
        workDetails.mobileNumber = mobileNumber;
        workDetails.emailID = emailID;
        workDetails.workDate = workDate;
        workDetails.villagesVisited = villagesVisited;
        workDetails.travelInKms = travelInKms;
        workDetails.farmersContactedIndividually = farmersContactedIndividually;
        workDetails.groupMeetingsConducted = groupMeetingsConducted;
        workDetails.farmersContactedInGroupMeetings = farmersContactedInGroupMeetings;
        workDetails.clusterTrainingPlace = clusterTrainingPlace;
        workDetails.farmersAttendedTraining = farmersAttendedTraining;

        // Handling the inputSupplied array (make sure it's properly formatted)
        workDetails.inputSupplied = Array.isArray(inputSupplied) ? inputSupplied : [];
        workDetails.consultancyTelephone = consultancyTelephone;
        workDetails.consultancyWhatsApp = consultancyWhatsApp;
        workDetails.totalConsultancy = (Number(consultancyTelephone) || 0) + (Number(consultancyWhatsApp) || 0);


        // Save the updated work details to the database
        await workDetails.save();

        // Send a success response and render the updated details
        return res.render('editfiledworkerdtail', {
            success: true,
            message: `Work details for ID: ${id} updated successfully.`,
            data: workDetails
        });

    } catch (error) {
        console.error(`Error updating work details for ID: ${id}`, error);
        return res.status(500).render('error', {
            success: false,
            message: `Error updating work details for ID: ${id}. Please try again later.`,
            error: error.message
        });
    }
};

export const AdmingetCoordinatorDetails = async (req, res) => {
    try {
        // Fetch coordinator details matching the coordinatorID
        const coordinatorDetails = await CoordinatorWorkDetail.findAll();

        if (coordinatorDetails.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No data found",
            });
        }


        res.render('AdminGetCoordinatorWorkDetail', {
            success: true,
            message: "Coordinator details retrieved successfully",
            data: coordinatorDetails,  // Send the retrieved data to the view
        });
    } catch (error) {
        console.error("Error fetching coordinator details:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};

// export const get_all_intraction_with_former = async (req, res) => {
//     try {
//          const Interaction = await Interactions.findAll();
//         console.log("farner-interaction",Interaction);
//         res.render('farmerintrations', {
//             success: true,
//             data: Interaction,
//         });
//     } catch (error) {
//         console.error("Error fetching interaction:", error);
//         res.status(500).render('error', {
//             success: false,
//             message: "Internal server error",
//             error: error.message,
//         });
//     }
// };

export const get_all_intraction_with_former = async (req, res) => {
    try {
        const Interaction = await Interactions.findAll();
        console.log("farmer-interaction", Interaction);

        // Count Interaction by farmer and village
        const interactionCounts = Interaction.reduce((acc, interaction) => {
            const { farmer, village } = interaction.dataValues;
            const key = `${farmer}-${village}`;
            acc[key] = (acc[key] || 0) + 1;
            return acc;
        }, {});

        // Add the count to each interaction
        const interactionsWithCounts = Interaction.map((interaction) => {
            const { farmer, village } = interaction.dataValues;
            const key = `${farmer}-${village}`;
            return {
                ...interaction.dataValues,
                count: interactionCounts[key],
            };
        });

        // Remove duplicates based on farmer and village
        const uniqueInteractions = Object.values(
            interactionsWithCounts.reduce((acc, interaction) => {
                const key = `${interaction.farmer}-${interaction.village}`;
                if (!acc[key]) {
                    acc[key] = interaction; // Keep the first occurrence
                }
                return acc;
            }, {})
        );

        res.render('farmerintrations', {
            success: true,
            Alldata: Interaction,
            data: uniqueInteractions, // Pass unique interactions to the view
        });
    } catch (error) {
        console.error("Error fetching interaction:", error);
        res.status(500).render('error', {
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};

export const get_interaction_details = async (req, res) => {
    try {
        const { village, farmer } = req.params;

        // Fetch detailed interaction data based on the village and farmer
        const detailedInteractions = await Interactions.findAll({
            where: {
                village,
                farmer,
            },
        });

        // Render the detailed page
        res.render('interactionDetails', {
            success: true,
            data: detailedInteractions,
            village,
            farmer,
        });
    } catch (error) {
        console.error("Error fetching detailed interaction:", error);
        res.status(500).render('error', {
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};

export const getfarmerbyid = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ success: false, message: "Farmer ID is required" });
        }

        const farmer = await farmers.findByPk(id);

        if (!farmer) {
            return res.status(404).render('editfarmer', {
                success: false,
                message: "Farmer not found",
                farmer: null,
            });
        }

        let parsedCropsSown = {};
        try {
            // Check if cropsSown is a string and needs parsing
            if (typeof farmer.cropsSown === 'string') {
                parsedCropsSown = JSON.parse(farmer.cropsSown);
            } else {
                parsedCropsSown = farmer.cropsSown || {}; // It's already an object or null, so just use it
            }
        } catch (parseError) {
            console.error("Error parsing cropsSown:", parseError);
            parsedCropsSown = {}; // Fallback to empty object if parsing fails
        }

        // Dynamic list of districts
        const districts = ["yavatmal", "washim"];

        const taluka = ["Arni", "Darwha", "Digras", "Ghatanji", "Kalamb", "Kelapur", "Mahagaon", "Maregaon", "Ner", "Ralegaon", "Yavatmal"];
        const village = [
            "Aajani",
            "Aajanti",
            "Aashti",
            "Aasola",
            "Adani",
            "Adani Pod",
            "Amala Gav",
            "Amala Tanda",
            "Amshet",
            "Anji",
            "Anuppod",
            "Arambhi",
            "Athmurdi",
            "Banayat",
            "Bandar",
            "Baradgaon",
            "Bechkheda",
            "Belora",
            "Bhamb Raja",
            "Bhurkipod",
            "Bodgavhan",
            "Borgaon",
            "Bori Chandra",
            "Bori Gosavi",
            "Bori Sinha",
            "Borjai",
            "Bramhanpur",
            "Bramhanwada",
            "Bramhanwada Purv",
            "Bramhanwada Tanda",
            "Bramhi",
            "Chandapur",
            "Chani",
            "Chauki",
            "Chauki Zuli",
            "Chikani",
            "Chikhali",
            "Chinchala",
            "Chinchamandal",
            "Chopan",
            "Churkuta",
            "Dabha",
            "Daheli",
            "Dahifal",
            "Deurwadi",
            "Devala",
            "Devdharui",
            "Dhaipod",
            "Dhanaj",
            "Dharanpod",
            "Domaga",
            "Dongargaon",
            "Dudhgav",
            "Echora",
            "Fulwadi",
            "Gadegao",
            "Gajipur",
            "Garpod",
            "Gaulpend",
            "Gaurala",
            "Gavpod",
            "Ghubadheti",
            "Gondegaon",
            "Gondgavhan",
            "Gunj",
            "Haru",
            "Hatgaon",
            "Hivara",
            "Indrathana",
            "Jambhora",
            "Jamwadi",
            "Jankai",
            "Kamathwada",
            "Kanada",
            "Kanala",
            "Kanzara",
            "Kapshi",
            "Karamala",
            "Khairgaon",
            "Khairgaon Pod",
            "Khairgaon Tanda",
            "Khandani",
            "Khatara",
            "Kinhi Walashi",
            "Krushnapur",
            "Kumbhari",
            "Kumbhipod",
            "Ladkhed",
            "Lakhmapur",
            "Lohatwadi",
            "Loni",
            "Majara",
            "Malkhed Bu.",
            "Malkinho",
            "Mangla Devi",
            "Mangrul",
            "Manikwada",
            "Manjarda",
            "Mardi",
            "Maregaon",
            "Masola",
            "Mendhala",
            "Mendhani",
            "Morath",
            "Morgavhan",
            "Mozar",
            "Mukindpur",
            "Munjhala",
            "Murli",
            "Nababpur",
            "Nagai",
            "Nageshvar",
            "Nait",
            "Naka Pardi",
            "Narkund",
            "Narsapur",
            "Ner",
            "Pahapal",
            "Palaskund",
            "Pandharkawada",
            "Pandhurbna",
            "Pandhurna Budruk",
            "Pandhurna Khurd",
            "Pangari",
            "Pangari Tanda",
            "Paradhi Beda",
            "Pardhi Tanda",
            "Pathari",
            "Pathrad Gole",
            "Pendhara",
            "Pimpalgaon",
            "Pimpari Ijara",
            "Pisgaon",
            "Prathrad Devi",
            "Ramnagar Tanda",
            "Rui",
            "Sajegaon",
            "Salaipod",
            "Salod",
            "Sarangpur",
            "Sarkinhi",
            "Satefal",
            "Savangi",
            "Sawala",
            "Sawana",
            "Sawanga",
            "Sawargaon",
            "Sawargaon Kale",
            "Saykheda",
            "Sevadas Nagar",
            "Shakalgaon",
            "Shankarpur",
            "Shelodi",
            "Shindi",
            "Shirpurwadi",
            "Shivani",
            "Shivpod",
            "Singaldip",
            "Sonegaon",
            "Sonupod",
            "Sonurli",
            "Surdevi",
            "Takali",
            "Tembhi",
            "Thalegaon",
            "Tiwasa",
            "Uchegaon",
            "Udapur",
            "Ujona",
            "Umari",
            "Umartha",
            "Vasantnagar",
            "Veni",
            "Virgavhan",
            "Vyahali",
            "Wadgaon",
            "Wadgaon Gadhave",
            "Wadgaon Poste",
            "Wai",
            "Wakodi",
            "Walki",
            "Waradh",
            "Warjai",
            "Warud",
            "Watfal",
            "Yelguda",
            "Zombhadi",
        ];

        const clusterName = [
            "Masola",
            "Bori Chandra",
            "Bramhi",
            "Chaani (Ka)",
            "Malkhed Bu.",
            "Pathrad Devi",
            "Arambhi",
            "Murali",
            "Umari",
            "Adani",
            "Veni",
            "Chinchala",
            "Khandani",
            "Mardi",
            "Ner",
            "Pathrad Gole",
            "Tembhi",
            "Palaskund",
            "Bori Sinha",
            "Rui",
        ];

        const typeOfLand = ["Clayey", "Sandy Loam", "Sandy"];

        const conservationMeasureItems = ["Trenching", "Farm Pond", "Bunding"];

        const microIrrigation = ["Drip", "Sprinklers"];

        const sourceIrrigationItems = ["Well", "Canal"];



        // Send parsed data and districts to frontend
        res.render('editfarmer', {
            success: true,
            farmer: { ...farmer.toJSON(), cropsSown: parsedCropsSown },
            districts,
            taluka,
            village,
            clusterName,
            typeOfLand,
            conservationMeasureItems,
            microIrrigation,
            sourceIrrigationItems,

        });
    } catch (error) {
        console.error("Error fetching farmer details:", error);
        res.status(500).render('editfarmer', {
            success: false,
            message: "Internal server error",
            farmer: null,
        });
    }
};

export const getattendancebyuser = async (req, res) => {
    try {
        const { userId } = req.params;

        if (!userId) {
            return res.status(400).json({ success: false, message: "USer Id is Required" });
        }

        const userattendances = await userattendance.findAll({
            where: { userId: userId }
        });

        res.render('userattendance', {
            success: true,
            data: userattendances
        });

    } catch (error) {
        console.error("Error fetching User_Attendance details:", error);
        res.status(500).render('userattendance', {
            success: false,
            message: "Internal server error",
            farmer: null,
        });
    }
};

export const AdminUpdateFarmer = async (req, res) => {
    try {
        const id = req.params.id;

        const {
            farmerID,
            newname,
            mobileNumber,
            emailID,
            villagename,
            taluka,
            clusterName,
            district,
            cultivatedLand,
            desiBreeds,
            typeOfLand,
            sourceIrrigationItems,
            conservationMeasureItems,
            microIrrigation,
            ...flattenedCropsSown
        } = req.body;

        console.log("Request body data:", req.body);

        // Transform the flattened `cropsSown` fields into a nested object
        const cropsSown = {};
        Object.keys(flattenedCropsSown).forEach((key) => {
            if (key.startsWith("cropsSown.")) {
                const path = key.replace("cropsSown.", "").split(".");
                let current = cropsSown;

                path.forEach((segment, index) => {
                    if (index === path.length - 1) {
                        // Assign the value at the final segment
                        if (!current[segment]) current[segment] = [];
                        const [crop, cropLand] = flattenedCropsSown[key];
                        current[segment].push({ crop, cropLand });
                    } else {
                        // Ensure the object exists for intermediate segments
                        current[segment] = current[segment] || {};
                        current = current[segment];
                    }
                });
            }
        });

        console.log("Transformed cropsSown data:", cropsSown);

        // Find the farmer record by ID
        const farmer = await farmers.findByPk(id);
        if (!farmer) {
            req.flash('error', 'Farmer not found');
            return res.status(404).redirect('/farmerlist');
        }

        // Update fields
        farmer.farmerID = farmerID;
        farmer.name = newname;
        farmer.mobileNumber = mobileNumber;
        farmer.emailID = emailID;
        farmer.villageName = villagename;
        farmer.taluka = taluka;
        farmer.clusterName = clusterName;
        farmer.district = district;
        farmer.cultivatedLand = cultivatedLand;
        farmer.desiBreeds = desiBreeds;
        farmer.typeOfLand = typeOfLand;
        farmer.sourceIrrigationItems = sourceIrrigationItems;
        farmer.conservationMeasureItems = conservationMeasureItems;
        farmer.microIrrigation = microIrrigation;

        if (Object.keys(cropsSown).length > 0) {
            try {
                farmer.cropsSown = cropsSown;
            } catch (err) {
                console.error('Failed to stringify cropsSown:', err.message);
                req.flash('error', 'Invalid cropsSown format');
                return res.redirect(`/editfarmer/${id}`);
            }
        }

        console.log("Updated farmer data:", farmer);

        await farmer.save();

        req.flash('success', 'Farmer details updated successfully');
        return res.redirect('/farmerlist');
    } catch (error) {
        console.error('Error updating farmer:', error.message);
        req.flash('error', 'An error occurred while updating farmer details');
        return res.redirect(`/editfarmer/${req.params.id}`);
    }
};

export const getFarmersByCluster = async (req, res) => {
    try {
        const clusterNames = [
            "Masola", "Bori Chandra", "Bramhi", "Chaani (Ka)", "Malkhed Bu.",
            "Pathrad Devi", "Arambhi", "Murali", "Umari", "Adani", "Veni",
            "Chinchala", "Khandani", "Mardi", "Ner", "Pathrad Gole",
            "Tembhi", "Palaskund", "Bori Sinha", "Rui"
        ];
        const defaultClusterName = "Bori Chandra";
        const clusterName = req.query.clusterName || defaultClusterName;


        const farmersData = await farmers.findAll({
            where: { clusterName },
        });
        const totalFarmers = farmersData.length;
        res.render('clusterfarmer', {
            success: farmersData.length > 0,
            message: farmersData.length
                ? `Farmers in cluster '${clusterName}' retrieved successfully.`
                : `No farmers found in cluster '${clusterName}'.`,
            totalFarmers,
            data: farmersData,
            clusters: clusterNames,
            clusterName,
        });
    } catch (error) {
        console.error("Error fetching farmers by cluster:", error);
        res.status(500).render('error', { message: "Internal server error", error: error.message });
    }
};

// export const getFarmerCropByCrop = async (req, res) => {
//     try {
//         const crop = req.query.crop || "Maize";

//         const rawCultivationCosts = await CultivationCost.findAll();
//         const rawProductionDetails = await ProductionDetails.findAll();

//         // Parse and structure cultivation costs
//         const cultivationData = rawCultivationCosts.map(cost => ({
//             ...cost.toJSON(),
//             crops: JSON.parse(cost.crops),
//         }));

//         // Parse and structure production details
//         const productionData = rawProductionDetails.map(detail => {
//             let parsedCropName;
//             try {
//                 parsedCropName = JSON.parse(detail.cropName);
//             } catch {
//                 parsedCropName = detail.cropName;
//             }
//             return {
//                 ...detail.toJSON(),
//                 cropName: parsedCropName,
//             };
//         });

//         // Create unique lists for crop, season, irrigationType, and year
//         const cropListSet = new Set();
//         const seasonListSet = new Set();
//         const irrigationTypeListSet = new Set();
//         const yearListSet = new Set();

//         // Add data from cultivationData
//         cultivationData.forEach(cultivation => {
//             cropListSet.add(cultivation.crops.crop);
//             seasonListSet.add(cultivation.crops.season);
//             irrigationTypeListSet.add(cultivation.crops.category);
//         });

//         // Add data from productionData
//         productionData.forEach(production => {
//             if (production.cropName && production.cropName.name) {
//                 cropListSet.add(production.cropName.name);
//             }
//             if (production.cropName && production.cropName.season) {
//                 seasonListSet.add(production.cropName.season);
//             }
//             if (production.cropName && production.cropName.irrigationType) {
//                 irrigationTypeListSet.add(production.cropName.irrigationType);
//             }
//             if (production.createdAt) {
//                 const year = new Date(production.createdAt).getFullYear();
//                 yearListSet.add(year);
//             }
//         });

//         // Convert Sets to arrays
//         const cropList = Array.from(cropListSet);
//         const seasonList = Array.from(seasonListSet);
//         const irrigationTypeList = Array.from(irrigationTypeListSet);
//         const yearList = Array.from(yearListSet);

//         // Calculate profit/loss
//         const profitLossData = [];

//         cultivationData.forEach(cultivation => {
//             const cropDetails = cultivation.crops;
//             const matchingProduction = productionData.find(production =>
//                 production.cropName.name === cropDetails.crop &&
//                 production.cropName.season === cropDetails.season &&
//                 production.cropName.irrigationType === cropDetails.category
//             );

//             if (matchingProduction) {
//                 const cultivationCost = cropDetails.totalCost;
//                 const productionCost = matchingProduction.cropName.totalSaleValue;

//                 const profitOrLoss = productionCost - cultivationCost;
//                 const profitOrLossPercentage = ((profitOrLoss / cultivationCost) * 100).toFixed(2);

//                 profitLossData.push({
//                     season: cropDetails.season,
//                     irrigationType: cropDetails.category,
//                     crop: cropDetails.crop,
//                     cultivationCost,
//                     productionCost,
//                     profitOrLoss,
//                     profitOrLossPercentage: `${profitOrLossPercentage}%`,
//                 });
//             }
//         });

//         res.render("podt_cult_databycrop", {
//             success: true,
//             crop,
//             cropList,
//             seasonList,
//             irrigationTypeList,
//             yearList,
//             cultivationData,
//             productionData,
//             profitLossData,
//         });

//         // Respond with JSON data
//         // res.status(200).json({
//         //     success: true,
//         //     crop,
//         //     cropList,
//         //     seasonList,
//         //     irrigationTypeList,
//         //     yearList,
//         //     cultivationData,
//         //     productionData,
//         //     profitLossData,
//         // });

//     } catch (error) {
//         console.error("Error fetching crop data:", error);
//         res.status(500).json({
//             success: false,
//             message: "Internal server error occurred while fetching crop data.",
//             error: error.message,
//             crop: req.query.crop,
//             cropList: [],
//             seasonList: [],
//             irrigationTypeList: [],
//             yearList: [],
//             cultivationData: [],
//             productionData: [],
//             profitLossData: [],
//         });
//     }
// };

export const getFarmerCropByCrop = async (req, res) => {
    try {
        // Get filter criteria from query parameters
        const { crop, season, irrigationType, year } = req.query;

        const rawCultivationCosts = await CultivationCost.findAll();
        const rawProductionDetails = await ProductionDetails.findAll();

        // Parse and structure cultivation costs
        const cultivationData = rawCultivationCosts.map(cost => ({
            ...cost.toJSON(),
            crops: JSON.parse(cost.crops),
        }));

        // Parse and structure production details
        const productionData = rawProductionDetails.map(detail => {
            let parsedCropName;
            try {
                parsedCropName = JSON.parse(detail.cropName);
            } catch {
                parsedCropName = detail.cropName;
            }
            return {
                ...detail.toJSON(),
                cropName: parsedCropName,
            };
        });

        // Create unique lists for crop, season, irrigationType, and year
        const cropListSet = new Set();
        const seasonListSet = new Set();
        const irrigationTypeListSet = new Set();
        const yearListSet = new Set();

        // Add data from cultivationData
        cultivationData.forEach(cultivation => {
            cropListSet.add(cultivation.crops.crop);
            seasonListSet.add(cultivation.crops.season);
            irrigationTypeListSet.add(cultivation.crops.category);
        });

        // Add data from productionData
        productionData.forEach(production => {
            if (production.cropName && production.cropName.name) {
                cropListSet.add(production.cropName.name);
            }
            if (production.cropName && production.cropName.season) {
                seasonListSet.add(production.cropName.season);
            }
            if (production.cropName && production.cropName.irrigationType) {
                irrigationTypeListSet.add(production.cropName.irrigationType);
            }
            if (production.createdAt) {
                const year = new Date(production.createdAt).getFullYear();
                yearListSet.add(year);
            }
        });

        // Convert Sets to arrays
        const cropList = Array.from(cropListSet);
        const seasonList = Array.from(seasonListSet);
        const irrigationTypeList = Array.from(irrigationTypeListSet);
        const yearList = Array.from(yearListSet);

        // Apply filtering to cultivationData and productionData based on query parameters
        const filteredCultivationData = cultivationData.filter(cultivation => {
            const cropMatch = crop ? cultivation.crops.crop === crop : true;
            const seasonMatch = season ? cultivation.crops.season === season : true;
            const irrigationTypeMatch = irrigationType ? cultivation.crops.category === irrigationType : true;
            return cropMatch && seasonMatch && irrigationTypeMatch;
        });

        const filteredProductionData = productionData.filter(production => {
            const cropMatch = crop ? production.cropName.name === crop : true;
            const seasonMatch = season ? production.cropName.season === season : true;
            const irrigationTypeMatch = irrigationType ? production.cropName.irrigationType === irrigationType : true;
            const yearMatch = year ? new Date(production.createdAt).getFullYear().toString() === year : true;
            return cropMatch && seasonMatch && irrigationTypeMatch && yearMatch;
        });

        // Calculate profit/loss for filtered data
        const profitLossData = [];

        filteredCultivationData.forEach(cultivation => {
            const cropDetails = cultivation.crops;
            const matchingProduction = filteredProductionData.find(production =>
                production.cropName.name === cropDetails.crop &&
                production.cropName.season === cropDetails.season &&
                production.cropName.irrigationType === cropDetails.category
            );

            if (matchingProduction) {
                const cultivationCost = cropDetails.totalCost;
                const productionCost = matchingProduction.cropName.totalSaleValue;

                const profitOrLoss = productionCost - cultivationCost;
                const profitOrLossPercentage = ((profitOrLoss / cultivationCost) * 100).toFixed(2);

                profitLossData.push({
                    season: cropDetails.season,
                    irrigationType: cropDetails.category,
                    crop: cropDetails.crop,
                    cultivationCost,
                    productionCost,
                    profitOrLoss,
                    profitOrLossPercentage: `${profitOrLossPercentage}%`,
                });
            }
        });

        res.render("podt_cult_databycrop", {
            success: true,
            crop,
            season,
            irrigationType,
            year,
            cropList,
            seasonList,
            irrigationTypeList,
            yearList,
            cultivationData: filteredCultivationData,
            productionData: filteredProductionData,
            profitLossData,
        });

        // Respond with JSON data
        // res.status(200).json({
        //     success: true,
        //     crop,
        //     season,
        //     irrigationType,
        //     year,
        //     cropList,
        //     seasonList,
        //     irrigationTypeList,
        //     yearList,
        //     cultivationData: filteredCultivationData,
        //     productionData: filteredProductionData,
        //     profitLossData,
        // });

    } catch (error) {
        console.error("Error fetching crop data:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error occurred while fetching crop data.",
            error: error.message,
            crop: req.query.crop,
            cropList: [],
            seasonList: [],
            irrigationTypeList: [],
            yearList: [],
            cultivationData: [],
            productionData: [],
            profitLossData: [],
        });
    }
};

export const getfieldworkerreport = async (req, res) => {
    try {
        const { name, year } = req.query;

        // Fetch unique names for the name dropdown
        const uniqueNames = await FieldWorkerWorkDetail.findAll({
            attributes: ['name'],
            group: ['name'],
        });

        // Fetch unique years for the year dropdown
        const uniqueYears = await FieldWorkerWorkDetail.findAll({
            attributes: [
                [Sequelize.fn('YEAR', Sequelize.col('workDate')), 'year']
            ],
            group: ['year'],
            order: [[Sequelize.fn('YEAR', Sequelize.col('workDate')), 'ASC']]
        });

        // Format years for the dropdown
        const yearsList = uniqueYears.map(record => record.get('year'));

        // Filter based on name and year if provided
        let whereCondition = {};
        if (name) {
            whereCondition.name = name;
        }
        if (year) {
            whereCondition.workDate = Sequelize.where(
                Sequelize.fn('YEAR', Sequelize.col('workDate')),
                year
            );
        }

        const fieldWorkerData = await FieldWorkerWorkDetail.findAll({
            where: whereCondition,
        });

        res.render('fieldofficerworkreport', {
            fieldWorkerData,
            uniqueNames,
            yearsList,
            selectedName: name || '',
            selectedYear: year || '',
            totalRecords: fieldWorkerData.length,
            success: fieldWorkerData.length > 0,
        });

    } catch (error) {
        console.error('Error fetching field worker report:', error);
        res.status(500).send('Internal Server Error');
    }
};

// export const get_crop_detail_with_percentage_by_farmerID = async (req, res) => {
//     try {
//         const farmerID = req.query.farmerID || req.params.farmerID || "frm_010125_1621"; // Default farmerID if not provided

//         // Fetch all unique farmerIDs for listing
//         const allFarmerIDsFromCultivation = await CultivationCost.findAll({
//             attributes: [[sequelize.fn('DISTINCT', sequelize.col('farmerID')), 'farmerID']],
//             raw: true,
//         });

//         const allFarmerIDsFromProduction = await ProductionDetails.findAll({
//             attributes: [[sequelize.fn('DISTINCT', sequelize.col('farmerID')), 'farmerID']],
//             raw: true,
//         });

//         // Combine and deduplicate farmerIDs
//         const allFarmerIDs = [
//             ...new Set([
//                 ...allFarmerIDsFromCultivation.map(item => item.farmerID),
//                 ...allFarmerIDsFromProduction.map(item => item.farmerID),
//             ]),
//         ];

//         // Fetch the farmer names by matching the farmerIDs from the farmers model
//         const farmerNames = await farmers.findAll({
//             where: {
//                 farmerID: {
//                     [sequelize.Op.in]: allFarmerIDs,  // Match farmerIDs
//                 },
//             },
//             attributes: ['farmerID', 'name'],  // Ensure the correct field name for farmer name
//             raw: true,
//         });

//         // Create a mapping of farmerID to farmer name
//         const farmerIDToNameMap = farmerNames.reduce((acc, farmer) => {
//             acc[farmer.farmerID] = farmer.name;  // Use the correct column name
//             return acc;
//         }, {});

//         // Fetch the cultivation costs and production details for the selected farmerID
//         const rawCultivationCosts = await CultivationCost.findAll({ where: { farmerID } });
//         const rawProductionDetails = await ProductionDetails.findAll({ where: { farmerID } });

//         // Parse the crops data from cultivation costs
//         const cultivationCosts = rawCultivationCosts.map(cost => ({
//             ...cost.toJSON(),
//             crops: JSON.parse(cost.crops), // Ensure crops data is in the correct format
//         }));

//         // Parse the crop names from production details
//         const productionDetails = rawProductionDetails.map(detail => {
//             let parsedCropName;
//             try {
//                 parsedCropName = JSON.parse(detail.cropName);
//             } catch {
//                 parsedCropName = detail.cropName; // Fallback if cropName isn't a JSON string
//             }
//             return {
//                 ...detail.toJSON(),
//                 cropName: parsedCropName,
//             };
//         });

//         // Calculate profit or loss for each crop
//         const profitLossData = [];

//         cultivationCosts.forEach(cultivation => {
//             const cropDetails = cultivation.crops;
//             const matchingProduction = productionDetails.find(production =>
//                 production.cropName.name === cropDetails.crop &&
//                 production.cropName.season === cropDetails.season &&
//                 production.cropName.irrigationType === cropDetails.category
//             );

//             if (matchingProduction) {
//                 const { totalCost: cultivationCost } = cropDetails;
//                 const { totalCost: productionCost } = matchingProduction.cropName;

//                 const profitOrLoss = productionCost - cultivationCost;
//                 const profitOrLossPercentage = ((profitOrLoss / cultivationCost) * 100).toFixed(2);

//                 profitLossData.push({
//                     season: cropDetails.season,
//                     irrigationType: cropDetails.category,
//                     crop: cropDetails.crop,
//                     cultivationCost,
//                     productionCost,
//                     profitOrLoss,
//                     profitOrLossPercentage: `${profitOrLossPercentage}%`,
//                 });
//             } else {
//                 profitLossData.push({
//                     season: cropDetails.season,
//                     irrigationType: cropDetails.category,
//                     crop: cropDetails.crop,
//                     cultivationCost: cropDetails.totalCost,
//                     productionCost: 0, // No matching production
//                     profitOrLoss: -cropDetails.totalCost,
//                     profitOrLossPercentage: '-100%', // If no matching production
//                 });
//             }
//         });

//         // Prepare the response data
//         const responseData = {
//             allFarmerIDs: allFarmerIDs.map(farmerID => ({
//                 farmerID,
//                 name: farmerIDToNameMap[farmerID] || "Unknown Farmer",  // Ensure the name is mapped
//             })),
//             defaultFarmerID: farmerID, // Pass the selected farmerID to the frontend
//             cultivationCosts,
//             productionDetails,
//             profitLossData,
//         };

//         console.log("Response Data:", JSON.stringify(responseData, null, 2)); // Debugging

//         // Render the Handlebars template with data (Optional for server-side rendering)
//         // res.render('crop_detail_with_per', { data: responseData });

//         res.status(200).json({
//             success: true,
//             data: responseData,
//         });

//     } catch (error) {
//         console.error("Error fetching farmer details:", error);
//         res.status(500).json({ success: false, message: "Internal server error", error: error.message });
//     }
// };

export const get_crop_detail_with_percentage_by_farmerID = async (req, res) => {
    try {
        const currentYear = new Date().getFullYear(); // Default to current year
        const yearFilter = req.query.year || ""; // Remove currentYear as the default value

        // Fetch all unique farmerIDs for listing
        const allFarmerIDsFromCultivation = await CultivationCost.findAll({
            attributes: [[sequelize.fn('DISTINCT', sequelize.col('farmerID')), 'farmerID']],
            where: yearFilter ? sequelize.where(sequelize.fn('YEAR', sequelize.col('createdAt')), yearFilter) : null,
            raw: true,
        });

        const allFarmerIDsFromProduction = await ProductionDetails.findAll({
            attributes: [[sequelize.fn('DISTINCT', sequelize.col('farmerID')), 'farmerID']],
            where: yearFilter ? sequelize.where(sequelize.fn('YEAR', sequelize.col('createdAt')), yearFilter) : null,
            raw: true,
        });

        // Merge and deduplicate farmer IDs
        const allFarmerIDs = [
            ...new Set([
                ...allFarmerIDsFromCultivation.map(item => item.farmerID),
                ...allFarmerIDsFromProduction.map(item => item.farmerID),
            ]),
        ];

        // Set default farmerID (choose the first one in the list)
        const farmerID = req.query.farmerID || req.params.farmerID || allFarmerIDs[0] || ""; // Default to the first farmerID if none is provided

        // Fetch farmer names for the farmer IDs
        const farmerNames = await farmers.findAll({
            where: { farmerID: { [sequelize.Op.in]: allFarmerIDs } },
            attributes: ['farmerID', 'name'],
            raw: true,
        });

        const farmerIDToNameMap = farmerNames.reduce((acc, farmer) => {
            acc[farmer.farmerID] = farmer.name;
            return acc;
        }, {});

        // Fetch cultivation and production details for the selected farmer
        const rawCultivationCosts = await CultivationCost.findAll({
            where: { farmerID, ...(yearFilter ? { createdAt: { [sequelize.Op.gte]: `${yearFilter}-01-01`, [sequelize.Op.lte]: `${yearFilter}-12-31` } } : {}) },
        });

        const rawProductionDetails = await ProductionDetails.findAll({
            where: { farmerID, ...(yearFilter ? { createdAt: { [sequelize.Op.gte]: `${yearFilter}-01-01`, [sequelize.Op.lte]: `${yearFilter}-12-31` } } : {}) },
        });

        // Parse and map cultivation and production details
        const cultivationCosts = rawCultivationCosts.map(cost => {
            let parsedCrops;
            try {
                parsedCrops = typeof cost.crops === 'string' ? JSON.parse(cost.crops) : cost.crops;
            } catch (err) {
                console.error(`Error parsing crops for cultivationCost ID ${cost.id}:`, err.message);
                parsedCrops = cost.crops; // Fallback to original value
            }
            return { ...cost.toJSON(), crops: parsedCrops };
        });

        const productionDetails = rawProductionDetails.map(detail => {
            let parsedCropName;
            try {
                parsedCropName = typeof detail.cropName === 'string' ? JSON.parse(detail.cropName) : detail.cropName;
            } catch (err) {
                console.error(`Error parsing cropName for productionDetail ID ${detail.id}:`, err.message);
                parsedCropName = detail.cropName; // Fallback to original value
            }
            return { ...detail.toJSON(), cropName: parsedCropName };
        });

        // Prepare unique filter lists (Seasons, Irrigation types, Crops, Years)
        const allCultivationData = await CultivationCost.findAll();
        const allProductionData = await ProductionDetails.findAll();

        const seasonList = [
            ...new Set([
                ...allCultivationData.map(cost => {
                    try {
                        return JSON.parse(cost.crops).season;
                    } catch {
                        return null;
                    }
                }).filter(Boolean),
                ...allProductionData.map(detail => {
                    try {
                        return JSON.parse(detail.cropName).season;
                    } catch {
                        return null;
                    }
                }).filter(Boolean),
            ]),
        ];

        const irrigationList = [
            ...new Set([
                ...allCultivationData.map(cost => {
                    try {
                        return JSON.parse(cost.crops).category;
                    } catch {
                        return null;
                    }
                }).filter(Boolean),
                ...allProductionData.map(detail => {
                    try {
                        return JSON.parse(detail.cropName).irrigationType;
                    } catch {
                        return null;
                    }
                }).filter(Boolean),
            ]),
        ];

        const cropList = [
            ...new Set([
                ...allCultivationData.map(cost => {
                    try {
                        return JSON.parse(cost.crops).crop;
                    } catch {
                        return null;
                    }
                }).filter(Boolean),
                ...allProductionData.map(detail => {
                    try {
                        return JSON.parse(detail.cropName).name;
                    } catch {
                        return null;
                    }
                }).filter(Boolean),
            ]),
        ];

        const yearList = [
            ...new Set([
                ...allCultivationData.map(cost => new Date(cost.createdAt).getFullYear()),
                ...allProductionData.map(detail => new Date(detail.createdAt).getFullYear()),
            ]),
        ];

        // Calculate profit or loss
        const profitLossData = [];
        cultivationCosts.forEach(cultivation => {
            const cropDetails = cultivation.crops;
            const matchingProduction = productionDetails.find(production =>
                production.cropName.name === cropDetails.crop &&
                production.cropName.season === cropDetails.season &&
                production.cropName.irrigationType === cropDetails.category
            );

            if (matchingProduction) {
                const cultivationCost = cropDetails.totalCost || 0;
                const productionCost = matchingProduction.cropName.totalCost || 0;

                const profitOrLoss = productionCost - cultivationCost;
                const profitOrLossPercentage = cultivationCost
                    ? ((profitOrLoss / cultivationCost) * 100).toFixed(2)
                    : "0";

                profitLossData.push({
                    season: cropDetails.season,
                    irrigationType: cropDetails.category,
                    crop: cropDetails.crop,
                    cultivationCost,
                    productionCost,
                    profitOrLoss,
                    profitOrLossPercentage: `${profitOrLossPercentage}%`,
                });
            } else {
                profitLossData.push({
                    season: cropDetails.season,
                    irrigationType: cropDetails.category,
                    crop: cropDetails.crop,
                    cultivationCost: cropDetails.totalCost || 0,
                    productionCost: 0,
                    profitOrLoss: -(cropDetails.totalCost || 0),
                    profitOrLossPercentage: '-100%',
                });
            }
        });

        // Prepare the response
        const responseData = {
            allFarmerIDs: allFarmerIDs.map(farmerID => ({
                farmerID,
                name: farmerIDToNameMap[farmerID] || "Unknown Farmer",
            })),
            defaultFarmerID: farmerID,
            cultivationCosts,
            productionDetails,
            profitLossData,
            seasonList,
            irrigationList,
            cropList,
            yearList,
            currentYear, // Keep it for display purposes but no longer defaulting in the filter
        };

        // Render the response to the frontend
        res.render('crop_detail_with_per', { data: responseData });

        // res.status(200).json({
        //     success: true,
        //     data: responseData
        // })
    } catch (error) {
        console.error("Error fetching farmer details:", error);
        res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
};

export const getLocationByName = async (req, res) => {
    const fullname = req.query.fullname || ''; // Empty string means no filter for fullname
    const role = req.query.role || ''; // Empty string means no filter for role

    try {
        // Fetch unique roles for the dropdown
        const rolesList = await userattendance.findAll({
            attributes: ['role'],
            group: ['role'],
            order: [['role', 'ASC']]
        });

        // Fetch unique users for the dropdown
        const usersList = await userattendance.findAll({
            attributes: ['fullname'],
            group: ['fullname'],
            order: [['fullname', 'ASC']]
        });

        // Build the filter condition dynamically
        const whereCondition = {};
        if (fullname) whereCondition.fullname = fullname;
        if (role) whereCondition.role = role;

        // Fetch location data based on filters
        const locations = await userattendance.findAll({
            where: whereCondition
        });

        // Render the template with the data
        res.render('locationreportbyuser', {
            success: true,
            locations,
            users: usersList,
            roles: rolesList,
            fullname,
            role
        });
    } catch (error) {
        console.error("Error fetching location data:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

export const downloadFarmersByCluster = async (req, res) => {
    try {
        const clusterName = req.query.clusterName || "Bori Chandra";

        // Fetch farmers based on the selected cluster
        const farmersData = await farmers.findAll({
            where: { clusterName },
        });

        if (farmersData.length === 0) {
            return res.status(404).json({ success: false, message: `No farmers found in cluster '${clusterName}'.` });
        }

        // Prepare Excel data
        const excelData = farmersData.map(farmer => ({
            FarmerID: farmer.farmerID,
            Name: farmer.name,
            MobileNumber: farmer.mobileNumber,
            EmailID: farmer.emailID,
            VillageName: farmer.villageName,
            Taluka: farmer.taluka,
            ClusterName: farmer.clusterName,
            District: farmer.district,
            CultivatedLand: farmer.cultivatedLand,
            TypeOfLand: farmer.typeOfLand,
            DesiBreeds: farmer.desiBreeds,
            IrrigationSource: farmer.irrigationSource,
            SoilConservationMeasures: farmer.soilConservationMeasures,
            MicroIrrigation: farmer.microIrrigation,
            Rabi_Natural_Irrigated_Crops: farmer.cropsSown?.rabi?.natural_irrigated.map(crop => crop.crop).join(", ") || "None",
            Rabi_Chemical_Irrigated_Crops: farmer.cropsSown?.rabi?.chemical_irrigated.map(crop => crop.crop).join(", ") || "None",
            Kharif_Natural_Irrigated_Crops: farmer.cropsSown?.kharif?.natural_irrigated.map(crop => crop.crop).join(", ") || "None",
            Kharif_Chemical_Irrigated_Crops: farmer.cropsSown?.kharif?.chemical_irrigated.map(crop => crop.crop).join(", ") || "None",
            CreatedAt: farmer.createdAt,
            UpdatedAt: farmer.updatedAt,
        }));

        // Create Excel file
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(excelData);
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Farmers');

        const fileName = `Farmers_${clusterName}.xlsx`;
        const filePath = path.join(__dirname, fileName);

        XLSX.writeFile(workbook, filePath);

        // Send the file to the client
        res.download(filePath, fileName, (err) => {
            if (err) console.error("Error sending file:", err);
            // Delete the file after sending
            fs.unlinkSync(filePath);
        });
    } catch (error) {
        console.error("Error downloading farmers by cluster:", error);
        res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
};

export const downloadCropReportExcel = async (req, res) => {
    try {
        const { crop, season, irrigationType, year } = req.query;

        const rawCultivationCosts = await CultivationCost.findAll();
        const rawProductionDetails = await ProductionDetails.findAll();

        // Parse and structure cultivation costs
        const cultivationData = rawCultivationCosts.map(cost => ({
            ...cost.toJSON(),
            crops: JSON.parse(cost.crops),
        }));

        // Parse and structure production details
        const productionData = rawProductionDetails.map(detail => {
            let parsedCropName;
            try {
                parsedCropName = JSON.parse(detail.cropName);
            } catch {
                parsedCropName = detail.cropName;
            }
            return {
                ...detail.toJSON(),
                cropName: parsedCropName,
            };
        });

        // Filter cultivationData based on query parameters
        const filteredCultivationData = cultivationData.filter(cultivation => {
            const cropMatch = crop ? cultivation.crops.crop === crop : true;
            const seasonMatch = season ? cultivation.crops.season === season : true;
            const irrigationTypeMatch = irrigationType ? cultivation.crops.category === irrigationType : true;
            return cropMatch && seasonMatch && irrigationTypeMatch;
        });

        // Filter productionData based on query parameters
        const filteredProductionData = productionData.filter(production => {
            const cropMatch = crop ? production.cropName.name === crop : true;
            const seasonMatch = season ? production.cropName.season === season : true;
            const irrigationTypeMatch = irrigationType ? production.cropName.irrigationType === irrigationType : true;
            const yearMatch = year ? new Date(production.createdAt).getFullYear().toString() === year : true;
            return cropMatch && seasonMatch && irrigationTypeMatch && yearMatch;
        });

        // Prepare the data for Excel file
        const cultivationHeaders = ["#", "Crop", "Season", "Seed Cost", "Land Cost", "Fertilizer Cost", "Pesticide Cost", "Harvest Cost", "Labor Cost", "Misc Cost", "Total Cost"];
        const productionHeaders = ["#", "Crop", "Season", "Total Yield", "Total Sale Value", "Surplus", "Sale Value per Quintal", "Total Cost"];

        const cultivationRows = filteredCultivationData.map((item, index) => [
            index + 1,
            item.crops.crop,
            item.crops.season,
            item.crops.costs.seedCost,
            item.crops.costs.landCost,
            item.crops.costs.fertilizerCost,
            item.crops.costs.pesticideCost,
            item.crops.costs.harvestCost,
            item.crops.costs.laborCost,
            item.crops.costs.miscCost,
            item.crops.totalCost
        ]);

        const productionRows = filteredProductionData.map((item, index) => [
            index + 1,
            item.cropName.name,
            item.cropName.season,
            item.cropName.totalYield,
            item.cropName.totalSaleValue,
            item.cropName.surplus,
            item.cropName.saleValuePerQuintal,
            item.cropName.totalCost
        ]);

        // Combine cultivation and production data with headings
        const combinedData = [
            ["Crop Cultivation Costs"],
            cultivationHeaders,
            ...cultivationRows,
            [], // Empty row for separation
            ["Crop Productions"],
            productionHeaders,
            ...productionRows,
        ];

        // Create the Excel sheet
        const ws = XLSX.utils.aoa_to_sheet(combinedData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Crop Report");

        // Send the Excel file as a download
        res.setHeader('Content-Disposition', 'attachment; filename=' + `${crop || "Maize"}_Data.xlsx`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

        // Write Excel file in buffer format and send it directly to the response
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
        res.send(excelBuffer); // Send the buffer as the response
    } catch (error) {
        console.error("Error generating Excel:", error);
        res.status(500).send("Error generating Excel report");
    }
};

export const downloadFieldWorkerReport = async (req, res) => {
    try {
        const { name, year } = req.query;

        // Prepare the where condition based on name and year
        let whereCondition = {};
        if (name && name !== 'All') {
            whereCondition.name = name;
        }
        if (year) {
            whereCondition.workDate = Sequelize.where(
                Sequelize.fn('YEAR', Sequelize.col('workDate')),
                year
            );
        }

        // Fetch field worker data based on query parameters (name and year)
        const fieldWorkerData = await FieldWorkerWorkDetail.findAll({
            where: whereCondition,
        });

        // Convert data to a plain array of objects
        const jsonData = fieldWorkerData.map(worker => ({
            ID: worker.id,
            User_ID: worker.userid,
            Name: worker.name,
            Address: worker.address,
            Qualifications: worker.qualifications,
            Mobile_Number: worker.mobileNumber,
            Email_ID: worker.emailID,
            Own_Land_Cultivated_Natural_Farming: worker.ownLandCultivatedUnderNaturalFarming,
            Cluster_ID: worker.clusterID,
            Work_Date: worker.workDate,
            Villages_Visited: worker.villagesVisited,
            Travel_in_Kms: worker.travelInKms,
            Farmers_Contacted_Individually: worker.farmersContactedIndividually,
            Group_Meetings_Conducted: worker.groupMeetingsConducted,
            Farmers_in_Group_Meetings: worker.farmersContactedInGroupMeetings,
            Cluster_Training_Place: worker.clusterTrainingPlace,
            Farmers_Attended_Training: worker.farmersAttendedTraining,
            Input_Supplied: JSON.stringify(worker.inputSupplied), // Include input supplied as JSON string
            Observation_in_Brief: worker.observationinbrif,
            Consultancy_Telephone: worker.consultancyTelephone,
            Consultancy_WhatsApp: worker.consultancyWhatsApp,
            Total_Consultancy: worker.totalConsultancy,
            Total_Cost_Input_Supplied: worker.totalcostinputsuplied,
            Updated_At: worker.updatedAt,
            Created_At: worker.createdAt,
        }));

        // Create a worksheet from JSON data
        const worksheet = XLSX.utils.json_to_sheet(jsonData);

        // Create a new workbook and append the worksheet
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Field Worker Report');

        // Write workbook to a buffer
        const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

        // Set filename dynamically based on name and year (or "All" if not provided)
        const fileName = name && name !== 'All' && year
            ? `Field_Worker_Report_${name}_${year}.xlsx`
            : name && name !== 'All'
                ? `Field_Worker_Report_${name}.xlsx`
                : year
                    ? `Field_Worker_Report_${year}.xlsx`
                    : 'Field_Worker_Report_All.xlsx';

        // Set response headers and send the file
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(excelBuffer);
    } catch (error) {
        console.error('Error downloading Excel:', error);
        res.status(500).send('Internal Server Error');
    }
};

export const download_filtered_crop_data_by_farmerID = async (req, res) => {
    try {
        const { farmerID } = req.query;
        if (!farmerID) {
            return res.status(400).json({ success: false, message: "farmerID is required" });
        }

        // Fetch cultivation and production data
        const rawCultivationCosts = await CultivationCost.findAll({ where: { farmerID } });
        const rawProductionDetails = await ProductionDetails.findAll({ where: { farmerID } });

        // Process Cultivation Costs
        // Process Cultivation Costs
        const cultivationCosts = rawCultivationCosts.map(cost => {
            let crops;
            if (typeof cost.crops === "string") {
                try {
                    crops = JSON.parse(cost.crops); // Parse only if it's a JSON string
                } catch (e) {
                    console.error("Error parsing crops JSON:", e.message);
                    crops = {}; // Fallback to an empty object
                }
            } else {
                crops = cost.crops || {}; // Use as-is if already an object
            }

            return {
                farmerID: cost.farmerID,
                crop: crops.crop || "Unknown",
                season: crops.season || "Unknown",
                category: crops.category || "Unknown",
                totalCost: crops.totalCost || 0,
                seedCost: crops.costs?.seedCost || 0,
                landCost: crops.costs?.landCost || 0,
                fertilizerCost: crops.costs?.fertilizerCost || 0,
                pesticideCost: crops.costs?.pesticideCost || 0,
                harvestCost: crops.costs?.harvestCost || 0,
                laborCost: crops.costs?.laborCost || 0,
                miscCost: crops.costs?.miscCost || 0,
            };
        });

        // Process Production Details
        const productionDetails = rawProductionDetails.map(detail => {
            let cropName;
            if (typeof detail.cropName === "string") {
                try {
                    cropName = JSON.parse(detail.cropName); // Parse only if it's a JSON string
                } catch (e) {
                    console.error("Error parsing cropName JSON:", e.message);
                    cropName = {}; // Fallback to an empty object
                }
            } else {
                cropName = detail.cropName || {}; // Use as-is if already an object
            }

            return {
                farmerID: detail.farmerID,
                cropName: cropName.name || "Unknown",
                season: cropName.season || "Unknown",
                category: cropName.irrigationType || "Unknown",
                surplus: cropName.surplus || 0,
                totalCost: cropName.totalCost || 0,
                totalYield: cropName.totalYield || 0,
                totalSaleValue: cropName.totalSaleValue || 0,
                saleValuePerQuintal: cropName.saleValuePerQuintal || 0,
            };
        });
        // Calculate Profit or Loss
        const profitLossData = cultivationCosts.map(cultivation => {
            const matchingProduction = productionDetails.find(
                production =>
                    production.cropName === cultivation.crop &&
                    production.season === cultivation.season &&
                    production.category === cultivation.category
            );

            const cultivationCost = cultivation.totalCost || 0;
            const productionCost = matchingProduction ? matchingProduction.totalCost || 0 : 0;
            const profitOrLoss = productionCost - cultivationCost;
            const profitOrLossPercentage =
                cultivationCost !== 0 ? ((profitOrLoss / cultivationCost) * 100).toFixed(2) : "0.00";

            return {
                season: cultivation.season,
                irrigationType: cultivation.category,
                crop: cultivation.crop,
                cultivationCost,
                productionCost,
                profitOrLoss,
                profitOrLossPercentage: `${profitOrLossPercentage}%`,
            };
        });

        // Create Excel Workbook
        const wb = XLSX.utils.book_new();

        // Prepare Data for Excel
        const cultivationHeading = [{ A: `Cultivation Data for Farmer ID: ${farmerID}` }];
        const cultivationData = [
            { farmerID: "Farmer ID", crop: "Crop", season: "Season", category: "Category", totalCost: "Total Cost", seedCost: "Seed Cost", landCost: "Land Cost", fertilizerCost: "Fertilizer Cost", pesticideCost: "Pesticide Cost", harvestCost: "Harvest Cost", laborCost: "Labor Cost", miscCost: "Misc Cost" },
            ...cultivationCosts,
        ];

        const productionHeading = [{ A: "Production Data" }];
        const productionData = [
            { farmerID: "Farmer ID", cropName: "Crop Name", season: "Season", category: "Category", surplus: "Surplus", totalCost: "Total Cost", totalYield: "Total Yield", totalSaleValue: "Total Sale Value", saleValuePerQuintal: "Sale Value/Quintal" },
            ...productionDetails,
        ];

        const profitLossHeading = [{ A: "Profit and Loss Data" }];
        const profitLossDataSheet = [
            { season: "Season", irrigationType: "Irrigation Type", crop: "Crop", cultivationCost: "Cultivation Cost", productionCost: "Production Cost", profitOrLoss: "Profit/Loss", profitOrLossPercentage: "Profit/Loss (%)" },
            ...profitLossData,
        ];

        // Merge Data for Single Sheet
        const mergedData = [
            ...cultivationHeading,
            ...cultivationData,
            [],
            ...productionHeading,
            ...productionData,
            [],
            ...profitLossHeading,
            ...profitLossDataSheet,
        ];

        // Convert Merged Data to Worksheet
        const ws = XLSX.utils.json_to_sheet(mergedData, { skipHeader: true });

        // Append Sheet to Workbook
        XLSX.utils.book_append_sheet(wb, ws, "Farmer Data");

        // Send the Excel file
        const fileName = `filtered_crop_data_by_farmerID_${farmerID}.xlsx`;
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);

        const excelFileBuffer = XLSX.write(wb, { bookType: "xlsx", type: "buffer" });
        res.end(excelFileBuffer);
    } catch (error) {
        console.error("Error exporting data:", error);
        res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
};

export const downloadsxcelLocationByName = async (req, res) => {
    const fullname = req.query.fullname || ''; // Get the fullname from the query
    const role = req.query.role || ''; // Get the role from the query

    try {
        const whereCondition = {};
        if (fullname) whereCondition.fullname = fullname;
        if (role) whereCondition.role = role;

        // Fetch location data based on filters
        const locations = await userattendance.findAll({
            where: whereCondition
        });

        // Log the data to ensure it's being fetched
        console.log('Fetched Locations:', locations);

        // Create the data for the Excel file
        const data = locations.map(location => ({
            id: location.id || 'N/A',
            fullname: location.fullname || 'N/A',
            role: location.role || 'N/A',
            address: location.address || 'N/A',
            latitude: location.latitude || 'N/A',
            longitude: location.longitude || 'N/A',
            timestamp: location.timestamp || 'N/A',
            createdAt: location.createdAt || 'N/A',
            updatedAt: location.updatedAt || 'N/A',
        }));

        // Log the mapped data
        console.log('Mapped Data:', data);

        // Create a new workbook and worksheet
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(data);

        // Append worksheet to the workbook
        XLSX.utils.book_append_sheet(wb, ws, 'Location Data');

        // Set headers for file download, include fullname in the filename
        const fileName = fullname ? `location_data_${fullname}.xlsx` : 'location_data.xlsx';

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);

        // Write the workbook to the response
        const excelData = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
        res.end(excelData);
    } catch (error) {
        console.error("Error fetching location data:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};



















