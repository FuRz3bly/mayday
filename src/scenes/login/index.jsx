import { Box, Button, TextField, Typography, Paper } from "@mui/material";
import { Formik } from "formik";
import { DataContext } from "../../data";
import * as yup from "yup";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../../config/firebaseConfig"; // Import Firebase auth instance
import { collection, query, where, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { useState, useContext } from "react";

const Login = () => {
  const { setAuthUser } = useContext(DataContext);
  const navigate = useNavigate();
  const [firebaseError, setFirebaseError] = useState(null);

  const handleLogin = async (values, { setSubmitting }) => {
    setFirebaseError(null);
    setSubmitting(true);

    let emailOrUsername = values.emailOrUsername;
    const isEmail = /\S+@\S+\.\S+/.test(emailOrUsername);
    let email = emailOrUsername;

    if (!isEmail) {
        try {
            const usersRef = collection(db, "users");
            const q = query(usersRef, where("username", "==", emailOrUsername));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                throw new Error("Username not found.");
            }

            email = querySnapshot.docs[0].data().email;
            if (!email) throw new Error("Email not found for the username.");
        } catch (error) {
            setFirebaseError(error.message);
            setSubmitting(false);
            return;
        }
    }

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, values.password);
        const authUser = userCredential.user;

        // Fetch the user document from Firestore using auth_uid
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("auth_uid", "==", authUser.uid));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            const userDoc = querySnapshot.docs[0].data(); // Get user document data
            setAuthUser(userDoc); // Store it in DataProvider
        } else {
            throw new Error("User document not found.");
        }

        navigate("/");
    } catch (err) {
        setFirebaseError("Invalid email/username or password. Try again.");
    }

    setSubmitting(false);
  };

  return (
    <Box 
      sx={{ 
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center", 
        height: "100vh", 
        width: "100%", 
        backgroundColor: "#2c4e80" // Dark Blue Background
      }}
    >
      <Paper 
        elevation={3} 
        sx={{ 
          padding: 4, 
          width: "400px", 
          textAlign: "center", 
          backgroundColor: "#f2f0f0", // Light Background
          borderRadius: "10px"
        }}
      >
        <Typography variant="h3" gutterBottom sx={{ color: "#2c4e80", fontWeight: "bold" }}>
          MAYDAY Login
        </Typography>
        {firebaseError && <Typography color="error">{firebaseError}</Typography>}
        
        <Formik
          initialValues={initialValues}
          validationSchema={loginSchema}
          onSubmit={handleLogin}
        >
          {({ values, errors, touched, handleChange, handleBlur, handleSubmit, isSubmitting }) => (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column" }}>
              <TextField
                label="Email or Username"
                variant="outlined"
                margin="normal"
                fullWidth
                name="emailOrUsername"
                onBlur={handleBlur}
                onChange={handleChange}
                value={values.emailOrUsername}
                error={!!touched.emailOrUsername && !!errors.emailOrUsername}
                helperText={touched.emailOrUsername && errors.emailOrUsername}
                sx={{
                  input: { color: "#2c4e80" },
                  label: { color: "#2c4e80" },
                  "& .MuiOutlinedInput-root": {
                    "& fieldset": { borderColor: "#2c4e80" },
                    "&:hover fieldset": { borderColor: "#ffc55a" },
                    "&.Mui-focused fieldset": { borderColor: "#ffc55a" },
                  },
                }}
              />
              <TextField
                label="Password"
                variant="outlined"
                margin="normal"
                fullWidth
                type="password"
                name="password"
                onBlur={handleBlur}
                onChange={handleChange}
                value={values.password}
                error={!!touched.password && !!errors.password}
                helperText={touched.password && errors.password}
                sx={{ 
                  input: { color: "#2c4e80" }, // Dark blue text color
                  label: { color: "#2c4e80" }, // Dark blue label color
                  "& .MuiOutlinedInput-root": {
                    "& fieldset": { borderColor: "#2c4e80" }, // Dark blue border
                    "&:hover fieldset": { borderColor: "#ffc55a" }, // Yellow border on hover
                    "&.Mui-focused fieldset": { borderColor: "#ffc55a" }, // Yellow border when focused
                  }
                }}
              />
              <Button 
                type="submit" 
                variant="contained" 
                sx={{ 
                  mt: 2, 
                  backgroundColor: "#ffc55a", // Yellow Button
                  color: "#2c4e80",
                  fontWeight: "bold",
                  "&:hover": { backgroundColor: "#e0a82e" }
                }} 
                disabled={isSubmitting}
              >
                {isSubmitting ? "Logging in..." : "Login"}
              </Button>
            </form>
          )}
        </Formik>
      </Paper>
    </Box>
  );
};

// ✅ Updated Validation Schema
const loginSchema = yup.object().shape({
  emailOrUsername: yup.string().required("Email or Username is required"),
  password: yup.string().min(6, "Password must be at least 6 characters").required("Password is required"),
});

// ✅ Updated Initial Form Values
const initialValues = {
  emailOrUsername: "", // Changed from 'email' to 'emailOrUsername'
  password: "",
};

export default Login;