import { Box, Button, TextField, useTheme, Autocomplete, MenuItem, IconButton, InputAdornment } from "@mui/material";
import Header from "./Header";
import { tokens } from "../theme";
import useMediaQuery from "@mui/material/useMediaQuery";
import { Formik, FieldArray } from "formik";
import * as yup from "yup";
import AddCircleOutlineOutlinedIcon from '@mui/icons-material/AddCircleOutlineOutlined';
import RemoveCircleOutlineOutlinedIcon from '@mui/icons-material/RemoveCircleOutlineOutlined';
import { db } from "../config/firebaseConfig";
import { doc, updateDoc, GeoPoint } from "firebase/firestore";

const EditStationForm = ({ station, onClose }) => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    const isNonMobile = useMediaQuery("(min-width:600px)");

    const handleEditSubmit = async (values) => {
        // Format data
        const formattedData = {
            station: {
                id: values.id,
                name: values.name,
                type: values.type,
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
                website: values.contacts.website,
            },
            key: {
                date: station?.key?.date || null,
                pass: station?.key?.pass || null,
            },
            service: {
                hours: values.service?.hours ? values.service.hours.toLowerCase() : "everyday",
                vehicle: station?.service?.vehicle || null,
            },
            responders: station?.responders || [],
        };
    
        // Only include phone if it has valid numbers
        if (values.contacts.phone && values.contacts.phone.some(phone => phone.trim() !== "")) {
            formattedData.contacts.phone = values.contacts.phone.filter(phone => phone.trim() !== "");
        }
    
        try {
            const stationRef = doc(db, "stations", values.id);
            await updateDoc(stationRef, formattedData);
            console.log("Station updated successfully:", formattedData);
            alert("Station updated successfully! ✅");
            onClose();
        } catch (error) {
            console.error("Error updating station:", error);
        }
    };    

    return (
        <Box m="20px">
            <Header title="EDIT STATION" subtitle="Modify Station Details" />
            <Box mt="20px" />
            <Formik
                onSubmit={handleEditSubmit}
                initialValues={{
                    id: station?.station?.id || "",
                    name: station?.station?.name || "",
                    type: station?.station?.type.toLowerCase() || "",
                    address: {
                        barangay: station?.address?.barangay || "",
                        municipality: station?.address?.municipality || "Indang",
                        province: station?.address?.province || "Cavite",
                        location: {
                            latitude: station?.address?.location?.latitude || "",
                            longitude: station?.address?.location?.longitude || ""
                        }
                    },
                    contacts: {
                        phone: station?.contacts?.phone || [""],
                        website: station?.contacts?.website || "",
                    },
                    service: {
                        hours: station?.service?.hours ? capitalize(station?.service?.hours) : ""
                    },
                }}
                validationSchema={stationSchema}
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
                            {/* Station ID (Read-Only) */}
                            <TextField
                                fullWidth
                                variant="filled"
                                label="Station ID"
                                value={values.id}
                                name="id"
                                disabled
                                sx={{ gridColumn: "span 4" }}
                            />

                            {/* Station Name */}
                            <TextField
                                fullWidth
                                variant="filled"
                                label="Station Name"
                                onBlur={handleBlur}
                                onChange={handleChange}
                                value={values.name}
                                name="name"
                                error={!!touched.name && !!errors.name}
                                helperText={touched.name && errors.name}
                                sx={{ gridColumn: "span 4" }}
                            />

                            {/* Station Type (Dropdown) */}
                            <TextField
                                select
                                fullWidth
                                variant="filled"
                                label="Station Type"
                                onBlur={handleBlur}
                                onChange={handleChange}
                                value={values.type}
                                name="type"
                                error={!!touched.type && !!errors.type}
                                helperText={touched.type && errors.type}
                                sx={{ gridColumn: "span 4" }}
                            >
                                {["fire", "police", "disaster", "barangay"].map((option) => (
                                    <MenuItem key={option} value={option}>
                                        {option.charAt(0).toUpperCase() + option.slice(1)}
                                    </MenuItem>
                                ))}
                            </TextField>

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

                            {/* Latitude */}
                            <TextField
                                fullWidth
                                variant="filled"
                                label="Latitude"
                                onBlur={handleBlur}
                                onChange={handleChange}
                                value={values.address.location.latitude}
                                name="address.location.latitude"
                                error={!!touched.address?.location?.latitude && !!errors.address?.location?.latitude}
                                helperText={touched.address?.location?.latitude && errors.address?.location?.latitude}
                                sx={{ gridColumn: "span 2" }}
                            />

                            {/* Longitude */}
                            <TextField
                                fullWidth
                                variant="filled"
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
                                                                    <IconButton onClick={() => push("")}>
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

                            {/* Website Field */}
                            <TextField
                                fullWidth
                                variant="filled"
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
                                Save Changes
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
    name: yup.string().required("Station name is required"),
    type: yup.string()
        .oneOf(["fire", "police", "disaster", "barangay"], "Invalid station type")
        .required("Station type is required"),
    address: yup.object().shape({
        barangay: yup.string().required("Barangay is required"),
        location: yup.object().shape({
            latitude: yup.number()
                .typeError("Latitude must be a number")
                .min(-90, "Latitude must be between -90 and 90")
                .max(90, "Latitude must be between -90 and 90")
                .required("Latitude is required"),
            longitude: yup.number()
                .typeError("Longitude must be a number")
                .min(-180, "Longitude must be between -180 and 180")
                .max(180, "Longitude must be between -180 and 180")
                .required("Longitude is required"),
        }),
    }),
    contacts: yup.object().shape({
        phone: yup.array()
            .of(
                yup.string()
                    .matches(/^\d{11}$/, "Phone number must be exactly 11 digits")
            )
            .max(3, "You can only add up to 3 phone numbers"),
        website: yup.string()
            .nullable()
            .matches(/^(https?:\/\/)?([\w\d-]+\.)+[\w]{2,}(\/.*)?$/, "Enter a valid website URL")
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

export default EditStationForm;