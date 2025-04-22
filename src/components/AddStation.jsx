import { useEffect } from "react";
import { Box, Button, TextField, Autocomplete, IconButton, InputAdornment, useTheme } from "@mui/material";
import { Formik, FieldArray } from "formik";
import { db } from "../config/firebaseConfig";
import { addDoc, updateDoc, getDoc, setDoc, doc, collection, GeoPoint, increment } from "firebase/firestore";
import * as yup from "yup";
import { tokens } from "../theme";
import useMediaQuery from "@mui/material/useMediaQuery";
import AddCircleOutlineOutlinedIcon from '@mui/icons-material/AddCircleOutlineOutlined';
import RemoveCircleOutlineOutlinedIcon from '@mui/icons-material/RemoveCircleOutlineOutlined';
import Header from "./Header";

const AddStationForm = ({ onClose, onSubmit, selectedCoords, formValues, setFormValues }) => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    const isNonMobile = useMediaQuery("(min-width:600px)");

    // Initial Values
    const initialValues = {
        name: "",
        type: "",
        contacts: {
            phone: [""],
            website: "",
        },
        address: {
            barangay: "",
            municipality: "Indang",
            province: "Cavite",
            location: {
                latitude: "",
                longitude: "",
            },
        },
        service: {
            hours: "",
            vehicle: []
        },
    };

    // Automatic Setting of Selected Coordinates
    useEffect(() => {
        if (selectedCoords) {
            setFormValues((prevValues) => {
                const currentValues = prevValues || initialValues;
                return {
                    ...currentValues,
                    address: {
                        ...currentValues.address,
                        location: {
                            latitude: selectedCoords[0],
                            longitude: selectedCoords[1],
                        },
                    },
                };
            });
        }
    // eslint-disable-next-line
    }, [selectedCoords, setFormValues]);

    const handleFormSubmit = async (values, { setSubmitting, resetForm }) => {
        console.log("Submitting", values);
        try {
            setSubmitting(true); // Show loading state
            setFormValues(values); // Ensure values persist even if submission fails
    
            const today = new Date();
            const formattedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    
            // Filter out empty phone numbers
            const validPhones = values.contacts.phone?.filter(phone => phone.trim() !== "") || [];
            const validWebsite = values.contacts.website?.trim() !== "" ? values.contacts.website : null;
    
            // Construct the formatted data
            const formattedData = {
                station: {
                    name: values.name,
                    type: values.type.toLowerCase(),
                },
                address: {
                    barangay: values.address.barangay,
                    municipality: values.address.municipality,
                    province: values.address.province,
                    location: new GeoPoint(
                        parseFloat(values.address.location.latitude),
                        parseFloat(values.address.location.longitude)
                    ),
                },
                key: {
                    date: null,
                    pass: null,
                },
                service: {
                    hours: values.service.hours.toLowerCase(),
                    vehicle: values.service?.vehicle?.length !== 0 ? values.service?.vehicle : null,
                },
                responders: [],
            };
    
            // Only include contacts if phone or website have valid data
            if (validPhones.length > 0 || validWebsite) {
                formattedData.contacts = {
                    phone: validPhones.length > 0 ? validPhones : undefined,
                    website: validWebsite || undefined,
                };
            } else {
                formattedData.contacts = null;
            }
    
            // Add to Firestore and get the auto-generated ID
            const docRef = await addDoc(collection(db, "stations"), formattedData);
    
            // Update the station ID with the Firestore document ID
            await updateDoc(doc(db, "stations", docRef.id), {
                "station.id": docRef.id
            });
    
            console.log("Station added with ID:", docRef.id);
    
            // Reference to the daily metadata document
            const dailyRecordRef = doc(db, "metadata", "daily", "records", formattedDate);
            const snapshot = await getDoc(dailyRecordRef);
    
            if (snapshot.exists()) {
                await updateDoc(dailyRecordRef, { stations: increment(1) });
            } else {
                await setDoc(dailyRecordRef, { stations: 1 });
            }
    
            alert("Station created successfully! ✅");
    
            // ✅ Reset only on successful submission
            resetForm();
            setFormValues(null); // Clear the parent state after submission
            onSubmit();
            onClose();
        } catch (error) {
            console.error("Error adding station:", error);
            setFormValues(values); // Preserve form values if submission fails
        } finally {
            setSubmitting(false); // Stop loading state
        }
    };

    const handleCancel = (resetForm) => {
        resetForm();

        onSubmit();

        setFormValues(initialValues);

        onClose();
    };

    return (
        <Box m="20px">
            <Header title="ADD STATION" subtitle="Create a New Station Profile" />
            <Box mt="20px" />
            <Formik
                initialValues={formValues || initialValues}
                validationSchema={stationSchema}
                enableReinitialize={true}  // Allow values to update dynamically
                onSubmit={(values, formikActions) => {
                    setFormValues(values); // Save values to parent state
                    handleFormSubmit(values, formikActions)
                        .then(() => {
                        })
                        .catch(() => setFormValues(values));
                }}
            >
                {({
                    values,
                    errors,
                    touched,
                    handleBlur,
                    handleChange,
                    handleSubmit,
                    setFieldValue,
                    resetForm,
                }) => {
                    const newHandleChange = (e) => {
                        handleChange(e); // Update Formik
                        const { name, value } = e.target;
                    
                        setFormValues((prevValues) => {
                            const updatedValues = { ...prevValues };
                            updateNestedValue(updatedValues, name, value); // Deep update
                            return updatedValues;
                        });
                    };

                    const newOnChange = (name, value) => {
                        setFieldValue(name, value); // Update Formik
                    
                        setFormValues((prevValues) => {
                            const updatedValues = { ...prevValues };
                    
                            updateNestedValue(updatedValues, name, value); // Deep update
                    
                            return updatedValues;
                        });
                    };
                    
                    const updateNestedValue = (obj, path, value) => {
                        // Check if this is an array field by looking for [index] pattern
                        const arrayMatch = path.match(/(.+)\[(\d+)\]$/);
                        
                        if (arrayMatch) {
                            // Handle array fields (like contacts.phone[0])
                            const arrayPath = arrayMatch[1];
                            const index = parseInt(arrayMatch[2]);
                            
                            // Navigate to the array
                            const keys = arrayPath.split(".");
                            let current = obj;
                            
                            for (let i = 0; i < keys.length; i++) {
                                const key = keys[i];
                                if (!current[key]) {
                                    // Initialize as array if it's the target property
                                    current[key] = i === keys.length - 1 ? [] : {};
                                }
                                current = current[key];
                            }
                            
                            // Ensure array has enough elements
                            while (current.length <= index) {
                                current.push("");
                            }
                            
                            // Set the value at the specified index
                            current[index] = value;
                        } else {
                            // Handle regular nested fields (non-array)
                            const keys = path.split(".");
                            let current = obj;
                            
                            for (let i = 0; i < keys.length - 1; i++) {
                                const key = keys[i];
                                if (!current[key]) current[key] = {};
                                current = current[key];
                            }
                            
                            current[keys[keys.length - 1]] = value;
                        }
                    };

                    return (
                        <form onSubmit={handleSubmit}>
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
                                variant="filled"
                                type="text"
                                label="Name"
                                onBlur={handleBlur}
                                onChange={newHandleChange}
                                value={values.name}
                                name="name"
                                error={!!touched.name && !!errors.name}
                                helperText={touched.name && errors.name}
                                sx={{ gridColumn: "span 4" }}
                            />

                            {/* Type */}
                            <Autocomplete
                                options={["fire", "police", "disaster", "barangay"]}
                                value={values.type || null}
                                onChange={(event, newValue) => newOnChange("type", newValue)}
                                onBlur={handleBlur}
                                sx={{ gridColumn: "span 4" }}
                                getOptionLabel={(option) => capitalize(option)} // Display capitalized
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        fullWidth
                                        variant="filled"
                                        label="Type"
                                        name="type"
                                        error={!!touched.type && !!errors.type}
                                        helperText={touched.type && errors.type}
                                    />
                                )}
                            />

                            {/* Address: Barangay */}
                            <Autocomplete
                                options={barangayOptions}
                                value={values.address.barangay || null}
                                onChange={(event, newValue) => newOnChange("address.barangay", newValue)}
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
                                onChange={newHandleChange}
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
                                onChange={newHandleChange}
                                value={values.address.location.longitude}
                                name="address.location.longitude"
                                error={!!touched.address?.location?.longitude && !!errors.address?.location?.longitude}
                                helperText={touched.address?.location?.longitude && errors.address?.location?.longitude}
                                sx={{ gridColumn: "span 2" }}
                            />

                            {/* Service Hours */}
                            <Autocomplete
                                options={serviceHoursOptions}
                                value={values.service.hours || null}
                                onChange={(event, newValue) => newOnChange("service.hours", newValue)}
                                onBlur={handleBlur}
                                sx={{ gridColumn: "span 4" }}
                                renderInput={(params) => (
                                <TextField
                                    {...params}
                                    fullWidth
                                    variant="filled"
                                    label="Service Hours"
                                    name="service.hours"
                                    error={!!touched.service?.hours && !!errors.service?.hours}
                                    helperText={touched.service?.hours && errors.service?.hours}
                                />
                                )}
                            />

                            {/* Service Vehicle */}
                            <Autocomplete
                                multiple
                                options={["Ambulance", "Firetruck", "None"]}
                                value={
                                    values.service.vehicle === null || values.service.vehicle.length === 0
                                        ? ["None"]
                                        : [...new Set(values.service.vehicle.flatMap(v =>
                                            v.ambulance ? ["Ambulance"] : v.firetruck ? ["Firetruck"] : []
                                        ))]
                                }
                                /* onChange={(event, newValue) => {
                                    if (newValue.includes("None") && newValue.length > 1) {
                                        // Remove "None" if another option is selected
                                        newValue = newValue.filter(v => v !== "None");
                                    }

                                    if (newValue.length === 0 || newValue.includes("None")) {
                                        setFieldValue("service.vehicle", []); // Empty array for "None"
                                    } else {
                                        const updatedVehicles = newValue.map(v =>
                                            v === "Ambulance" ? { ambulance: true } : { firetruck: true }
                                        );
                                        setFieldValue("service.vehicle", updatedVehicles);
                                    }
                                }} */
                                onChange={(event, newValue) => {
                                    if (newValue.includes("None") && newValue.length > 1) {
                                        newValue = newValue.filter(v => v !== "None");
                                    }
                            
                                    let updatedVehicles = [];
                                    if (newValue.length === 0 || newValue.includes("None")) {
                                        updatedVehicles = []; // Empty array for "None"
                                    } else {
                                        updatedVehicles = newValue.map(v => v === "Ambulance" ? { ambulance: true } : { firetruck: true });
                                    }
                            
                                    newOnChange("service.vehicle", updatedVehicles);
                                }}
                                onBlur={handleBlur}
                                sx={{
                                    gridColumn: values.service.vehicle === null || values.service.vehicle.length === 0 
                                        ? "span 4" 
                                        : [...new Set(values.service.vehicle.flatMap(v =>
                                            v.ambulance ? ["Ambulance"] : v.firetruck ? ["Firetruck"] : []
                                        ))].length === 2 
                                            ? "span 2" 
                                            : "span 3"
                                }}                                
                                disableCloseOnSelect
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        fullWidth
                                        variant="filled"
                                        label="Service Vehicles"
                                        name="service.vehicle"
                                        error={!!touched.service?.vehicle && !!errors.service?.vehicle}
                                        helperText={touched.service?.vehicle && errors.service?.vehicle}
                                    />
                                )}
                            />

                            {/* Services Count */}
                            {(() => {
                                const vehicleCounts = [
                                    { type: "Firetruck", key: "firetruck", count: values.service.vehicle?.filter(v => v.firetruck).length || 0 },
                                    { type: "Ambulance", key: "ambulance", count: values.service.vehicle?.filter(v => v.ambulance).length || 0 }
                                ].filter(v => v.count > 0);

                                const handleCountChange = (e, vehicleKey) => {
                                    const count = Math.max(0, Number(e.target.value) || 0); // Ensure non-negative integer
                                    const updatedVehicles = Array.from({ length: count }, () => ({ [vehicleKey]: true }));
                                
                                    // Create a custom event-like object
                                    const customEvent = {
                                        target: {
                                            name: "service.vehicle",
                                            value: [
                                                ...values.service.vehicle.filter(v => !v[vehicleKey]),
                                                ...updatedVehicles
                                            ]
                                        }
                                    };
                                
                                    newHandleChange(customEvent); // Use newHandleChange for deep updates
                                };                                

                                return vehicleCounts.length > 0 ? (
                                    vehicleCounts.map((v) => (
                                        <TextField
                                            key={v.type}
                                            fullWidth
                                            variant="filled"
                                            label={v.type}
                                            type="number"
                                            value={v.count}
                                            onChange={(e) => handleCountChange(e, v.key)}
                                            sx={{ gridColumn: "span 1" }}
                                        />
                                    ))
                                ) : null; // Return nothing if no vehicles are selected
                            })()}

                            {/* Phone Numbers (Dynamic) */}
                            <FieldArray name="contacts.phone">
                                {({ push, remove }) => (
                                    <Box sx={{ gridColumn: "span 4" }}>
                                    {values.contacts.phone.map((phone, index) => (
                                        <TextField
                                            key={index}
                                            fullWidth
                                            variant="filled"
                                            label={`Phone Number ${index + 1}`}
                                            type="tel"
                                            onBlur={handleBlur}
                                            onChange={(e) => {
                                                const { value } = e.target;
                                                // Update Formik
                                                setFieldValue(`contacts.phone[${index}]`, value);
                                                // Update parent state
                                                setFormValues((prevValues) => {
                                                    const updatedValues = { ...prevValues };
                                                    if (!updatedValues.contacts) updatedValues.contacts = {};
                                                    if (!updatedValues.contacts.phone) updatedValues.contacts.phone = [...values.contacts.phone];
                                                    updatedValues.contacts.phone[index] = value;
                                                    return updatedValues;
                                                });
                                            }}
                                            value={phone}
                                            name={`contacts.phone[${index}]`}
                                            error={!!touched.contacts?.phone?.[index] && !!errors.contacts?.phone?.[index]}
                                            helperText={touched.contacts?.phone?.[index] && errors.contacts?.phone?.[index]}
                                            slotProps={{
                                                input: {
                                                endAdornment: (
                                                    <InputAdornment position="end">
                                                        {values.contacts.phone.length > 1 && (
                                                            <IconButton 
                                                                onClick={() => {
                                                                    remove(index);
                                                                    // Update parent state when removing a phone
                                                                    setFormValues(prevValues => {
                                                                        const updatedValues = { ...prevValues };
                                                                        updatedValues.contacts.phone = [...updatedValues.contacts.phone];
                                                                        updatedValues.contacts.phone.splice(index, 1);
                                                                        return updatedValues;
                                                                    });
                                                                }} 
                                                                color="error"
                                                            >
                                                                <RemoveCircleOutlineOutlinedIcon />
                                                            </IconButton>
                                                        )}
                                                        
                                                        {index === 0 && values.contacts.phone.length < 3 && (
                                                            <IconButton 
                                                                onClick={() => {
                                                                    push("");
                                                                    // Update parent state when adding a phone
                                                                    setFormValues(prevValues => {
                                                                        const updatedValues = { ...prevValues };
                                                                        updatedValues.contacts.phone = [...updatedValues.contacts.phone, ""];
                                                                        return updatedValues;
                                                                    });
                                                                }} 
                                                                sx={{ bgcolor: "gray.700", color: theme.palette.mode === "dark" ? colors.grey[100] : colors.grey[400] }}
                                                            >
                                                                <AddCircleOutlineOutlinedIcon />
                                                            </IconButton>
                                                        )}
                                                    </InputAdornment>
                                                ),
                                                },
                                            }}
                                        />
                                    ))}
                                </Box>
                            )}
                            </FieldArray>

                            {/* Website */}
                            <TextField
                                fullWidth
                                variant="filled"
                                type="url"
                                label="Website (Optional)"
                                onBlur={handleBlur}
                                onChange={newHandleChange}
                                value={values.contacts.website}
                                name="contacts.website"
                                error={!!touched.contacts?.website && !!errors.contacts?.website}
                                helperText={touched.contacts?.website && errors.contacts?.website}
                                sx={{ gridColumn: "span 4" }}
                            />
                            </Box>

                            {/* Action Buttons */}
                            <Box display="flex" justifyContent="end" mt="20px">
                                <Button onClick={() => handleCancel(resetForm)}  color="error" variant="contained" sx={{ mr: 2 }}>
                                    Cancel
                                </Button>
                                <Button type="submit" color="secondary" variant="contained">
                                    Add Station
                                </Button>
                            </Box>
                        </form>
                    )
                }}
            </Formik>
        </Box>
    );
};

// Validation Schema
const stationSchema = yup.object().shape({
    name: yup.string().required("Name is required"),
    type: yup.string().required("Station type is required"),
    contacts: yup.object().shape({
        phone: yup.array().of(
          yup.string().matches(/^\d{10,11}$/, "Phone number must be 10-11 digits")
        ).max(3, "Maximum of 3 phone numbers"),
        website: yup.string().url("Invalid website URL").nullable(),
    }),
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
    service: yup.object().shape({
      hours: yup.string().required("Service hours are required"),
      vehicle: yup.mixed()
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

// Service Hours Options
const serviceHoursOptions = [
    "Everyday",
    "Weekdays",
    "None"
];

const capitalize = (string) => string.charAt(0).toUpperCase() + string.slice(1);

export default AddStationForm;