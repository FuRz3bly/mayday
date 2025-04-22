import { useState, useEffect } from "react";
import { tokens } from "../theme";
import { Box, Button, CircularProgress, TextField, Autocomplete, Snackbar, Alert, Dialog, DialogContent, InputAdornment, useTheme } from "@mui/material";
import useMediaQuery from "@mui/material/useMediaQuery";
import Header from "./Header";
import { decode as base64Decode } from 'base-64';
// Firebase
import {
  updateDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../config/firebaseConfig";

const ReviewUser = ({ onClose, user }) => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    const isNonMobile = useMediaQuery("(min-width:600px)");
    const [formValues, setFormValues] = useState(initialValues);
    const [viewableID, setViewableID] = useState(null);
    const [isIDLoading, setIDLoading] = useState(false);

    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [isReject, setReject] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState("");
    const [snackbarSeverity, setSnackbarSeverity] = useState("success");

    const [rejectReason, setRejectReason] = useState("");
    const [customReason, setCustomReason] = useState(false);
    const [customReasonText, setCustomReasonText] = useState("");
    const [requestMessage, setRequestMessage] = useState("");

    // Generate a simple hashed key from user_id + auth_uid using Web Crypto API
    const generateKey = async (user_id, auth_uid) => {
        const encoder = new TextEncoder();
        const data = encoder.encode(user_id + auth_uid);
        const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
        
        // Convert buffer to hex string
        return Array.from(new Uint8Array(hashBuffer))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    };

    // Decrypting URL
    const decryptURL = async (encodedURL, user_id, auth_uid) => {
        if (!encodedURL) return null;
        
        const decoded = base64Decode(encodedURL);
        const parts = decoded.split("::");
        
        if (parts.length !== 2) {
            console.error("Decryption failed: Invalid format");
            return null;
        }
        
        const [storedHash, originalURL] = parts;
        
        // Verify integrity using the key
        const key = await generateKey(user_id, auth_uid);
        const iv = key.slice(0, 16);
        
        const encoder = new TextEncoder();
        const data = encoder.encode(iv + originalURL);
        const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
        const expectedHash = Array.from(new Uint8Array(hashBuffer))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
        
        if (storedHash !== expectedHash) {
            console.error("Decryption failed: Hash mismatch");
            return null;
        }
        
        return originalURL;
    };

    // Populate form values and decrypt ID photo
    useEffect(() => {
        const loadUserData = async () => {
            setIDLoading(true);
            
            // Populate form values from user object
            if (user) {
                const newFormValues = {
                    ...initialValues,
                    id: user.user_id || "",
                    idNumber: user.info?.id_no || "",
                    idType: user.info?.id_type || "",
                    firstName: user.name?.first_name || "User",
                    lastName: user.name?.last_name || "Verification",
                    sex: formatSex(user.sex),
                    birthdate: formatBirthdate(user.birthdate || ""),
                    age: calculateAge(user.birthdate || ""),
                    phone: user.phone || "",
                    address: user.address ? 
                        `${user.address.barangay || "Unknown"}, Indang, Cavite` : 
                        "Unknown, Indang, Cavite"
                };
                
                setFormValues(newFormValues);
            }
            
            // Decrypt ID photo if available
            if (user?.photos?.id && user?.user_id && user?.auth_uid) {
                try {
                    const decryptedURL = await decryptURL(
                        user.photos.id,
                        user.user_id,
                        user.auth_uid
                    );
                    
                    if (decryptedURL) {
                        setViewableID(decryptedURL);
                        setIDLoading(false);
                    } else {
                        console.error("Decryption returned empty result");
                        setIDLoading(false);
                    }
                    
                } catch (error) {
                    console.error("Failed to decrypt ID photo:", error);
                    setIDLoading(false);
                }
            } else {
                console.log("Missing required data to decrypt ID photo");
                setIDLoading(false);
            }
        };

        loadUserData();
    // eslint-disable-next-line
    }, [user]);

    // Approve Function
    const handleApprove = async () => {
        try {
            const userRef = doc(db, "users", user.user_id);
            await updateDoc(userRef, {
                "verified.id": true,
                "verified.status": 1,
                "account.last_updated": serverTimestamp(),
            });
            
            setSnackbarMessage(`${user?.name?.last_name} approved successfully.`);
            setSnackbarSeverity("success");
            setOpenSnackbar(true);
            onClose();
        } catch (error) {
            console.error("Error approving user:", error);
            setSnackbarMessage("Failed to approve user.");
            setSnackbarSeverity("error");
            setOpenSnackbar(true);
            onClose();
        }
    };

    // Request ID
    const handleRequest = async (msg) => {
        try {
            const userRef = doc(db, "users", user.user_id);
            await updateDoc(userRef, {
                "verified.id": false,
                "verified.status": 0,
                "info.command": 'submit',
                "info.message": msg,
                "account.last_updated": serverTimestamp(),
            });
            
            setSnackbarMessage(`${user?.name?.last_name} requested successfully.`);
            setSnackbarSeverity("success");
            setOpenSnackbar(true);
            onClose();
        } catch (error) {
            console.error("Error requesting user:", error);
            setSnackbarMessage("Failed to request user.");
            setSnackbarSeverity("error");
            setOpenSnackbar(true);
            onClose();
        }
    };

    // Reject Function
    const handleReject = async (msg) => {
        try {
            const userRef = doc(db, "users", user.user_id);
            await updateDoc(userRef, {
                "verified.id": false,
                "verified.status": 2,
                "info.command": 'resubmit',
                "info.message": msg,
                "account.last_updated": serverTimestamp(),
            });
            
            setSnackbarMessage(`${user?.name?.last_name} ID rejected successfully.`);
            setSnackbarSeverity("success");
            setOpenSnackbar(true);
            onClose();
        } catch (error) {
            console.error("Error rejecting user:", error);
            setSnackbarMessage("Failed to reject user.");
            setSnackbarSeverity("error");
            setOpenSnackbar(true);
            onClose();
        }
    };

    // Add a function to handle closing the Snackbar
    const handleCloseSnackbar = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setOpenSnackbar(false);
    };

    // Cancel Reject Function
    const handleCancelReject = () => {
        setReject(false);
        setRejectReason("");
        setCustomReason(false);
        setCustomReasonText("");
    };

    return (
        <Box m="20px">
            {/* Notification */}
            <Snackbar
                open={openSnackbar} 
                autoHideDuration={6000} 
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <Alert 
                    onClose={handleCloseSnackbar} 
                    severity={snackbarSeverity} 
                    variant="filled"
                    sx={{ width: '100%' }}
                >
                    {snackbarMessage}
                </Alert>
            </Snackbar>

            <Header 
                title="REVIEW USER" 
                subtitle={`Pending User Verification Approval`}
            />

            <Box mt="20px" />

            {/* Reject Popup */}
            <Dialog
                open={isReject}
                onClose={handleCancelReject}
                PaperProps={{
                    sx: {
                        backgroundColor: colors.primary[500],
                        boxShadow: 'none',
                        padding: 2,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        height: '30%',
                        minWidth: '900px',
                        maxWidth: '900px'
                    },
                    elevation: 0,
                }}
            >
                <DialogContent
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        backgroundColor: 'transparent',
                        width: '100%',
                    }}
                >
                    <Header 
                        title="REJECT ID" 
                        subtitle="Please state the reason for rejecting this ID." 
                    />
                    
                    <Box
                        display="grid"
                        gap="30px"
                        gridTemplateColumns="repeat(4, minmax(0, 1fr))"
                        sx={{
                            "& > div": { gridColumn: isNonMobile ? undefined : "span 4" },
                            mt: 2,
                        }}
                    >
                        {customReason ? (
                            <>
                                <Autocomplete
                                    options={[
                                        "Photo is blurry or unreadable",
                                        "ID is expired or invalid",
                                        "ID image is incomplete or cropped",
                                        "Incorrect document was uploaded",
                                        "ID appears to be altered or fraudulent",
                                        "Key information on the ID is not visible",
                                        "ID number does not match the account",
                                        "Type of ID does not match the uploaded image",
                                        "Name on the ID does not match account information",
                                        "Address on the ID does not match account information",
                                        "Date of birth on the ID does not match account information",
                                        "Other (please specify)"
                                    ]}
                                    value={rejectReason}
                                    onChange={(event, newValue) => {
                                        setRejectReason(newValue);
                                        if (newValue === "Other (specify reason)") {
                                            setCustomReason(true);
                                            setCustomReasonText("");
                                        } else {
                                            setCustomReason(false);
                                        }
                                    }}
                                    sx={{ gridColumn: "span 2" }}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            fullWidth
                                            variant="filled"
                                            label="Rejection Reason"
                                            name="rejectReason"
                                        />
                                    )}
                                />
                                <TextField
                                    fullWidth
                                    variant="filled"
                                    label="Custom Reason"
                                    onChange={(e) => setCustomReasonText(e.target.value)}
                                    value={customReasonText}
                                    name="customReason"
                                    sx={{ gridColumn: "span 2" }}
                                />
                            </>
                        ) : (
                            <Autocomplete
                                options={[
                                    "Photo is blurry or unreadable",
                                    "ID is expired or invalid",
                                    "ID image is incomplete or cropped",
                                    "Incorrect document was uploaded",
                                    "ID appears to be altered or fraudulent",
                                    "Key information on the ID is not visible",
                                    "ID number does not match the account",
                                    "Type of ID does not match the uploaded image",
                                    "Name on the ID does not match account information",
                                    "Address on the ID does not match account information",
                                    "Date of birth on the ID does not match account information",
                                    "Other (please specify)"
                                ]}
                                value={rejectReason}
                                onChange={(event, newValue) => {
                                    setRejectReason(newValue);
                                    if (newValue === "Other (specify reason)") {
                                        setCustomReason(true);
                                        setCustomReasonText("");
                                    } else {
                                        setCustomReason(false);
                                    }
                                }}
                                sx={{ gridColumn: "span 4" }}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        fullWidth
                                        variant="filled"
                                        label="Rejection Reason"
                                        name="rejectReason"
                                    />
                                )}
                            />
                        )}
                    </Box>

                    {/* Action Buttons */}
                    <Box display="flex" justifyContent="end" mt='20px' sx={{ gap: 2 }}>
                        <Button 
                            variant="contained" 
                            color="error" 
                            onClick={handleCancelReject}
                        >
                            Cancel
                        </Button>
                        <Button 
                            variant="contained" 
                            color="secondary"
                            onClick={() => {
                                const finalReason = customReason ? customReasonText : rejectReason;
                                handleReject(finalReason);
                                handleCancelReject();
                            }}
                            disabled={!rejectReason || (customReason && !customReasonText)}
                        >
                            Confirm
                        </Button>
                    </Box>
                </DialogContent>
            </Dialog>

            <Box
                display="grid"
                gap="30px"
                gridTemplateColumns="repeat(4, minmax(0, 1fr))"
                sx={{
                    "& > div": { gridColumn: isNonMobile ? undefined : "span 4" },
                    position: "relative",
                }}
            >

                {isIDLoading && (
                    <CircularProgress 
                        size={40} 
                        sx={{ 
                            color: 'white', 
                            position: 'absolute',
                            left: '50%',
                            top: '50%',
                            transform: 'translate(-50%, -50%)',
                            zIndex: 1
                        }} 
                    />
                )}

                {viewableID && (
                    <>
                        <Box
                            component="img"
                            src={viewableID}
                            alt="User ID"
                            onLoad={() => setIDLoading(false)}
                            onError={() => {
                                console.error("Error loading image");
                                setIDLoading(false); 
                            }}
                            sx={{
                                gridColumn: "span 4",
                                height: "300px",
                                width: "100%",
                                objectFit: "contain",
                                backgroundColor: "transparent",
                                pointerEvents: "none",
                                "& .MuiInputBase-input": {
                                    color: "inherit",
                                },
                                display: isIDLoading ? 'none' : 'block',
                            }}
                        />
                        
                        {/* Type of ID */}
                        <TextField
                            fullWidth
                            variant="filled"
                            type="text"
                            label="Type of ID"
                            name="idType"
                            value={formValues.idType}
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

                        {/* ID Number */}
                        <TextField
                            fullWidth
                            variant="filled"
                            type="text"
                            label="ID Number"
                            name="idNumber"
                            value={formValues.idNumber}
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
                        
                        {/* First Name */}
                        <TextField
                            fullWidth
                            variant="filled"
                            type="text"
                            label="First Name"
                            name="firstName"
                            value={formValues.firstName}
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

                        {/* Last Name */}
                        <TextField
                            fullWidth
                            variant="filled"
                            type="text"
                            label="Last Name"
                            name="lastName"
                            value={formValues.lastName}
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

                        {/* Birthdate */}
                        <TextField
                            fullWidth
                            variant="filled"
                            type="text"
                            label="Birthdate"
                            name="birthdate"
                            value={formValues.birthdate}
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

                        {/* Age */}
                        <TextField
                            fullWidth
                            variant="filled"
                            type="text"
                            label="Age"
                            name="age"
                            value={formValues.age}
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

                        {/* Sex */}
                        <TextField
                            fullWidth
                            variant="filled"
                            type="text"
                            label="Sex"
                            name="sex"
                            value={formValues.sex}
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
                        
                        {/* Phone Number */}
                        <TextField
                            fullWidth
                            variant="filled"
                            type="text"
                            label="Phone Number"
                            name='Phone'
                            value={formValues.phone}
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

                        {/* Address */}
                        <TextField
                            fullWidth
                            variant="filled"
                            type="text"
                            name="address"
                            label="Address"
                            value={formValues.address}
                            readOnly
                            sx={{
                                gridColumn: "span 4",
                                backgroundColor: "transparent",
                                pointerEvents: "none",
                                "& .MuiInputBase-input": {
                                    color: "inherit",
                                },
                            }}
                        />
                    </>
                )}

                {!viewableID && !isIDLoading && (
                    <TextField
                        fullWidth
                        variant="filled"
                        type="text"
                        label="ID Status"
                        value="No ID Uploaded"
                        readOnly
                        sx={{
                            gridColumn: "span 4",
                            backgroundColor: "transparent",
                            "& .MuiInputBase-input": {
                                color: "inherit",
                        },
                        }}
                        slotProps={{
                        input: {
                            endAdornment: (
                            <InputAdornment position="end">
                                <Button 
                                    onClick={() => handleRequest("Please upload an ID")} 
                                    color="secondary" 
                                    variant="contained"
                                    sx={{ mr: -1 }}
                                >
                                    Request
                                </Button>
                            </InputAdornment>
                            ),
                        },
                        }}
                    />
                )}
            </Box>

            {/* Action Buttons */}
            <Box display="flex" justifyContent="end" mt={isIDLoading ? "60px" : "20px"}>
                {/* Close */}
                <Button onClick={onClose} color="error" variant="contained">
                    Close
                </Button>
                {/* Reject Button */}
                <Button onClick={() => setReject(true)} color="secondary" variant="contained" disabled={!viewableID} sx={{ mx: 2 }}>
                    Reject
                </Button>
                {/* Approval Button */}
                <Button onClick={handleApprove} color="secondary" variant="contained" disabled={!viewableID}>
                    Approve
                </Button>
            </Box>
        </Box>
    )
};

// Default Values
const initialValues = {
    // User
    id: "D1ABCDefghIJKLmnopQ",
    idNumber: "1234-5678-9012-3456",
    idType: "None",
    firstName: "User",
    lastName: "Verification",
    sex: "Rather Not Say",
    age: "30",
    phone: "09123456789",
    address: "Unknown, Indang, Cavite",
    birthdate: "1990-01-01",
};

// Helper function to format date as "Month DD, YYYY"
const formatBirthdate = (dateString) => {
    if (!dateString) return "";
    
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    } catch (error) {
        console.error("Error formatting date:", error);
        return dateString;
    }
};

// Helper function to calculate age from birthdate
const calculateAge = (birthdate) => {
    if (!birthdate) return "";
    
    try {
        const birthDate = new Date(birthdate);
        const today = new Date();
        
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        
        return age.toString();
    } catch (error) {
        console.error("Error calculating age:", error);
        return "";
    }
};

// Helper function to convert sex number to string
const formatSex = (sexNumber) => {
    if (sexNumber === 0) return "Male";
    if (sexNumber === 1) return "Female";
    if (sexNumber === 2) return "Rather Not Say";
    return "";
};

export default ReviewUser;