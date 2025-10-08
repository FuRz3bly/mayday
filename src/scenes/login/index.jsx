import { Box, Button, TextField, Typography, Paper, InputAdornment, IconButton, CircularProgress, Dialog, useTheme } from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { Formik } from "formik";
import { DataContext } from "../../data";
import * as yup from "yup";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth, db } from "../../config/firebaseConfig";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { useState, useContext } from "react";
import QRCode from "react-qr-code";
import { tokens } from "../../theme";

import MaydayLogo from "../../assets/images/logo-192x192.png";
import MaydayBackground from "../../assets/images/background-ad-1.png";
import MaydayPocketD from "../../assets/images/phone-ad-1.png"
import MaydayPocketL from "../../assets/images/phone-ad-2.png"

import CloseIcon from '@mui/icons-material/Close';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import CallMadeIcon from '@mui/icons-material/CallMade';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowCircleDownIcon from '@mui/icons-material/ArrowCircleDown';


const APK_CONFIG = {
  url: process.env.REACT_APP_APK_URL || "/downloads/mayday-app-v1.0.4.apk",
  version: process.env.REACT_APK_VERSION || "1.0.4",
  size: process.env.REACT_APP_APK_SIZE || "105 MB"
};

const Login = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  const { setAuthUser } = useContext(DataContext);
  const navigate = useNavigate();
  const [firebaseError, setFirebaseError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [expandQR, setExpandQR] = useState(false);
  const [changePhoneMode, setChangePhoneMode] = useState(true);

  const [viewApp, setViewApp] = useState(false);

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
            navigate("/home");
        } else {
            // Sign out if user document not found
            await signOut(auth);
            throw new Error("User document not found.");
        }
    } catch (err) {
        setFirebaseError("Invalid email or password. Try again.");
        console.error(err);
    }

    setSubmitting(false);
  };

  // Scan URL
  const scanURL = () => {
    if (APK_CONFIG.url.startsWith('http')) {
      return APK_CONFIG.url;
    }
    
    return `${window.location.origin}${APK_CONFIG.url}`;
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
      {viewApp ? (
        <Paper
          elevation={3} 
          sx={{  
            width: "70%",
            height: "80%",
            display: "flex",
            flexDirection: "row",
            overflow: "hidden",
            position: "relative",
            borderRadius: "30px",
            boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
          }}
        >
          <Box sx={{ width: "100%", height: "100%", alignContent: "center", justifyContent: "center", position: "relative", display: "flex", flexDirection: "row" }}>
            {/* QR Popup */}
            <Dialog
              open={expandQR}
              onClose={() => setExpandQR(false)}
              maxWidth={false}
              PaperProps={{
                sx: {
                  backgroundColor: 'transparent',
                  boxShadow: 'none',
                  borderRadius: '30px',
                  overflow: 'visible'
                }
              }}
              sx={{
                '& .MuiBackdrop-root': {
                  backdropFilter: 'blur(10px)',
                  backgroundColor: 'rgba(0, 0, 0, 0.4)'
                }
              }}
            >
              <Box sx={{ position: 'relative' }}>
                {/* Close Button */}
                <IconButton
                  onClick={() => setExpandQR(false)}
                  sx={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    color: colors.primary[400],
                    padding: 1.5,
                    backgroundColor: colors.grey[100],
                    '&:hover': {
                      backgroundColor: colors.grey[200]
                    }
                  }}
                >
                  <CloseIcon
                    sx={{ 
                      fontSize: 30,
                    }}
                  />
                </IconButton>

                {/* QR Code Container */}
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: 6,
                    borderRadius: '30px',
                    backgroundColor: colors.grey[100]
                  }}
                >
                  <QRCode
                    value={scanURL()}
                    size={400}
                    level="H"
                    bgColor={colors.grey[100]}
                    fgColor={colors.primary[400]}
                  />
                </Box>
              </Box>
            </Dialog>

            {/* Background */}
            <Box
              component="img"
              src={MaydayBackground}
              alt="Mayday Background"
              sx={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "101%",
                height: "100%",
                objectFit: "cover",
                backgroundColor: colors.primary[400],
                zIndex: 0,
              }}
            />

            <Box
              sx={{
                backgroundColor: changePhoneMode ? colors.grey[100] : colors.primary[400],
                position: "absolute",
                bottom: -400,
                right: -300,
                width: '150%',
                height: '60%',
                zIndex: 1,
                transform: "rotate(-25deg)",
              }}
            />

            {/* Back Button */}
            <Box sx={{ position: "absolute", bottom: 10, left: 2, zIndex: 2 }}>
              <Button
                sx={{
                  border: `1px solid ${colors.grey[100]}`,
                  borderRadius: 30,
                  color: colors.grey[100],
                  padding: "10px 10px",
                  marginX: 1,
                  "&:hover": {
                    backgroundColor: colors.blueAccent[500],
                  },
                  transition: 'transform 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                onClick={() => setViewApp(false)}
              >
                <ArrowBackIcon sx={{ color: colors.grey[100] }} />
              </Button>
            </Box>

            {/* Dialog & Buttons */}
            <Box sx={{ 
              width: "50%", 
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 1,
              position: "relative"
            }}>
              <Box sx={{ width: "70%" }}>
                {/* Dialog */}
                <Typography variant="h1" color={colors.grey[100]} fontWeight="bold" sx={{ mb: 3 }}>
                  Staying Vigilant<br />
                  with Mayday
                </Typography>

                <Typography 
                  variant="h5" 
                  color={colors.grey[100]}
                  sx={{ 
                    textAlign: "justify",
                    textJustify: "inter-word",
                    lineHeight: 1.6,
                    mb: 3
                  }}
                >
                  Your lifeline in an emergency starts here. <br />
                  When every second counts, Mayday lets you report emergencies fast and helps responders reach you without delay. <br />
                  Feel secure knowing support is always within reach for you and your community.
                </Typography>

                <Box sx={{ width: "100%", display: 'flex', flexDirection: "row" }}>
                  {/* Buttons */}
                  <Box sx={{ width: '50%', display: "flex", flexDirection: 'column', justifyContent: "space-between" }}>
                    {/* Discover More */}
                    <Button
                      sx={{
                        backgroundColor: colors.blueAccent[500],
                        borderRadius: 3,
                        color: colors.grey[100],
                        padding: "20px 25px",
                        "&:hover": {
                          backgroundColor: colors.blueAccent[400],
                        },
                        transition: 'transform 0.2s ease'
                      }}
                      onClick={() => setViewApp(false)}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      Discover More
                    </Button>

                    {/* Download App */}
                    <Button
                      sx={{
                        border: `1px solid ${colors.grey[100]}`,
                        borderRadius: 3,
                        color: colors.grey[100],
                        padding: "20px 25px",
                        "&:hover": {
                          border: `1px solid #868dfb`,
                          backgroundColor: '#868dfb',
                          color: colors.grey[100],
                          "& .MuiSvgIcon-root": {
                            color: colors.grey[100]
                          }
                        },
                        transition: 'transform 0.2s ease'
                      }}
                      component="a"
                      href={APK_CONFIG.url}
                      download={`Mayday-App-v${APK_CONFIG.version}.apk`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      Download App ({APK_CONFIG.size})
                      <ArrowCircleDownIcon sx={{ color: colors.grey[100], ml: 1 }} />
                    </Button>
                  </Box>

                  {/* QR Code */}
                  <Box sx={{ width: '50%', display: 'flex', justifyContent: "end", alignItems: 'center' }}>
                    <Box 
                      onClick={() => setExpandQR(true)} 
                      sx={{ 
                        position: 'relative',
                        display: 'flex', 
                        justifyContent: 'center', 
                        alignItems: 'center', 
                        padding: 1.6, 
                        borderRadius: '30px', 
                        backgroundColor: colors.grey[100],
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          transform: 'scale(1.05)',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                        }
                      }}
                    >
                      <QRCode
                        value={scanURL()}
                        size={110}
                        level="H"
                        bgColor={colors.grey[100]}
                        fgColor={colors.primary[400]}
                      />
                      
                      {/* Expand Icon */}
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '30px',
                          backgroundColor: `${colors.grey[900]}80`, // 50% opacity
                          opacity: 0,
                          transition: 'opacity 0.2s ease',
                          '&:hover': {
                            opacity: 1
                          }
                        }}
                      >
                        <OpenInFullIcon 
                          sx={{ 
                            fontSize: 30, 
                            color: colors.grey[100] 
                          }} 
                        />
                      </Box>
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Box>

            {/* Phone */}
            <Box sx={{
              width: "50%", 
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 1,
              position: "relative"
            }}>
              <img
                src={changePhoneMode ? MaydayPocketD : MaydayPocketL}
                alt="Mayday Application"
                onClick={() => setChangePhoneMode(!changePhoneMode)}
                style={{ 
                  maxHeight: '86%', 
                  maxWidth: '95%',
                  height: 'auto',
                  width: 'auto',
                  objectFit: 'contain',
                  cursor: 'pointer',
                  transition: 'transform 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              />
            </Box>
          </Box>
        </Paper>
      ) : (
        <Paper
          elevation={3} 
          sx={{  
            width: "70%",
            height: "80%",
            display: "flex",
            flexDirection: "row",
            overflow: "hidden",
            position: "relative",
            borderRadius: "30px",
            boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
          }}
        >
          {/* Mobile Ad */}
          <Box sx={{ 
            width: "40%", 
            height: "12%", 
            backgroundColor: colors.greenAccent[500], 
            display: "flex", 
            flexDirection: "row", 
            alignItems: "center",
            justifyContent: "space-between",
            paddingX: 3,
            borderRadius: "30px 30px 0 0",
            position: "absolute", 
            bottom: 0, 
            right: 0 
          }}>
            <Box>
              <Typography variant="h4" color={colors.grey[900]} fontWeight={400}>
                Check out the <strong>Mayday</strong> app <strong>today</strong>!
              </Typography>
            </Box>
            <Box>
              {/* View Button */}
              <Button
                sx={{
                  backgroundColor: colors.greenAccent[500],
                  border: `1px solid ${colors.grey[900]}`,
                  borderRadius: "30px",
                  color: colors.grey[900],
                  fontSize: "12px",
                  fontWeight: "bold",
                  padding: "10px 15px",
                  marginX: 1,
                  "&:hover": {
                    backgroundColor: colors.greenAccent[400],
                  },
                transition: 'transform 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                onClick={() => setViewApp(true)}
              >
                View
                <CallMadeIcon sx={{ ml: "10px", color: colors.grey[900] }} />
              </Button>
            </Box>
          </Box>

          {/* Viewable Ads */}
          <Box sx={{ width: "60%", height: "100%", backgroundColor: colors.primary[400], alignContent: "center", justifyItems: "center" }}>
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
          </Box>

          {/* Sign In Form */}
          <Box sx={{ width: "40%", height: "100%", backgroundColor: colors.grey[100], alignContent: "center", justifyItems: "center" }}>
            {/* Header */}
            <Box sx={{ width: "70%", justifyItems: "start" }}>
              <Typography variant="h2" color={colors.grey[700]} fontWeight="bold" sx={{ mb: "5px" }}>
                Sign In
              </Typography>
            </Box>

            {firebaseError && 
              <Typography variant="h5" color={colors.redAccent[500]} sx={{ mt: 3, }}>
                {firebaseError}
              </Typography>
            }
            
            <Box sx={{ width: "70%" }}>
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
                        input: { 
                          color: colors.primary[400],
                          "&:-webkit-autofill": {
                            WebkitBoxShadow: "0 0 0 100px rgba(255, 232, 189, 1) inset !important",
                            WebkitTextFillColor: "#141b2d !important",
                          },
                        },
                        "& .MuiInputLabel-root": { 
                          color: colors.grey[700],
                          "&.Mui-focused": { color: colors.blueAccent[500] },
                          "&.Mui-error": { color: colors.redAccent[500] },
                        },
                        "& .MuiOutlinedInput-root": {
                          "& fieldset": { borderColor: colors.grey[200] },
                          "&:hover fieldset": { borderColor: colors.blueAccent[500] },
                          "&.Mui-focused fieldset": { borderColor: colors.blueAccent[500] },
                          "&.Mui-error fieldset": { borderColor: colors.redAccent[500] },
                          "&.Mui-error:hover fieldset": { borderColor: colors.redAccent[500] },
                        },
                        "& .MuiFormHelperText-root": {
                          "&.Mui-error": { color: colors.redAccent[500] },
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
                              sx={{ color: colors.grey[700] }}
                            >
                              {showPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        input: { 
                          color: colors.primary[400],
                          "&:-webkit-autofill": {
                            WebkitBoxShadow: "0 0 0 100px rgba(255, 232, 189, 1) inset !important",
                            WebkitTextFillColor: "#141b2d !important",
                          },
                        },
                        "& .MuiInputLabel-root": { 
                          color: colors.grey[700],
                          "&.Mui-focused": { color: colors.blueAccent[500] },
                          "&.Mui-error": { color: colors.redAccent[500] },
                        },
                        "& .MuiOutlinedInput-root": {
                          "& fieldset": { borderColor: colors.grey[200] },
                          "&:hover fieldset": { borderColor: colors.blueAccent[500] },
                          "&.Mui-focused fieldset": { borderColor: colors.blueAccent[500] },
                          "&.Mui-error fieldset": { borderColor: colors.redAccent[500] },
                          "&.Mui-error:hover fieldset": { borderColor: colors.redAccent[500] },
                        },
                        "& .MuiFormHelperText-root": {
                          "&.Mui-error": { color: colors.redAccent[500] },
                        },
                      }}
                    />

                    {/* Sign In Button */}
                    <Button 
                      type="submit" 
                      variant="contained" 
                      sx={{ 
                        mt: 2, 
                        height: "48px",
                        backgroundColor: colors.blueAccent[400], 
                        color: colors.grey[100],
                        "&:hover": { backgroundColor: colors.blueAccent[500] },
                        "&.Mui-disabled": { 
                          backgroundColor: colors.blueAccent[200], 
                          color: colors.grey[900] 
                        }
                      }} 
                      disabled={isSubmitting || !isValid || !dirty}
                    >
                      {isSubmitting ? (
                        <CircularProgress size={24} sx={{ color: colors.grey[100] }} />
                      ) : (
                        "Sign In"
                      )}
                    </Button>
                  </form>
                )}
              </Formik>
            </Box>
          </Box>
        </Paper>
      )}
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