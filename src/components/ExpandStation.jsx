import { useState } from "react";
//import { tokens } from "../theme";
import { Box, Button, TextField } from "@mui/material";
import { Formik } from "formik";
import useMediaQuery from "@mui/material/useMediaQuery";
import Header from "./Header";

const ExpandStation = ({ onClose, stations, editStation }) => {
    //const theme = useTheme();
    //const colors = tokens(theme.palette.mode);
    const isNonMobile = useMediaQuery("(min-width:600px)");
    
    // Ensure stations is treated as an array
    const stationsArray = Array.isArray(stations) ? stations : [stations];
    
    // State to track current station index
    const [currentIndex, setCurrentIndex] = useState(0);
    
    // Get current station based on index
    const currentStation = stationsArray[currentIndex];

    // Properly handle null contacts and format phone numbers
    const getPhoneNumbers = () => {
        if (!currentStation?.contacts) return [];
        return Array.isArray(currentStation.contacts.phone) 
            ? currentStation.contacts.phone 
            : currentStation.contacts.phone ? [currentStation.contacts.phone] : [];
    };

    // Format phone numbers as a comma-separated string
    const formatPhoneNumbers = (phones) => {
        if (!phones || phones.length === 0) return "N/A";
        return phones.join(", ");
    };
    
    // Next Station
    const handleNext = () => {
        if (currentIndex < stationsArray.length - 1) {
            setCurrentIndex(currentIndex + 1);
        }
    };
    
    // Previous Station
    const handlePrevious = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
        }
    };

    // Handle Edit
    const handleEdit = () => {
        editStation(currentStation);
        onClose();
    };

    return (
        <Box m="20px">
            <Header 
                title="EXPANDED STATION(S)" 
                subtitle={`Details on the Station(s) (${currentIndex + 1}/${stationsArray.length})`} 
            />

            <Box mt="20px" />
            <Formik
                enableReinitialize={true}
                initialValues={{
                    id: currentStation?.station?.id || "",
                    name: currentStation?.station?.name || "",
                    type: currentStation?.station?.type?.toLowerCase() || "",
                    address: {
                        barangay: currentStation?.address?.barangay || "",
                        municipality: currentStation?.address?.municipality || "Indang",
                        province: currentStation?.address?.province || "Cavite",
                        location: {
                            latitude: currentStation?.address?.location?.latitude || "",
                            longitude: currentStation?.address?.location?.longitude || ""
                        }
                    },
                    contacts: {
                        phoneList: getPhoneNumbers(),
                        phoneFormatted: formatPhoneNumbers(getPhoneNumbers()),
                        website: currentStation?.contacts?.website || "",
                    },
                    service: {
                        hours: currentStation?.service?.hours ? capitalize(currentStation?.service?.hours) : "",
                        vehicle: currentStation?.service?.vehicle?.length
                            ? currentStation.service.vehicle.map(v => ({
                                ambulance: v.ambulance || false,
                                firetruck: v.firetruck || false
                            }))
                            : null
                    },
                    responders: currentStation?.responders?.length || 0,
                }}
            >
                {({ values }) => (
                    <form>
                        <Box
                            display="grid"
                            gap="30px"
                            gridTemplateColumns="repeat(4, minmax(0, 1fr))"
                            sx={{
                                "& > div": { gridColumn: isNonMobile ? undefined : "span 4" },
                            }}
                        >
                            {/* Name */}
                            <TextField
                                fullWidth
                                type="text"
                                variant="filled"
                                label="Name"
                                name="name"
                                value={values.name}
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

                            {/* Type */}
                            <TextField
                                fullWidth
                                type="text"
                                variant="filled"
                                label="Type"
                                name="type"
                                value={capitalize(values.type)}
                                readOnly
                                sx={{
                                    gridColumn: "span 1",
                                    backgroundColor: "transparent",
                                    pointerEvents: "none",
                                    "& .MuiInputBase-input": {
                                        color: "inherit",
                                    },
                                }}
                            />

                            {/* Responders */}
                            <TextField
                                fullWidth
                                variant="filled"
                                label="Responders"
                                value={values?.responders || 0}
                                name="responders"
                                readOnly
                                sx={{ 
                                    gridColumn: "span 1",
                                    backgroundColor: "transparent",
                                    pointerEvents: "none",
                                    "& .MuiInputBase-input": {
                                        color: "inherit",
                                    },
                                }}
                            />

                            {/* Barangay */}
                            <TextField
                                fullWidth
                                variant="filled"
                                label="Barangay"
                                value={values.address.barangay}
                                name="address.barangay"
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

                            {/* Municipality (Pre-filled) */}
                            <TextField
                                fullWidth
                                variant="filled"
                                label="Municipality"
                                value={values.address.municipality}
                                name="address.municipality"
                                readOnly
                                sx={{
                                    gridColumn: "span 1",
                                    backgroundColor: "transparent",
                                    pointerEvents: "none",
                                    "& .MuiInputBase-input": {
                                        color: "inherit",
                                    },
                                }}
                            />

                            {/* Province (Pre-filled) */}
                            <TextField
                                fullWidth
                                variant="filled"
                                label="Province"
                                value={values.address.province}
                                name="address.province"
                                readOnly
                                sx={{
                                    gridColumn: "span 1",
                                    backgroundColor: "transparent",
                                    pointerEvents: "none",
                                    "& .MuiInputBase-input": {
                                        color: "inherit",
                                    },
                                }}
                            />

                            {/* Phone Numbers */}
                            <TextField
                                fullWidth
                                variant="filled"
                                type="text"
                                label={`Phone Number${values.contacts.phoneList.length > 1 ? 's' : ''}`}
                                value={values.contacts.phoneFormatted}
                                name="contacts.phoneFormatted"
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

                            {/* Website */}
                            <TextField
                                fullWidth
                                variant="filled"
                                label="Website"
                                value={values?.contacts?.website || "N/A"}
                                name="contacts.website"
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

                            {/* Services */}
                            <TextField
                                fullWidth
                                variant="filled"
                                label="Service Vehicles"
                                readOnly
                                value={
                                    values.service.vehicle === null || values.service.vehicle.length === 0
                                    ? "None"
                                    : [...new Set(values.service.vehicle.flatMap(v =>
                                        v.ambulance ? ["Ambulance"] : v.firetruck ? ["Firetruck"] : []
                                        ))].join(", ")
                                }
                                sx={{
                                    backgroundColor: "transparent",
                                    pointerEvents: "none",
                                    "& .MuiInputBase-input": {
                                        color: "inherit",
                                    },
                                    gridColumn: values.service.vehicle === null || values.service.vehicle.length === 0 
                                    ? "span 3" 
                                    : [...new Set(values.service.vehicle.flatMap(v =>
                                        v.ambulance ? ["Ambulance"] : v.firetruck ? ["Firetruck"] : []
                                        ))].length === 2 
                                        ? "span 1"
                                        : "span 2"
                                }}
                            />

                            {/* Services Count */}
                            {(() => {
                                const vehicleCounts = [
                                    { type: "Firetruck", key: "firetruck", count: values.service.vehicle?.filter(v => v.firetruck).length || 0 },
                                    { type: "Ambulance", key: "ambulance", count: values.service.vehicle?.filter(v => v.ambulance).length || 0 }
                                ].filter(v => v.count > 0);

                                return vehicleCounts.length > 0 ? (
                                    vehicleCounts.map((v) => (
                                        <TextField
                                            key={v.type}
                                            fullWidth
                                            variant="filled"
                                            label={v.type}
                                            value={v.count}
                                            readOnly
                                            sx={{ 
                                                gridColumn: "span 1",
                                                backgroundColor: "transparent",
                                                pointerEvents: "none",
                                                "& .MuiInputBase-input": {
                                                    color: "inherit",
                                                },
                                            }}
                                        />
                                    ))
                                ) : null; // Return nothing if no vehicles are selected
                            })()}

                            {/* Service Hours */}
                            <TextField
                                fullWidth
                                variant="filled"
                                label="Service Hours"
                                value={values?.service?.hours || "N/A"}
                                name="service.hours"
                                readOnly
                                sx={{
                                    gridColumn: "span 1",
                                    backgroundColor: "transparent",
                                    pointerEvents: "none",
                                    "& .MuiInputBase-input": {
                                        color: "inherit",
                                    },
                                }}
                            />
                        </Box>

                        {/* Action Buttons */}
                        <Box display="flex" justifyContent="end" mt="20px">
                            <Button onClick={onClose} color="error" variant="contained" sx={{ mr: 2 }}>
                                Close
                            </Button>
                            {/* Next and Previous Buttons */}
                            {stationsArray.length > 1 && (
                                <Box display="flex" justifyContent="space-between" gap={2}>
                                    <Button
                                        type="button"
                                        color="secondary"
                                        variant="contained"
                                        onClick={handlePrevious}
                                        disabled={currentIndex === 0}
                                    >
                                        Previous
                                    </Button>
                                    <Button
                                        type="button"
                                        color="secondary"
                                        variant="contained"
                                        onClick={handleNext}
                                        disabled={currentIndex === stationsArray.length - 1}
                                    >
                                        Next
                                    </Button>
                                </Box>
                            )}
                            <Button onClick={handleEdit} color="secondary" variant="contained" sx={{ ml: stationsArray.length > 1 ? 2 : 0 }}>
                                Edit
                            </Button>
                        </Box>
                    </form>
                )}
            </Formik>
        </Box>
    )
};

const capitalize = (string) => string.charAt(0).toUpperCase() + string.slice(1);

export default ExpandStation;