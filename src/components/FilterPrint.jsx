import { useState, useEffect } from "react";

// Formik
import { Formik } from "formik";

// Yup
import * as yup from "yup";

// Material UI (MUI) Components
import {
  Autocomplete,
  Box,
  Button,
  TextField,
  Snackbar,
  Alert
} from "@mui/material";
import useMediaQuery from "@mui/material/useMediaQuery";

// Custom Components
import Header from "./Header";

// Helper function for ISO week number calculation
const getISOWeekNumber = (date) => {
    const tempDate = new Date(date.getTime());
    
    // Set to Thursday in current week (ISO week starts on Monday)
    tempDate.setDate(tempDate.getDate() - (tempDate.getDay() + 6) % 7 + 3);
    
    // Get first Thursday of the year
    const firstThursday = new Date(tempDate.getFullYear(), 0, 4);
    firstThursday.setDate(firstThursday.getDate() - (firstThursday.getDay() + 6) % 7 + 3);
    
    // Calculate difference in days and divide by 7
    const diff = (tempDate - firstThursday) / 86400000;
    return Math.floor(diff / 7) + 1;
};

// Helper function to convert timestamp to Date object
const convertDate = (timestamp) => {
    // Case 1: timestamp is a Firestore Timestamp object (has seconds and nanoseconds)
    if (timestamp && typeof timestamp === 'object' && 'seconds' in timestamp) {
        return new Date(timestamp.seconds * 1000 + (timestamp.nanoseconds || 0) / 1000000);
    }
    
    // Case 2: timestamp is a number (milliseconds since epoch)
    if (timestamp && typeof timestamp === 'number') {
        return new Date(timestamp);
    }
    
    // Case 3: timestamp is a string that can be parsed as a number
    if (timestamp && typeof timestamp === 'string' && !isNaN(parseInt(timestamp, 10))) {
        return new Date(parseInt(timestamp, 10));
    }
    
    // Case 4: timestamp is a string in ISO format
    if (timestamp && typeof timestamp === 'string') {
        const date = new Date(timestamp);
        if (!isNaN(date.getTime())) {
            return date;
        }
    }
    
    // Return null for invalid timestamps
    console.warn("Invalid timestamp format:", timestamp);
    return null;
};

// New helper function to convert readable format to system format
const convertToSystemFormat = (readableValue, primaryType) => {
    if (!readableValue) return null;
    
    const currentYear = new Date().getFullYear();
    
    // Extract year from readable format or use current year
    let year = currentYear;
    if (readableValue.includes(currentYear.toString())) {
        year = currentYear;
    }
    
    switch (primaryType) {
        case "monthly":
            // Convert "March", "April", etc. to "YYYY-MM"
            const monthMap = {
                "January": "01", "February": "02", "March": "03", "April": "04",
                "May": "05", "June": "06", "July": "07", "August": "08",
                "September": "09", "October": "10", "November": "11", "December": "12"
            };
            
            for (const [monthName, monthNum] of Object.entries(monthMap)) {
                if (readableValue.includes(monthName)) {
                    return `${year}-${monthNum}`;
                }
            }
            break;
            
        case "weekly":
            // Convert "Week 12" to "YYYY-W12"
            const weekMatch = readableValue.match(/Week (\d+)/i);
            if (weekMatch && weekMatch[1]) {
                return `${year}-W${weekMatch[1]}`;
            }
            break;
            
        case "quarterly":
            // Convert "Q2" to "YYYY-Q2"
            const quarterMatch = readableValue.match(/Q([1-4])/i);
            if (quarterMatch && quarterMatch[1]) {
                return `${year}-Q${quarterMatch[1]}`;
            }
            break;
            
        case "yearly":
            // If it's just a year, return it as is
            if (/^\d{4}$/.test(readableValue)) {
                return readableValue;
            }
            break;
            
        case "daily":
            // If it's already in YYYY-MM-DD format, return it as is
            if (/^\d{4}-\d{2}-\d{2}$/.test(readableValue)) {
                return readableValue;
            }
            break;
            
        default:
            // Default case: return the original value if no match
            console.warn("Unhandled primaryType in convertToSystemFormat:", primaryType);
            return readableValue;
    }
    
    // If we can't convert it, return the original value
    return readableValue;
};

