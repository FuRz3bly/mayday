//import { useState } from "react";
import { Box, Button, TextField, Autocomplete, useTheme } from "@mui/material";
import { DateTimePicker } from "@mui/x-date-pickers";
import { Formik } from "formik";
import { db } from "../config/firebaseConfig";
import { setDoc, doc, GeoPoint ,Timestamp, runTransaction } from "firebase/firestore";
import * as yup from "yup";
//import { tokens } from "../theme";
import useMediaQuery from "@mui/material/useMediaQuery";
import Header from "./Header";

const AddReportForm = ({ onClose, users }) => {
    const theme = useTheme();
    const isNonMobile = useMediaQuery("(min-width:600px)");

    const generateID = async (serviceType, barangayName, dateParam = null) => {
        try {
            if (typeof serviceType !== "number" || serviceType < 0 || serviceType > 3) {
                throw new Error("Invalid service type. Must be 0 to 3.");
            }

            // Generate a 4-character random hex (A-E, 1-9)
            //const chars = "ABCDE123456789";
            //const hexID = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
        
            const barangayCode = barangayCodes[barangayName] || "UNK"; // Default to "UNK" (Unknown) if not found
        
            // Use provided date or current date
            const dateObj = dateParam ? new Date(dateParam) : new Date();
            if (isNaN(dateObj)) throw new Error("Invalid date parameter.");

            // Get date in YYYYMMDD and YYYY-MM-DD formats
            const compressedDate = `${dateObj.getFullYear()}${String(dateObj.getMonth() + 1).padStart(2, "0")}${String(dateObj.getDate()).padStart(2, "0")}`;
            const formattedDate = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, "0")}-${String(dateObj.getDate()).padStart(2, "0")}`;
        
            // Reference Firestore document for today's records
            const dailyRef = doc(db, "metadata", "daily", "records", formattedDate);

            // Transaction to update the count safely
            const newCount = await runTransaction(db, async (transaction) => {
                const dailySnap = await transaction.get(dailyRef);

                let count = 1; // Default if no existing count
                if (dailySnap.exists()) {
                    const data = dailySnap.data();
                    count = (data.reports ?? 0) + 1; // Increment report count
                }

                // Update Firestore with the new count
                transaction.set(dailyRef, { reports: count }, { merge: true });

                return count;
            });
        
            // Format Report ID: IND-YYYYMMDD-TSSSSS-BBB-HHHH
            const reportID = `IND-${compressedDate}-${serviceType}${String(newCount).padStart(5, "0")}-${barangayCode}`;
        
            return reportID;
        } catch (error) {
            console.error("Error generating report ID:", error);
            return null;
        }
    };

    const handleFormSubmit = async (values) => {
        try {
            // Extract values for ID generation
            const serviceType = values.service; // 0, 1, 2, or 3
            const barangayName = values.address.barangay;
            const incidentDate = values.date.incident ? new Date(values.date.incident) : new Date();
    
            // Generate the report ID
            const reportID = await generateID(serviceType, barangayName, incidentDate);
            if (!reportID) {
                console.error("Failed to generate report ID");
                alert("Failed to generate report ID. Please try again.");
                return;
            }
    
            // Format the report
            const formattedReport = {
                id: reportID,
                ...values,
                type: values.type,
                address: {
                    ...values.address,
                    location: new GeoPoint(
                        parseFloat(values.address.location.latitude),
                        parseFloat(values.address.location.longitude)
                    ),
                },
                date: {
                    incident: values.date.incident ? Timestamp.fromDate(incidentDate) : null,
                },
                status: 0,
                time: {
                    estimated: 7,
                },
                flags: {
                    report: null,
                },
                responders: null,
            };
    
            console.log("Formatted Report:", formattedReport);
    
            await setDoc(doc(db, "reports", reportID), formattedReport);

            alert(`Report ${reportID} has been successfully submitted!`);
            onClose();
        } catch (error) {
            console.error("Error submitting report:", error);
            alert("An error occurred while submitting the report. Please try again.");
        }
    };    

    return (
        <Box m="20px">
            <Header title="ADD REPORT" subtitle="Create a New Report" />
            <Box mt="20px" />
                <Formik
                    onSubmit={handleFormSubmit}
                    initialValues={initialValues}
                    validationSchema={reportSchema}
                >
                    {({
                    values,
                    errors,
                    touched,
                    handleBlur,
                    handleChange,
                    handleSubmit,
                    setFieldValue
                    }) => (
                        <form onSubmit={handleSubmit}>
                            <Box
                                display="grid"
                                gap="30px"
                                gridTemplateColumns="repeat(4, minmax(0, 1fr))"
                                sx={{
                                    "& > div": { gridColumn: isNonMobile ? undefined : "span 4" },
                                }}
                            >
                                {/* Reporter */}
                                <Autocomplete
                                    options={users}
                                    getOptionLabel={(option) => `${option.name.first_name} ${option.name.last_name}`}
                                    value={users.find(user => user.user_id === values.reporter?.user_id) || null}
                                    onChange={(event, newValue) => {
                                        if (newValue) {
                                            setFieldValue("reporter", {
                                                name: {
                                                    first_name: newValue.name.first_name,
                                                    last_name: newValue.name.last_name,
                                                },
                                                address: {
                                                    barangay: newValue.address.barangay,
                                                    municipality: newValue.address.municipality,
                                                    province: newValue.address.province,
                                                },
                                                user_id: newValue.user_id,
                                                phone: newValue.phone,
                                                birthdate: newValue.birthdate,
                                            });
                                        } else {
                                            // Reset to initial structure instead of empty {}
                                            setFieldValue("reporter", { 
                                                name: { first_name: "", last_name: "" },
                                                address: { barangay: "", municipality: "Indang", province: "Cavite" },
                                                user_id: "",
                                                phone: "",
                                                birthdate: null
                                            });
                                        }
                                    }}
                                    onBlur={handleBlur}
                                    sx={{ gridColumn: "span 4" }}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            fullWidth
                                            variant="filled"
                                            label="Select Reporter"
                                            name="reporter.user_id"
                                            error={
                                                !!touched.reporter?.user_id && 
                                                !!errors.reporter?.user_id
                                            }
                                            helperText={touched.reporter?.user_id && errors.reporter?.user_id}
                                        />
                                    )}
                                />

                                {/* Type(s) */}
                                <Autocomplete
                                    multiple
                                    options={["Fire", "Crime", "Medical"]}
                                    value={(() => {
                                        const selected = [];
                                        if (values.type & 0b010) selected.push("Fire");
                                        if (values.type & 0b001) selected.push("Crime");
                                        if (values.type & 0b100) selected.push("Medical");
                                        return selected;
                                    })()}
                                    sx={{ gridColumn: "span 4" }}
                                    onChange={(event, newValue) => {
                                        let typeBitmask = 0;
                                        if (newValue.includes("Crime")) typeBitmask |= 0b001;
                                        if (newValue.includes("Fire")) typeBitmask |= 0b010;
                                        if (newValue.includes("Medical")) typeBitmask |= 0b100;

                                        setFieldValue("type", typeBitmask);

                                        // Determine the correct `service` value
                                        let serviceValue = 0;
                                        if (typeBitmask & 0b010) serviceValue |= 1; // Fire → Firetruck
                                        if (typeBitmask & 0b100) serviceValue |= 2; // Medical → Ambulance

                                        setFieldValue("service", serviceValue);
                                    }}
                                    onBlur={handleBlur}
                                    disableCloseOnSelect
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            fullWidth
                                            variant="filled"
                                            label="Report Type"
                                            name="type"
                                            error={!!touched.type && !!errors.type}
                                            helperText={touched.type && errors.type}
                                        />
                                    )}
                                />

                                {/* Service(s) */}
                                <Autocomplete
                                    options={serviceOptions}
                                    getOptionLabel={(option) => option.label}
                                    value={serviceOptions.find(option => option.value === values.service) || null}
                                    onChange={(event, newValue) => setFieldValue("service", newValue ? newValue.value : 0)}
                                    onBlur={handleBlur}
                                    sx={{ gridColumn: "span 4" }}
                                    renderInput={(params) => (
                                        <TextField
                                        {...params}
                                        fullWidth
                                        variant="filled"
                                        label="Service(s)"
                                        name="service"
                                        error={!!touched.service && !!errors.service}
                                        helperText={touched.service && errors.service}
                                        />
                                    )}
                                />

                                {/* Address: Barangay */}
                                <Autocomplete
                                    options={barangayOptions}
                                    value={values.address.barangay || null}
                                    onChange={(event, newValue) => setFieldValue("address.barangay", newValue)}
                                    onBlur={handleBlur}
                                    sx={{ gridColumn: "span 4" }}
                                    renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        fullWidth
                                        variant="filled"
                                        label="Barangay"
                                        name="address.barangay"
                                        error={!!touched.address?.barangay && !!errors.address?.barangay}
                                        helperText={touched.address?.barangay && errors.address?.barangay}
                                    />
                                    )}
                                />
                
                                {/* Municipality (Pre-filled) */}
                                <TextField
                                    fullWidth
                                    variant="filled"
                                    label="Municipality"
                                    value={values.address.municipality}
                                    name="address.municipality"
                                    disabled
                                    sx={{ gridColumn: "span 2" }}
                                />
                
                                {/* Province (Pre-filled) */}
                                <TextField
                                    fullWidth
                                    variant="filled"
                                    label="Province"
                                    value={values.address.province}
                                    name="address.province"
                                    disabled
                                    sx={{ gridColumn: "span 2" }}
                                />
                
                                {/* Location: Latitude */}
                                <TextField
                                    fullWidth
                                    variant="filled"
                                    type="number"
                                    label="Latitude"
                                    onBlur={handleBlur}
                                    onChange={handleChange}
                                    value={values.address.location.latitude}
                                    name="address.location.latitude"
                                    error={!!touched.address?.location?.latitude && !!errors.address?.location?.latitude}
                                    helperText={touched.address?.location?.latitude && errors.address?.location?.latitude}
                                    sx={{ gridColumn: "span 2" }}
                                />
                
                                {/* Location: Longitude */}
                                <TextField
                                    fullWidth
                                    variant="filled"
                                    type="number"
                                    label="Longitude"
                                    onBlur={handleBlur}
                                    onChange={handleChange}
                                    value={values.address.location.longitude}
                                    name="address.location.longitude"
                                    error={!!touched.address?.location?.longitude && !!errors.address?.location?.longitude}
                                    helperText={touched.address?.location?.longitude && errors.address?.location?.longitude}
                                    sx={{ gridColumn: "span 2" }}
                                />

                                {/* Incident Date */}
                                <DateTimePicker
                                    label="Incident Date"
                                    value={values.date.incident}
                                    onChange={(date) => setFieldValue("date.incident", date)}
                                    sx={{
                                        gridColumn: "span 4",
                                        backgroundColor: theme.palette.mode === "dark" ? "#293040" : "#c4c5c8",
                                    }}
                                    renderInput={(params) => (
                                        <TextField
                                        {...params}
                                        fullWidth
                                        variant="filled"
                                        error={!!touched.date?.incident && !!errors.date?.incident}
                                        helperText={touched.date?.incident && errors.date?.incident}
                                        sx={{
                                            gridColumn: "span 1",
                                            "& .MuiInputBase-root": {
                                            backgroundColor: "transparent",
                                            borderRadius: 0,
                                            },
                                            "& .MuiFilledInput-root": {
                                            border: "none",
                                            "&:before, &:after": {
                                                display: "none",
                                            },
                                            },
                                        }}
                                        />
                                    )}
                                />
                            </Box>

                            {/* Action Buttons */}
                            <Box display="flex" justifyContent="end" mt="20px">
                                <Button onClick={onClose} color="error" variant="contained" sx={{ mr: 2 }}>
                                    Cancel
                                </Button>
                                <Button type="submit" color="secondary" variant="contained">
                                    Add Report
                                </Button>
                            </Box>
                        </form>
                    )}
                </Formik>
        </Box>
    )

};

// Validation Schema
const reportSchema = yup.object().shape({
    reporter: yup.object().shape({
        name: yup.object().shape({
            first_name: yup.string().required("First name is required"),
            last_name: yup.string().required("Last name is required"),
        }),
        address: yup.object().shape({
            barangay: yup.string().required("Barangay is required"),
            municipality: yup.string().required("Municipality is required"),
            province: yup.string().required("Province is required"),
        }),
        user_id: yup.string().required("User ID is required"),
        phone: yup
            .string()
            .matches(/^[0-9]{11}$/, "Phone number must be 11 digits")
            .required("Phone number is required"),
        birthdate: yup
            .date()
            .nullable()
            .required("Birthdate is required"),
    }),
    type: yup
        .number()
        .oneOf([0, 1, 2, 3, 4, 5, 6, 7], "Invalid report type") // Ensures only valid bitmask values are allowed
        .required("Report type is required"),
    service: yup
        .number()
        .oneOf([0, 1, 2, 3], "Invalid service type")
        .required("Service is required"),
    address: yup.object().shape({
        barangay: yup.string().required("Barangay is required"),
        location: yup.object().shape({
            latitude: yup
                .number()
                .typeError("Latitude must be a number")
                .required("Latitude is required"),
            longitude: yup
                .number()
                .typeError("Longitude must be a number")
                .required("Longitude is required"),
        }),
    }),
    date: yup.object().shape({
        incident: yup.date().nullable().required("Incident date is required"),
    }),
});

// Initial Values
const initialValues = {
    reporter: {
        name: {
            first_name: "",
            last_name: "",
        },
        address: {
            barangay: "",
            municipality: "Indang",
            province: "Cavite",
        },
        user_id: "",
        phone: "",
        birthdate: null,
    },
    type: 0,
    service: 0,
    address: {
        barangay: "",
        municipality: "Indang",
        province: "Cavite",
        location: {
            latitude: "",
            longitude: "",
        }
    },
    date: {
        incident: null,
    }
};

// Indang Barangay Options
const barangayOptions = [
    "Agus-os", "Alulod", "Banaba Cerca", "Banaba Lejos", "Bancod", 
    "Buna Cerca", "Buna Lejos I", "Buna Lejos II", "Calumpang Cerca", 
    "Calumpang Lejos", "Carasuchi", "Guyam Malaki", "Guyam Munti", 
    "Harasan", "Kayquit I", "Kayquit II", "Kayquit III", "Kaytapos", 
    "Limbon", "Lumampong Balagbag", "Lumampong Halayhay", 
    "Mahabang Kahoy Cerca", "Mahabang Kahoy Lejos", "Mataas na Lupa", 
    "Pulo", "Tambo Balagbag", "Tambo Ilaya", "Tambo Kulit", 
    "Tambo Malaki", "Tambo Munti", "Poblacion I", "Poblacion II", 
    "Poblacion III", "Poblacion IV", "Daine I", "Daine II"
];

// Services Options
const serviceOptions = [
    { label: "None", value: 0 },
    { label: "Firetruck", value: 1 },
    { label: "Ambulance", value: 2 },
    { label: "Firetruck & Ambulance", value: 3 }
];

// Indang Barangay Codes
const barangayCodes = {
    "Agus-os": "AGS",
    "Alulod": "ALD",
    "Banaba Cerca": "BNC",
    "Banaba Lejos": "BNL",
    "Bancod": "BND",
    "Buna Cerca": "BNC1",
    "Buna Lejos I": "BNL1",
    "Buna Lejos II": "BNL2",
    "Calumpang Cerca": "CLC",
    "Calumpang Lejos": "CLL",
    "Carasuchi": "CRS",
    "Guyam Malaki": "GYM",
    "Guyam Munti": "GYT",
    "Harasan": "HRS",
    "Kayquit I": "KQT1",
    "Kayquit II": "KQT2",
    "Kayquit III": "KQT3",
    "Kaytapos": "KTP",
    "Limbon": "LMB",
    "Lumampong Balagbag": "LMBG",
    "Lumampong Halayhay": "LMHY",
    "Mahabang Kahoy Cerca": "MKC",
    "Mahabang Kahoy Lejos": "MKL",
    "Mataas na Lupa": "MTL",
    "Pulo": "PLO",
    "Tambo Balagbag": "TBB",
    "Tambo Ilaya": "TIL",
    "Tambo Kulit": "TKL",
    "Tambo Malaki": "TMB",
    "Tambo Munti": "TMT",
    "Poblacion I": "PB1",
    "Poblacion II": "PB2",
    "Poblacion III": "PB3",
    "Poblacion IV": "PB4",
    "Daine I": "DNE1",
    "Daine II": "DNE2",
};

export default AddReportForm;