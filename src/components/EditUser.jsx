//import { useState } from "react";
import { Box, Button, TextField, Autocomplete, IconButton, InputAdornment, Tooltip, useTheme } from "@mui/material";
import { Formik } from "formik";
import * as yup from "yup";
import useMediaQuery from "@mui/material/useMediaQuery";
import Header from "./Header";
import { tokens } from "../theme";
import { DatePicker } from "@mui/x-date-pickers";
import { db } from "../config/firebaseConfig";
import ForwardToInboxOutlinedIcon from '@mui/icons-material/ForwardToInboxOutlined';
import { doc, getDoc, updateDoc, serverTimestamp, deleteField } from "firebase/firestore";

const EditUserForm = ({ user, stations, onClose, onChangePass }) => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    const isNonMobile = useMediaQuery("(min-width:600px)");

    const handleEditSubmit = async (values) => {
        const roleSuffixes = { responder: "@respo", admin: "@admin" };
    
        // Extract IDs to exclude them from comparison
        const { userId, id, firstName, lastName, station, ...filteredValues } = values;
        const { id: _, ...filteredUser } = user; // Remove `id` but keep `user_id`
    
        // Check if the role has changed
        const roleChanged = values.role?.name && values.role?.name !== user.role?.name;
        const roleFromResponderToCommunity = user.role?.name === "responder" && values.role?.name === "community";
    
        // Construct the updated user object
        const updatedUser = {
            ...filteredUser,
            ...filteredValues,
            user_id: user.user_id, // Ensure `user_id` is preserved
            name: {
                first_name: firstName || user.name?.first_name || "",
                last_name: lastName || user.name?.last_name || "",
            },
            birthdate: values.birthdate
                ? `${values.birthdate.getFullYear()}-${String(values.birthdate.getMonth() + 1).padStart(2, "0")}-${String(values.birthdate.getDate()).padStart(2, "0")}`
                : user.birthdate,
        };
    
        // If role changed to "responder", initialize `duty` fields in session
        if (roleChanged && values.role?.name === "responder") {
            updatedUser.session = { ...user.session, duty: false, duty_clock: null };
        };

        if (values.role?.name === "responder") {
            updatedUser.station = {
                name: station.name || "",
                id: station.id || "",
                rank: station.rank || "",
            };
            
            const responderData = {
                id: updatedUser.user_id,
                role: updatedUser.role,
                rank: values.station.rank || "",
                address: updatedUser.address
            };

            try {
                const stationRef = doc(db, "stations", values.station.id);
                const stationSnap = await getDoc(stationRef);
    
                if (stationSnap.exists()) {
                    const stationData = stationSnap.data();
                    let responders = stationData.responders || [];
    
                    // Check if responder already exists in station
                    const existingIndex = responders.findIndex((res) => res.id === user.user_id);
                    if (existingIndex !== -1) {
                        responders[existingIndex] = responderData; // Update existing
                    } else {
                        responders.push(responderData); // Add new
                    }
    
                    await updateDoc(stationRef, { responders });
                    console.log("Station responders updated successfully.");
                }
            } catch (error) {
                console.error("Error updating station responders:", error);
            }
        };
    
        // Check if there are any actual updates before writing to Firestore
        if (JSON.stringify(updatedUser) !== JSON.stringify(user)) {
            try {
                const userRef = doc(db, "users", user.user_id); // Reference to Firestore document
    
                // Prepare Firestore update object
                const updateData = {
                    ...updatedUser,
                    "account.last_updated": serverTimestamp(), // Set Firestore server timestamp
                };
    
                // If role changed from "responder" to "community", remove session fields
                if (roleFromResponderToCommunity) {
                    updateData["session.duty"] = deleteField();
                    updateData["session.duty_clock"] = deleteField();
                }
    
                await updateDoc(userRef, updateData);
                console.log("User updated successfully in Firestore");
            } catch (error) {
                console.error("Error updating user:", error);
            }
        }
    
        onClose();
    };
    
    return (
        <Box m="20px">
            <Header title="EDIT USER" subtitle="Modify User Details" />
            <Box mt="20px" />
            <Formik
                onSubmit={handleEditSubmit}
                initialValues={{
                    firstName: user?.name.first_name || "",
                    lastName: user?.name.last_name || "",
                    userId: user?.user_id || "",
                    email: user?.email || "",
                    phone: user?.phone || "",
                    birthdate: user?.birthdate ? new Date(user.birthdate) : null,
                    address: {
                        barangay: user?.address?.barangay || "",
                        municipality: user?.address?.municipality || "Indang",
                        province: user?.address?.province || "Cavite",
                    },
                    role: user?.role ? { ...user.role } : null,
                    station: {
                        name: user?.station?.name || "",
                        id: user?.station?.id || "",
                        rank: user?.station?.rank || ""
                    }
                }}
                validationSchema={editUserSchema}
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
                            {/* First Name */}
                            <TextField
                                fullWidth
                                variant="filled"
                                type="text"
                                label="First Name"
                                onBlur={handleBlur}
                                onChange={handleChange}
                                value={values.firstName}
                                name="firstName"
                                error={!!touched.firstName && !!errors.firstName}
                                helperText={touched.firstName && errors.firstName}
                                sx={{ gridColumn: "span 2" }}
                            />
                            
                            {/* Last Name */}
                            <TextField
                                fullWidth
                                variant="filled"
                                type="text"
                                label="Last Name"
                                onBlur={handleBlur}
                                onChange={handleChange}
                                value={values.lastName}
                                name="lastName"
                                error={!!touched.lastName && !!errors.lastName}
                                helperText={touched.lastName && errors.lastName}
                                sx={{ gridColumn: "span 2" }}
                            />

                            {/* User ID (Non-editable) */}
                            <TextField
                                fullWidth
                                variant="filled"
                                type="text"
                                label="User ID"
                                value={values.userId}
                                name="userId"
                                disabled
                                sx={{ gridColumn: "span 4" }}
                            />

                            {/* Email (Non-editable) */}
                            <TextField
                                fullWidth
                                variant="filled"
                                type="text"
                                label="Email"
                                value={values.email}
                                name="email"
                                disabled
                                sx={{ gridColumn: "span 4" }}
                            />

                            {/* Phone */}
                            <TextField
                                fullWidth
                                variant="filled"
                                type="text"
                                label="Phone Number"
                                onBlur={handleBlur}
                                onChange={handleChange}
                                value={values.phone}
                                name="phone"
                                error={!!touched.phone && !!errors.phone}
                                helperText={touched.phone && errors.phone}
                                sx={{ gridColumn: "span 2" }}
                            />

                            {/* Birthdate Picker */}
                            <DatePicker
                                label="Birthdate"
                                value={values.birthdate}
                                onChange={(newDate) => setFieldValue("birthdate", newDate)}
                                sx={{ 
                                    gridColumn: "span 2",
                                    backgroundColor: theme.palette.mode === "dark" ?  "#293040" : "#c4c5c8"
                                }}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        fullWidth
                                        variant="filled"
                                        error={!!touched.birthdate && !!errors.birthdate}
                                        helperText={touched.birthdate && errors.birthdate}
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

                            {/* Role Selector */}
                            <Autocomplete
                                options={roles}
                                getOptionLabel={(option) => capitalize(option.name)}
                                value={values.role || null}
                                onChange={(event, newValue) => {
                                    if (!newValue) {
                                    setFieldValue("role", null);
                                    return;
                                    }

                                    let updatedRole = { name: newValue.name.toLowerCase() };

                                    if (newValue.name === "community") {
                                    updatedRole = { ...updatedRole, id: "D1", reports: 4 };
                                    } else {
                                    updatedRole = { ...updatedRole, id: null, type: null };
                                    }

                                    setFieldValue("role", updatedRole);
                                }}
                                onBlur={handleBlur}
                                sx={{ gridColumn: values.role?.name === "community" || !values.role ? "span 4" : "span 2" }}
                                renderInput={(params) => (
                                    <TextField
                                    {...params}
                                    fullWidth
                                    variant="filled"
                                    label="Role"
                                    name="role"
                                    error={!!touched.role && !!errors.role}
                                    helperText={touched.role && errors.role}
                                    />
                                )}
                            />

                            {values.role?.name === "responder" && (
                                <Autocomplete
                                    options={responderTypes}
                                    getOptionLabel={(option) => capitalize(option.name)}
                                    value={values.role?.type ? { name: values.role.type, id: values.role.id } : null}
                                    onChange={(event, newValue) => {
                                    if (newValue) {
                                        setFieldValue("role", {
                                        ...values.role,
                                        type: newValue.name.toLowerCase(),
                                        id: newValue.id,
                                        });
                                    }
                                    }}
                                    onBlur={handleBlur}
                                    sx={{ gridColumn: "span 2" }}
                                    renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        fullWidth
                                        variant="filled"
                                        label="Responder Type"
                                        name="roleType"
                                        error={!!touched.roleType && !!errors.roleType}
                                        helperText={touched.roleType && errors.roleType}
                                    />
                                    )}
                                />
                            )}

                            {values.role?.name === "admin" && (
                                <Autocomplete
                                    options={adminTypes}
                                    getOptionLabel={(option) => capitalize(option.name)}
                                    value={values.role?.type ? { name: values.role.type, id: values.role.id } : null}
                                    onChange={(event, newValue) => {
                                    if (newValue) {
                                        setFieldValue("role", {
                                        ...values.role,
                                        type: newValue.name.toLowerCase(),
                                        id: newValue.id,
                                        });
                                    }
                                    }}
                                    onBlur={handleBlur}
                                    sx={{ gridColumn: "span 2" }}
                                    renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        fullWidth
                                        variant="filled"
                                        label="Admin Type"
                                        name="roleType"
                                        error={!!touched.roleType && !!errors.roleType}
                                        helperText={touched.roleType && errors.roleType}
                                    />
                                    )}
                                />
                            )}

                            {/* Station Selection */}
                            {values.role?.name === "responder" && (
                                <>
                                    {/* Rank */}
                                    <TextField
                                        fullWidth
                                        variant="filled"
                                        label="Rank"
                                        name="station.rank"
                                        value={values.station?.rank || ""}
                                        onChange={(event) => 
                                            setFieldValue("station", { ...values.station, rank: event.target.value })
                                        }
                                        onBlur={handleBlur}
                                        error={!!touched.station?.rank && !!errors.station?.rank}
                                        helperText={touched.station?.rank && errors.station?.rank}
                                        sx={{ gridColumn: "span 2" }}
                                    />

                                    {/* Station Selector */}
                                    <Autocomplete
                                        options={stations.filter((station) =>
                                            station.station?.type.includes(values.role?.type)
                                        )}
                                        getOptionLabel={(option) => option.station?.name || "Unknown Station"}
                                        value={stations.find((s) => s.station?.id === values.station?.id) || null}
                                        onChange={(event, newValue) => {
                                            setFieldValue("station", newValue 
                                                ? { name: newValue.station?.name, id: newValue.station?.id, rank: values.station?.rank || "" } 
                                                : null
                                            );
                                        }}
                                        onBlur={handleBlur}
                                        sx={{ gridColumn: "span 2" }}
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                fullWidth
                                                variant="filled"
                                                label="Station"
                                                name="station"
                                                error={!!touched.station && !!errors.station}
                                                helperText={touched.station && errors.station}
                                            />
                                        )}
                                    />
                                </>
                            )}

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

                            {/* Password Field */}
                            <TextField
                                fullWidth
                                variant="filled"
                                label="Password"
                                type="password"
                                value={generateFakePassword()}
                                name="password"
                                disabled // Prevent user edits
                                error={!!touched.password && !!errors.password}
                                helperText={touched.password && errors.password}
                                sx={{ gridColumn: "span 4" }}
                                slotProps={{
                                    input: {
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <Tooltip 
                                                title={"Change New Password"} 
                                                placement="top" 
                                                sx={{ bgcolor: "gray.700", color: theme.palette.mode === "dark" ? colors.grey[100] : colors.grey[400] }} // Tooltip styling
                                            >
                                            <IconButton onClick={onChangePass} edge="end">
                                                <ForwardToInboxOutlinedIcon />
                                            </IconButton>
                                            </Tooltip>
                                        </InputAdornment>
                                    ),
                                    },
                                }}
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
    )
};

