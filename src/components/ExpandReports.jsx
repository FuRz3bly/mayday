// React & Hooks
import { useEffect, useState } from "react";

// Formik
import { Formik } from "formik";

// Material UI (MUI) Components
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  InputAdornment,
  Snackbar,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import useMediaQuery from "@mui/material/useMediaQuery";

// MUI Icons
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ImageIcon from '@mui/icons-material/Image';

// Theme
import { tokens } from "../theme";

// Custom Components
import Header from "./Header";

const ExpandReports = ({ onClose, reports, editReport }) => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    const isNonMobile = useMediaQuery("(min-width:600px)");

    const [currentIndex, setCurrentIndex] = useState(0);
    const [currentReport, setCurrentReport] = useState(null);
    const [formValues, setFormValues] = useState(initialValues);
    const [snackbarOpen, setSnackbarOpen] = useState(false);

    const [openImage, setOpenImage] = useState(false);
    const [isImageLoading, setIsImageLoading] = useState(true);

    // Update current report and form values when reports or index changes
    useEffect(() => {
        // Ensure reports is treated as an array
        const reportsArray = Array.isArray(reports) ? reports : [reports];

        // Get current report based on index (with safety check)
        if (reportsArray.length > 0 && currentIndex < reportsArray.length) {
            const report = reportsArray[currentIndex];
            setCurrentReport(report);
            
            // Base form values all reports have
            const baseFormValues = {
                id: report.id || "",
                status: report?.status !== undefined 
                    ? getStatusLabel(report.status) 
                    : "Unknown",
                type: report?.type !== undefined 
                    ? getTypeLabel(report.type) 
                    : "Unknown",
                service: report?.service !== undefined 
                    ? getServiceLabel(report.service) 
                    : "Unknown",
                incidentDate: report?.date?.incident ? getDate(report.date.incident) : "",
                tempETA: report?.time?.estimated 
                    ? `${report.time.estimated} minutes`
                    : "",
                reportFlag: getFlag(report?.flags?.report),
                address: (report?.address?.barangay && report?.address?.location)
                    ? `${report.address.barangay}, ${report.address.municipality}, ${report.address.province}`
                    : "Unknown, Indang, Cavite",
                name: (report?.reporter?.name?.first_name && report?.reporter?.name?.last_name) 
                    ? `${report.reporter.name.first_name} ${report.reporter.name.last_name}`
                    : "User",
                phone: report?.reporter?.phone || "",
                reporterAddress: report?.reporter?.address?.barangay
                    ? `${report.reporter.address.barangay}, ${report.reporter.address.municipality}, ${report.reporter.address.province}`
                    : "Unknown, Indang, Cavite",
                birthdate: getBirthdate(report?.reporter?.birthdate),
                age: getAge(report?.reporter?.birthdate),
                // Station I
                stationIid: "",
                stationIName: "",
                stationIType: "",
                stationIService: "",
                // Station I Personnel
                stationIPersonnelId: "",
                stationIPersonnelName: "",
                stationIPersonnelPhone: "",
                // Station I Stats
                stationIETA: "",
                stationIArrivalTime: "",
                stationIArrivalDate: "",
                stationIResponseDate: "",
                stationIResolvedTime: "",
                stationIResolvedDate: "",
                // Station II
                stationIIid: "",
                stationIIName: "",
                stationIIType: "",
                stationIIService: "",
                // Station II Personnel
                stationIIPersonnelId: "",
                stationIIPersonnelName: "",
                stationIIPersonnelPhone: "",
                // Station II Stats
                stationIIETA: "",
                stationIIArrivalTime: "",
                stationIIArrivalDate: "",
                stationIIResponseDate: "",
                stationIIResolvedTime: "",
                stationIIResolvedDate: "",
                // Station III
                stationIIIid: "",
                stationIIIName: "",
                stationIIIType: "",
                stationIIIService: "",
                // Station III Personnel
                stationIIIPersonnelId: "",
                stationIIIPersonnelName: "",
                stationIIIPersonnelPhone: "",
                // Station III Stats
                stationIIIETA: "",
                stationIIIArrivalTime: "",
                stationIIIArrivalDate: "",
                stationIIIResponseDate: "",
                stationIIIResolvedTime: "",
                stationIIIResolvedDate: "",
            };

            // Add status 1 specific fields only if the report status is 1
            if (report?.status === 1) {
                const formValuesWithReceivedDate = {
                    ...baseFormValues,
                    receivedDate: report?.date?.received ? getDate(report.date.received) : ""
                };
                
                // Process up to 3 providers
                const providers = report?.responders?.providers || [];
                
                // Station I (first provider)
                if (providers.length >= 1) {
                    formValuesWithReceivedDate.stationIid = providers[0]?.station?.id || "";
                    formValuesWithReceivedDate.stationIName = providers[0]?.station?.name || "";
                    formValuesWithReceivedDate.stationIType = providers[0]?.station?.type
                        ? capitalize(providers[0].station.type)
                        : "";
                    formValuesWithReceivedDate.stationIService = providers[0]?.service !== undefined 
                        ? getServiceLabel(providers[0].service) 
                        : "";
                    
                    // Check if station ID matches the specific ID
                    if (providers[0]?.station?.id === "Cd9EsUAQMNp3aam3K1Ze" && providers[0]?.personnel) {
                        formValuesWithReceivedDate.stationIPersonnelId = providers[0].personnel.user_id || "";
                        formValuesWithReceivedDate.stationIPersonnelName = providers[0].personnel.name 
                            ? `${providers[0].personnel.name.first_name} ${providers[0].personnel.name.last_name}`
                            : "";
                        formValuesWithReceivedDate.stationIPersonnelPhone = providers[0].personnel.phone || "";
                    }
                }
                
                // Station II (second provider)
                if (providers.length >= 2) {
                    formValuesWithReceivedDate.stationIIid = providers[1]?.station?.id || "";
                    formValuesWithReceivedDate.stationIIName = providers[1]?.station?.name || "";
                    formValuesWithReceivedDate.stationIIType = providers[1]?.station?.type
                        ? capitalize(providers[1].station.type)
                        : "";
                    formValuesWithReceivedDate.stationIIService = providers[1]?.service !== undefined 
                        ? getServiceLabel(providers[1].service) 
                        : "";
                    
                    // Check if station ID matches the specific ID
                    if (providers[1]?.station?.id === "Cd9EsUAQMNp3aam3K1Ze" && providers[1]?.personnel) {
                        formValuesWithReceivedDate.stationIIPersonnelId = providers[1].personnel.user_id || "";
                        formValuesWithReceivedDate.stationIIPersonnelName = providers[1].personnel.name 
                            ? `${providers[1].personnel.name.first_name} ${providers[1].personnel.name.last_name}`
                            : "";
                        formValuesWithReceivedDate.stationIIPersonnelPhone = providers[1].personnel.phone || "";
                    }
                }
                
                // Station III (third provider)
                if (providers.length >= 3) {
                    formValuesWithReceivedDate.stationIIIid = providers[2]?.station?.id || "";
                    formValuesWithReceivedDate.stationIIIName = providers[2]?.station?.name || "";
                    formValuesWithReceivedDate.stationIIIType = providers[2]?.station?.type
                        ? capitalize(providers[2].station.type)
                        : "";
                    formValuesWithReceivedDate.stationIIIService = providers[2]?.service !== undefined 
                        ? getServiceLabel(providers[2].service)
                        : "";
                    
                    // Check if station ID matches the specific ID
                    if (providers[2]?.station?.id === "Cd9EsUAQMNp3aam3K1Ze" && providers[2]?.personnel) {
                        formValuesWithReceivedDate.stationIIIPersonnelId = providers[2].personnel.user_id || "";
                        formValuesWithReceivedDate.stationIIIPersonnelName = providers[2].personnel.name 
                            ? `${providers[2].personnel.name.first_name} ${providers[2].personnel.name.last_name}`
                            : "";
                        formValuesWithReceivedDate.stationIIIPersonnelPhone = providers[2].personnel.phone || "";
                    }
                }
                
                setFormValues(formValuesWithReceivedDate);
            } else if (report?.status === 2) {
                const formValuesWithResponding = {
                    ...baseFormValues,
                    receivedDate: report?.date?.received ? getDate(report.date.received) : "",
                    receivedTime: report?.time?.receive || ""
                };
                
                // Process up to 3 providers regardless of station ID
                const providers = report?.responders?.providers || [];
                
                // Station I (first provider)
                if (providers.length >= 1) {
                    const stationId = providers[0]?.station?.id || "";
                    
                    formValuesWithResponding.stationIid = stationId;
                    formValuesWithResponding.stationIName = providers[0]?.station?.name || "";
                    formValuesWithResponding.stationIType = providers[0]?.station?.type
                        ? capitalize(providers[0].station.type)
                        : "";
                    formValuesWithResponding.stationIService = providers[0]?.service !== undefined 
                        ? getServiceLabel(providers[0].service) 
                        : "";
                    
                    // Personnel information
                    if (providers[0]?.personnel) {
                        formValuesWithResponding.stationIPersonnelId = providers[0].personnel.user_id || "";
                        formValuesWithResponding.stationIPersonnelName = providers[0].personnel.name 
                            ? `${providers[0].personnel.name.first_name} ${providers[0].personnel.name.last_name}`
                            : "";
                        formValuesWithResponding.stationIPersonnelPhone = providers[0].personnel.phone || "";
                    }
                    
                    // Station I specific response data
                    formValuesWithResponding.stationIETA = report?.time?.[stationId]?.estimated
                        ? getMinTime(report?.time?.[stationId]?.estimated)
                        : "";
                    formValuesWithResponding.stationIArrivalTime = report?.time?.[stationId]?.arrived
                        ? getMinTime(report?.time?.[stationId]?.arrived)
                        : "";
                    formValuesWithResponding.stationIArrivalDate = report?.date?.[stationId]?.arrived ? getDate(report.date[stationId].arrived) : "";
                    formValuesWithResponding.stationIResponseDate = report?.date?.[stationId]?.response ? getDate(report.date[stationId].response) : "";
                }
                
                // Station II (second provider)
                if (providers.length >= 2) {
                    const stationId = providers[1]?.station?.id || "";
                    
                    formValuesWithResponding.stationIIid = stationId;
                    formValuesWithResponding.stationIIName = providers[1]?.station?.name || "";
                    formValuesWithResponding.stationIIType = providers[1]?.station?.type
                        ? capitalize(providers[1].station.type)
                        : "";
                    formValuesWithResponding.stationIIService = providers[1]?.service !== undefined 
                        ? getServiceLabel(providers[1].service) 
                        : "";
                    
                    // Personnel information
                    if (providers[1]?.personnel) {
                        formValuesWithResponding.stationIIPersonnelId = providers[1].personnel.user_id || "";
                        formValuesWithResponding.stationIIPersonnelName = providers[1].personnel.name 
                            ? `${providers[1].personnel.name.first_name} ${providers[1].personnel.name.last_name}`
                            : "";
                        formValuesWithResponding.stationIIPersonnelPhone = providers[1].personnel.phone || "";
                    }
                    
                    // Station II specific response data
                    formValuesWithResponding.stationIIETA = report?.time?.[stationId]?.estimated
                        ? getMinTime(report?.time?.[stationId]?.estimated)
                        : "";
                    formValuesWithResponding.stationIIArrivalTime = report?.time?.[stationId]?.arrived
                        ? getMinTime(report?.time?.[stationId]?.arrived)
                        : "";
                    formValuesWithResponding.stationIIArrivalDate = report?.date?.[stationId]?.arrived ? getDate(report.date[stationId].arrived) : "";
                    formValuesWithResponding.stationIIResponseDate = report?.date?.[stationId]?.response ? getDate(report.date[stationId].response) : "";
                }
                
                // Station III (third provider)
                if (providers.length >= 3) {
                    const stationId = providers[2]?.station?.id || "";
                    
                    formValuesWithResponding.stationIIIid = stationId;
                    formValuesWithResponding.stationIIIName = providers[2]?.station?.name || "";
                    formValuesWithResponding.stationIIIType = providers[2]?.station?.type
                        ? capitalize(providers[2].station.type)
                        : "";
                    formValuesWithResponding.stationIIIService = providers[2]?.service !== undefined 
                        ? getServiceLabel(providers[2].service)
                        : "";
                    
                    // Personnel information
                    if (providers[2]?.personnel) {
                        formValuesWithResponding.stationIIIPersonnelId = providers[2].personnel.user_id || "";
                        formValuesWithResponding.stationIIIPersonnelName = providers[2].personnel.name 
                            ? `${providers[2].personnel.name.first_name} ${providers[2].personnel.name.last_name}`
                            : "";
                        formValuesWithResponding.stationIIIPersonnelPhone = providers[2].personnel.phone || "";
                    }
                    
                    // Station III specific response data
                    formValuesWithResponding.stationIIIETA = report?.time?.[stationId]?.estimated
                        ? getMinTime(report?.time?.[stationId]?.estimated)
                        : "";
                    formValuesWithResponding.stationIIIArrivalTime = report?.time?.[stationId]?.arrived
                        ? getMinTime(report?.time?.[stationId]?.arrived)
                        : "";
                    formValuesWithResponding.stationIIIArrivalDate = report?.date?.[stationId]?.arrived ? getDate(report.date[stationId].arrived) : "";
                    formValuesWithResponding.stationIIIResponseDate = report?.date?.[stationId]?.response ? getDate(report.date[stationId].response) : "";
                }
                
                setFormValues(formValuesWithResponding);
            } else if (report?.status === 3) {
                const formValuesWithResolved = {
                    ...baseFormValues,
                    receivedDate: report?.date?.received ? getDate(report.date.received) : "",
                    receivedTime: report?.time?.receive || ""
                };
                
                // Process up to 3 providers
                const providers = report?.responders?.providers || [];
                
                // Station I (first provider)
                if (providers.length >= 1) {
                    const stationId = providers[0]?.station?.id || "";
                    
                    formValuesWithResolved.stationIid = stationId;
                    formValuesWithResolved.stationIName = providers[0]?.station?.name || "";
                    formValuesWithResolved.stationIType = providers[0]?.station?.type
                        ? capitalize(providers[0].station.type)
                        : "";
                    formValuesWithResolved.stationIService = providers[0]?.service !== undefined 
                        ? getServiceLabel(providers[0].service) 
                        : "";
                    
                    // Personnel information
                    if (providers[0]?.personnel) {
                        formValuesWithResolved.stationIPersonnelId = providers[0].personnel.user_id || "";
                        formValuesWithResolved.stationIPersonnelName = providers[0].personnel.name 
                            ? `${providers[0].personnel.name.first_name} ${providers[0].personnel.name.last_name}`
                            : "";
                        formValuesWithResolved.stationIPersonnelPhone = providers[0].personnel.phone || "";
                    }
                    
                    // Station I specific response and resolution data
                    formValuesWithResolved.stationIETA = report?.time?.[stationId]?.estimated
                        ? getMinTime(report?.time?.[stationId]?.estimated)
                        : "";
                    formValuesWithResolved.stationIArrivalTime = report?.time?.[stationId]?.arrived
                        ? getMinTime(report?.time?.[stationId]?.arrived)
                        : "";
                    formValuesWithResolved.stationIArrivalDate = report?.date?.[stationId]?.arrived ? getDate(report.date[stationId].arrived) : "";
                    formValuesWithResolved.stationIResponseDate = report?.date?.[stationId]?.response ? getDate(report.date[stationId].response) : "";
                    formValuesWithResolved.stationIResolvedTime = report?.time?.[stationId]?.resolved
                        ? getMinTime(report?.time?.[stationId]?.resolved)
                        : "";
                    formValuesWithResolved.stationIResolvedDate = report?.date?.[stationId]?.resolved ? getDate(report.date[stationId].resolved) : "";
                }
                
                // Station II (second provider)
                if (providers.length >= 2) {
                    const stationId = providers[1]?.station?.id || "";
                    
                    formValuesWithResolved.stationIIid = stationId;
                    formValuesWithResolved.stationIIName = providers[1]?.station?.name || "";
                    formValuesWithResolved.stationIIType = providers[1]?.station?.type
                        ? capitalize(providers[1].station.type)
                        : "";
                    formValuesWithResolved.stationIIService = providers[1]?.service !== undefined 
                        ? getServiceLabel(providers[1].service) 
                        : "";
                    
                    // Personnel information
                    if (providers[1]?.personnel) {
                        formValuesWithResolved.stationIIPersonnelId = providers[1].personnel.user_id || "";
                        formValuesWithResolved.stationIIPersonnelName = providers[1].personnel.name 
                            ? `${providers[1].personnel.name.first_name} ${providers[1].personnel.name.last_name}`
                            : "";
                        formValuesWithResolved.stationIIPersonnelPhone = providers[1].personnel.phone || "";
                    }
                    
                    // Station II specific response and resolution data
                    formValuesWithResolved.stationIIETA = report?.time?.[stationId]?.estimated
                        ? getMinTime(report?.time?.[stationId]?.estimated)
                        : "";
                    formValuesWithResolved.stationIIArrivalTime = report?.time?.[stationId]?.arrived
                        ? getMinTime(report?.time?.[stationId]?.arrived)
                        : "";
                    formValuesWithResolved.stationIIArrivalDate = report?.date?.[stationId]?.arrived ? getDate(report.date[stationId].arrived) : "";
                    formValuesWithResolved.stationIIResponseDate = report?.date?.[stationId]?.response ? getDate(report.date[stationId].response) : "";
                    formValuesWithResolved.stationIIResolvedTime = report?.time?.[stationId]?.resolved
                        ? getMinTime(report?.time?.[stationId]?.resolved)
                        : "";
                    formValuesWithResolved.stationIIResolvedDate = report?.date?.[stationId]?.resolved ? getDate(report.date[stationId].resolved) : "";
                }
                
                // Station III (third provider)
                if (providers.length >= 3) {
                    const stationId = providers[2]?.station?.id || "";
                    
                    formValuesWithResolved.stationIIIid = stationId;
                    formValuesWithResolved.stationIIIName = providers[2]?.station?.name || "";
                    formValuesWithResolved.stationIIIType = providers[2]?.station?.type
                        ? capitalize(providers[2].station.type)
                        : "";
                    formValuesWithResolved.stationIIIService = providers[2]?.service !== undefined 
                        ? getServiceLabel(providers[2].service)
                        : "";
                    
                    // Personnel information
                    if (providers[2]?.personnel) {
                        formValuesWithResolved.stationIIIPersonnelId = providers[2].personnel.user_id || "";
                        formValuesWithResolved.stationIIIPersonnelName = providers[2].personnel.name 
                            ? `${providers[2].personnel.name.first_name} ${providers[2].personnel.name.last_name}`
                            : "";
                        formValuesWithResolved.stationIIIPersonnelPhone = providers[2].personnel.phone || "";
                    }
                    
                    // Station III specific response and resolution data
                    formValuesWithResolved.stationIIIETA = report?.time?.[stationId]?.estimated
                        ? getMinTime(report?.time?.[stationId]?.estimated)
                        : "";
                    formValuesWithResolved.stationIIIArrivalTime = report?.time?.[stationId]?.arrived
                        ? getMinTime(report?.time?.[stationId]?.arrived)
                        : "";
                    formValuesWithResolved.stationIIIArrivalDate = report?.date?.[stationId]?.arrived ? getDate(report.date[stationId].arrived) : "";
                    formValuesWithResolved.stationIIIResponseDate = report?.date?.[stationId]?.response ? getDate(report.date[stationId].response) : "";
                    formValuesWithResolved.stationIIIResolvedTime = report?.time?.[stationId]?.resolved
                        ? getMinTime(report?.time?.[stationId]?.resolved)
                        : "";
                    formValuesWithResolved.stationIIIResolvedDate = report?.date?.[stationId]?.resolved ? getDate(report.date[stationId].resolved) : "";
                }
                
                setFormValues(formValuesWithResolved);
            } else {
                // For other statuses, just use the base form values
                setFormValues(baseFormValues);
            }
        }
    }, [reports, currentIndex]);

    // Next Report
    const handleNext = () => {
        if (currentIndex < reports.length - 1) {
            setCurrentIndex(currentIndex + 1);
        }
    };

    // Previous Report
    const handlePrevious = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
        }
    };

    // Handle Edit
    const handleEdit = () => {
        editReport(currentReport);
        onClose();
    };

    // Station fields component to avoid duplication
    const StationFields = ({ stationNumber, values, currentReport }) => {
        const stationPrefix = `station${stationNumber}`;
        const hasPersonnel = values[`${stationPrefix}PersonnelName`] !== "";

        // Check if this station exists (has an ID)
        const stationExists = values[`${stationPrefix}id`] !== undefined && values[`${stationPrefix}id`] !== "";

        // Check if Responding
        const isResponding = currentReport?.status === 2;

        // Check if Resolved
        const isResolved = currentReport?.status === 3;

        return (
            <>
                <Typography color={colors.grey[100]} fontSize="14px" sx={{ gridColumn: "span 4" }}>
                    {values[`${stationPrefix}Service`] === 'None' ? 'Crime Handler' : `${values[`${stationPrefix}Service`]} Provider`}
                </Typography>

                {/* Name */}
                <TextField
                    fullWidth
                    type="text"
                    variant="filled"
                    label="Name"
                    name={`${stationPrefix}Name`}
                    value={values[`${stationPrefix}Name`]}
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
                    name={`${stationPrefix}Type`}
                    value={values[`${stationPrefix}Type`]}
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

                {/* Service */}
                <TextField
                    fullWidth
                    type="text"
                    variant="filled"
                    label="Service"
                    name={`${stationPrefix}Service`}
                    value={values[`${stationPrefix}Service`]}
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

                {/* Personnel information */}
                {hasPersonnel && (
                    <>
                        {/* Name */}
                        <TextField
                            fullWidth
                            type="text"
                            variant="filled"
                            label="Personnel Name"
                            name={`${stationPrefix}PersonnelName`}
                            value={values[`${stationPrefix}PersonnelName`]}
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
                        
                        {/* Phone */}
                        <TextField
                            fullWidth
                            type="text"
                            variant="filled"
                            label="Phone"
                            name={`${stationPrefix}PersonnelPhone`}
                            value={values[`${stationPrefix}PersonnelPhone`]}
                            readOnly
                            onClick={() => {
                                navigator.clipboard.writeText(values[`${stationPrefix}PersonnelPhone`]);
                                setSnackbarOpen(true);
                            }}
                            sx={{
                                gridColumn: "span 2",
                                backgroundColor: "transparent",
                                cursor: 'grabbing',
                                "& .MuiInputBase-input": {
                                    color: "inherit",
                                },
                                "&:hover": {
                                    backgroundColor: colors.primary[400], // Optional: add hover effect
                                    opacity: 0.9,
                                },
                            }}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <ContentCopyIcon fontSize="small" />
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </>
                )}

                {(isResponding || isResolved) && stationExists && (
                    <>
                        {/* ETA */}
                        <TextField
                            fullWidth
                            type="text"
                            variant="filled"
                            label="Estimated Time of Arrival"
                            name={`${stationPrefix}ETA`}
                            value={values[`${stationPrefix}ETA`] || "Not provided"}
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
                        
                        {/* Response Date - Display if available (typically available when status is 2) */}
                        <TextField
                            fullWidth
                            type="text"
                            variant="filled"
                            label="Response Date"
                            name={`${stationPrefix}ResponseDate`}
                            value={values[`${stationPrefix}ResponseDate`] || "Not provided"}
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
                        
                        {/* Arrival information */}
                        {(values[`${stationPrefix}ArrivalTime`] || values[`${stationPrefix}ArrivalDate`]) && (
                            <>
                                {/* Arrival Time */}
                                <TextField
                                    fullWidth
                                    type="text"
                                    variant="filled"
                                    label="Arrival Time"
                                    name={`${stationPrefix}ArrivalTime`}
                                    value={values[`${stationPrefix}ArrivalTime`] || "Not recorded"}
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
                                
                                {/* Arrival Date */}
                                <TextField
                                    fullWidth
                                    type="text"
                                    variant="filled"
                                    label="Arrival Date"
                                    name={`${stationPrefix}ArrivalDate`}
                                    value={values[`${stationPrefix}ArrivalDate`] || "Not recorded"}
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
                            </>
                        )}
                    </>
                )}

                {isResolved && stationExists && (
                    <>
                        {/* Resolved Time */}
                        <TextField
                            fullWidth
                            type="text"
                            variant="filled"
                            label="Resolved Time"
                            name={`${stationPrefix}ResolvedTime`}
                            value={values[`${stationPrefix}ResolvedTime`] || "Not recorded"}
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
                        
                        {/* Resolved Date */}
                        <TextField
                            fullWidth
                            type="text"
                            variant="filled"
                            label="Resolved Date"
                            name={`${stationPrefix}ResolvedDate`}
                            value={values[`${stationPrefix}ResolvedDate`] || "Not recorded"}
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
                    </>
                )}
            </>
        );
    };

    const handleOpenEvidence = () => {
        setOpenImage(true);
    };
    
    const handleCloseEvidence = () => {
        setOpenImage(false);
    };

    return (
        <Box m="20px">
            <Snackbar
                open={snackbarOpen}
                autoHideDuration={2000}
                onClose={() => setSnackbarOpen(false)}
                message="Phone number copied to clipboard"
            />

            {/* Evidence Popup */}
            <Dialog
                open={openImage}
                onClose={handleCloseEvidence}
                PaperProps={{
                    sx: {
                        backgroundColor: colors.primary[500],
                        boxShadow: 'none',
                        padding: 2,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                    },
                    elevation: 0,
                }}
            >
                <DialogContent
                    sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: 'transparent',
                        minHeight: '200px', // to avoid layout shift
                    }}
                >
                    {isImageLoading && (
                        <CircularProgress size={40} sx={{ color: 'white', position: 'absolute' }} />
                    )}
                    {currentReport?.evidence && (
                        <Box
                            component="img"
                            src={currentReport.evidence}
                            alt="Evidence"
                            onLoad={() => setIsImageLoading(false)}
                            onError={() => setIsImageLoading(false)} // fallback if it fails
                            sx={{
                                maxWidth: '100%',
                                maxHeight: '80vh',
                                borderRadius: 2,
                                boxShadow: 3,
                                display: isImageLoading ? 'none' : 'block',
                            }}
                        />
                    )}
                </DialogContent>
            </Dialog>

            <Header 
                title="EXPANDED REPORTS(S)" 
                subtitle={`Details on the Report(s) (${currentIndex + 1}/${reports.length})`} 
            />

            <Box mt="20px" />
            <Formik
                enableReinitialize={true}
                initialValues={formValues}
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
                            <Typography 
                                color={colors.grey[100]} 
                                fontSize="14px" 
                                sx={{ 
                                    gridColumn: currentReport && currentReport.type === 8 
                                        ? "span 2" 
                                        : "span 4" 
                                }}
                            >
                                {'Report Details'}
                            </Typography>

                            {/* Evidence */}
                            {currentReport?.type === 8 && currentReport?.evidence && (
                                <Box
                                    sx={{
                                        gridColumn: "span 2",
                                        display: "flex",
                                        justifyContent: "flex-end", // horizontal alignment
                                    }}
                                >
                                    <Tooltip
                                        title="View Evidence"
                                        placement="bottom"
                                        sx={{ bgcolor: "gray.700", color: "white" }}
                                    >
                                        <Button
                                            onClick={handleOpenEvidence}
                                            type="button"
                                            color="secondary"
                                            variant="contained"
                                            sx={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 1,
                                                padding: "6px 12px",
                                                cursor: "pointer",
                                            }}
                                        >
                                            <ImageIcon fontSize="small" />
                                            View Evidence
                                        </Button>
                                    </Tooltip>
                                </Box>
                            )}

                            {/* Report ID */}
                            <TextField
                                fullWidth
                                type="text"
                                variant="filled"
                                label="Report ID"
                                name="id"
                                value={values.id}
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
                                value={values.type}
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

                            {/* Status */}
                            <TextField
                                fullWidth
                                type="text"
                                variant="filled"
                                label="Status"
                                name="status"
                                value={values.status}
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

                            {/* Report Location */}
                            <TextField
                                fullWidth
                                type="text"
                                variant="filled"
                                label="Report Location"
                                name="address"
                                value={values.address}
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

                            {/* Service */}
                            <TextField
                                fullWidth
                                type="text"
                                variant="filled"
                                label="Services"
                                name="service"
                                value={values.service}
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

                            {/* Incident Date */}
                            <TextField
                                fullWidth
                                type="text"
                                variant="filled"
                                label="Incident Date"
                                name="incidentDate"
                                value={values.incidentDate}
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

                            {/* Common TextField styling */}
                            {currentReport && (() => {
                                const status = currentReport.status;
                                const commonSx = {
                                    backgroundColor: "transparent",
                                    pointerEvents: "none",
                                    "& .MuiInputBase-input": {
                                        color: "inherit",
                                    }
                                };
                                
                                // Define components based on order needed
                                const components = [];
                                
                                // Flag
                                components.push(
                                    <TextField
                                        key="flag"
                                        fullWidth
                                        type="text"
                                        variant="filled"
                                        label="Flag"
                                        name="reportFlag"
                                        value={values.reportFlag}
                                        readOnly
                                        sx={{
                                            ...commonSx,
                                            gridColumn: status === 1 || status > 3 ? "span 2" : "span 1"
                                        }}
                                    />
                                );
                                
                                // ETA - Add only for status 0 and 1
                                if (status === 0 || status === 1) {
                                    components.push(
                                        <TextField
                                            key="eta"
                                            fullWidth
                                            type="text"
                                            variant="filled"
                                            label="Estimated Time of Arrival"
                                            name="tempETA"
                                            value={values.tempETA}
                                            readOnly
                                            sx={{
                                                ...commonSx,
                                                gridColumn: status === 1 ? "span 2" : "span 1"
                                            }}
                                        />
                                    );
                                }
                                
                                // Received Time - Add for status 1, 2, 3
                                if (status === 1 || status === 2 || status === 3) {
                                    components.push(
                                        <TextField
                                            key="receivedTime"
                                            fullWidth
                                            type="text"
                                            variant="filled"
                                            label="Received Time"
                                            name="receivedDate"
                                            value={values.receivedDate}
                                            readOnly
                                            sx={{
                                                ...commonSx,
                                                gridColumn: status === 1 ? "span 2" : "span 1"
                                            }}
                                        />
                                    );
                                }
                                
                                // Reorder components based on status
                                if (status === 0) {
                                    // For status 0: ETA then Flag
                                    [components[0], components[1]] = [components[1], components[0]];
                                }
                                
                                return <>{components}</>;
                            })()}

                            <Typography color={colors.grey[100]} fontSize="14px" sx={{ gridColumn: "span 4" }}>
                                {'Reporter Details'}
                            </Typography>

                            {/* Full Name */}
                            <TextField
                                fullWidth
                                type="text"
                                variant="filled"
                                label="Full Name"
                                name="name"
                                value={values.name}
                                readOnly
                                sx={{
                                    gridColumn: "span 3",
                                    backgroundColor: "transparent",
                                    pointerEvents: "none",
                                    "& .MuiInputBase-input": {
                                        color: "inherit",
                                    },
                                }}
                            />

                            {/* Phone */}
                            <TextField
                                fullWidth
                                type="text"
                                variant="filled"
                                label="Phone Number"
                                name="phone"
                                value={values.phone}
                                readOnly
                                onClick={() => {
                                    navigator.clipboard.writeText(values.phone);
                                    setSnackbarOpen(true);
                                }}
                                sx={{
                                    gridColumn: "span 1",
                                    backgroundColor: "transparent",
                                    cursor: 'grabbing',
                                    "& .MuiInputBase-input": {
                                        color: "inherit",
                                    },
                                    "&:hover": {
                                        backgroundColor: colors.primary[400],
                                        opacity: 0.9,
                                    },
                                }}
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <ContentCopyIcon fontSize="small" />
                                        </InputAdornment>
                                    ),
                                }}
                            />

                            {/* Address */}
                            <TextField
                                fullWidth
                                type="text"
                                variant="filled"
                                label="Address"
                                name="address"
                                value={values.reporterAddress}
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

                            {/* Age */}
                            <TextField
                                fullWidth
                                type="text"
                                variant="filled"
                                label="Age"
                                name="age"
                                value={values.age}
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

                            {/* Birthdate */}
                            <TextField
                                fullWidth
                                type="text"
                                variant="filled"
                                label="Birthdate"
                                name="birthdate"
                                value={values.birthdate}
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

                            {/* Stations */}
                            {['I', 'II', 'III'].map((stationNum) => {
                                const index = stationNum === 'I' ? 0 : stationNum === 'II' ? 1 : 2;
                                return (
                                    currentReport && 
                                    currentReport.responders && 
                                    currentReport.responders.providers && 
                                    currentReport.responders.providers.length > index && 
                                    values[`station${stationNum}id`] && (
                                        <StationFields 
                                            key={`station-${stationNum}`}
                                            stationNumber={stationNum} 
                                            values={values} 
                                            currentReport={currentReport}
                                        />
                                    )
                                );
                            })}
                        </Box>

                        {/* Action Buttons */}
                        <Box display="flex" justifyContent="end" mt="20px">
                            <Button onClick={onClose} color="error" variant="contained" sx={{ mr: 2 }}>
                                Close
                            </Button>
                            {/* Next and Previous Buttons */}
                            {reports.length > 1 && (
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
                                        disabled={currentIndex === reports.length - 1}
                                    >
                                        Next
                                    </Button>
                                </Box>
                            )}
                            <Button onClick={handleEdit} color="secondary" variant="contained" sx={{ ml: reports.length > 1 ? 2 : 0 }}>
                                Edit
                            </Button>
                        </Box>
                    </form>
                )}
            </Formik>
        </Box>
    )
};

