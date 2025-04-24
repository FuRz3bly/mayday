import { Box, Button, TextField, Typography, Paper, InputAdornment, IconButton, CircularProgress } from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { Formik } from "formik";
import { DataContext } from "../../data";
import * as yup from "yup";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth, db } from "../../config/firebaseConfig";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { useState, useContext } from "react";

import MaydayLogo from "../../assets/images/logo-192x192.png";

const Login = () => {
  const { setAuthUser } = useContext(DataContext);
  const navigate = useNavigate();
  const [firebaseError, setFirebaseError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  // Toggle Password Visibility
  const handleTogglePassword = () => {
    setShowPassword((prev) => !prev);
  };

  // Login Function
  const handleLogin = async (values, { setSubmitting }) => {
    setFirebaseError(null);
    setSubmitting(true);

    try {
        const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
        const authUser = userCredential.user;

        // Fetch the user document from Firestore
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("auth_uid", "==", authUser.uid));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            const userDoc = querySnapshot.docs[0].data(); // Get user document data
            
            // Check if user is an admin
            const isAdmin = 
              userDoc.role && 
              userDoc.role.id === "A1" && 
              userDoc.role.name && 
              userDoc.role.name.toLowerCase() === "admin";
            
            if (!isAdmin) {
              // Sign out the user since they don't have admin privileges
              await signOut(auth);
              setFirebaseError("Access denied. Admin privileges required.");
              setSubmitting(false);
              return;
            }
            
            setAuthUser(userDoc); // Store it in DataProvider
            navigate("/");
        } else {
            // Sign out if user document not found
            await signOut(auth);
            throw new Error("User document not found.");
        }
    } catch (err) {
        setFirebaseError("Invalid email or password. Try again.");
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
        position: "relative",
        overflow: "hidden",
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `
            radial-gradient(ellipse at top left, #000428 0%, transparent 70%),
            radial-gradient(ellipse at bottom right, #004e92 0%, transparent 70%),
            radial-gradient(ellipse at center, #1a2980 0%, #26d0ce 100%)
          `,
          backgroundSize: "200% 200%",
          animation: "waveGradient 15s ease infinite",
          zIndex: -1,
        },
        "@keyframes waveGradient": {
          "0%": {
            backgroundPosition: "0% 0%",
          },
          "25%": {
            backgroundPosition: "100% 0%",
          },
          "50%": {
            backgroundPosition: "100% 100%",
          },
          "75%": {
            backgroundPosition: "0% 100%",
          },
          "100%": {
            backgroundPosition: "0% 0%",
          },
        },
      }}
    >
      <Paper 
        elevation={3} 
        sx={{ 
          padding: 4, 
          width: "400px", 
          textAlign: "center", 
          backgroundColor: "rgba(31, 42, 64, 0.9)", 
          borderRadius: "10px",
          boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
        }}
      >
        {/* Logo */}
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
          <img 
            src={MaydayLogo}
            alt="Mayday Logo" 
            style={{ 
              height: '120px', 
              width: 'auto',
              marginBottom: '10px'
            }} 
          />
        </Box>

        <Typography variant="h4" gutterBottom sx={{ color: "#ffc55a", fontWeight: "500", mb: 3 }}>
          Log in to Mayday
        </Typography>
        {firebaseError && <Typography color="error">{firebaseError}</Typography>}
        
        <Formik
          initialValues={initialValues}
          validationSchema={loginSchema}
          onSubmit={handleLogin}
        >
          {({ values, errors, touched, handleChange, handleBlur, handleSubmit, isSubmitting, isValid, dirty }) => (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column" }}>
              {/* Email */}
              <TextField
                label="Email"
                variant="outlined"
                margin="normal"
                fullWidth
                name="email"
                onBlur={handleBlur}
                onChange={handleChange}
                value={values.email}
                error={!!touched.email && !!errors.email}
                helperText={touched.email && errors.email}
                sx={{
                  input: { color: "#fff" },
                  "& .MuiInputLabel-root": { 
                    color: "#fff",
                    "&.Mui-focused": { color: "#ffc55a" },
                  },
                  "& .MuiOutlinedInput-root": {
                    "& fieldset": { borderColor: "#fff" },
                    "&:hover fieldset": { borderColor: "#ffc55a" },
                    "&.Mui-focused fieldset": { borderColor: "#ffc55a" },
                  },
                }}
              />
              {/* Password */}
              <TextField
                label="Password"
                variant="outlined"
                margin="normal"
                fullWidth
                type={showPassword ? "text" : "password"}
                name="password"
                onBlur={handleBlur}
                onChange={handleChange}
                value={values.password}
                error={!!touched.password && !!errors.password}
                helperText={touched.password && errors.password}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={handleTogglePassword}
                        edge="end"
                        sx={{ color: "#fff" }}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{ 
                  input: { color: "#fff" },
                  "& .MuiInputLabel-root": { 
                    color: "#fff",
                    "&.Mui-focused": { color: "#ffc55a" }, 
                  },
                  "& .MuiOutlinedInput-root": {
                    "& fieldset": { borderColor: "#fff" },
                    "&:hover fieldset": { borderColor: "#ffc55a" },
                    "&.Mui-focused fieldset": { borderColor: "#ffc55a" },
                  }
                }}
              />
              {/* Sign In Button */}
              <Button 
                type="submit" 
                variant="contained" 
                sx={{ 
                  mt: 2, 
                  height: "48px", // Fixed height for consistent button size
                  backgroundColor: "#ffc55a", 
                  color: "#000",
                  "&:hover": { backgroundColor: "#e0a82e" },
                  "&.Mui-disabled": { 
                    backgroundColor: "rgba(255, 197, 90, 0.5)", 
                    color: "rgba(0, 0, 0, 0.5)" 
                  }
                }} 
                disabled={isSubmitting || !isValid || !dirty}
              >
                {isSubmitting ? (
                  <CircularProgress size={24} sx={{ color: "#fff" }} />
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
          )}
        </Formik>
      </Paper>
    </Box>
  );
};

// Validation Schema
const loginSchema = yup.object().shape({
  email: yup.string()
    .email("Please enter a valid email address")
    .required("Email is required"),
  password: yup.string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),
});

// Initial Form Values
const initialValues = {
  email: "",
  password: "",
};

export default Login;