// New helper function to convert system format to readable format
const convertToReadableFormat = (systemValue, primaryType) => {
    if (!systemValue) return null;
    
    switch (primaryType) {
        case "monthly":
            // Convert "YYYY-MM" to month name
            const monthMatch = systemValue.match(/^\d{4}-(\d{2})$/);
            if (monthMatch && monthMatch[1]) {
                const monthNum = parseInt(monthMatch[1], 10);
                const monthNames = [
                    "January", "February", "March", "April", "May", "June",
                    "July", "August", "September", "October", "November", "December"
                ];
                return monthNames[monthNum - 1];
            }
            break;
            
        case "weekly":
            // Convert "YYYY-W12" to "Week 12"
            const weekMatch = systemValue.match(/^\d{4}-W(\d{1,2})$/);
            if (weekMatch && weekMatch[1]) {
                return `Week ${weekMatch[1]}`;
            }
            break;
            
        case "quarterly":
            // Convert "YYYY-Q2" to "Q2"
            const quarterMatch = systemValue.match(/^\d{4}-Q([1-4])$/);
            if (quarterMatch && quarterMatch[1]) {
                return `Q${quarterMatch[1]}`;
            }
            break;
            
        default:
            // Default case: return the original value if no match
            console.warn("Unhandled primaryType in convertToReadableFormat:", primaryType);
            return systemValue;
    }
    
    // For other formats or if conversion fails, return the original
    return systemValue;
};