const TYPE_CRIME = 0b001;        // 1
const TYPE_FIRE = 0b010;         // 2
const TYPE_MEDICAL = 0b100;      // 4
const TYPE_SUSPICIOUS = 0b1000;  // 8

const capitalize = (string) => string.charAt(0).toUpperCase() + string.slice(1);

// Default Values
const initialValues = {
    // Reports
    id: "",
    status: "Unknown",
    type: "Unknown",
    service: "Unknown",
    incidentDate: "",
    receivedDate: "",
    receivedTime: "",
    tempETA: "",
    reportFlag: "",
    address: "Unknown, Indang, Cavite",
    // Reporter
    name: "User",
    phone: "",
    reporterAddress: "Unknown, Indang, Cavite",
    birthdate: "",
    age: "",
    // Station I
    stationIid: "",
    stationIName: "",
    stationIType: "",
    stationIService: "",
    stationIPersonnelId: "",
    stationIPersonnelName: "",
    stationIPersonnelPhone: "",
    // Station I Stats
    stationIETA: "",
    stationIArrivalTime: "",
    stationIArrivalDate: "",
    stationIResponseDate: "",
    stationIResolvedTime: "",
    stationIResolvedDate: "",
    // Station II
    stationIIid: "",
    stationIIName: "",
    stationIIType: "",
    stationIIService: "",
    stationIIPersonnelId: "",
    stationIIPersonnelName: "",
    stationIIPersonnelPhone: "",
    // Station II Stats
    stationIIETA: "",
    stationIIArrivalTime: "",
    stationIIArrivalDate: "",
    stationIIResponseDate: "",
    stationIIResolvedTime: "",
    stationIIResolvedDate: "",
    // Station III
    stationIIIid: "",
    stationIIIName: "",
    stationIIIType: "",
    stationIIIService: "",
    stationIIIPersonnelId: "",
    stationIIIPersonnelName: "",
    stationIIIPersonnelPhone: "",
    // Station III Stats
    stationIIIETA: "",
    stationIIIArrivalTime: "",
    stationIIIArrivalDate: "",
    stationIIIResponseDate: "",
    stationIIIResolvedTime: "",
    stationIIIResolvedDate: ""
};

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

