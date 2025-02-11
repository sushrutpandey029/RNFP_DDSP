import UserModel from '../Models/UserModel.js'
import Farmer from '../Models/FarmerInfoModel.js'
import CultivationCost from '../Models/CultivationCostModel.js'
import ProductionDetails from '../Models/ProductionDetailsModel.js'
import workedetails from '../Models/PrpjectCoordinatorWorkDetailModel.js'
import FieldWorkerWorkDetail from '../Models/FOWorkDetailModel.js'
import Location from '../Models/UserLocationModel.js';
import Interactions from '../Models/InteractionModel.js'
import bcrypt from "bcrypt";
import Interaction from '../Models/InteractionModel.js';
import PCworkDetail from '../Models/PrpjectCoordinatorWorkDetailModel.js'

export const data = async (req, res) => {

    res.status(200).json({
        message: "Hello, you have accessed protected data!",
        user: req.user
    });
};

export const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { fullname, emailid, phonenumber, dob, qualification } = req.body;
        const profileimage = req.file ? path.normalize(req.file.path) : null;

        // Validate phone number
        const phoneRegex = /^(\+91[\-\s]?)?[0]?(91)?[789]\d{9}$/;
        if (phonenumber && !phoneRegex.test(phonenumber)) {
            return res.status(400).json({
                status: false,
                message: "Mobile number is not valid",
            });
        }

        // Validate email
        const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
        if (emailid && !emailRegex.test(emailid)) {
            return res.status(400).json({
                status: false,
                message: "Email is not valid",
            });
        }

        // Validate date of birth (if provided)
        if (dob && isNaN(Date.parse(dob))) {
            return res.status(400).json({
                status: false,
                message: "Date of Birth must be a valid date (YYYY-MM-DD)",
            });
        }

        // Check if the user exists
        const user = await UserModel.findByPk(id);
        if (!user) {
            return res.status(404).json({
                status: false,
                message: "User not found",
            });
        }

        // Prepare updates
        const updates = {};
        if (fullname) updates.fullname = fullname;
        if (emailid) updates.emailid = emailid;
        if (phonenumber) updates.phonenumber = phonenumber;
        if (dob) updates.dob = dob;
        if (qualification) updates.qualification = qualification;
        if (profileimage) updates.profileimage = profileimage;

        // Update the user
        await user.update(updates);

        return res.status(200).json({
            status: true,
            message: "User updated successfully",
            user: {
                id: user.id,
                fullname: user.fullname,
                emailid: user.emailid,
                phonenumber: user.phonenumber,
                dob: user.dob,
                qualification: user.qualification,
                profileimage: user.profileimage,
            },
        });
    } catch (err) {
        console.error("Error updating user:", err);
        return res.status(500).json({
            status: false,
            message: "Error updating user",
            error: err.message,
        });
    }
};

const generateFarmerID = () => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = String(now.getFullYear()).slice(2); // Last 2 digits of the year
    const time = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;

    return `frm_${day}${month}${year}_${time}`;
};

// export const addFarmerInfo = async (req, res) => {
//     try {
//         const {
//             userid, userrole, name, mobileNumber, emailID, villageName, taluka, cluster, district,
//             cultivatedLand, typeOfLand, cropsSown, desiBreeds, irrigationSource,
//             soilConservationMeasures, microIrrigation
//         } = req.body;

//         if (!userid || !userrole || !name || !mobileNumber || !villageName || !taluka || !cluster || !district || !cultivatedLand || !cropsSown || !irrigationSource || !soilConservationMeasures || !microIrrigation) {
//             res.status(400).json({
//                 message: "All fields are required",
//             })
//         }

//         if (!(/^(\+91[\-\s]?)?[0]?(91)?[789]\d{9}$/.test(mobileNumber))) {
//             return res.status(400).json({ status: false, message: "Mobile Number is not valid" })
//         }
//         // Generate a unique farmerID
//         const farmerID = await generateFarmerID();
//         // const clusterName = `${villageName}_${taluka}`;
//         const farmer = await Farmer.create({
//             userid,
//             userrole,
//             farmerID,
//             name,
//             mobileNumber,
//             emailID,
//             villageName,
//             taluka,
//             clusterName: cluster,
//             district,
//             cultivatedLand,
//             typeOfLand,
//             cropsSown,
//             desiBreeds,
//             irrigationSource,
//             soilConservationMeasures,
//             microIrrigation,
//         });

//         return res.status(201).json({
//             message: 'Farmer information added successfully',
//             farmer
//         });
//     } catch (error) {
//         console.error(error);
//         return res.status(500).json({ message: 'Error adding farmer information' });
//     }
// };

export const addFarmerInfo = async (req, res) => {
    try {
        const {
            userid, userrole, name, mobileNumber, emailID, villageName, taluka, cluster, district,
            cultivatedLand, typeOfLand, cropsSown, desiBreeds, irrigationSource,
            soilConservationMeasures, microIrrigation
        } = req.body;

        // Check if all required fields are present
        if (!userid || !userrole || !name || !mobileNumber || !villageName || !taluka || !cluster || !district || !cultivatedLand || !cropsSown || !irrigationSource || !soilConservationMeasures || !microIrrigation) {
            return res.status(400).json({
                message: "All fields are required",
            });
        }

        // Validate mobile number format
        if (!(/^(\+91[\-\s]?)?[0]?(91)?[789]\d{9}$/.test(mobileNumber))) {
            return res.status(400).json({
                status: false,
                message: "Mobile Number is not valid"
            });
        }

        // Check if the email already exists in the database
        const existingFarmer = await Farmer.findOne({ where: { emailID } });
        if (existingFarmer) {
            return res.status(400).json({
                message: "Email ID already exists. Duplicate entries are not allowed."
            });
        }

        // Generate a unique farmerID
        const farmerID = await generateFarmerID();

        // Create a new farmer entry
        const farmer = await Farmer.create({
            userid,
            userrole,
            farmerID,
            name,
            mobileNumber,
            emailID,
            villageName,
            taluka,
            clusterName: cluster,
            district,
            cultivatedLand,
            typeOfLand,
            cropsSown,
            desiBreeds,
            irrigationSource,
            soilConservationMeasures,
            microIrrigation,
        });

        return res.status(201).json({
            message: 'Farmer information added successfully',
            farmer
        });
    } catch (error) {
        console.error("Error adding farmer information:", error);
        return res.status(500).json({
            message: 'Error adding farmer information',
            error: error.message
        });
    }
};

