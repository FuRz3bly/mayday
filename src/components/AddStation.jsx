import { useState } from "react";
import { Box, Button, TextField, Autocomplete, IconButton, InputAdornment, useTheme } from "@mui/material";
import { Formik, FieldArray } from "formik";
import { db } from "../config/firebaseConfig";
import { addDoc, updateDoc, doc, collection, GeoPoint } from "firebase/firestore";
import * as yup from "yup";
import { tokens } from "../theme";
import useMediaQuery from "@mui/material/useMediaQuery";
import AddCircleOutlineOutlinedIcon from '@mui/icons-material/AddCircleOutlineOutlined';
import RemoveCircleOutlineOutlinedIcon from '@mui/icons-material/RemoveCircleOutlineOutlined';
import Header from "./Header";

const AddStationForm = ({ onClose }) => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    const isNonMobile = useMediaQuery("(min-width:600px)");

    const handleFormSubmit = async (values) => {
        try {
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
                contacts: {
                    phone: values.contacts.phone.filter(phone => phone),
                    ...(values.contacts.website && { website: values.contacts.website })
                },
                key: {
                    date: null,
                    pass: null,
                },
                service: {
                    hours: values.service.hours.toLowerCase(),
                    vehicle: null,
                },
                responders: [],
            };
    
            // Add to Firestore and get the auto-generated ID
            const docRef = await addDoc(collection(db, "stations"), formattedData);
    
            // Update the station ID with the Firestore document ID
            await updateDoc(doc(db, "stations", docRef.id), {
                "station.id": docRef.id
            });
    
            console.log("Station added with ID:", docRef.id);
            alert("Station created successfully! ✅");
            onClose();
        } catch (error) {
            console.error("Error adding station:", error);
        }
    };

    return (
        <Box m="20px">
        <Header title="ADD STATION" subtitle="Create a New Station Profile" />
        <Box mt="20px" />
        <Formik
            onSubmit={handleFormSubmit}
            initialValues={initialValues}
            validationSchema={stationSchema}
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
                {/* Name */}
                <TextField
                    fullWidth
                    variant="filled"
                    type="text"
                    label="Name"
                    onBlur={handleBlur}
                    onChange={handleChange}
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
                    onChange={(event, newValue) => setFieldValue("type", newValue)}
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

                {/* Service Hours */}
                <Autocomplete
                    options={serviceHoursOptions}
                    value={values.service.hours || null}
                    onChange={(event, newValue) => setFieldValue("service.hours", newValue)}
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
                                onChange={handleChange}
                                value={phone}
                                name={`contacts.phone[${index}]`}
                                error={!!touched.contacts?.phone?.[index] && !!errors.contacts?.phone?.[index]}
                                helperText={touched.contacts?.phone?.[index] && errors.contacts?.phone?.[index]}
                                slotProps={{
                                    input: {
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            {values.contacts.phone.length > 1 && (
                                                <IconButton onClick={() => remove(index)} color="error">
                                                    <RemoveCircleOutlineOutlinedIcon />
                                                </IconButton>
                                            )}
                                            
                                            {index === 0 && values.contacts.phone.length < 3 && (
                                                <IconButton onClick={() => push("")} sx={{ bgcolor: "gray.700", color: theme.palette.mode === "dark" ? colors.grey[100] : colors.grey[400] }}>
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
                    onChange={handleChange}
                    value={values.contacts.website}
                    name="contacts.website"
                    error={!!touched.contacts?.website && !!errors.contacts?.website}
                    helperText={touched.contacts?.website && errors.contacts?.website}
                    sx={{ gridColumn: "span 4" }}
                />
                </Box>

                {/* Action Buttons */}
                <Box display="flex" justifyContent="end" mt="20px">
                    <Button onClick={onClose} color="error" variant="contained" sx={{ mr: 2 }}>
                        Cancel
                    </Button>
                    <Button type="submit" color="secondary" variant="contained">
                        Add Station
                    </Button>
                </Box>
            </form>
            )}
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
    }),
});

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
    },
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

// Service Hours Options
const serviceHoursOptions = [
    "Everyday",
    "Weekdays",
    "None"
];

const capitalize = (string) => string.charAt(0).toUpperCase() + string.slice(1);

export default AddStationForm;