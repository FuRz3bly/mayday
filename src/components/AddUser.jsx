import { useState } from "react";
import { Box, Button, TextField, Autocomplete, IconButton, InputAdornment, useTheme } from "@mui/material";
import { Formik } from "formik";
import * as yup from "yup";
import useMediaQuery from "@mui/material/useMediaQuery";
import Header from "./Header";
//import { tokens } from "../theme";
import { DatePicker } from "@mui/x-date-pickers";
import { db } from "../config/firebaseConfig";
//import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import { firebaseConfig } from "../config/firebaseConfig"
import { doc, setDoc, getDoc,  updateDoc, serverTimestamp } from "firebase/firestore";

const AddUserForm = ({ onClose, stations }) => {
  const theme = useTheme();
  //const colors = tokens(theme.palette.mode);
  const isNonMobile = useMediaQuery("(min-width:600px)");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleFormSubmit = async (values) => {
    try {
      const { role, email, password, confirm_password, station, birthdate, ...restValues } = values;
  
      const roleName = role?.name;
      const roleTypeId = role?.id || "D1"; // Default to D1 (Community)

      // Format birthdate to "YYYY-MM-DD" without shifting due to timezone
      const formattedBirthdate = birthdate 
      ? `${birthdate.getFullYear()}-${String(birthdate.getMonth() + 1).padStart(2, "0")}-${String(birthdate.getDate()).padStart(2, "0")}`
      : null;
  
      // Generate User ID
      const user_id = `${roleTypeId}${generateRandomId()}`;
  
      // Define session object based on role
      const session =
        roleName === "responder"
          ? { token: null, duty: false, duty_clock: null, last_login: null }
          : { token: null, last_login: null };
  
      // ✅ Create user without logging out the admin
      const createUser = async (email, password) => {
        const response = await fetch(
          `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${firebaseConfig.apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email,
              password,
              returnSecureToken: true,
            }),
          }
        );
        const data = await response.json();
        if (data.error) throw new Error(data.error.message);
        return { uid: data.localId, idToken: data.idToken };
      };

      // ✅ Send email verification manually
      const sendEmailVerification = async (idToken) => {
        await fetch(
          `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${firebaseConfig.apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              requestType: "VERIFY_EMAIL",
              idToken,
            }),
          }
        );
      };

      // Get the Firebase UID without logging out the admin
      const { uid, idToken } = await createUser(email, password);

      // Send verification email
      await sendEmailVerification(idToken);
      console.log("Verification email sent to:", email);
  
      // Construct final user object (excluding password fields)
      const updatedValues = {
        ...restValues, // Includes all remaining values (excluding password)
        user_id, // Keep user_id as the document ID
        email: email,
        birthdate: formattedBirthdate,
        auth_uid: uid, // Store Firebase Authentication UID
        role: role,
        account: {
          access: true,
          access_clock: null,
          created: serverTimestamp(), // ✅ Firestore Timestamp
          last_updated: serverTimestamp(), // ✅ Firestore Timestamp
        },
        photos: { id: null, profile: null },
        session,
        verified: roleName === "community"
          ? { id: false, barangay: false, email: false }
          : { id: true, email: false },
      };

      if (values.role?.name === "responder") {
      updatedValues.station = {
        name: station.name || "",
        id: station.id || "",
        rank: station.rank || "",
      };
      
      const responderData = {
        id: user_id,
        role: updatedValues.role,
        rank: values.station.rank || "",
        address: updatedValues.address
      };

      try {
          const stationRef = doc(db, "stations", values.station.id);
          const stationSnap = await getDoc(stationRef);

          if (stationSnap.exists()) {
              const stationData = stationSnap.data();
              let responders = stationData.responders || [];

              // Check if responder already exists in station
              const existingIndex = responders.findIndex((res) => res.id === user_id);
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
  
      // Store user data in Firestore with user_id as the document ID
      await setDoc(doc(db, "users", user_id), updatedValues);
  
      console.log("User added successfully!");
      alert("User registered successfully! ✅");
      onClose();
    } catch (error) {
      console.error("Error registering user:", error);
      alert("Error: " + error.message);
    }
  };

  return (
    <Box m="20px">
      <Header title="CREATE USER" subtitle="Create a New User Profile" />
      <Box mt="20px" />
      <Formik
        onSubmit={handleFormSubmit}
        initialValues={initialValues}
        validationSchema={validationSchema}
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
                label="First Name"
                onBlur={handleBlur}
                onChange={handleChange}
                value={values.name.first_name}
                name="name.first_name"
                error={!!touched.name?.first_name && !!errors.name?.first_name}
                helperText={touched.name?.first_name && errors.name?.first_name}
                sx={{ gridColumn: "span 2" }}
              />

              {/* Last Name */}
              <TextField
                fullWidth
                variant="filled"
                label="Last Name"
                onBlur={handleBlur}
                onChange={handleChange}
                value={values.name.last_name}
                name="name.last_name"
                error={!!touched.name?.last_name && !!errors.name?.last_name}
                helperText={touched.name?.last_name && errors.name?.last_name}
                sx={{ gridColumn: "span 2" }}
              />

              {/* Email */}
              <TextField
                fullWidth
                variant="filled"
                label="Email"
                onBlur={handleBlur}
                onChange={handleChange}
                value={values.email}
                name="email"
                error={!!touched.email && !!errors.email}
                helperText={touched.email && errors.email}
                sx={{ gridColumn: "span 4" }}
              />

              {/* Phone */}
              <TextField
                fullWidth
                variant="filled"
                label="Phone"
                onBlur={handleBlur}
                onChange={handleChange}
                value={values.phone}
                name="phone"
                error={!!touched.phone && !!errors.phone}
                helperText={touched.phone && errors.phone}
                sx={{ gridColumn: "span 4" }}
                inputMode="numeric"
                type="tel"
              />

              {/* Birthdate */}
              <DatePicker
                label="Birthdate"
                value={values.birthdate}
                onChange={(date) => setFieldValue("birthdate", date)}
                sx={{ 
                  gridColumn: "span 4",
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
                  setFieldValue(
                    "role",
                    newValue ? { name: newValue.name.toLowerCase(), id: newValue.id || null } : null
                  );
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

              {/* Conditional sub-role selection */}
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
                type={showPassword ? "text" : "password"}
                onBlur={handleBlur}
                onChange={handleChange}
                value={values.password}
                name="password"
                error={!!touched.password && !!errors.password}
                helperText={touched.password && errors.password}
                sx={{ gridColumn: "span 4" }}
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                          {showPassword ? <VisibilityOffOutlinedIcon /> : <VisibilityOutlinedIcon />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />

              {/* Confirm Password Field */}
              <TextField
                fullWidth
                variant="filled"
                label="Confirm Password"
                type={showConfirmPassword ? "text" : "password"}
                onBlur={handleBlur}
                onChange={handleChange}
                value={values.confirm_password}
                name="confirm_password"
                error={!!touched.confirm_password && !!errors.confirm_password}
                helperText={touched.confirm_password && errors.confirm_password}
                sx={{ gridColumn: "span 4" }}
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)} edge="end">
                          {showConfirmPassword ? <VisibilityOffOutlinedIcon /> : <VisibilityOutlinedIcon />}
                        </IconButton>
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
                Create New User
              </Button>
            </Box>
          </form>
        )}
      </Formik>
    </Box>
  );
};