// Example API endpoint for getting all farmers
export const getFarmers = async (req, res) => {
    try {
        const farmers = await Farmer.findAll({
            order: [['createdAt', 'DESC']], // Order by createdAt in descending order
        });
        if (farmers.length === 0) {
            return res.status(404).json({ success: true, message: "No data found", farmers: [] });
        }
        res.status(200).json({ success: true, farmers });
    } catch (error) {
        console.error("Error fetching farmers:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const addCultivationCostDetails1 = async (req, res) => {
    try {
        const farmer = await Farmer.findByPk(req.params.id);
        if (farmer) {
            const { farmerID, cropsSown } = farmer;
            res.status(200).json({
                farmerID,
                crops: cropsSown // I assume cropsSown is an object, so we'll extract it here
            });
        } else {
            res.status(404).json({ error: 'Farmer not found' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// for get data
export const getCultivationCostDetails = async (req, res) => {
    try {
        const farmers = await CultivationCost.findAll(); // Fetch all farmers from the Farmer table
        res.status(200).json({ success: true, farmers });
    } catch (error) {
        console.error("Error fetching farmers:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// for submit data
export const addCultivationCostDetails = async (req, res) => {
    try {
        // Log the incoming request body to ensure we're receiving data
        console.log('Request body:', req.body);

        // Get the farmer using the ID from the request parameters
        const farmer = await Farmer.findByPk(req.params.id);

        if (farmer) {
            const { farmerID } = farmer;

            // Extract the crops data from the request body
            const { crops } = req.body;

            if (!crops || Object.keys(crops).length === 0) {
                return res.status(400).json({ error: 'No crops data provided' });
            }

            // Loop through each season and crop, calculating the cost
            for (const season in crops) {
                for (const cropType in crops[season]) {
                    // Process each crop and its costs
                    const cropList = crops[season][cropType];

                    for (const crop of cropList) {
                        const { cropName, costs } = crop;

                        // Calculate total cost for the crop
                        const totalCost = (
                            (costs.seedCost || 0) +
                            (costs.landCost || 0) +
                            (costs.fertilizerCost || 0) +
                            (costs.pesticideCost || 0) +
                            (costs.harvestCost || 0) +
                            (costs.laborCost || 0) +
                            (costs.miscCost || 0)
                        );

                        // Log the crop and costs for debugging
                        console.log(`Processing crop: ${cropName} in season: ${season} with total cost: ${totalCost}`);

                        // Insert each crop and its costs into the CultivationCost table
                        await CultivationCost.create({
                            farmerID,              // the ID of the farmer
                            cropName,              // the name of the crop
                            season,                // the season for the crop (e.g., rabi, kharif)
                            crops: JSON.stringify(crop),  // Convert the crop data to JSON if necessary
                            seedCost: costs.seedCost || 0,
                            landPreparationCost: costs.landCost || 0,
                            fertilizerCost: costs.fertilizerCost || 0,
                            pesticideCost: costs.pesticideCost || 0,
                            harvestingCost: costs.harvestCost || 0,
                            laborCost: costs.laborCost || 0,
                            miscCost: costs.miscCost || 0,
                            totalCost,             // total calculated cost
                        });
                    }
                }
            }

            // Respond with a success message after inserting the data
            res.status(201).json({
                success: true,
                message: 'Cultivation costs added successfully',
            });

        } else {
            // Farmer not found, return a 404 error
            res.status(404).json({ error: 'Farmer not found' });
        }
    } catch (error) {
        // Catch any errors that happen during the process and return a 500 error
        console.error('Error inserting cultivation costs:', error);
        res.status(500).json({ error: error.message });
    }
};

// get data Details of production 
export const getProductionDetails = async (req, res) => {
    try {
        const farmer = await Farmer.findByPk(req.params.id);

        if (farmer) {
            const { farmerID, cropsSown } = farmer;

            // Prepare the data with the desired format
            const formattedCrops = [];

            // Iterate over the seasons (rabi, kharif)
            Object.keys(cropsSown).forEach((season) => {
                // Iterate over the irrigation types within each season
                Object.keys(cropsSown[season]).forEach((irrigationType) => {
                    if (cropsSown[season][irrigationType].length > 0) {
                        // Push the formatted crop data for each irrigation type
                        formattedCrops.push({
                            cropName: {
                                season: season,
                                irrigationType: irrigationType,
                                crops: cropsSown[season][irrigationType].map((crop) => ({
                                    name: crop,
                                }))
                            }
                        });
                    }
                });
            });

            // Store the formatted crops data in session
            req.session.cropsData = formattedCrops;

            // json response
            return res.status(200).json({
                farmerID,
                crops: formattedCrops, // json the modified crops data
            });
        } else {
            res.status(404).json({ error: 'Farmer not found' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
// save Details of production 
export const addProductionDetails = async (req, res) => {
    try {
        const { cropName } = req.body;

        if (!Array.isArray(cropName)) {
            return res.status(400).json({
                message: 'cropName should be an array of objects, each containing season, irrigationType, and crops.',
            });
        }

        const farmer = await Farmer.findByPk(req.params.id);

        if (!farmer) {
            return res.status(404).json({ message: 'Farmer not found' });
        }

        const { farmerID } = farmer;

        const insertedRows = [];

        // Process each season entry
        for (const entry of cropName) {
            const { season, irrigationType, crops } = entry;

            if (!season || !irrigationType || !Array.isArray(crops)) {
                return res.status(400).json({
                    message: 'Each entry must include season, irrigationType, and an array of crops.',
                });
            }

            for (const crop of crops) {
                const { name, totalYield, totalSaleValue, surplus, totalCost } = crop;

                if (!name || !totalYield || !totalSaleValue || !surplus || !totalCost) {
                    return res.status(400).json({
                        message: 'Each crop must include name, totalYield, totalSaleValue, surplus and totalCost.',
                    });
                }

                const saleValuePerQuintal = (totalSaleValue / totalYield).toFixed(2);

                // Combine crop details with metadata
                const cropData = {
                    name,
                    season,
                    irrigationType,
                    totalYield,
                    totalSaleValue,
                    surplus,
                    saleValuePerQuintal,
                    totalCost,
                };

                // Save the row directly as JSON
                const productionDetail = await ProductionDetails.create({
                    farmerID,
                    cropName: cropData, // No JSON.stringify here; save as plain JSON
                });

                insertedRows.push(productionDetail);
            }
        }

        return res.status(201).json({
            message: 'Production details added successfully',
            data: insertedRows,
        });
    } catch (err) {
        console.error('Error saving production details:', err);
        return res.status(500).json({ message: 'Error saving production details', error: err.message });
    }
};

// workdetail form add
export const addCoordinatorWorkDetails = async (req, res) => {
    try {
        const { trainingProgrammes, reviewMeetings, monitoringVisits, reports } = req.body;
        const { id } = req.params; // Assume userID is passed as a parameter

        // Validate request parameters
        if (!id) {
            return res.status(400).json({ message: 'User ID is required.' });
        }

        // Fetch the coordinator ID from the User model
        const user = await UserModel.findByPk(id);

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        const coordinatorID = user.id;

        if (!coordinatorID) {
            return res.status(400).json({ message: 'Coordinator ID is missing for the user.' });
        }

        // Create a new work detail entry
        const newWorkDetail = await workedetails.create({
            workDetailID: `wd_${Date.now()}`,
            coordinatorID,
            trainingProgrammes: trainingProgrammes || [],
            reviewMeetings: reviewMeetings || [],
            monitoringVisits: monitoringVisits || [],
            reports: reports || [],
        });

        return res.status(201).json({
            message: 'Coordinator work details added successfully',
            data: newWorkDetail,
        });
    } catch (err) {
        console.error('Error adding coordinator work details:', err);
        res.status(500).json({ message: 'Error adding coordinator work details', error: err.message });
    }
};

export const getFarmerById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ success: false, message: "Farmer ID is required" });
        }

        const farmer = await Farmer.findByPk(id);
        if (!farmer) {
            return res.status(404).json({ success: false, message: "Farmer not found" });
        }

        res.status(200).json({ success: true, data: farmer });
    } catch (error) {
        console.error("Error fetching farmer:", error);
        res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
};

// export const getFarmerById = async (req, res) => {
//     try {
//         const { id } = req.params;

//         if (!id) {
//             return res.status(400).json({ success: false, message: "Farmer ID is required" });
//         }

//         const farmer = await farmers.findByPk(id);

//         if (!farmer) {
//             return res.status(404).render('editfarmer', {
//                 success: false,
//                 message: "Farmer not found",
//                 farmer: null,
//             });
//         }

//         // Parse `cropsSown` JSON field
//         const parsedCropsSown = farmer.cropsSown ? JSON.parse(farmer.cropsSown) : {};

//         // Dynamic list of districts
//         const districts = ["yavatmal", "washim"];

//         const taluka = ["Arni", "Darwha", "Digras", "Ghatanji", "Kalamb", "Kelapur", "Mahagaon", "Maregaon", "Ner", "Ralegaon", "Yavatmal"];
//         const village = [
//             "Aajani",
//             "Aajanti",
//             "Aashti",
//             "Aasola",
//             "Adani",
//             "Adani Pod",
//             "Amala Gav",
//             "Amala Tanda",
//             "Amshet",
//             "Anji",
//             "Anuppod",
//             "Arambhi",
//             "Athmurdi",
//             "Banayat",
//             "Bandar",
//             "Baradgaon",
//             "Bechkheda",
//             "Belora",
//             "Bhamb Raja",
//             "Bhurkipod",
//             "Bodgavhan",
//             "Borgaon",
//             "Bori Chandra",
//             "Bori Gosavi",
//             "Bori Sinha",
//             "Borjai",
//             "Bramhanpur",
//             "Bramhanwada",
//             "Bramhanwada Purv",
//             "Bramhanwada Tanda",
//             "Bramhi",
//             "Chandapur",
//             "Chani",
//             "Chauki",
//             "Chauki Zuli",
//             "Chikani",
//             "Chikhali",
//             "Chinchala",
//             "Chinchamandal",
//             "Chopan",
//             "Churkuta",
//             "Dabha",
//             "Daheli",
//             "Dahifal",
//             "Deurwadi",
//             "Devala",
//             "Devdharui",
//             "Dhaipod",
//             "Dhanaj",
//             "Dharanpod",
//             "Domaga",
//             "Dongargaon",
//             "Dudhgav",
//             "Echora",
//             "Fulwadi",
//             "Gadegao",
//             "Gajipur",
//             "Garpod",
//             "Gaulpend",
//             "Gaurala",
//             "Gavpod",
//             "Ghubadheti",
//             "Gondegaon",
//             "Gondgavhan",
//             "Gunj",
//             "Haru",
//             "Hatgaon",
//             "Hivara",
//             "Indrathana",
//             "Jambhora",
//             "Jamwadi",
//             "Jankai",
//             "Kamathwada",
//             "Kanada",
//             "Kanala",
//             "Kanzara",
//             "Kapshi",
//             "Karamala",
//             "Khairgaon",
//             "Khairgaon Pod",
//             "Khairgaon Tanda",
//             "Khandani",
//             "Khatara",
//             "Kinhi Walashi",
//             "Krushnapur",
//             "Kumbhari",
//             "Kumbhipod",
//             "Ladkhed",
//             "Lakhmapur",
//             "Lohatwadi",
//             "Loni",
//             "Majara",
//             "Malkhed Bu.",
//             "Malkinho",
//             "Mangla Devi",
//             "Mangrul",
//             "Manikwada",
//             "Manjarda",
//             "Mardi",
//             "Maregaon",
//             "Masola",
//             "Mendhala",
//             "Mendhani",
//             "Morath",
//             "Morgavhan",
//             "Mozar",
//             "Mukindpur",
//             "Munjhala",
//             "Murli",
//             "Nababpur",
//             "Nagai",
//             "Nageshvar",
//             "Nait",
//             "Naka Pardi",
//             "Narkund",
//             "Narsapur",
//             "Ner",
//             "Pahapal",
//             "Palaskund",
//             "Pandharkawada",
//             "Pandhurbna",
//             "Pandhurna Budruk",
//             "Pandhurna Khurd",
//             "Pangari",
//             "Pangari Tanda",
//             "Paradhi Beda",
//             "Pardhi Tanda",
//             "Pathari",
//             "Pathrad Gole",
//             "Pendhara",
//             "Pimpalgaon",
//             "Pimpari Ijara",
//             "Pisgaon",
//             "Prathrad Devi",
//             "Ramnagar Tanda",
//             "Rui",
//             "Sajegaon",
//             "Salaipod",
//             "Salod",
//             "Sarangpur",
//             "Sarkinhi",
//             "Satefal",
//             "Savangi",
//             "Sawala",
//             "Sawana",
//             "Sawanga",
//             "Sawargaon",
//             "Sawargaon Kale",
//             "Saykheda",
//             "Sevadas Nagar",
//             "Shakalgaon",
//             "Shankarpur",
//             "Shelodi",
//             "Shindi",
//             "Shirpurwadi",
//             "Shivani",
//             "Shivpod",
//             "Singaldip",
//             "Sonegaon",
//             "Sonupod",
//             "Sonurli",
//             "Surdevi",
//             "Takali",
//             "Tembhi",
//             "Thalegaon",
//             "Tiwasa",
//             "Uchegaon",
//             "Udapur",
//             "Ujona",
//             "Umari",
//             "Umartha",
//             "Vasantnagar",
//             "Veni",
//             "Virgavhan",
//             "Vyahali",
//             "Wadgaon",
//             "Wadgaon Gadhave",
//             "Wadgaon Poste",
//             "Wai",
//             "Wakodi",
//             "Walki",
//             "Waradh",
//             "Warjai",
//             "Warud",
//             "Watfal",
//             "Yelguda",
//             "Zombhadi",
//         ];

//         const clusterName = [
//             "Masola",
//             "Bori Chandra",
//             "Bramhi",
//             "Chaani (ka)",
//             "Malkhed Bu.",
//             "Pathrad Devi",
//             "Arambhi",
//             "Murali",
//             "Umari",
//             "Adani",
//             "Veni",
//             "Chinchala",
//             "Khandani",
//             "Mardi",
//             "Ner",
//             "Pathrad Gole",
//             "Tembhi",
//             "Palaskund",
//             "Bori Sinha",
//             "Rui",
//         ];

//         const typeOfLand = ["Clayey", "Sandy Loam", "Sandy"];

//         const conservationMeasureItems = ["Trenching", "Farm Pond", "Bunding"];

//         const microIrrigation = ["Drip", "Sprinklers"];

//         const sourceIrrigationItems = ["Well", "Canal"];



//         // Send parsed data and districts to frontend
//         return res.status(200).json( {
//             success: true,
//             farmer: { ...farmer.toJSON(), cropsSown: parsedCropsSown },
//             districts,
//             taluka,
//             village,
//             clusterName,
//             typeOfLand,
//             conservationMeasureItems,
//             microIrrigation,
//             sourceIrrigationItems,

//         });
//     } catch (error) {
//         console.error("Error fetching farmer details:", error);
//         res.status(500).render('editfarmer', {
//             success: false,
//             message: "Internal server error",
//             farmer: null,
//         });
//     }
// };

export const UserLogout = (req, res) => {
    try {
        req.session.destroy((err) => {
            if (err) {
                console.error('Error destroying session:', err);
                return res.status(500).json({ success: false, message: 'Error logging out' });
            }
            res.clearCookie('session_cookie_name');
            return res.status(200).json({ success: true, message: 'User logged out successfully' });
        });
    } catch (error) {
        console.error('Unexpected error during logout:', error);
        res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
};

export const addFieldWorkerWorkDetail = async (req, res) => {
    try {
        const {
            userid, name, qualifications, mobileNumber, emailID, address, ownLandCultivatedUnderNaturalFarming, clusterID,
            workDate, villagesVisited, travelInKms, farmersContactedIndividually, groupMeetingsConducted, farmersContactedInGroupMeetings,
            clusterTrainingPlace, farmersAttendedTraining, inputSupplied, observationinbrif, consultancyTelephone, totalcostinputsuplied, consultancyWhatsApp
        } = req.body;

        // Validate required fields
        if (!userid || !name || !address || !mobileNumber || !emailID || !workDate) {
            return res.status(400).json({
                success: false,
                message: 'Please fill in all required fields.'
            });
        }

        // Validate mobile number format (example check for numeric value)
        const phoneRegex = /^[0-9]{10}$/;
        if (!phoneRegex.test(mobileNumber)) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid mobile number.'
            });
        }

        // Validate email format
        const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
        if (!emailRegex.test(emailID)) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid email ID.'
            });
        }

        // Calculate the total number of farmers contacted
        const totalConsultancy = (consultancyTelephone || 0) + (consultancyWhatsApp || 0);

        // Create the work detail entry
        const newWorkDetail = await FieldWorkerWorkDetail.create({
            userid,
            name,
            address,
            qualifications,
            mobileNumber,
            emailID,
            ownLandCultivatedUnderNaturalFarming,
            clusterID,
            workDate,
            villagesVisited,
            travelInKms,
            farmersContactedIndividually,
            groupMeetingsConducted,
            farmersContactedInGroupMeetings,
            clusterTrainingPlace,
            farmersAttendedTraining,
            inputSupplied,
            observationinbrif,
            consultancyTelephone,
            consultancyWhatsApp,
            totalConsultancy,
            totalcostinputsuplied
        });

        return res.status(201).json({
            success: true,
            message: 'Work details added successfully!',
            data: newWorkDetail
        });

    } catch (error) {
        console.error("Error adding field worker work details:", error);
        // Ensure no multiple responses are sent
        if (!res.headersSent) {
            return res.status(500).json({
                success: false,
                message: 'Error adding work details.',
                error: error.message
            });
        }
    }
};


// export const UserUpdatePassword = async (req, res) => {
//     try {
//         const { id } = req.params;
//         const { oldpassword, newpassword, cpassword } = req.body;

//         console.log("Request Body:", req.body);
//         console.log("User ID:", id);

//         if (!oldpassword || !newpassword || !cpassword) {
//             return res.status(400).json({
//                 errormessage: "All fields required"
//             });
//         }

//         if (newpassword !== cpassword) {
//             return res.status(400).json({
//                 errormessage: "New password and confirm password do not match."
//             });
//         }

//         const user = await UserModel.findByPk(id);
//         if (!user) {
//             return res.status(400).json({
//                 errormessage: "User not Found."
//             });
//         }

//         console.log("Stored hashed password:", user.password);
//         const isMatch = await bcrypt.compare(oldpassword, user.password);
//         console.log("Password match status:", isMatch);

//         if (!isMatch) {
//             return res.status(400).json({
//                 errormessage: "Old password is incorrect."
//             });
//         }

//         const hashedPassword = await bcrypt.hash(newpassword, 10);
//         user.password = hashedPassword;
//         await user.save();

//         return res.status(201).json({
//             message: "Password updated successfully"
//         });
//     } catch (error) {
//         console.error("Error updating password:", error);
//         return res.status(500).json({
//             errormessage: "An error occurred while changing the password.",
//             error: error.message
//         });
//     }
// };



// export const addFarmerInfo = async (req, res) => {
//     try {
//         const {
//             name, mobileNumber, emailID, villageName, taluka, district,
//             cultivatedLand, typeOfLand, cropsSown, desiBreeds, irrigationSource,
//             soilConservationMeasures, microIrrigation
//         } = req.body;

//         // Validate required fields
//         if (!name || !mobileNumber || !emailID || !villageName || !taluka || !district ||
//             !cultivatedLand || !typeOfLand || !cropsSown || !desiBreeds || !irrigationSource ||
//             !soilConservationMeasures || !microIrrigation) {
//             return res.status(400).json({ message: "All fields are required" });
//         }

//         // Check if emailID or mobileNumber already exists
//         const existingFarmer = await Farmer.findOne({
//             where: {
//                 [Op.or]: [
//                     { mobileNumber },
//                     { emailID }
//                 ]
//             }
//         });

//         let farmerID;
//         let id;

//         if (existingFarmer) {
//             // Farmer already exists, use existing farmerID and id
//             farmerID = existingFarmer.farmerID;
//             id = existingFarmer.id;

//             // Insert the data using the existing farmerID and id
//             const farmer = await Farmer.create({
//                 id, // Use existing id
//                 farmerID, // Use existing farmerID
//                 name,
//                 mobileNumber,
//                 emailID,
//                 villageName,
//                 taluka,
//                 clusterName: `${villageName}_${taluka}`, // Cluster name
//                 district,
//                 cultivatedLand,
//                 typeOfLand,
//                 cropsSown,
//                 desiBreeds,
//                 irrigationSource,
//                 soilConservationMeasures,
//                 microIrrigation,
//             });

//             return res.status(200).json({
//                 message: 'Farmer already exists. Data updated successfully.',
//                 farmer,
//             });
//         } else {
//             // Farmer does not exist, generate new farmerID and id
//             farmerID = await generateFarmerID();

//             // Create a new farmer record
//             const farmer = await Farmer.create({
//                 farmerID,
//                 name,
//                 mobileNumber,
//                 emailID,
//                 villageName,
//                 taluka,
//                 clusterName: `${villageName}_${taluka}`, // Cluster name
//                 district,
//                 cultivatedLand,
//                 typeOfLand,
//                 cropsSown,
//                 desiBreeds,
//                 irrigationSource,
//                 soilConservationMeasures,
//                 microIrrigation,
//             });

//             return res.status(201).json({
//                 message: 'Farmer information added successfully.',
//                 farmer,
//             });
//         }
//     } catch (error) {
//         console.error("Error adding farmer information:", error);
//         return res.status(500).json({ message: 'Error adding farmer information' });
//     }
// };


export const UserUpdatePassword = async (req, res) => {
    try {
        const { id } = req.params;
        const { oldpassword, newpassword, cpassword } = req.body;

        console.log("Request Body:", req.body);
        console.log("User ID:", id);

        // Check if all fields are provided
        if (!oldpassword || !newpassword || !cpassword) {
            return res.status(400).json({
                errormessage: "All fields required"
            });
        }

        // Check if new password matches confirm password
        if (newpassword !== cpassword) {
            return res.status(400).json({
                errormessage: "New password and confirm password do not match."
            });
        }

        // Find the user by ID
        const user = await UserModel.findByPk(id);
        if (!user) {
            return res.status(400).json({
                errormessage: "User not Found."
            });
        }

        console.log("Stored hashed password:", user.password);

        // Compare old password with stored hashed password
        const isMatch = await bcrypt.compare(oldpassword, user.password);
        console.log("Password match status:", isMatch);

        if (!isMatch) {
            return res.status(400).json({
                errormessage: "Old password is incorrect."
            });
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(newpassword, 10);

        // Update both hashed and plain password fields
        user.password = hashedPassword;
        user.planepassword = newpassword; // Store plain text password (ensure this is allowed as per your requirements)
        await user.save();

        return res.status(201).json({
            message: "Password updated successfully"
        });
    } catch (error) {
        console.error("Error updating password:", error);

        // Check if a response was already sent
        if (!res.headersSent) {
            return res.status(500).json({
                errormessage: "An error occurred while changing the password.",
                error: error.message
            });
        }

        // If headers were already sent, log the error but avoid another response
        console.error("Headers already sent. Cannot send another response.");
    }
};



export const getProductionAndCultivationByFarmerID = async (req, res) => {
    try {
        const { farmerID } = req.params;

        // Fetch cultivation costs and production details based on farmerID
        const rawCultivationCosts = await CultivationCost.findAll({ where: { farmerID } });
        const rawProductionDetails = await ProductionDetails.findAll({ where: { farmerID } });

        // Parse the 'crops' field from cultivation costs
        const cultivationCosts = rawCultivationCosts.map(cost => ({
            ...cost.toJSON(),
            crops: JSON.parse(cost.crops),
        }));

        // Parse the 'cropName' field from production details
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

        // Prepare the response data
        const responseData = {
            success: true,
            message: "Farmer production and cultivation data fetched successfully",
            data: {
                cultivationCosts,
                productionDetails,
            },
        };

        // Log the response data for debugging
        console.log("Response Data:", JSON.stringify(responseData, null, 2));

        // Send JSON response to the client
        res.status(200).json(responseData);

    } catch (error) {
        // Handle any errors and return an error response
        console.error("Error fetching farmer details:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};

// export const updatecultivationdetails = async (req, res) => {
//     const { id } = req.params;
//     const updatedData = req.body;

//     try {
//         const cultivationCost = await CultivationCost.findByPk(id);

//         if (!cultivationCost) {
//             return res.status(404).json({ message: 'Cultivation cost not found' });
//         }

//         const newupdatedata = JSON.stringify(updatedData)

//         await cultivationCost.update(newupdatedata);

//         return res.status(200).json({
//             success:true,
//             message: 'Cultivation cost updated successfully.',
//             data: newupdatedata,
//         });
//     } catch (error) {
//         console.error('Error updating cultivation cost:', error);
//         return res.status(500).json({ message: 'Internal server error', error: error.message });
//     }
// };


export const updateproductiondetails = async (req, res) => {
    const { id } = req.params;
    const updatedData = req.body;
    try {
        const productionDetail = await ProductionDetails.findByPk(id);
        if (!productionDetail) {
            return res.status(404).json({ message: 'Production detail not found' });
        }
        await productionDetail.update(updatedData);
        return res.status(200).json({
            success: true,
            message: 'Production detail updated successfully.',
            data: productionDetail,
        });
    } catch (error) {
        console.error('Error updating production detail:', error);
        return res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};


// export const updatecultivationdetails = async (req, res) => {
//     const { id } = req.params;
//     const updatedData = req.body;

//     try {
//         // Find the cultivation cost record by its ID
//         const cultivationCost = await CultivationCost.findByPk(id);

//         // If the record is not found, return 404
//         if (!cultivationCost) {
//             return res.status(404).json({ message: 'Cultivation cost not found' });
//         }

//         // Ensure crops field is handled correctly
//         if (updatedData.crops) {
//             // Parse the crops field if needed
//             const cropsData = typeof updatedData.crops === 'string' 
//                 ? JSON.parse(updatedData.crops) 
//                 : updatedData.crops;

//             // Update the record with the crops field
//             await cultivationCost.update({ crops: cropsData });
//         }

//         // Respond with success
//         return res.status(200).json({
//             success: true,
//             message: 'Cultivation cost updated successfully.',
//             updatedData: cultivationCost,
//         });
//     } catch (error) {
//         console.error('Error updating cultivation cost:', error);
//         return res.status(500).json({ message: 'Internal server error', error: error.message });
//     }
// };


export const updatecultivationdetails = async (req, res) => {
    const { id } = req.params;
    const updatedData = req.body;
    try {
        const cultivationCost = await CultivationCost.findByPk(id);

        if (!cultivationCost) {
            return res.status(404).json({ message: 'Cultivation cost not found' });
        }
        const cropsStringified = JSON.stringify(updatedData.crops);
        const totalCost = updatedData.totalCost;
        await cultivationCost.update({
            crops: cropsStringified,
            totalCost,
        });
        return res.status(200).json({
            success: true,
            message: 'Cultivation cost updated successfully.',
            data: {
                crops: cropsStringified,
                totalCost,
            },
        });
    } catch (error) {
        console.error('Error updating cultivation cost:', error);
        return res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};


export const FOdeleteFarmerById = async (req, res) => {
    try {
        const id = req.params.id;


        const deletedUser = await Farmer.destroy({
            where: { id: id }
        });

        if (!deletedUser) {

            return res.status(404).json({
                success: false,
                message: 'Farmer not found',
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Farmer deleted successfully',
        });
    } catch (error) {
        console.error("Error deleting Farmer:", error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
};

export const usergetAllFieldWorkerWorkDetails = async (req, res) => {
    try {
        const workDetails = await FieldWorkerWorkDetail.findAll(
            {
                order: [['createdAt', 'DESC']], // Order by createdAt in descending order
            }
        );

        if (workDetails.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No work details found.",
                data: [],
            });
        }

        return res.status(200).json({
            success: true,
            message: "All field worker work details fetched successfully.",
            data: workDetails,
        });
    } catch (error) {
        console.error("Error fetching all work details:", error);
        return res.status(500).json({
            success: false,
            message: "Error fetching work details.",
            error: error.message,
        });
    }
};

export const getFieldWorkerWorkDetailsById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Field worker ID is required.",
            });
        }

        // Fetch the work details using the ID
        const workDetail = await FieldWorkerWorkDetail.findOne({
            where: { id },
        });

        if (!workDetail) {
            return res.status(404).json({
                success: false,
                message: `No work details found for field worker with ID: ${id}.`,
            });
        }

        return res.status(200).json({
            success: true,
            message: `Field worker work details fetched successfully for ID: ${id}.`,
            data: workDetail,
        });
    } catch (error) {
        console.error("Error fetching work details by ID:", error);
        return res.status(500).json({
            success: false,
            message: "Error fetching work details.",
            error: error.message,
        });
    }
};

export const updateFieldWorkerWorkDetailsById = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            userid,
            name,
            address,
            qualifications,
            mobileNumber,
            emailID,
            ownLandCultivatedUnderNaturalFarming,
            clusterID,
            workDate,
            villagesVisited,
            travelInKms,
            farmersContactedIndividually,
            groupMeetingsConducted,
            farmersContactedInGroupMeetings,
            clusterTrainingPlace,
            farmersAttendedTraining,
            inputSupplied,
            observationinbrif,
            consultancyTelephone,
            consultancyWhatsApp,
            totalConsultancy,
            totalcostinputsuplied,
        } = req.body;

        // Validation checks
        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Field worker ID is required.",
            });
        }

        if (!name || !mobileNumber || !emailID) {
            return res.status(400).json({
                success: false,
                message: "Name, mobile number, and email ID are required fields.",
            });
        }

        // Check if work detail exists
        const workDetail = await FieldWorkerWorkDetail.findOne({ where: { id } });
        if (!workDetail) {
            return res.status(404).json({
                success: false,
                message: `No field worker work details found for ID: ${id}.`,
            });
        }

        // Update the work detail
        const [affectedRows] = await FieldWorkerWorkDetail.update(
            {
                userid,
                name,
                address,
                qualifications,
                mobileNumber,
                emailID,
                ownLandCultivatedUnderNaturalFarming,
                clusterID,
                workDate,
                villagesVisited,
                travelInKms,
                farmersContactedIndividually,
                groupMeetingsConducted,
                farmersContactedInGroupMeetings,
                clusterTrainingPlace,
                farmersAttendedTraining,
                inputSupplied,
                observationinbrif,
                consultancyTelephone,
                consultancyWhatsApp,
                totalConsultancy,
                totalcostinputsuplied,
            },
            { where: { id } }
        );

        // Check if any rows were updated
        if (affectedRows === 0) {
            return res.status(400).json({
                success: false,
                message: `Failed to update work details for ID: ${id}.`,
            });
        }

        // Successful update response
        return res.status(200).json({
            success: true,
            message: `Field worker work details updated successfully for ID: ${id}.`,
        });

    } catch (error) {
        console.error("Error updating work details:", error);
        // Ensure no multiple responses are sent
        if (!res.headersSent) {
            return res.status(500).json({
                success: false,
                message: "Error updating work details.",
                error: error.message,
            });
        }
    }
};


// export const updateFarmerDetails = async (req, res) => {
//     try {
//         const id = req.params.id;
//         const {
//             farmerID,
//             newname,
//             mobileNumber,
//             emailID,
//             villagename,
//             taluka,
//             clusterName,
//             district,
//             cultivatedLand,
//             desiBreeds,
//             typeOfLand,
//             sourceIrrigationItems,
//             conservationMeasureItems,
//             microIrrigation,
//             ...flattenedCropsSown
//         } = req.body;

//         console.log("Request body data:", req.body);

//         const cropsSown = {};
//         Object.keys(flattenedCropsSown).forEach((key) => {
//             if (key.startsWith("cropsSown.")) {
//                 const path = key.replace("cropsSown.", "").split(".");
//                 let current = cropsSown;

//                 path.forEach((segment, index) => {
//                     if (index === path.length - 1) {
//                         if (!current[segment]) current[segment] = [];
//                         const [crop, cropLand] = flattenedCropsSown[key];
//                         current[segment].push({ crop, cropLand });
//                     } else {
//                         current[segment] = current[segment] || {};
//                         current = current[segment];
//                     }
//                 });
//             }
//         });

//         console.log("Transformed cropsSown data:", cropsSown);

//         // Find the farmer record by ID
//         const farmer = await Farmer.findByPk(id);
//         if (!farmer) {
//             return res.status(404).json({
//                 success: false,
//                 message: "Farmer not found",
//             });
//         }

//         // Update fields
//         farmer.farmerID = farmerID;
//         farmer.name = newname;
//         farmer.mobileNumber = mobileNumber;
//         farmer.emailID = emailID;
//         farmer.villageName = villagename;
//         farmer.taluka = taluka;
//         farmer.clusterName = clusterName;
//         farmer.district = district;
//         farmer.cultivatedLand = cultivatedLand;
//         farmer.desiBreeds = desiBreeds;
//         farmer.typeOfLand = typeOfLand;
//         farmer.sourceIrrigationItems = sourceIrrigationItems;
//         farmer.conservationMeasureItems = conservationMeasureItems;
//         farmer.microIrrigation = microIrrigation;

//         if (Object.keys(cropsSown).length > 0) {

//                 farmer.cropsSown = JSON.stringify(cropsSown);
//         }

//         console.log("Updated farmer data:", farmer);

//         const new_data = await farmer.save();

//         console.log("new data", new_data)

//         return res.status(200).json({
//             success: true,
//             message: "Farmer details updated successfully",
//             data: new_data,
//         });
//     } catch (error) {
//         console.error('Error updating farmer:', error.message);
//         return res.status(500).json({
//             success: false,
//             message: "An error occurred while updating farmer details",
//             error: error.message,
//         });
//     }
// };

// Location APi's

export const updateFarmerDetails = async (req, res) => {
    try {
        const id = req.params.id; // Get farmerID from URL parameters
        const {
            farmerID,
            newname,
            mobileNumber,
            emailID,
            villageName,
            taluka,
            cluster,
            district,
            cultivatedLand,
            typeOfLand,
            cropsSown,
            desiBreeds,
            irrigationSource,
            soilConservationMeasures,
            microIrrigation
        } = req.body;

        console.log("Request body data:", req.body);

        if (!id) {
            return res.status(400).json({ message: "Farmer ID is required" });
        }

        if (!(/^(\+91[\-\s]?)?[0]?(91)?[789]\d{9}$/.test(mobileNumber))) {
            return res.status(400).json({
                status: false,
                message: "Mobile Number is not valid"
            });
        }

        // Check if the farmer exists
        const farmer = await Farmer.findByPk(id);
        if (!farmer) {
            return res.status(404).json({ message: "Farmer not found" });
        }

        // Update the farmer's information
        const updatedFarmer = await farmer.update({
            farmerID: farmerID || farmer.farmerID,
            name: newname || farmer.newname,
            mobileNumber: mobileNumber || farmer.mobileNumber,
            emailID: emailID || farmer.emailID,
            villageName: villageName || farmer.villageName,
            taluka: taluka || farmer.taluka,
            clusterName: cluster || farmer.clusterName,
            district: district || farmer.district,
            cultivatedLand: cultivatedLand || farmer.cultivatedLand,
            typeOfLand: typeOfLand || farmer.typeOfLand,
            cropsSown: cropsSown || farmer.cropsSown,
            desiBreeds: desiBreeds || farmer.desiBreeds,
            irrigationSource: irrigationSource || farmer.irrigationSource,
            soilConservationMeasures: soilConservationMeasures || farmer.soilConservationMeasures,
            microIrrigation: microIrrigation || farmer.microIrrigation,
        });

        console.log("updated data in database", updatedFarmer);

        return res.status(200).json({
            message: "Farmer information updated successfully",
            updatedFarmer,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Error updating farmer information" });
    }
};

export const UserLocation = async (req, res) => {

    try {
        const { userId, fullname, role, latitude, longitude, address } = req.body;

        if (!userId || !fullname || !role || !latitude || !longitude || !address) {
            return res.status(400).json({ success: false, message: "All fields are required." });
        }
        const newLocation = await Location.create({
            userId,
            fullname,
            role,
            latitude,
            longitude,
            address
        });

        res.status(201).json({ success: true, message: "Location added successfully!", data: newLocation });
    } catch (error) {
        console.error("Error adding location:", error);
        res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }

}

export const getalllocation = async (req, res) => {
    try {
        const locations = await Location.findAll();
        res.status(200).json({ success: true, data: locations });
    } catch (error) {
        console.error("Error fetching locations:", error);
        res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
};

export const getlocationbyuserid = async (req, res) => {
    try {
        const { userId } = req.params;

        const location = await Location.findAll({ where: { userId } });

        if (!location) {
            return res.status(404).json({ success: false, message: "Location not found for this userId." });
        }

        res.status(200).json({ success: true, data: location });
    } catch (error) {
        console.error("Error fetching location:", error);
        res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
};

export const locationdeletebyid = async (req, res) => {
    try {
        const { id } = req.params;

        const location = await Location.findOne({ where: { id } });

        if (!location) {
            return res.status(404).json({ success: false, message: "Location not found." });
        }

        await location.destroy();

        res.status(200).json({ success: true, message: "Location deleted successfully!" });
    } catch (error) {
        console.error("Error deleting location:", error);
        res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
};

export const Allfieldofficer = async (req, res) => {
    try {
        const fieldOfficers = await UserModel.findAll({
            where: { role: 'Field Officer' },
            attributes: ['fullname']
        });

        // If no field officers found, send the response and return immediately
        if (fieldOfficers.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No field officers found",
            });
        }

        // If field officers are found, send the response and return immediately
        return res.status(200).json({
            success: true,
            message: "All field officers fetched successfully",
            data: fieldOfficers
        });

    } catch (error) {
        console.error("Error fetching users:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};


export const AllAsstPC = async (req, res) => {
    try {
        const AsstProcjectCoardinater = await UserModel.findAll({
            where: { role: 'Assistant Project Coordinator' },
            attributes: ['fullname']
        });

        if (AsstProcjectCoardinater.length === 0) {
            res.status(404).json({
                success: false,
                message: "Not Found Asst. Project coordinater",
            })
        }
        return res.status(200).json({
            success: true,
            message: "All field officer",
            data: AsstProcjectCoardinater
        })
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// export const user_get_all_intraction_with_former = async (req, res) => {
//     try {
//         const Interaction = await Interactions.findAll();
//         console.log("farmer-interaction", Interaction);

//         const interactionCounts = Interaction.reduce((acc, interaction) => {
//             const { farmer, village } = interaction.dataValues;
//             const key = `${farmer}-${village}`;
//             acc[key] = (acc[key] || 0) + 1;
//             return acc;
//         }, {});

//         const interactionsWithCounts = Interaction.map((interaction) => {
//             const { farmer, village } = interaction.dataValues;
//             const key = `${farmer}-${village}`;
//             return {
//                 ...interaction.dataValues,
//                 count: interactionCounts[key],
//             };
//         });

//         const uniqueInteractions = Object.values(
//             interactionsWithCounts.reduce((acc, interaction) => {
//                 const key = `${interaction.farmer}-${interaction.village}`;
//                 if (!acc[key]) {
//                     acc[key] = interaction; // Keep the first occurrence
//                 }
//                 return acc;
//             }, {})
//         );

//         return res.status(200).json({
//             success: true,
//             message: "interation with farmer",
//             CountData: uniqueInteractions

//         })
//     } catch (error) {
//         console.error("Error fetching interaction:", error);
//         res.status(500).render('error', {
//             success: false,
//             message: "Internal server error",
//             error: error.message,
//         });
//     }
// };

export const user_get_all_intraction_with_former = async (req, res) => {
    try {
        // Fetch all interactions
        const interactions = await Interactions.findAll({
            order: [['id', 'DESC']]
        });
        console.log("farmer-interaction", interactions);


        const users = await UserModel.findAll({
            attributes: ['id', 'fullname']
        });

        // Create a map for user_id to fullname
        const userMap = users.reduce((acc, user) => {
            acc[user.id] = user.fullname;
            return acc;
        }, {});

        // Count interactions by farmer and village
        const interactionCounts = interactions.reduce((acc, interaction) => {
            const { farmer, village } = interaction.dataValues;
            const key = `${farmer}-${village}`;
            acc[key] = (acc[key] || 0) + 1;
            return acc;
        }, {});

        // Add count and fullname to each interaction
        const interactionsWithCounts = interactions.map((interaction) => {
            const { farmer, village, user_id } = interaction.dataValues;
            const key = `${farmer}-${village}`;
            return {
                ...interaction.dataValues,
                count: interactionCounts[key],
                fullname: userMap[user_id] || "Unknown User" // Map user_id to fullname
            };
        });

        // Keep unique interactions by farmer and village
        const uniqueInteractions = Object.values(
            interactionsWithCounts.reduce((acc, interaction) => {
                const key = `${interaction.farmer}-${interaction.village}`;
                if (!acc[key]) {
                    acc[key] = interaction; // Keep the first occurrence
                }
                return acc;
            }, {})
        );

        return res.status(200).json({
            success: true,
            message: "Interaction with farmer retrieved successfully",
            CountData: uniqueInteractions,
        });
    } catch (error) {
        console.error("Error fetching interactions:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};

// export const user_get_interaction_details = async (req, res) => {
//     try {
//         const { village, farmer } = req.params;
//         const detailedInteractions = await Interactions.findAll({
//             where: {
//                 village,
//                 farmer,
//             },
//         });
//         res.status(200).json({
//             success: true,
//             data: detailedInteractions,
//             village,
//             farmer,
//         });
//     } catch (error) {
//         console.error("Error fetching detailed interaction:", error);
//         res.status(500).render('error', {
//             success: false,
//             message: "Internal server error",
//             error: error.message,
//         });
//     }
// };

// intaraction with farmer

export const user_get_interaction_details = async (req, res) => {
    try {
        const { village, farmer } = req.params;

        // Fetch interactions based on village and farmer
        const detailedInteractions = await Interactions.findAll({
            where: {
                village,
                farmer,
            },
            order: [['id', 'DESC']]
        });

        if (detailedInteractions.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No interactions found for the given village and farmer.",
                village,
                farmer,
                data: [],
            });
        }

        // Fetch all users for mapping user_id to fullname
        const users = await UserModel.findAll({
            attributes: ['id', 'fullname'], // Select only id and fullname
        });

        // Create a map for user_id to fullname
        const userMap = users.reduce((acc, user) => {
            acc[user.id] = user.fullname;
            return acc;
        }, {});

        // Add fullname to each interaction
        const interactionsWithFullnames = detailedInteractions.map((interaction) => {
            const { user_id } = interaction.dataValues;
            return {
                ...interaction.dataValues,
                fullname: userMap[user_id] || "Unknown User", // Map user_id to fullname
            };
        });

        return res.status(200).json({
            success: true,
            message: "Detailed interactions fetched successfully.",
            data: interactionsWithFullnames,
            village,
            farmer,
        });
    } catch (error) {
        console.error("Error fetching detailed interaction:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};

export const addInteraction = async (req, res) => {
    try {
        const { user_id, userrole, village, farmer, date, observationInBrief } = req.body;

        if (!user_id || !userrole || !village || !date || !farmer || !observationInBrief) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const newInteraction = await Interaction.create({
            user_id,
            userrole,
            village,
            farmer,
            date,
            observationInBrief,
        });

        return res.status(200).json({
            success: true,
            message: "Interaction added successfully",
            data: newInteraction,
        });

    } catch (error) {
        console.error("Error adding interaction:", error);
        return res.status(500).json({ message: "Error adding interaction" });
    }
};

export const farmerlistbyuserid = async (req, res) => {
    try {
        const { userid } = req.params;
        if (!userid) {
            return res.status(400).json({ message: "User ID is required" });
        }
        const Allfarmers = await Farmer.findAll({
            where: { userid },
            attributes: ['name']
        });
        if (Allfarmers.length === 0) {
            return res.render('farmerlist', { message: 'No farmers found for this user' });
        }
        res.status(200).json({
            success: true,
            message: "All farmer related user",
            data: Allfarmers
        })
    } catch (error) {
        console.error("Error fetching farmers by user ID:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const getCoordinatorDetailsByID = async (req, res) => {
    try {
        const { coordinatorID } = req.params;

        if (!coordinatorID) {
            return res.status(400).json({
                success: false,
                message: "Coordinator ID is required",
            });
        }
        const coordinatorDetails = await PCworkDetail.findAll({
            where: { coordinatorID },
        });

        if (coordinatorDetails.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No data found for the given Coordinator ID",
            });
        }
        res.status(200).json({
            success: true,
            message: "Coordinator details retrieved successfully",
            data: coordinatorDetails,
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




// export const getCoordinatorDetailsByID = async (req, res) => {
//     try {
//         const { coordinatorID } = req.params;

//         if (!coordinatorID) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Coordinator ID is required",
//             });
//         }

//         const coordinatorDetails = await PCworkDetail.findAll({
//             where: { coordinatorID },
//         });

//         if (coordinatorDetails.length === 0) {
//             return res.status(404).json({
//                 success: false,
//                 message: "No data found for the given Coordinator ID",
//             });
//         }

//         // Filter out empty arrays and objects with empty fields
//         const filteredData = coordinatorDetails.map((record) => {
//             const {
//                 trainingProgrammes,
//                 reviewMeetings,
//                 monitoringVisits,
//                 reports,
//                 ...otherFields
//             } = record;

//             // Helper function to check if an array contains valid data
//             const isValidArray = (arr) => {
//                 return (
//                     Array.isArray(arr) &&
//                     arr.some(
//                         (item) =>
//                             Object.values(item).some(
//                                 (value) => value && value.trim() !== ""
//                             )
//                     )
//                 );
//             };

//             return {
//                 ...otherFields,
//                 ...(isValidArray(trainingProgrammes) && { trainingProgrammes }),
//                 ...(isValidArray(reviewMeetings) && { reviewMeetings }),
//                 ...(isValidArray(monitoringVisits) && { monitoringVisits }),
//                 ...(isValidArray(reports) && { reports }),
//             };
//         });

//         res.status(200).json({
//             success: true,
//             message: "Coordinator details retrieved successfully",
//             data: filteredData,
//         });
//     } catch (error) {
//         console.error("Error fetching coordinator details:", error);
//         res.status(500).json({
//             success: false,
//             message: "Internal server error",
//             error: error.message,
//         });
//     }
// };


































