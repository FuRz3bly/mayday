import { Box, Button, TextField, Autocomplete, useTheme } from "@mui/material";
import { DateTimePicker, DatePicker } from "@mui/x-date-pickers";
import { Formik } from "formik";
import * as yup from "yup";
import useMediaQuery from "@mui/material/useMediaQuery";
import Header from "./Header";
import { tokens } from "../theme";
import { db } from "../config/firebaseConfig";
import { doc, updateDoc, Timestamp, GeoPoint, serverTimestamp } from "firebase/firestore";

const DispatchReportForm = ({ stations, report, onClose }) => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    const isNonMobile = useMediaQuery("(min-width:600px)");
    
    // Initial Values
    const initialValues = {
        id: report?.id || "",
        status: 1,
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

    // Dispatch Report
    const handleDispatch = async (values) => {
        const formattedReport = {
            ...values,
            reporter: {
                ...values.reporter,
                birthdate: values.reporter.birthdate instanceof Date 
                    ? values.reporter.birthdate.toISOString().split("T")[0]
                    : values.reporter.birthdate,
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
            console.log("Report dispatched successfully:", formattedReport);
            alert("Report dispatched successfully! ✅");
            onClose();
        } catch (error) {
            console.error("Error updating report:", error);
        }
    };
    
    return (
        <Box m="20px">
            <Header title="DISPATCH REPORT" subtitle="Dispatch Report to Stations" />
            <Box mt="20px" />
            <Formik
                onSubmit={handleDispatch}
                initialValues={initialValues}
                validationSchema={false}
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
                            {/* Reporter */}
                            <TextField
                                fullWidth
                                variant="filled"
                                label="Reporter"
                                name="reporter.user_id"
                                value={`${values.reporter?.name.first_name} ${values.reporter?.name.last_name}`}
                                readOnly
                                sx={{
                                    gridColumn: "span 2",
                                    backgroundColor: "transparent",
                                    pointerEvents: "none",
                                    "& .MuiInputBase-input": {
                                    color: "inherit",
                                    },
                                }}
                            />

                            {/* User Address: Barangay */}
                            <TextField
                                fullWidth
                                variant="filled"
                                label="Reporter Barangay"
                                name="reporter.address.barangay"
                                value={values.reporter.address.barangay || ""}
                                readOnly
                                sx={{
                                    gridColumn: "span 1",
                                    backgroundColor: "transparent",
                                    pointerEvents: "none",
                                    "& .MuiInputBase-input": {
                                    color: "inherit",
                                    },
                                }}
                                error={!!touched.reporter?.address?.barangay && !!errors.reporter?.address?.barangay}
                                helperText={touched.reporter?.address?.barangay && errors.reporter?.address?.barangay}
                            />

                            {/* Incident Date */}
                            <DateTimePicker
                                label="Incident Date"
                                value={values.date.incident}
                                onChange={(date) => setFieldValue("date.incident", date)}
                                disableOpenPicker
                                readOnly // Ensures no typing
                                sx={{
                                    gridColumn: "span 1",
                                    backgroundColor: theme.palette.mode === "dark" ? "#293040" : "#c4c5c8",
                                }}
                                renderInput={(params) => (
                                    <TextField
                                    {...params}
                                    fullWidth
                                    variant="filled"
                                    error={!!touched.date?.incident && !!errors.date?.incident}
                                    helperText={touched.date?.incident && errors.date?.incident}
                                    readOnly
                                    sx={{
                                        gridColumn: "span 1",
                                        pointerEvents: "none", // Prevents interaction
                                        userSelect: "none", // Prevents selection
                                        caretColor: "transparent", // Hides the blinking text cursor
                                        "& .MuiInputBase-input": {
                                          cursor: "default",
                                        },
                                        "& .MuiIconButton-root": {
                                          display: "none", // Hides the date picker icon
                                        },
                                      }}
                                    />
                                )}
                            />

                            {/* Service(s) */}
                            <TextField
                                fullWidth
                                variant="filled"
                                label="Service Requirement"
                                value={serviceOptions.find(option => option.value === values.service)?.label || ""}
                                name="service"
                                readOnly
                                sx={{
                                    gridColumn: "span 2",
                                    backgroundColor: "transparent",
                                    pointerEvents: "none",
                                    userSelect: "none",
                                    "& .MuiInputBase-input": {
                                        color: "inherit",
                                        cursor: "default",
                                    },
                                }}
                            />

                            {/* Address: Barangay */}
                            <TextField
                                fullWidth
                                variant="filled"
                                label="Report Address"
                                value={values.address.barangay || ""}
                                name="address.barangay"
                                error={!!touched.address?.barangay && !!errors.address?.barangay}
                                helperText={touched.address?.barangay && errors.address?.barangay}
                                readOnly
                                sx={{
                                    gridColumn: "span 1",
                                    pointerEvents: "none", // Prevents interaction
                                    userSelect: "none", // Prevents text selection
                                    caretColor: "transparent", // Hides blinking cursor
                                    "& .MuiInputBase-input": {
                                        cursor: "default",
                                    },
                                }}
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
                                sx={{ gridColumn: "span 1" }}
                            />

                            {/* Service Provider */}
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

                            {/* Second Service Provider */}
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
                        </Box>

                        {/* Action Buttons */}
                        <Box display="flex" justifyContent="end" mt="20px">
                            <Button onClick={onClose} color="error" variant="contained" sx={{ mr: 2 }}>
                                Cancel
                            </Button>
                            <Button onClick={() => handleSubmit()} color="secondary" variant="contained">
                                Dispatch
                            </Button>
                        </Box>
                    </form>
                )}
            </Formik>
        </Box>
    )
}

// Validation Schema
const dispatchReportSchema = yup.object().shape({
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

// Services Options
const serviceOptions = [
    { label: "None", value: 0 },
    { label: "Firetruck", value: 1 },
    { label: "Ambulance", value: 2 },
    { label: "Firetruck & Ambulance", value: 3 }
];

export default DispatchReportForm;