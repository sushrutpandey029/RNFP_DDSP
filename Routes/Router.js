import express from 'express';
import {
    AdminRegister, AdminLogin, AdminLogout,
    Adminlogin, AdminDashboard,
    UserRegister, userlist,fieldofficerlist, farmerlist, AdminUpdateFarmer,
    UserLogin, adduser, DeleteUserById,
    getuserbyid, AdminupdateUser, details,PClist,getFarmerCropByCrop,AsstPClist,downloadFarmersByCluster,
    DeleteFarmerById, getfarmerbyid,getLocationByName,DeleteUserLocation,downloadsxcelLocationByName, changepassword,download_filtered_crop_data_by_farmerID,get_all_intraction_with_former,get_crop_detail_with_percentage_by_farmerID,getattendancebyuser,get_interaction_details,AdmingetCoordinatorDetails,AdminupdateFieldWorkerWorkDetails,downloadCropReportExcel,downloadFieldWorkerReport,getfieldworkerreport,getFarmersByCluster,editFieldWorkerWorkDetailsById,DeleteFieldOfficerWorkDetailById, getAllFieldWorkerWorkDetails, UpdatePassword, getProductionAndCultivationById
} from '../Controllers/Admin_Controller.js';
import {
    data, updateUser, addFieldWorkerWorkDetail, usergetAllFieldWorkerWorkDetails,
    FOdeleteFarmerById, getProductionAndCultivationByFarmerID,
    getFarmerById, UserLogout, UserUpdatePassword, addFarmerInfo, updateFieldWorkerWorkDetailsById,
    getFarmers, addCultivationCostDetails, addCultivationCostDetails1,
    getProductionDetails, UserLocation, getalllocation,user_get_interaction_details,updatecultivationdetails,updateproductiondetails,user_get_all_intraction_with_former,Allfieldofficer,AllAsstPC,addInteraction,getCoordinatorDetailsByID,farmerlistbyuserid, getlocationbyuserid,locationdeletebyid, addProductionDetails, updateFarmerDetails, addCoordinatorWorkDetails, getFieldWorkerWorkDetailsById
} from '../Controllers/ProjectManager_Controller.js';
import { authenticateJWT } from '../Middlewares/JwtAuthAminLogin.js'; 
import { authorizeRole } from '../Middlewares/RoleBasedAuth.js'; // Import the new middleware
import upload from '../Middlewares/ProfileUploaupLoad.js';
import { isAuthenticated } from '../Middlewares/isAuthenticated.js'; // Adjust path if necessary

export const router = express.Router();

router.post('/api/admin/adminregister', AdminRegister);
router.get('/', Adminlogin);
router.post('/adminlogin', AdminLogin);


router.get('/fieldOfficerlist', fieldofficerlist);
router.get('/Project_Coordinator', PClist);
router.get('/Asst_Project_Coordinator', AsstPClist);

router.get('/dashboard', isAuthenticated, AdminDashboard);
router.get('/adminlogout', AdminLogout);
router.get('/changepassword/:id', changepassword);
router.post('/update_password/:id', UpdatePassword);
router.get('/farmerlist', farmerlist);
router.get('/deletefarmer/:id', DeleteFarmerById);
router.get('/editfarmer/:id', getfarmerbyid);
router.post('/adminupdatefarmer/:id', AdminUpdateFarmer);
router.get('/getproduction_and_cultivation_detail/:farmerID', getProductionAndCultivationById);
router.get('/details', details);
router.get('/adduser', adduser);
router.get('/userlist', userlist);
router.get('/edituser/:id', getuserbyid);
router.post('/adminupdateuser/:id', upload.single('profileimage'), AdminupdateUser);
router.get('/delete/:id', DeleteUserById);
router.get('/getAllFieldWorkerWorkDetails', getAllFieldWorkerWorkDetails);
router.post('/AdminupdateFieldWorkerWorkDetails/:id', AdminupdateFieldWorkerWorkDetails);