// Helper function to get the status
const getStatusLabel = (statusValue) => {
    const status = statusOptions.find(option => option.value === statusValue);
    return status ? status.label : "Unknown Status";
};

// Helper function to get the service
const getServiceLabel = (serviceValue) => {
    const service = serviceOptions.find(option => option.value === serviceValue);
    return service ? service.label : "Unknown Service";
};

// Helper function to format Date
const getDate = (timestamp) => {
    if (!timestamp) return "";
    
    const date = timestamp.toDate();
    const monthDay = date.toLocaleString('en-US', {
        month: 'long',
        day: '2-digit'
    });
    
    const year = date.toLocaleString('en-US', {
        year: 'numeric'
    });
    
    const time = date.toLocaleString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
    
    return `${monthDay}, ${year} at ${time}`;
};

const getTypeLabel = (bitmask) => {
  let types = [];

  if (bitmask & TYPE_CRIME) types.push("Crime");
  if (bitmask & TYPE_FIRE) types.push("Fire");
  if (bitmask & TYPE_MEDICAL) types.push("Medical");
  if (bitmask & TYPE_SUSPICIOUS) types.push("Suspicious Activity");

  if (types.length === 0) return "Unknown";
  if (types.length === 1) return types[0];
  if (types.length === 2) return types.join(" & ");

  return types.slice(0, -1).join(", ") + " & " + types[types.length - 1];
};

// Get formatted birthdate
const getBirthdate = (birthdate) => {
    if (!birthdate) return "Unknown";
    
    try {
        const date = new Date(birthdate);
        return date.toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        });
    } catch (error) {
        return "Invalid Date";
    }
};

// Calculate age
const getAge = (birthdate) => {
    if (!birthdate) return "Unknown";
    
    try {
        const birthDate = new Date(birthdate);
        const today = new Date();
        
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        // Adjust age if birthday hasn't occurred yet this year
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
      
        return `${age} years old`;
    } catch (error) {
        return "Unknown age";
    }
};

// Check report flags
const getFlag = (flag) => {
    if (flag === null || flag === undefined) {
      return "Pending";
    } else if (flag === true) {
      return "True";
    } else {
      return "False";
    }
};

// Get Minutes or Seconds
const getMinTime = (value) => {
    if (!value || value === "") return "";
    
    const numValue = parseFloat(value);
    
    if (numValue >= 1) {
        // Display as minutes if >= 1
        return `${numValue.toFixed(1)} minutes`;
    } else {
        // Convert to seconds if < 1
        const seconds = Math.round(numValue * 60);
        return `${seconds} seconds`;
    }
};

export default ExpandReports;