// Validation Schema
const phoneRegExp =
    /^((\+[1-9]{1,4}[ -]?)|(\([0-9]{2,3}\)[ -]?)|([0-9]{2,4})[ -]?)*?[0-9]{3,4}[ -]?[0-9]{3,4}$/;

const editUserSchema = yup.object().shape({
    firstName: yup.string().required("First name is required"),
    lastName: yup.string().required("Last name is required"),
    phone: yup.string().matches(phoneRegExp, "Invalid phone number").required("Phone is required"),
    birthdate: yup.date().nullable().required("Birthdate is required"),
    address: yup.object().shape({
        barangay: yup.string().required("Barangay is required"),
    }),
    role: yup.mixed(),
    station: yup.mixed()
});

const generateFakePassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const length = Math.floor(Math.random() * 7) + 6; // Random length between 6 and 12
    let password = "";
    for (let i = 0; i < length; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
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

const roles = [
    { name: "community", id: "D1" },
    { name: "responder" },
    { name: "admin" },
];

const responderTypes = [
{ name: "police", id: "B1" },
{ name: "fire", id: "C1" },
{ name: "disaster", id: "C2" },
{ name: "barangay", id: "C3" },
];

const adminTypes = [
{ name: "head", id: "A1" },
{ name: "station", id: "A2" },
];

const capitalize = (string) => string.charAt(0).toUpperCase() + string.slice(1);

export default EditUserForm;