router.get('/work_details/:id', editFieldWorkerWorkDetailsById);
router.get('/Coorddinator_work_details', AdmingetCoordinatorDetails);
router.get('/intration_with_farmer', get_all_intraction_with_former);

router.get('/interaction-details/:village/:farmer', get_interaction_details);
router.get('/attendance/:userId', getattendancebyuser);
router.delete('/deleteuserlocation/:id', DeleteUserLocation);



router.get('/deleteWorkDetail/:id', DeleteFieldOfficerWorkDetailById);

// REPORT FUNCTION GERENATE
router.get('/getfarmerbyclusetr', getFarmersByCluster);
router.get('/downloadxcel', downloadFarmersByCluster);

router.get('/getFarmerCropByCrop', getFarmerCropByCrop);
router.get('/downloadCropReportExcel', downloadCropReportExcel);

router.get('/getfieldworkerreport', getfieldworkerreport);
router.get('/downloadFieldWorkerReport', downloadFieldWorkerReport);

router.post('/api/admin/userregister', upload.single('profileimage'), UserRegister);
router.put('/api/admin/userupdate/:id', upload.single('profileimage'), updateUser);

router.get('/Crop-Details', get_crop_detail_with_percentage_by_farmerID);
router.get('/download_filtered_crop_data', download_filtered_crop_data_by_farmerID);

router.get('/locationreportbyuser', getLocationByName);
router.get('/downloadsxcelLocationByName', downloadsxcelLocationByName);


router.post('/api/user/userlogin', UserLogin);
router.post('/api/user/addfarmerinfo', addFarmerInfo);
router.get('/api/user/getFarmers', getFarmers);
router.delete('/api/user/deletefarmer/:id', FOdeleteFarmerById);//*
router.get('/api/user/addCultivationCostDetails1/:id', addCultivationCostDetails1);
router.post('/api/user/addCultivationCostDetails/:id', addCultivationCostDetails);
router.get('/api/user/getProductionDetails/:id', getProductionDetails);
router.post('/api/user/addProductionDetails/:id', addProductionDetails);
router.post('/api/user/addworkdetails/:id', addCoordinatorWorkDetails);
router.get('/api/user/getfarmerbyid/:id', getFarmerById);
router.post('/api/user/addFieldofficerWorkDetail/:id', addFieldWorkerWorkDetail);
router.put('/api/user/UserUpdatePassword/:id', UserUpdatePassword);
router.get('/api/user/userlogout', UserLogout);
router.get('/api/user/detailofproductionandcultivation/:farmerID', getProductionAndCultivationByFarmerID);

router.put('/api/user/updatecultivationdetail/:id', updatecultivationdetails);
router.put('/api/user/updateproductiondetails/:id', updateproductiondetails);

router.get('/api/user/workdetails', usergetAllFieldWorkerWorkDetails);
router.get('/api/user/workdetailsbyid/:id', getFieldWorkerWorkDetailsById);
router.put('/api/user/updateworkdetailsbyid/:id', updateFieldWorkerWorkDetailsById);
router.put('/api/user/updateFarmerDetails/:id', updateFarmerDetails);
router.post('/api/user/adduserlocation', UserLocation);
router.get('/api/user/getalllocation', getalllocation);
router.get('/api/user/getlocationbyuserid/:userId', getlocationbyuserid);
router.delete('/api/user/locationdeletebyid/:id', locationdeletebyid);
router.post('/api/user/addInteraction', addInteraction);
router.get('/api/user/farmerlistbyuserid/:userid', farmerlistbyuserid);
router.get('/api/user/getfarmerintration', user_get_all_intraction_with_former);
router.get('/api/user/interaction_details/:village/:farmer', user_get_interaction_details);


router.get('/api/user/allfieldofficer', Allfieldofficer);
router.get('/api/user/allasstpc', AllAsstPC);



router.get('/api/user/getCoordinatorDetailsByID/:coordinatorID', getCoordinatorDetailsByID);






router.get('/api/user/data', authenticateJWT, authorizeRole(['Project Coordinator']), data); // Accessible only to 'Project Coordinator'