// Initial Form Values
const initialValues = {
  name: { first_name: "", last_name: "" },
  email: "",
  phone: "",
  birthdate: null,
  password: "",
  confirm_password: "",
  role: null,
  station: {
    name: "",
    id: "",
    rank: ""
  },
  address: {
    barangay: "",
    municipality: "Indang",
    province: "Cavite",
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

// Validation Schema
const validationSchema = yup.object().shape({
  name: yup.object().shape({
    first_name: yup.string().required("Required"),
    last_name: yup.string().required("Required"),
  }),
  email: yup.string().email("Invalid email").required("Required"),
  phone: yup
  .string()
  .matches(/^\d{11}$/, "Phone number must be 11 digits") // ✅ Enforces exactly 11 digits
  .required("Required"),
  birthdate: yup.date().required("Required"),
  address: yup.object().shape({
    barangay: yup
      .string()
      .oneOf(barangayOptions, "Invalid barangay") // ✅ Ensures input matches the list
      .required("Required"),
  }),
  role: yup.mixed(),
  station: yup.mixed(),
  password: yup.string().min(6, "Password must be at least 6 characters").required("Required"),
  confirm_password: yup
    .string()
    .oneOf([yup.ref("password"), null], "Passwords must match")
    .required("Required"),
});

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

const generateRandomId = () => {
  const uppercaseLetters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  
  let randomString = "";

  // Ensure the first character after the role ID is uppercase
  randomString += uppercaseLetters.charAt(Math.floor(Math.random() * uppercaseLetters.length));

  // Generate the remaining 17 characters randomly
  for (let i = 1; i < 18; i++) {
    randomString += characters.charAt(Math.floor(Math.random() * characters.length));
  }

  return randomString;
};

export default AddUserForm;