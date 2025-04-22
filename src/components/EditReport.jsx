//import { useEffect } from "react";
import { Box, Button, TextField, Autocomplete, useTheme } from "@mui/material";
import { DateTimePicker, DatePicker } from "@mui/x-date-pickers";
import { Formik } from "formik";
import * as yup from "yup";
import useMediaQuery from "@mui/material/useMediaQuery";
import Header from "./Header";
//import { tokens } from "../theme";
import { db } from "../config/firebaseConfig";
import { doc, updateDoc, Timestamp, GeoPoint, serverTimestamp } from "firebase/firestore";

const EditReportForm = ({ users, stations, report, onClose }) => {
    const theme = useTheme();
    //const colors = tokens(theme.palette.mode);
    const isNonMobile = useMediaQuery("(min-width:600px)");

    // Initial Values
    const initialValues = {
        id: report?.id || "",
        status: report?.status || 0,
        reporter: {
            name: {
                first_name: report?.reporter.name.first_name || "",
                last_name: report?.reporter.name.last_name || "",
            },
            address: {
                barangay: report?.reporter.address.barangay || "",
                municipality: report?.reporter.address.municipality || "Indang",
                province: report?.reporter.address.province || "Cavite",
            },
            user_id: report?.reporter.user_id || "",
            phone: report?.reporter.phone || "",
            birthdate: report?.reporter.birthdate 
                ? new Date(report.reporter.birthdate)
                : null,
        },
        time: {
            estimated: report?.time.estimated || 7,
        },
        flags: {
            report: report?.flags.report || null,
        },
        service: report?.service || 0,
        address: {
            barangay: report?.address.barangay || "",
            municipality: report?.address.municipality || "Indang",
            province: report?.address.province || "Cavite",
            location: {
                latitude:  report?.address?.location?.latitude || "",
                longitude: report?.address?.location?.longitude || "",
            }
        },
        date: {
            incident: report?.date.incident 
              ? report.date.incident.toDate()
              : null,
        },
        responders: {
            providers: []
        }
    };

    // Display Available Stations that provides Required Service
    const getAvailableStations = (selectedService, stations) => {
        return stations.filter(station => {
            const hasVehicles = station.service?.vehicle?.length > 0; // Check if station has any vehicles
    
            if (selectedService === 0) {
                return !hasVehicles; // Only return stations with no vehicles
            }
    
            if (!hasVehicles) return false; // Skip stations with no vehicle data if service isn't 0
    
            const hasFiretruck = station.service.vehicle.some(vehicle => vehicle.firetruck);
            const hasAmbulance = station.service.vehicle.some(vehicle => vehicle.ambulance);
    
            // If "Firetruck & Ambulance" is required, allow stations with at least one of them
            if (selectedService === 3) {
                return hasFiretruck || hasAmbulance;
            }
    
            // Otherwise, strictly require the specific vehicle
            if (selectedService === 1) return hasFiretruck; // Firetruck required
            if (selectedService === 2) return hasAmbulance; // Ambulance required
    
            return false; // Default case (shouldn't happen)
        });
    };    

    // Submit Editted Report
    const handleEditSubmit = async (values) => {
        // Determine if responders.providers is empty
        const hasResponders = values.responders?.providers?.length > 0;

        const formattedReport = {
            ...values,
            responders: hasResponders ? values.responders : null,
            reporter: {
                ...values.reporter,
                birthdate: values.reporter.birthdate instanceof Date 
                    ? values.reporter.birthdate.toISOString().split("T")[0] // Convert Date to "YYYY-MM-DD"
                    : values.reporter.birthdate, // Keep it as is if it's already a string
            },
            address: {
                ...values.address,
                location: new GeoPoint(
                    values.address.location.latitude,
                    values.address.location.longitude
                ),
            },
            date: {
                ...values.date,
                incident: Timestamp.fromDate(new Date(values.date.incident)),
                received: serverTimestamp()
            },
        };
    
        console.log("Formatted Report:", formattedReport);
    
        try {
            await updateDoc(doc(db, "reports", values.id), formattedReport);
            console.log("Report updated successfully:", formattedReport);
            alert("Report updated successfully! ✅");
            onClose();
        } catch (error) {
            console.error("Error updating report:", error);
        }
    };

    return (
        <Box m="20px">
            <Header title="EDIT REPORT" subtitle="Modify Report Details" />
            <Box mt="20px" />
            <Formik
                onSubmit={handleEditSubmit}
                initialValues={initialValues}
                validationSchema={editReportSchema}
            >
                {({
                    values,
                    errors,
                    touched,
                    handleBlur,
                    handleChange,
                    handleSubmit,
                    setFieldValue,
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
                            {/* Report ID (Non-editable) */}
                            <TextField
                                fullWidth
                                variant="filled"
                                type="text"
                                label="Report ID"
                                value={values.id}
                                name="reportID"
                                disabled
                                sx={{ gridColumn: "span 2" }}
                            />

                            {/* User ID (Non-editable) */}
                            <TextField
                                fullWidth
                                variant="filled"
                                type="text"
                                label="User ID"
                                value={values.reporter?.user_id}
                                name="userID"
                                disabled
                                sx={{ gridColumn: "span 2" }}
                            />

                            {/* Status */}
                            <Autocomplete
                                options={statusOptions}
                                getOptionLabel={(option) => option.label}
                                value={statusOptions.find(option => option.value === values.status) || null}
                                onChange={(event, newValue) => setFieldValue("status", newValue ? newValue.value : 0)}
                                onBlur={handleBlur}
                                sx={{ gridColumn: "span 4" }}
                                renderInput={(params) => (
                                    <TextField
                                    {...params}
                                    fullWidth
                                    variant="filled"
                                    label="Status"
                                    name="status"
                                    error={!!touched.status && !!errors.status}
                                    helperText={touched.status && errors.status}
                                    />
                                )}
                            />

                            {/* Reporter */}
                            <Autocomplete
                                options={users}
                                getOptionLabel={(option) => `${option.name.first_name} ${option.name.last_name}`}
                                value={users.find(user => String(user.user_id) === String(values.reporter?.user_id)) || null}
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
                                        user_id: newValue.user_id, // Ensure correct type
                                        phone: newValue.phone,
                                        birthdate: newValue.birthdate ? new Date(newValue.birthdate) : null,
                                      });
                                    } else {
                                      setFieldValue("reporter", {
                                        name: { first_name: "", last_name: "" },
                                        address: { barangay: "", municipality: "Indang", province: "Cavite" },
                                        user_id: "",
                                        phone: "",
                                        birthdate: null,
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

                            {/* User Address: Barangay */}
                            <Autocomplete
                                options={barangayOptions}
                                value={values.reporter.address.barangay || null}
                                onChange={(event, newValue) => setFieldValue("reporter.address.barangay", newValue)}
                                onBlur={handleBlur}
                                sx={{ gridColumn: "span 2" }}
                                disabled
                                renderInput={(params) => (
                                <TextField
                                    {...params}
                                    fullWidth
                                    variant="filled"
                                    label="User Barangay"
                                    name="reporter.address.barangay"
                                    error={!!touched.reporter?.address?.barangay && !!errors.reporter?.address?.barangay}
                                    helperText={touched.reporter?.address?.barangay && errors.reporter?.address?.barangay}
                                />
                                )}
                            />
            
                            {/* Phone Number */}
                            <TextField
                                fullWidth
                                variant="filled"
                                type="text"
                                label="Phone Number"
                                disabled
                                value={values.reporter?.phone}
                                name="phone"
                                sx={{ gridColumn: "span 1" }}
                            />
            
                            {/* Birthdate */}
                            <DatePicker
                                label="Birthdate"
                                value={values.reporter.birthdate}
                                disabled
                                sx={{ 
                                    gridColumn: "span 1",
                                    backgroundColor: theme.palette.mode === "dark" ?  "#293040" : "#c4c5c8"
                                }}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        fullWidth
                                        variant="filled"
                                        error={!!touched.reporter.birthdate && !!errors.reporter.birthdate}
                                        helperText={touched.reporter.birthdate && errors.reporter.birthdate}
                                        sx={{
                                            gridColumn: "span 1",
                                            "& .MuiInputBase-root": {
                                              backgroundColor: "transparent", // Optional: Adjust background if needed
                                              borderRadius: 0, // Removes border radius
                                            },
                                            "& .MuiFilledInput-root": {
                                              border: "none", // Removes border
                                              "&:before, &:after": {
                                                display: "none", // Removes underline (for 'filled' variant)
                                              },
                                            },
                                          }}
                                    />
                                )}
                            />

                            {/* Service(s) */}
                            <Autocomplete
                                options={serviceOptions}
                                getOptionLabel={(option) => option.label}
                                value={serviceOptions.find(option => option.value === values.service) || null}
                                onChange={(event, newValue) => {
                                    setFieldValue("service", newValue ? newValue.value : 0);
                                    setFieldValue("responders.providers", []); // Clear service providers
                                }}
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

                            {/* Estimated Arrival Time */}
                            <TextField
                                fullWidth
                                type="number"
                                variant="filled"
                                label="Estimated Time (minutes)"
                                name="time.estimated"
                                value={values.time.estimated}
                                onChange={(e) => setFieldValue("time.estimated", Number(e.target.value))}
                                onBlur={handleBlur}
                                error={!!touched.time?.estimated && !!errors.time?.estimated}
                                helperText={touched.time?.estimated && errors.time?.estimated}
                                sx={{ gridColumn: "span 2" }}
                            />

                            {/* Flag */}
                            <Autocomplete
                                options={flagOptions}
                                getOptionLabel={(option) => option.label}
                                value={flagOptions.find((option) => option.value === values.flags.report) || null}
                                onChange={(event, newValue) => setFieldValue("flags.report", newValue ? newValue.value : null)}
                                onBlur={(event) => {
                                    if (values.status !== 0) {
                                    setFieldValue("flags.report", true);
                                    }
                                    handleBlur(event);
                                }}
                                sx={{ gridColumn: "span 2" }}
                                renderInput={(params) => (
                                    <TextField
                                    {...params}
                                    fullWidth
                                    variant="filled"
                                    label="Flag Report"
                                    name="flags.report"
                                    error={!!touched.flags?.report && !!errors.flags?.report}
                                    helperText={touched.flags?.report && errors.flags?.report}
                                    />
                                )}
                            />

                            {/* Service Provider */}
                            {values.status !== 0 && (
                                <>
                                    {/* First Autocomplete - Select the primary station */}
                                    <Autocomplete
                                        options={getAvailableStations(values.service, stations)}
                                        getOptionLabel={(option) => option.station.name}
                                        value={
                                            stations.find(
                                            (station) =>
                                                station.station.id === values.responders?.providers?.[0]?.station?.id
                                            ) || null
                                        }
                                        onChange={(event, newValue) => {
                                            if (newValue) {
                                            const vehicles = newValue.service?.vehicle || [];
                                            const hasFiretruck = vehicles.some((v) => v.firetruck);
                                            const hasAmbulance = vehicles.some((v) => v.ambulance);

                                            let service = 0;
                                            if (hasFiretruck && hasAmbulance) {
                                                service = 3; // Both Firetruck & Ambulance
                                            } else if (hasFiretruck) {
                                                service = 1; // Firetruck only
                                            } else if (hasAmbulance) {
                                                service = 2; // Ambulance only
                                            }

                                            setFieldValue("responders.providers", [
                                                {
                                                station: {
                                                    id: newValue.station.id,
                                                    name: newValue.station.name,
                                                    type: newValue.station.type,
                                                },
                                                service,
                                                },
                                            ]);
                                            } else {
                                                setFieldValue("responders.providers", []);
                                            }
                                        }}
                                        onBlur={handleBlur}
                                        sx={{ gridColumn: "span 4" }}
                                        renderInput={(params) => {
                                            const providerService = values.responders?.providers?.[0]?.service;
                                            let label = "Select Station";
                                            if (providerService === 1) {
                                            label = "Firetruck Provider";
                                            } else if (providerService === 2) {
                                            label = "Ambulance Provider";
                                            } else if (providerService === 3) {
                                            label = "Firetruck & Ambulance Provider";
                                            }

                                            return (
                                            <TextField
                                                {...params}
                                                fullWidth
                                                variant="filled"
                                                label={label}
                                                name="responders.providers"
                                                error={
                                                !!touched.responders?.providers && !!errors.responders?.providers
                                                }
                                                helperText={
                                                touched.responders?.providers && errors.responders?.providers
                                                }
                                            />
                                            );
                                        }}
                                    />

                                    {/* Second Autocomplete - Only shown if the first station lacks one of the required services */}
                                    {values.responders.providers.length > 0 &&
                                        values.service === 3 &&  // Ensure the overall required service is both Firetruck & Ambulance
                                        values.responders.providers[0].service !== 3 && ( // Only show if first provider doesn't already provide both
                                            <Autocomplete
                                                options={getAvailableStations(
                                                    values.responders.providers[0].service === 1 ? 2 : 1, // If Firetruck is selected, get Ambulance providers; vice versa
                                                    stations.filter(
                                                        (station) => !values.responders.providers.some((p) => p.station.id === station.station.id) // Exclude already selected stations
                                                    )
                                                )}
                                                getOptionLabel={(option) => option.station.name}
                                                value={
                                                    stations.find(
                                                        (station) => station.station.id === values.responders?.providers?.[1]?.station?.id
                                                    ) || null
                                                }
                                                onChange={(event, newValue) => {
                                                    if (newValue) {
                                                        const service = values.responders.providers[0].service === 1 ? 2 : 1; // Ensure correct service type

                                                        setFieldValue("responders.providers", [
                                                            ...values.responders.providers,
                                                            {
                                                                station: {
                                                                    id: newValue.station.id,
                                                                    name: newValue.station.name,
                                                                    type: newValue.station.type,
                                                                },
                                                                service,
                                                            },
                                                        ]);
                                                    } else {
                                                        setFieldValue("responders.providers", [
                                                            values.responders.providers[0],
                                                        ]);
                                                    }
                                                }}
                                                onBlur={handleBlur}
                                                sx={{ gridColumn: "span 4" }}
                                                renderInput={(params) => (
                                                    <TextField
                                                        {...params}
                                                        fullWidth
                                                        variant="filled"
                                                        label={
                                                            values.responders.providers[0].service === 1
                                                                ? "Ambulance Provider"
                                                                : "Firetruck Provider"
                                                        }
                                                        name="responders.providers[1]"
                                                        error={
                                                            !!touched.responders?.providers &&
                                                            !!errors.responders?.providers?.[1]
                                                        }
                                                        helperText={
                                                            touched.responders?.providers &&
                                                            errors.responders?.providers?.[1]
                                                        }
                                                    />
                                                )}
                                            />
                                    )}
                                </>
                            )}
                        </Box>

                        {/* Action Buttons */}
                        <Box display="flex" justifyContent="end" mt="20px">
                            <Button onClick={onClose} color="error" variant="contained" sx={{ mr: 2 }}>
                                Cancel
                            </Button>
                            <Button type="submit" color="secondary" variant="contained">
                                Save Changes
                            </Button>
                        </Box>
                    </form>
                )}
            </Formik>
        </Box>
    )
};

// Validation Schema
const editReportSchema = yup.object().shape({
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
    status: yup.string().required("Status is required"),
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

// Status Options
const statusOptions = [
    { label: "Pending", value: 0 },
    { label: "Acknowledged", value: 1 },
    { label: "Responding", value: 2 },
    { label: "Resolved", value: 3 },
    { label: "Archived", value: 4 },
    { label: "Reopened", value: 5 },
];

// Flag Options
const flagOptions = [
    { label: "Pending", value: null },
    { label: "True", value: true },
    { label: "False", value: false },
];

export default EditReportForm;