const FilterPrint = ({ 
    onClose, 
    setFilter, 
    responses = [],
    // New parameters
    setUser = null,
    isResponder = false,
    currentFilter = null
}) => {
    //const theme = useTheme();
    //const colors = tokens(theme.palette.mode);
    const isNonMobile = useMediaQuery("(min-width:600px)");
    
    // State for the secondary filter options which will change based on primary selection
    const [secondaryOptions, setSecondaryOptions] = useState([]);
    
    // State for unique responders extracted from responses
    const [responders, setResponders] = useState([]);
    
    // State for snackbar
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    
    // Extract unique responders from responses
    useEffect(() => {
        if (responses && responses.length > 0 && isResponder) {
            // Extract responders from responses and remove duplicates
            const uniqueResponders = [];
            const responderIds = new Set();
            
            responses.forEach(response => {
                if (response?.responder && !responderIds.has(response.responder.user_id)) {
                    responderIds.add(response.responder.user_id);
                    uniqueResponders.push(response.responder);
                }
            });
            
            setResponders(uniqueResponders);
        }
    }, [responses, isResponder]);
    
    // Primary filter options
    const primaryOptions = [
        { value: "daily", label: "Daily" },
        { value: "weekly", label: "Weekly" },
        { value: "monthly", label: "Monthly" },
        { value: "quarterly", label: "Quarterly" },
        { value: "yearly", label: "Yearly" }
    ];
    
    // Process currentFilter to ensure secondary value is in correct format
    const processedFilter = currentFilter ? {
        ...currentFilter,
        secondary: currentFilter.secondary ? 
            convertToSystemFormat(currentFilter.secondary, currentFilter.primary) : 
            currentFilter.secondary
    } : null;
    
    // Initial form values - use processedFilter values if provided
    const initialValues = {
        primary: processedFilter?.primary || null,
        secondary: processedFilter?.secondary || null,
        user: null
    };
    
    // Generate secondary options based on primary filter and available responses
    const updateSecondaryOptions = (primaryValue) => {
        if (!primaryValue || !responses || responses.length === 0) {
            setSecondaryOptions([]);
            return;
        }
        
        // Extract dates from responses and convert timestamps to Date objects
        const incidentDates = responses
            .map(response => {
                const timestamp = response.date?.incident;
                if (!timestamp) return null;
                
                return convertDate(timestamp);
            })
            .filter(Boolean); // Filter out any null values
        
        // Format dates based on primary filter type
        let formattedDates = [];
        
        switch (primaryValue) {
            case "daily":
                // Format: YYYY-MM-DD
                formattedDates = incidentDates.map(dateObj => {
                    const year = dateObj.getFullYear();
                    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
                    const day = dateObj.getDate().toString().padStart(2, '0');
                    const value = `${year}-${month}-${day}`;
                    return {
                        value: value,
                        label: value
                    };
                });
                break;
                
            case "weekly":
                // Format: YYYY-WX (unpadded week number)
                formattedDates = incidentDates.map(dateObj => {
                    const weekNumber = getISOWeekNumber(dateObj);
                    const value = `${dateObj.getFullYear()}-W${weekNumber}`;
                    return {
                        value: value,
                        label: value
                    };
                });
                break;
                
            case "monthly":
                // Format: YYYY-MM (raw format) with human-readable month names
                formattedDates = incidentDates.map(dateObj => {
                    const year = dateObj.getFullYear();
                    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
                    const monthNames = [
                        "January", "February", "March", "April", "May", "June",
                        "July", "August", "September", "October", "November", "December"
                    ];
                    const value = `${year}-${month}`;
                    const label = `${monthNames[dateObj.getMonth()]} ${year}`;
                    return {
                        value: value,
                        label: label
                    };
                });
                break;
                
            case "quarterly":
                // Format: YYYY-QX with readable label
                formattedDates = incidentDates.map(dateObj => {
                    const quarter = Math.ceil((dateObj.getMonth() + 1) / 3);
                    const value = `${dateObj.getFullYear()}-Q${quarter}`;
                    const label = `Q${quarter} ${dateObj.getFullYear()}`;
                    return {
                        value: value,
                        label: label
                    };
                });
                break;
                
            case "yearly":
                // Format: YYYY
                formattedDates = incidentDates.map(dateObj => {
                    const year = dateObj.getFullYear();
                    return {
                        value: `${year}`,
                        label: `${year}`
                    };
                });
                break;
                
            default:
                // Default case for unhandled filter types
                console.warn("Unhandled primary filter type:", primaryValue);
                formattedDates = [];
        }
        
        // Remove duplicates by value
        const uniqueValues = new Set();
        const uniqueFormattedDates = formattedDates.filter(item => {
            const isDuplicate = uniqueValues.has(item.value);
            uniqueValues.add(item.value);
            return !isDuplicate;
        });
        
        // Sort dates by value
        uniqueFormattedDates.sort((a, b) => a.value.localeCompare(b.value));
        
        // If we have a processedFilter.secondary value, make sure it's included in options
        if (processedFilter && processedFilter.secondary && 
            !uniqueFormattedDates.some(opt => opt.value === processedFilter.secondary)) {
            
            // Get a readable label for the system format
            const readableLabel = convertToReadableFormat(processedFilter.secondary, primaryValue) || processedFilter.secondary;
            
            uniqueFormattedDates.push({
                value: processedFilter.secondary,
                label: readableLabel
            });
        }
        
        setSecondaryOptions(uniqueFormattedDates);
    };
    
    // Load secondary options for the initial primary value (if set by processedFilter)
    useEffect(() => {
        if (processedFilter?.primary) {
            updateSecondaryOptions(processedFilter.primary);
        }
    // eslint-disable-next-line
    }, [processedFilter, responses]);
    
    const handleFilter = (values) => {
        // Create filter object
        const filterObj = {
            primary: values.primary,
            secondary: values.secondary
        };
        
        if (isResponder && setUser && values.user) {
            setFilter(filterObj, values.user);
        } else {
            setFilter(filterObj);
        }
        
        // Close the dialog
        onClose();
    };
    
    // Handler for snackbar close
    const handleSnackbarClose = () => {
        setSnackbarOpen(false);
    };
    
    // Handler for when user attempts to modify disabled fields
    const handleDisabledFieldClick = () => {
        if (currentFilter) {
            setSnackbarOpen(true);
        }
    };

    // Create validation schema based on whether isResponder is true
    const createValidationSchema = () => {
        const baseSchema = {
            primary: yup
                .string()
                .oneOf(["daily", "weekly", "monthly", "quarterly", "yearly"], "Invalid primary filter type")
                .required("Primary filter is required"),
            
            secondary: yup
                .string()
                .required("Secondary filter is required")
                .test(
                    "is-valid-secondary",
                    "Invalid secondary filter format",
                    function(value) {
                        const { primary } = this.parent;
                        if (!value) return false;
                        
                        // Validate format based on primary filter type
                        switch (primary) {
                            case "daily":
                                // Format: YYYY-MM-DD
                                return /^\d{4}-\d{2}-\d{2}$/.test(value);
                                
                            case "weekly":
                                // Format: YYYY-WX or YYYY-WXX
                                return /^\d{4}-W\d{1,2}$/.test(value);
                                
                            case "monthly":
                                // Format: YYYY-MM
                                return /^\d{4}-\d{2}$/.test(value);
                                
                            case "quarterly":
                                // Format: YYYY-QX
                                return /^\d{4}-Q[1-4]$/.test(value);
                                
                            case "yearly":
                                // Format: YYYY
                                return /^\d{4}$/.test(value);
                                
                            default:
                                // Default case for unhandled filter types
                                console.warn("Unhandled primary filter type in validation:", primary);
                                return false;
                        }
                    }
                )
        };
        
        // Add user validation if isResponder is true
        if (isResponder) {
            baseSchema.user = yup.object().required("User selection is required");
        }
        
        return yup.object().shape(baseSchema);
    };

    return (
        <Box m="20px">
            <Header 
                title="PRINT FILTER" 
                subtitle="Select a filter for the performance report." 
            />

            <Box mt="20px" />
            <Formik
                enableReinitialize={true}
                initialValues={initialValues}
                onSubmit={handleFilter}
                validationSchema={createValidationSchema()}
            >
                {({ values, errors, touched, handleBlur, handleSubmit, setFieldValue }) => (
                    <form onSubmit={handleSubmit}>
                        <Box
                            display="grid"
                            gap="30px"
                            gridTemplateColumns="repeat(4, minmax(0, 1fr))"
                            sx={{
                                "& > div": { gridColumn: isNonMobile ? undefined : "span 4" },
                            }}
                        >
                            {/* User Selection - Only shown if isResponder is true */}
                            {isResponder && (
                                <Autocomplete
                                    options={responders}
                                    getOptionLabel={(user) => {
                                        return `${user?.name?.first_name || "N/A"} ${user?.name?.last_name || ""}`.trim();
                                    }}
                                    value={values.user}
                                    onChange={(event, newValue) => {
                                        setFieldValue("user", newValue);
                                    }}
                                    sx={{ gridColumn: "span 4" }}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            fullWidth
                                            variant="filled"
                                            label="Select User"
                                            name="user"
                                            error={!!touched.user && !!errors.user}
                                            helperText={touched.user && errors.user}
                                        />
                                    )}
                                />
                            )}
                            
                            {/* Primary Filter */}
                            <Autocomplete
                                options={primaryOptions}
                                getOptionLabel={(option) => option.label}
                                value={primaryOptions.find((option) => option.value === values.primary) || null}
                                onChange={(event, newValue) => {
                                    // Only update if not using processedFilter
                                    if (!processedFilter) {
                                        const primaryValue = newValue ? newValue.value : null;
                                        setFieldValue("primary", primaryValue);
                                        setFieldValue("secondary", null); // Reset secondary when primary changes
                                        updateSecondaryOptions(primaryValue);
                                    }
                                }}
                                onClick={handleDisabledFieldClick}
                                disabled={!!processedFilter}
                                sx={{ gridColumn: "span 2" }}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        fullWidth
                                        variant="filled"
                                        label="Primary Filter"
                                        name="primary"
                                        error={!!touched.primary && !!errors.primary}
                                        helperText={touched.primary && errors.primary}
                                    />
                                )}
                            />
                            
                            {/* Secondary Filter */}
                            <Autocomplete
                                options={secondaryOptions}
                                getOptionLabel={(option) => option.label}
                                value={
                                    // Find matching option in secondaryOptions
                                    secondaryOptions.find(opt => opt.value === values.secondary) || 
                                    // If not found but we have a processedFilter, create a temp option
                                    (processedFilter?.secondary && values.secondary 
                                        ? {
                                            value: values.secondary,
                                            label: convertToReadableFormat(values.secondary, values.primary) || values.secondary
                                          } 
                                        : null)
                                }
                                onChange={(event, newValue) => {
                                    // Only update if not using processedFilter
                                    if (!processedFilter) {
                                        setFieldValue("secondary", newValue ? newValue.value : null);
                                    }
                                }}
                                onClick={handleDisabledFieldClick}
                                disabled={!values.primary || secondaryOptions.length === 0 || !!processedFilter}
                                sx={{ gridColumn: "span 2" }}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        fullWidth
                                        variant="filled"
                                        label="Secondary Filter"
                                        name="secondary"
                                        error={!!touched.secondary && !!errors.secondary}
                                        helperText={touched.secondary && errors.secondary}
                                    />
                                )}
                            />
                        </Box>
                        
                        {/* Action Buttons */}
                        <Box display="flex" justifyContent="end" mt="20px">
                            <Button onClick={onClose} color="error" variant="contained" sx={{ mr: 2 }}>
                                Close
                            </Button>
                            <Button 
                                type="submit"
                                color="secondary" 
                                variant="contained"
                                disabled={
                                    !values.primary || 
                                    !values.secondary || 
                                    (isResponder && !values.user)
                                }
                            >
                                Apply
                            </Button>
                        </Box>
                    </form>
                )}
            </Formik>
            
            {/* Snackbar for disabled filter notification */}
            <Snackbar
                open={snackbarOpen}
                autoHideDuration={6000}
                onClose={handleSnackbarClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={handleSnackbarClose} severity="info" sx={{ width: '100%' }}>
                    Filter options cannot be changed here. Please adjust filters before printing.
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default FilterPrint;