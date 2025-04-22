// React & Hooks
import { useState, useEffect, useRef, useContext } from "react";

// Material UI Components
import {
  Box,
  IconButton,
  Button,
  Typography,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Tooltip,
  Dialog,
  DialogContent,
  capitalize,
  useTheme
} from "@mui/material";

// MUI Icons
import DeleteSweepOutlinedIcon from '@mui/icons-material/DeleteSweepOutlined';
import BlockOutlinedIcon from '@mui/icons-material/BlockOutlined';
import ForwardToInboxOutlinedIcon from '@mui/icons-material/ForwardToInboxOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import BorderColorOutlinedIcon from '@mui/icons-material/BorderColorOutlined';
import PersonAddAlt1OutlinedIcon from '@mui/icons-material/PersonAddAlt1Outlined';
import ToggleOffOutlinedIcon from '@mui/icons-material/ToggleOffOutlined';
import ToggleOnOutlinedIcon from '@mui/icons-material/ToggleOnOutlined';
import PrintIcon from '@mui/icons-material/Print';
import ContactPageIcon from '@mui/icons-material/ContactPage';

// Material UI DataGrid
import {
  DataGrid,
  GridToolbarContainer,
  GridToolbarQuickFilter,
  GridToolbarDensitySelector,
  GridToolbarExport,
  GridToolbarColumnsButton,
  GridToolbarFilterButton,
  GridPagination
} from "@mui/x-data-grid";

// Firebase
import {
  deleteDoc,
  updateDoc,
  doc,
  serverTimestamp,
  Timestamp
} from "firebase/firestore";
import { sendPasswordResetEmail } from "firebase/auth";
import { db, auth } from "../../config/firebaseConfig";

// Context & Theming
import { tokens } from "../../theme";
import { DataContext } from "../../data";

// Printing Components
import html2pdf from 'html2pdf.js/dist/html2pdf.min.js';

// Local Components
import Header from "../../components/Header";
import AddUserForm from "../../components/AddUser";
import EditUserForm from "../../components/EditUser";
import FilterPrint from "../../components/FilterPrint";
import PerformanceForm from "../../components/PerformanceForm";
import ReviewUser from "../../components/ReviewUser";

const Users = () => {
  const { 
    users, stations, responds, loadingUsers, 
    startUsersListener, stopUsersListener,
    startResponsesListener, stopResponsesListener } = useContext(DataContext); // Data Context
  const [isListening, setIsListening] = useState(false); // Check if Is Listening
  const theme = useTheme(); // For Usage of Themes
  const colors = tokens(theme.palette.mode); // Mode Appropriate Colors
  const [selectedUsers, setSelectedUsers] = useState([]); // Selected Users
  const [editingUser, setEditingUser] = useState(null); // Editing Users
  const [formattedUsers, setFormattedUsers] = useState([]); // Formatted Users
  const [selectedType, setSelectedType] = useState("all"); // Highest Filter - User Type
  const [addVisible, setAddVisible] = useState(false); // Add User Dialog State
  const [editVisible, setEditVisible] = useState(false); // Edit User Dialog State

  const summaryRef = useRef(null);
  const page1Ref = useRef(null);
  const page2Ref = useRef(null);
  const page3Ref = useRef(null);

  // eslint-disable-next-line
  const [filters, setFilters] = useState({ primary: "", secondary: "" });
  const [filterVisible, setFilterVisible] = useState(false); // Edit User Dialog State

  const [isPrinting, setPrinting] = useState(false);
  const [printReadyFilters, setPrintReadyFilters] = useState(null);
  const [printResponses, setPrintResponses] = useState(null);
  const [printResponseTime, setPrintResponseTime] = useState(null);
  const [printIndividual, setPrintIndividual] = useState(null);

  const [reviewVisible, setReviewVisible] = useState(false);
  const [reviewingUser, setReviewingUser] = useState(null);

  // Format Users For Table
  useEffect(() => {
    if (!loadingUsers) {
      const filteredUsers = users.filter(user => user.role?.id !== "A1");
  
      setFormattedUsers(
        filteredUsers.map((user) => {
          const isDisabled = !user.account?.access;
          const accessTime = user.account?.access_clock;
          const timeUntilAccess = isDisabled ? String(calculateTimeLeft(accessTime) === "Enabled" ? "Enabled" : String(calculateTimeLeft(accessTime))) : "Enabled";
          
          // Check if user is a responder
          const responderRoles = ["B1", "C1", "C2", "C3"];
          const isResponder = responderRoles.includes(user.role?.id);
          
          // Format name with rank for responders
          let formattedName = user.name ? `${user.name.first_name || ""} ${user.name.last_name || ""}` : "N/A";
          if (isResponder && user.station?.rank) {
            formattedName = `${user.station.rank} ${formattedName}`;
          }

          // Determine verification status and create the appropriate display element
          let verificationStatusDisplay;

          if (user.verified) {
            const idVerified = user.verified.id === true;
            const emailVerified = user.verified.email === true;
            const verificationStatus = user.verified.status;
            
            if (idVerified && emailVerified) {
              verificationStatusDisplay = "Verified";
            } else if (idVerified && !emailVerified) {
              verificationStatusDisplay = (
                <Tooltip title="User's email is not yet verified" arrow>
                  <span style={{ color: colors.greenAccent[400] }}>Pending Email</span>
                </Tooltip>
              );
            } else if (!idVerified && emailVerified) {
              verificationStatusDisplay = verificationStatus === 2 
                ? (
                  <Tooltip title={`ID rejected - ${user.info?.message || 'Resubmission required'}`} arrow>
                    <span style={{ color: colors.greenAccent[500] }}>Pending Resubmit</span>
                  </Tooltip>
                )
                : (
                  <Tooltip title="User's ID is not yet verified" arrow>
                    <span style={{ color: colors.greenAccent[400] }}>Pending ID</span>
                  </Tooltip>
                );
            } else {
              // Both ID and email not verified or explicitly set to false
              if (verificationStatus === 2) {
                verificationStatusDisplay = (
                  <Tooltip title={`Rejected - ${user.info?.message || 'Resubmission required'}`} arrow>
                    <span style={{ color: colors.greenAccent[500] }}>Pending Resubmit</span>
                  </Tooltip>
                );
              } else if (user.info?.command === 'submit') {
                verificationStatusDisplay = (
                  <Tooltip title="Verification in progress" arrow>
                    <span style={{ color: colors.greenAccent[400] }}>Pending Verification</span>
                  </Tooltip>
                );
              } else {
                const idMsg = user.verified.id === false ? "ID rejected" : "";
                const separator = user.verified.id === false && user.verified.email === false ? ", " : "";
                const emailMsg = user.verified.email === false ? "Email rejected" : "";
                
                verificationStatusDisplay = (
                  <Tooltip title={`Rejected: ${idMsg}${separator}${emailMsg}`} arrow>
                    <span style={{ color: colors.redAccent[400] }}>Rejected</span>
                  </Tooltip>
                );
              }
            }
          } else {
            verificationStatusDisplay = "No";
          }
          
          // Base user object with common fields
          const formattedUser = {
            name: formattedName,
            id: user.user_id || user.id,
            email: user.email || "N/A",
            phone: user.phone || "N/A",
            age: user.birthdate ? calculateAge(user.birthdate) : "N/A",
            sex: user.sex !== undefined && user.sex >= 0 && user.sex < sexOptions.length ? sexOptions[user.sex] : "N/A",
            role_id: user.role?.id || "",
            role_name: capitalize(user.role?.name) || "N/A",
            reports: user.role?.reports || 0,
            address: user.address
              ? `${user.address.barangay || ""}, ${user.address.municipality || ""}, ${user.address.province || ""}`
              : "N/A",
            verified: verificationStatusDisplay,
            last_login:
              user.session?.last_login instanceof Timestamp
                ? user.session.last_login.toDate().toLocaleString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                    hour12: true,
                  })
                : "N/A",
            account_status: isDisabled ? (
              <Tooltip title={`Disabled - Access in ${timeUntilAccess}`} arrow>
                <span style={{ color: colors.redAccent[400] }}>Disabled</span>
              </Tooltip>
            ) : (
              "Enabled"
            ),
            profile_photo: user.photos?.profile || null,
          };
          
          // Add responder-specific fields
          if (isResponder) {
            formattedUser.station_name = user.station?.name || "N/A";
            formattedUser.station_id = user.station?.id || "N/A";
            // Don't need to add rank separately since it's now part of the name
            
            // Count responses for this responder
            const responseCount = responds.filter(response => 
              response.responder?.user_id === (user.user_id || user.id)
            ).length;
            
            formattedUser.responses = responseCount;
          }
          
          return formattedUser;
        })
      );
    }
  // eslint-disable-next-line 
  }, [users, loadingUsers, responds]);

  // Filtered Rows Based on selectedType
  const filteredRows = formattedUsers.filter((row) => {
    if (selectedType === "all") return true; // Show all Users
  
    const roleId = row.role_id || "";
  
    switch (selectedType) {
      case "community":
        return roleId === "D1"; // Community Users
      case "responder":
        return roleId.startsWith("B") || roleId.startsWith("C"); // All Responders (Police, Fire, Disaster, Barangay)
      case "responder_fire":
        return roleId === "C1"; // Fire Responder
      case "responder_police":
        return roleId === "B1"; // Police Responder
      case "responder_disaster":
        return roleId === "C2"; // Disaster Responder
      case "responder_barangay":
        return roleId === "C3"; // Barangay Responder
      case "admin":
        return roleId.startsWith("A"); // All Admins (Super / Head, Station)
      default:
        return false;
    }
  });

  // Check if Selected User's Accounts are Disabled
  const allDisabled = selectedUsers.length > 0 && selectedUsers.every((userId) => {
      const user = users.find((u) => u.user_id === userId || u.id === userId);
      return user?.account?.access === false;
  });

  // Check if selected users are fully verified
  const isVerified = selectedUsers.length > 0 && selectedUsers.every((userId) => {
    const user = users.find((u) => u.user_id === userId || u.id === userId);
    return user?.verified?.id === true && user?.verified?.email === true;
  });

  // Select User Type on Dropdown Button
  const handleTypeSelect = (event) => {
    setSelectedType(event.target.value);
  };

  // Table Columns
  const columns = [
    { field: "name", headerName: "Full Name", flex: 1.2, cellClassName: "name-column--cell" },
    { field: "station_name", headerName: "Station", flex: 1.5 },
    { field: "email", headerName: "Email", flex: 1.7 },
    { field: "phone", headerName: "Phone Number", flex: 0.7 },
    { field: "age", headerName: "Age", type: "number", headerAlign: "left", align: "left", flex: 0.5 },
    { field: "sex", headerName: "Sex", flex: 0.5 },
    { field: "role_name", headerName: "Role", flex: 1 },
    { field: "address", headerName: "Address", flex: 1.5 },
    { field: "reports", headerName: "Reports", type: "number", headerAlign: "left", align: "left", flex: 0.5 },
    { field: "responses", headerName: "Responses", type: "number", headerAlign: "left", align: "left", flex: 0.7 },
    { field: "verified", headerName: "Verified", flex: 0.7, width: 100, renderCell: (params) => params.value,},
    { field: "last_login", headerName: "Last Login", flex: 1.3 },
    { field: "account_status", headerName: "Account Status", width: 120, renderCell: (params) => params.value,},
  ];

  // Toggle Real-time Listener
  const handleToggleListener = () => {
    if (isListening) {
      stopUsersListener();
      stopResponsesListener();
    } else {
      startUsersListener();
      startResponsesListener();
    }
    setIsListening(!isListening);
  };

  // Delete Function
  const handleDelete = async () => {
    if (selectedUsers.length === 0) {
      alert("Please select users to delete.");
      return;
    }
  
    const confirmDelete = window.confirm(`Are you sure you want to delete ${selectedUsers.length} users?`);
    if (!confirmDelete) return;
  
    try {
      await Promise.all(
        selectedUsers.map(async (userId) => {
          const userRef = doc(db, "users", userId);
          await deleteDoc(userRef);
        })
      );
  
      alert("Selected users deleted successfully.");
      setSelectedUsers([]); // Clear selection after deletion
    } catch (error) {
      console.error("Error deleting users:", error);
      alert("Failed to delete users.");
    }
  };

  // Enable Function
  const handleEnable = async () => {
    if (selectedUsers.length === 0) {
      alert("Please select users to enable.");
      return;
    }
  
    const confirmEnable = window.confirm(`Are you sure you want to enable ${selectedUsers.length} users?`);
    if (!confirmEnable) return;
  
    try {
      await Promise.all(
        selectedUsers.map(async (userId) => {
          const userRef = doc(db, "users", userId);
          await updateDoc(userRef, {
            "account.access": true,
            "account.access_clock": null,
            "account.last_updated": serverTimestamp(), // Firestore server timestamp
          });
        })
      );
  
      alert("Selected users enabled successfully.");
      setSelectedUsers([]); // Clear selection
    } catch (error) {
      console.error("Error enabling users:", error);
      alert("Failed to enable users.");
    }
  };

  // Disable / Ban Function
  const handleDisable = async (days) => {
    if (selectedUsers.length === 0) {
      alert("Please select users to disable.");
      return;
    }
  
    const confirmDisable = window.confirm(
      `Are you sure you want to disable ${selectedUsers.length} users for ${days === 0 ? "Forever" : `${days} day(s)`}?`
    );
    if (!confirmDisable) return;
  
    try {
      const disableUntil = days === 0 ? null : new Date();
      if (days > 0) disableUntil.setDate(disableUntil.getDate() + days);
  
      await Promise.all(
        selectedUsers.map(async (userId) => {
          const userRef = doc(db, "users", userId);
          await updateDoc(userRef, {
            "account.access": false,
            "account.access_clock": disableUntil ? Timestamp.fromDate(disableUntil) : null,
            "account.last_updated": serverTimestamp(),
          });
        })
      );
  
      alert("Selected users disabled successfully.");
      setSelectedUsers([]);
    } catch (error) {
      console.error("Error disabling users:", error);
      alert("Failed to disable users.");
    }
  };

  // Sends a Reset Password Function
  const handleResetPassword = async () => {
    if (selectedUsers.length === 0) {
      alert("Please select users to reset passwords.");
      return;
    }
  
    const confirmReset = window.confirm(`Are you sure you want to send a password reset email to ${selectedUsers.length} users?`);
    if (!confirmReset) return;
  
    try {
      await Promise.all(
        selectedUsers.map(async (userId) => {
          const user = users.find((u) => u.user_id === userId || u.id === userId);
          if (user && user.email) {
            await sendPasswordResetEmail(auth, user.email);
          }
        })
      );
  
      alert("Password reset emails sent successfully.");
      setSelectedUsers([]); // Clear selection after reset
    } catch (error) {
      console.error("Error sending password reset emails:", error);
      alert("Failed to send password reset emails.");
    }
  };

  // Edit Function
  const handleEdit = () => {
    if (selectedUsers.length === 1) {
      const selectedUser = users.find((user) => user.id === selectedUsers[0]);
      setEditingUser(selectedUser);
      setEditVisible(true);
      console.log("Selected User:", selectedUser);
    }
  };

  const closeEdit = () => {
    setEditVisible(false);
  };

  // Add User Function
  const handleAdd = () => {
    setAddVisible(true);
  };

  const closeAdd = () => {
    setAddVisible(false);
  };

  // Open Filter Function
  const handleFilter = () => {
    setFilterVisible(true);

    // Find the selected user
    const selectedUser = users.find((user) => user.id === selectedUsers[0] || user.user_id === selectedUsers[0]);
    
    if (selectedUser) {
      // Filter responses for this responder
      const userResponses = responds.filter(response => 
        response.responder?.user_id === (selectedUser.user_id || selectedUser.id)
      );

      setPrintResponses(userResponses);
      setPrintIndividual(selectedUser);
    }
  };

  // Close Filter Function
  const closeFilter = () => {
    setFilterVisible(false);
  };

  // Performance Review Title
  const getPRTitle = (primary, secondary, lastName) => {
    if (!primary || !secondary || !lastName) return "Performance Report";

    const year = secondary.split("-")[0];

    switch (primary) {
        case "daily": {
            const date = new Date(secondary);
            const formattedDate = date.toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
            });
            return `${lastName} Daily Performance Review - ${formattedDate}`;
        }
        case "weekly": {
            const weekNumber = secondary.split("-W")[1];
            return `${lastName} Weekly Performance Review - Week ${weekNumber}, ${year}`;
        }
        case "monthly": {
            const monthNumber = parseInt(secondary.split("-")[1], 10);
            const monthName = new Date(2025, monthNumber - 1, 1).toLocaleDateString("en-US", {
                month: "long",
            });
            return `${lastName} Monthly Performance Review - ${monthName} ${year}`;
        }
        case "quarterly": {
            const quarter = secondary.split("-Q")[1];
            const quarterName = ["Q1", "Q2", "Q3", "Q4"][quarter - 1];
            return `${lastName} Quarterly Performance Review - ${quarterName} ${year}`;
        }
        case "yearly":
            return `${lastName} Annual Performance Review - ${year}`;
        default:
            return `${lastName} Performance Report`;
    }
  };

  // Downloading Summary Function
  const downloadSummary = () => { 
    // Now check if refs are available
    if (!summaryRef.current || !page1Ref.current || !page2Ref.current || !page3Ref.current) {
        console.error("Refs not ready yet");
        setPrinting(false);
        return;
    }

    if (!printIndividual) {
      console.error("Responder Data Unavailable");
      setPrinting(false);
      return;
    }

    if (!printReadyFilters) {
        console.error("Filter Unavailable");
        setPrinting(false);
        return;
    }
    
    const style = document.createElement("style");
    style.id = "print-styles";
    style.innerHTML = `
        @media print {
            /* Basic page setup */
            .page {
                width: 650px !important;
                height: 900px !important;
                background-color: white !important;
                page-break-inside: avoid !important;
                overflow: hidden;
                box-sizing: border-box;
                display: flex !important;
                flex-direction: column !important;
                margin-top: 0 !important;
            }
            
            /* Only apply page breaks between pages, not after the last one */
            .page:not(:last-child) {
                page-break-after: always;
            }
            
            /* Explicitly prevent page break after the last page */
            .page:last-child {
                page-break-after: avoid !important;
            }
            
            /* --- Keep your alignment classes --- */
            .page1-print-align {
                justify-content: center !important;
                align-items: center !important;
                text-align: center !important;
            }
            .page2-print-align, .page3-print-align {
                justify-content: flex-start !important;
                align-items: center !important;
            }
            
            /* --- Keep body margin reset --- */
            body {
                margin: 0 !important;
            }
            
            /* --- Keep nested grid styles --- */
            .page .MuiBox-root[class*="grid"] {
                height: auto !important;
                flex-grow: 1;
            }
        }
    `;
    document.getElementById("print-styles")?.remove();
    document.head.appendChild(style);
    
    html2pdf()
        .set({
            margin: [5, 5],
            filename: getPRTitle(
              printReadyFilters?.primary, 
              printReadyFilters?.secondary, 
              printIndividual?.name?.last_name || 'Responder'
          ) + '.pdf',
            image: { type: "jpeg", quality: 0.98 },
            html2canvas: {
                scale: 2,
                useCORS: true,
            },
            jsPDF: { orientation: "portrait", unit: "px", format: [660, 910] }, // Changed to portrait and swapped dimensions
            pagebreak: { mode: ['css'], avoid: '.avoid-break' }
        })
        .from(summaryRef.current)
        .save()
        .then(() => {
            document.getElementById("print-styles")?.remove();
            console.log("PDF Generated and styles removed.");
            // Only set printing to false after PDF generation is complete
            setPrinting(false);
            setFilters({ primary: "", secondary: "" });
            setPrintResponses(null);
            setPrintIndividual(null);
            setSelectedUsers([]);
        })
        .catch((error) => {
            console.error("Error generating PDF:", error);
            document.getElementById("print-styles")?.remove();
            setPrinting(false);
            setFilters({ primary: "", secondary: "" });
            setPrintResponses(null);
            setPrintIndividual(null);
            setSelectedUsers([]);
        });
  };

  const waitForRefs = (callback, retries = 10) => {
    if (
      summaryRef.current &&
      page1Ref.current &&
      page2Ref.current &&
      page3Ref.current
    ) {
      callback();
    } else if (retries > 0) {
      setTimeout(() => waitForRefs(callback, retries - 1), 100);
    } else {
      console.error("Refs not ready after multiple retries");
      setPrinting(false);
    }
  };  

  useEffect(() => {
    if (isPrinting && printReadyFilters) {
      waitForRefs(() => {
        // Add extra delay so the charts are fully rendered visually
        setTimeout(() => {
          downloadSummary(); // Now download the PDF after additional delay
          setPrintReadyFilters(null);
        }, 500);
      });
    }
  // eslint-disable-next-line
  }, [isPrinting, printReadyFilters]);  

  // Print Responder Performance Report
  const handlePrint = (filter) => {
    // Make sure we have valid filter data
    if (!filter || !filter.primary || !filter.secondary) {
      console.error("Invalid filter provided to handlePrint", filter);
      return;
    }

    // Find the selected user
    const selectedUser = users.find((user) => user.id === selectedUsers[0] || user.user_id === selectedUsers[0]);
    
    if (selectedUser) {
      // Filter responses for this responder
      const userResponses = responds.filter(response => 
        response.responder?.user_id === (selectedUser.user_id || selectedUser.id)
      );
      
      // Filter responses by date based on primary and secondary filters
      let filteredForCalculation = [...userResponses];
      
      // Process filter
      const { primary, secondary } = filter;
      
      // Filter responses based on the filter type and value
      filteredForCalculation = userResponses.filter(response => {
        // Verify incident date exists before processing
        if (!response?.date?.incident) {
          return false;
        }
        
        try {
          // Convert Firebase timestamp to JavaScript Date
          let incidentDate;
          
          // Handle different timestamp formats
          if (response.date.incident.toMillis) {
            // Firebase Timestamp object
            incidentDate = new Date(response.date.incident.toMillis());
          } else if (typeof response.date.incident === 'object' && 'seconds' in response.date.incident) {
            // Firestore Timestamp object format
            incidentDate = new Date(response.date.incident.seconds * 1000 + (response.date.incident.nanoseconds || 0) / 1000000);
          } else if (typeof response.date.incident === 'number') {
            // Unix timestamp in milliseconds
            incidentDate = new Date(response.date.incident);
          } else if (typeof response.date.incident === 'string') {
            // String timestamp that can be parsed
            incidentDate = new Date(response.date.incident);
          } else {
            return false;
          }
          
          if (isNaN(incidentDate.getTime())) {
            return false;
          }
          
          const incidentYear = incidentDate.getFullYear();
          const incidentMonth = incidentDate.getMonth() + 1; // JavaScript months are 0-indexed
          const incidentDay = incidentDate.getDate();
          const incidentWeek = getISOWeekNumber(incidentDate);
          const incidentQuarter = Math.ceil(incidentMonth / 3);
          
          switch (primary) {
            case "daily": 
              // Format: YYYY-MM-DD
              const dailyFormat = `${incidentYear}-${String(incidentMonth).padStart(2, '0')}-${String(incidentDay).padStart(2, '0')}`;
              return dailyFormat === secondary;
              
            case "weekly":
              // Format: YYYY-WX
              const weeklyFormat = `${incidentYear}-W${incidentWeek}`;
              return weeklyFormat === secondary;
              
            case "monthly":
              // Format: YYYY-MM
              const monthlyFormat = `${incidentYear}-${String(incidentMonth).padStart(2, '0')}`;
              return monthlyFormat === secondary;
              
            case "quarterly":
              // Format: YYYY-QX
              const quarterlyFormat = `${incidentYear}-Q${incidentQuarter}`;
              return quarterlyFormat === secondary;
              
            case "yearly":
              // Format: YYYY
              return incidentYear.toString() === secondary;
              
            default:
              return false;
          }
        } catch (error) {
          console.error("Error filtering response:", error);
          return false;
        }
      });
      
      // Calculate response times and adherence to estimated times
      const responsesWithTimes = filteredForCalculation.map(response => {
        try {
          // Extract timestamps with error handling
          const responseTime = response?.date?.response ? new Date(response.date.response.toMillis()) : null;
          const arrivedTime = response?.date?.arrived ? new Date(response.date.arrived.toMillis()) : null;
          const estimatedTime = response?.date?.estimated ? new Date(response.date.estimated.toMillis()) : null;
          const resolvedTime = response?.date?.resolved ? new Date(response.date.resolved.toMillis()) : null;
          
          // Skip if missing critical timing data
          if (!responseTime || !arrivedTime) {
            return { ...response, actualResponseTime: null, adherenceRatio: null, resolveTime: null };
          }
          
          // Calculate actual response time in minutes (rounded to 2 decimal places)
          const actualResponseTime = Math.round(((arrivedTime.getTime() - responseTime.getTime()) / (1000 * 60)) * 100) / 100;
          
          // Calculate estimated time (or use default 7 minutes)
          let expectedResponseTime;
          if (estimatedTime) {
            expectedResponseTime = Math.round(((estimatedTime.getTime() - responseTime.getTime()) / (1000 * 60)) * 100) / 100;
          } else {
            expectedResponseTime = 7; // Default ETA in minutes
          }
          
          // Calculate adherence ratio (actual/expected)
          // Values > 1 mean slower than expected, < 1 mean faster than expected
          const adherenceRatio = actualResponseTime / expectedResponseTime;
          
          // Calculate resolve time (time between arrival and resolution) in hours
          let resolveTime = null;
          let resolveTimeInMinutes = null;
          let resolveTimeFormatted = null;
          
          if (resolvedTime && arrivedTime) {
            // Calculate in minutes first for accurate sorting
            resolveTimeInMinutes = Math.round(((resolvedTime.getTime() - arrivedTime.getTime()) / (1000 * 60)) * 100) / 100;
            
            // Format for display - handle days, hours, minutes based on duration
            if (resolveTimeInMinutes >= 1440) { // More than 24 hours (1 day)
              const days = Math.floor(resolveTimeInMinutes / 1440);
              const remainingMinutes = resolveTimeInMinutes % 1440;
              const hours = Math.floor(remainingMinutes / 60);
              const minutes = Math.round(remainingMinutes % 60);
              
              // Format with days, hours, minutes
              resolveTimeFormatted = `${days}d ${hours}h ${minutes}m`;
              
              // Also store in hours for calculations (with 2 decimal precision)
              resolveTime = Math.round((resolveTimeInMinutes / 60) * 100) / 100;
            }
            else if (resolveTimeInMinutes >= 60) { // More than 1 hour but less than 1 day
              const hours = Math.floor(resolveTimeInMinutes / 60);
              const minutes = Math.round(resolveTimeInMinutes % 60);
              resolveTimeFormatted = `${hours}h ${minutes}m`;
              resolveTime = Math.round((resolveTimeInMinutes / 60) * 100) / 100;
            } else { // Less than 1 hour
              resolveTimeFormatted = `${resolveTimeInMinutes} mins`;
              resolveTime = resolveTimeInMinutes / 60; // Convert to hours for calculations
            }
          }
          
          // Return enhanced response object
          return {
            ...response,
            actualResponseTime,
            expectedResponseTime,
            adherenceRatio,
            diffFromExpected: Math.round((actualResponseTime - expectedResponseTime) * 100) / 100,
            resolveTime,
            resolveTimeInMinutes,
            resolveTimeFormatted
          };
        } catch (error) {
          console.error("Error calculating response metrics:", error);
          return { 
            ...response, 
            actualResponseTime: null, 
            adherenceRatio: null, 
            resolveTime: null,
            resolveTimeInMinutes: null,
            resolveTimeFormatted: null
          };
        }
      }).filter(response => response.actualResponseTime !== null);
      
      // Calculate average response time (rounded to 2 decimal places)
      const validResponseTimes = responsesWithTimes.map(r => r.actualResponseTime).filter(time => time !== null);
      const averageResponseTime = validResponseTimes.length > 0 
        ? Math.round((validResponseTimes.reduce((sum, time) => sum + time, 0) / validResponseTimes.length) * 100) / 100
        : 0;
      
      // Calculate resolve time metrics
      const validResolveTimes = responsesWithTimes
        .map(r => r.resolveTimeInMinutes)
        .filter(time => time !== null && time !== undefined);
      
      // Calculate average resolve time in minutes first
      const averageResolveTimeInMinutes = validResolveTimes.length > 0
        ? Math.round((validResolveTimes.reduce((sum, time) => sum + time, 0) / validResolveTimes.length) * 100) / 100
        : 0;
      
      // Format average resolve time for display with days support
      let averageResolveTimeFormatted;
      if (averageResolveTimeInMinutes >= 1440) { // More than 24 hours
        const days = Math.floor(averageResolveTimeInMinutes / 1440);
        const remainingMinutes = averageResolveTimeInMinutes % 1440;
        const hours = Math.floor(remainingMinutes / 60);
        const minutes = Math.round(remainingMinutes % 60);
        averageResolveTimeFormatted = `${days}d ${hours}h ${minutes}m`;
      } else if (averageResolveTimeInMinutes >= 60) { // Between 1 hour and 24 hours
        const hours = Math.floor(averageResolveTimeInMinutes / 60);
        const minutes = Math.round(averageResolveTimeInMinutes % 60);
        averageResolveTimeFormatted = `${hours}h ${minutes}m`;
      } else { // Less than 1 hour
        averageResolveTimeFormatted = `${averageResolveTimeInMinutes} mins`;
      }
      
      // Sort responses from fastest to slowest compared to estimated time
      const sortedResponses = [...responsesWithTimes].sort((a, b) => a.adherenceRatio - b.adherenceRatio);
      
      // Sort responses by resolve time for fastest/slowest calculations
      const resolveTimeSorted = [...responsesWithTimes]
        .filter(r => r.resolveTimeInMinutes !== null && r.resolveTimeInMinutes !== undefined)
        .sort((a, b) => a.resolveTimeInMinutes - b.resolveTimeInMinutes);
      
      // Get fastest and slowest resolve times
      const fastestResolve = resolveTimeSorted.length > 0 ? resolveTimeSorted[0] : null;
      const slowestResolve = resolveTimeSorted.length > 0 ? resolveTimeSorted[resolveTimeSorted.length - 1] : null;
      
      // Store calculated response time data
      setPrintResponseTime({
        responses: sortedResponses,
        average: averageResponseTime,
        fastest: sortedResponses.length > 0 ? sortedResponses[0] : null,
        slowest: sortedResponses.length > 0 ? sortedResponses[sortedResponses.length - 1] : null,
        totalResponses: sortedResponses.length,
        // Add resolve time data
        averageResolveTime: averageResolveTimeInMinutes,
        averageResolveTimeFormatted: averageResolveTimeFormatted,
        fastestResolve: fastestResolve,
        slowestResolve: slowestResolve,
        // Add filter information for reference
        filter: {
          primary,
          secondary,
          label: `${primary.charAt(0).toUpperCase() + primary.slice(1)}: ${secondary}`
        }
      });

      console.log({
        filter: `${primary}: ${secondary}`,
        responses: sortedResponses.length,
        average: averageResponseTime,
        fastest: sortedResponses.length > 0 ? sortedResponses[0].actualResponseTime : null,
        slowest: sortedResponses.length > 0 ? sortedResponses[sortedResponses.length - 1].actualResponseTime : null,
        totalResponses: sortedResponses.length,
        // Logging resolve time data
        averageResolveTime: averageResolveTimeInMinutes,
        averageResolveTimeFormatted: averageResolveTimeFormatted,
        fastestResolve: fastestResolve ? fastestResolve.resolveTimeFormatted : null,
        slowestResolve: slowestResolve ? slowestResolve.resolveTimeFormatted : null
      });
    }
  };

  // Define the function to get column visibility based on selected type
  const getColumns = (selectedType) => ({
    name: true,
    email: true,
    phone: true,
    sex: true,
    age: true,
    role_name: selectedType === "all",
    reports: selectedType === "community", // Only show for community
    address: true, // Always show address
    verified: ["community", "admin"].includes(selectedType), // Show for community and admin
    last_login: true, // Always show last login
    account_status: true, // Always show account status
    station_name: selectedType.includes("responder"), // Show for all responder types
    responses: selectedType.includes("responder"), // Show for all responder types
  });

  const [columnVisibilityModel, setColumnVisibilityModel] = useState(getColumns(selectedType));

  const handleReview = () => {
    if (selectedUsers.length === 1) {
      const selectedUser = users.find((user) => user.id === selectedUsers[0]);
      setReviewingUser(selectedUser);
      setReviewVisible(true);
      console.log("Selected User:", selectedUser);
    }
  };

  const closeReview = () => {
    setReviewVisible(false);
  };

  useEffect(() => {
    setColumnVisibilityModel(getColumns(selectedType));
  }, [selectedType]);

  // Users Management Toolbar Component
  const UserToolbar = () => {
    return (
      <GridToolbarContainer sx={{ display: "flex", justifyContent: "space-between", p: 1 }}>
        {/* Default Toolbar Tools */}
        <Box display="flex" gap={2}>
          {/* Listener Toggle Buttons */}
          <Box display="flex" gap={1}>
            <Tooltip 
              title={isListening ? "Disconnect from Database" : "Connect to Database"} 
              placement="bottom" 
              sx={{ bgcolor: "gray.700", color: "white" }} // Tooltip styling
            >
              <IconButton 
                onClick={handleToggleListener} 
                color={isListening ? "secondary" : "default"}
                sx={{ fontSize: "2rem", padding: "5px" }}
              >
                {isListening ? (
                  <ToggleOnOutlinedIcon sx={{ fontSize: "1.5rem" }} />
                ) : (
                  <ToggleOffOutlinedIcon sx={{ fontSize: "1.5rem" }} />
                )}
              </IconButton>
            </Tooltip>
          </Box>
          {/* Show / Hide Columns Button */}
          <GridToolbarColumnsButton />
          {/* Advance Filtering Button */}
          <GridToolbarFilterButton />
          {/* Density Selector Button */}
          <GridToolbarDensitySelector />
          {/* Export to CSV Button with Custom Name */}
          <GridToolbarExport />
          {/* Search Input */}
          <Box display="flex" sx={{ marginLeft: '50px', marginTop: '5px' }}>
            <GridToolbarQuickFilter />
          </Box>
        </Box>
        
        <Box>
          {/* User Type Dropdown */}
          <Tooltip 
            title={"Categorize User By Type"} 
            placement="bottom" 
            sx={{ bgcolor: "gray.700", color: "white" }} // Tooltip styling
          >
          <FormControl sx={{ minWidth: 200 }}>
            {/* Dropdown Label - User Type */}
            <InputLabel
              sx={{
                backgroundColor: theme.palette.mode === 'dark' ? colors.primary[500] : "#fcfcfc",
                color: colors.grey[100],
                fontSize: "16px",
                paddingX: "15px"
              }}>
                {'User Type'}
              </InputLabel>
            {/* Dropdown Selection Items */}
            <Select value={selectedType} onChange={handleTypeSelect}>
              {userTypes.map((type) => (
                <MenuItem key={type.value} value={type.value}>
                  {type.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          </Tooltip>
        </Box>
      </GridToolbarContainer>
    );
  };

  // Users Management Footer Tools Component
  const UserFootTools = () => {
    return (
      <Box 
        sx={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center", 
          p: 1, 
          backgroundColor: colors.blueAccent[700] 
        }}
      >
        {/* Left Section: Selection Counter */}
        <Typography color={colors.grey[100]} fontSize="14px" ml={2}>
          {selectedUsers.length > 0 && `${selectedUsers.length} selected`}
        </Typography>
        {/* Default Pagination Component */}
        <GridPagination />

        {/* Add User */}
        <Tooltip
          title={"Add User"} 
          placement="top" 
          sx={{ bgcolor: "gray.700", color: "white" }} // Tooltip styling
        >
          <span>
            <Button
              sx={{
                backgroundColor: colors.greenAccent[400],
                color: colors.grey[900],
                fontSize: "12px",
                fontWeight: "bold",
                padding: "5px 10px",
                marginX: 1,
                "&:hover": {
                  backgroundColor: colors.greenAccent[500],
                },
              }}
              onClick={handleAdd}
            >
              <PersonAddAlt1OutlinedIcon sx={{ mr: "10px" }} />
              Add
            </Button>
          </span>
        </Tooltip>

        {/* Print Report */}
        <Tooltip
          title={
            !selectedUsers || selectedUsers.length === 0 || selectedUsers.length > 1 || 
            !users.find(user => (user.id === selectedUsers[0] || user.user_id === selectedUsers[0]))?.role?.id?.match(/^[BC][1-3]$/) 
            ? "Select a single responder to print their performance report" 
            : "Print Summary"
          } 
          placement="top" 
          sx={{ bgcolor: "gray.700", color: "white" }}
        >
          <span>
            <Button
              sx={{
                backgroundColor: colors.greenAccent[400],
                color: colors.grey[900],
                fontSize: "12px",
                fontWeight: "bold",
                padding: "5px 10px",
                marginX: 1,
                "&:hover": {
                  backgroundColor: colors.greenAccent[500],
                },
                "&.Mui-disabled": {
                  backgroundColor: colors.blueAccent[900],
                  color: colors.grey[500],
                }
              }}
              onClick={handleFilter}
              disabled={
                !selectedUsers || 
                selectedUsers.length === 0 || 
                selectedUsers.length > 1 || 
                !users.find(user => 
                  (user.id === selectedUsers[0] || user.user_id === selectedUsers[0]))?.role?.id?.match(/^[BC][1-3]$/)
              }
            >
              <PrintIcon sx={{ mr: "10px" }} />
              Print
            </Button>
          </span>
        </Tooltip>

        {/* Review Button */}
        <Tooltip
          title={
            selectedUsers.length > 1
              ? "Reviewing multiple users is not allowed"
              : selectedUsers.length === 1 && isVerified
                ? "User is already fully verified"
                : "Review User"
          }
          placement="top"
          sx={{ bgcolor: "gray.700", color: "white" }}
        >
          <span>
            <Button
              sx={{
                backgroundColor:
                  selectedUsers.length === 1 && !isVerified
                    ? colors.greenAccent[400]
                    : colors.blueAccent[900],
                color: colors.grey[900],
                fontSize: "12px",
                fontWeight: "bold",
                padding: "5px 10px",
                marginX: 1,
                "&:hover": {
                  backgroundColor:
                    selectedUsers.length === 1 && !isVerified
                      ? colors.greenAccent[500]
                      : colors.blueAccent[800],
                },
              }}
              onClick={handleReview}
              disabled={selectedUsers.length !== 1 || isVerified} 
            >
              <ContactPageIcon sx={{ mr: "10px" }} />
              Review
            </Button>
          </span>
        </Tooltip>
        
        {/* Delete Button */}
        <Tooltip 
          title={"Delete User(s)"} 
          placement="top" 
          sx={{ bgcolor: "gray.700", color: "white" }} // Tooltip styling
        >
          <span>
            <Button
              sx={{
                backgroundColor: selectedUsers.length > 0 ? colors.greenAccent[400] : colors.blueAccent[900],
                color: colors.grey[900],
                fontSize: "12px",
                fontWeight: "bold",
                padding: "5px 10px",
                marginX: 1,
                "&:hover": {
                  backgroundColor: selectedUsers.length > 0 ? colors.greenAccent[500] : colors.blueAccent[800],
                },
              }}
              onClick={handleDelete}
              disabled={selectedUsers.length === 0}
            >
              <DeleteSweepOutlinedIcon sx={{ mr: "10px" }} />
              Delete
            </Button>
          </span>
        </Tooltip>

        {/* Edit Button */}
        <Tooltip
          title={
            selectedUsers.length > 1
              ? "Editing multiple users is not allowed"
              : "Edit User"
          }
          placement="top"
          sx={{ bgcolor: "gray.700", color: "white" }}
        >
          <span>
            <Button
              sx={{
                backgroundColor:
                  selectedUsers.length === 1
                    ? colors.greenAccent[400]
                    : colors.blueAccent[900],
                color: colors.grey[900],
                fontSize: "12px",
                fontWeight: "bold",
                padding: "5px 10px",
                marginX: 1,
                "&:hover": {
                  backgroundColor:
                    selectedUsers.length === 1
                      ? colors.greenAccent[500]
                      : colors.blueAccent[800],
                },
              }}
              onClick={handleEdit}
              disabled={selectedUsers.length !== 1} // Disable if multiple or no users selected
            >
              <BorderColorOutlinedIcon sx={{ mr: "10px" }} />
              Edit
            </Button>
          </span>
        </Tooltip>

        {/* Disable/Ban Button */}
        <Tooltip 
          title={allDisabled ? "Enable User(s)" : "Disable User(s)"} 
          placement="top" 
          sx={{ bgcolor: "gray.700", color: "white" }} // Tooltip styling
        >
          <span>
            <Button
              sx={{
                backgroundColor: selectedUsers.length > 0 ? colors.greenAccent[400] : colors.blueAccent[900],
                color: colors.grey[900],
                fontSize: "12px",
                fontWeight: "bold",
                padding: "5px 10px",
                marginX: 1,
                "&:hover": {
                  backgroundColor: selectedUsers.length > 0 ? colors.greenAccent[500] : colors.blueAccent[800],
                },
              }}
              onClick={allDisabled ? handleEnable : () => handleDisable(3)} // Toggle function
              disabled={selectedUsers.length === 0}
            >
              {allDisabled ? <CheckCircleOutlinedIcon sx={{ mr: "10px" }} /> : <BlockOutlinedIcon sx={{ mr: "10px" }} />}
              {allDisabled ? "Enable" : "Disable"}
            </Button>
          </span>
        </Tooltip>

        {/* Reset Password Button */}
        <Tooltip 
          title={"Reset User(s) Password(s)"} 
          placement="top" 
          sx={{ bgcolor: "gray.700", color: "white" }} // Tooltip styling
        >
          <span>
            <Button
              sx={{
                backgroundColor: selectedUsers.length > 0 ? colors.greenAccent[400] : colors.blueAccent[900],
                color: colors.grey[900],
                fontSize: "12px",
                fontWeight: "bold",
                padding: "5px 10px",
                marginX: 1,
                "&:hover": {
                  backgroundColor: selectedUsers.length > 0 ? colors.greenAccent[500] : colors.blueAccent[800],
                },
              }}
              onClick={handleResetPassword}
              disabled={selectedUsers.length === 0}
            >
              <ForwardToInboxOutlinedIcon sx={{ mr: "10px" }} />
              Reset Password
            </Button>
          </span>
        </Tooltip>
      </Box>
    );
  };

  return (
    <Box m={(isPrinting && printReadyFilters) ? "0px" : "20px"} justifyItems={(isPrinting && printReadyFilters) ? 'center' : ''}>
      {(isPrinting && printReadyFilters) ? (
        <PerformanceForm
          refs={{ summaryRef, page1Ref, page2Ref, page3Ref }}
          printResponses={printResponses}
          printReadyFilters={printReadyFilters}
          printResponseTime={printResponseTime}
          printIndividual={printIndividual}
          theme={theme}
        />
      ) : (
        <>
          {/* Add User Modal */}
          <Dialog open={addVisible} onClose={closeAdd} fullWidth maxWidth="md">
            <DialogContent sx={{ backgroundColor: theme.palette.mode === "dark" ? colors.primary[500] : colors.primary[900] }}>
              <AddUserForm onClose={closeAdd} stations={stations} />
            </DialogContent>
          </Dialog>

          {/* Edit User Modal */}
          <Dialog open={editVisible} onClose={closeEdit} fullWidth maxWidth="md">
            <DialogContent sx={{ backgroundColor: theme.palette.mode === "dark" ?  colors.primary[500] : colors.primary[900] }}>
              {editingUser && <EditUserForm onClose={closeEdit} user={editingUser} stations={stations} onChangePass={handleResetPassword} />}
            </DialogContent>
          </Dialog>

          {/* Filter Print Modal */}
          <Dialog open={filterVisible} onClose={closeFilter} fullWidth maxWidth="md">
            <DialogContent sx={{ backgroundColor: theme.palette.mode === "dark" ?  colors.primary[500] : colors.primary[900] }}>
              {printResponses && 
                <FilterPrint 
                  onClose={closeFilter} 
                  setFilter={(selectedFilters) => {
                    setFilters(selectedFilters);              // global UI filter state (if needed elsewhere)
                    setPrintReadyFilters(selectedFilters);    // used ONLY for printing
                    handlePrint(selectedFilters);             // uses fresh values directly
                    setPrinting(true);
                  }}
                  responses={printResponses} 
                />
              }
            </DialogContent>
          </Dialog>

          {/* Review User Modal */}
          <Dialog open={reviewVisible} onClose={closeReview} fullWidth maxWidth="md">
            <DialogContent sx={{ backgroundColor: theme.palette.mode === "dark" ? colors.primary[500] : colors.primary[900] }}>
              <ReviewUser onClose={closeReview} user={reviewingUser} />
            </DialogContent>
          </Dialog>

          {/* Headers */}
          <Header 
            title="USERS" 
            subtitle="List of Registered Users"
          />
          
          {/* Database Table */}
          <Box
            height="75vh"
            sx={{
              "& .MuiDataGrid-root": {
                border: "none",
              },
              "& .MuiDataGrid-cell": {
                borderBottom: "none",
              },
              "& .name-column--cell": {
                color: colors.greenAccent[300],
              },
              "& .MuiDataGrid-columnHeaders": {
                backgroundColor: colors.blueAccent[700],
                borderBottom: "none",
              },
              "& .MuiDataGrid-virtualScroller": {
                backgroundColor: colors.primary[400],
              },
              "& .MuiDataGrid-footerContainer": {
                borderTop: "none",
                backgroundColor: colors.blueAccent[700],
              },
              "& .MuiCheckbox-root": {
                color: `${colors.greenAccent[200]} !important`,
              },
              "& .MuiDataGrid-toolbarContainer .MuiButton-text": {
                color: `${colors.grey[100]} !important`,
              } // Styling for Theme
            }}
          >
            <DataGrid
              checkboxSelection
              rows={filteredRows}
              columns={columns}
              slots={{ 
                toolbar: UserToolbar,
                footer: UserFootTools
              }}
              columnVisibilityModel={columnVisibilityModel}
              onRowSelectionModelChange={(ids) => setSelectedUsers(ids)} // Track selected IDs
              onColumnVisibilityModelChange={setColumnVisibilityModel}
            />
          </Box>
        </>
      )}
    </Box>
  );
};

// Caculate Age of Users
const calculateAge = (birthdate) => {
  const birthDateObj = new Date(birthdate);
  const today = new Date();
  let age = today.getFullYear() - birthDateObj.getFullYear();
  const monthDiff = today.getMonth() - birthDateObj.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDateObj.getDate())) {
    age--;
  }
  return age;
};

// Function to calculate the remaining time in days, hours, and minutes
const calculateTimeLeft = (accessClock) => {
  if (!accessClock) return "Unknown";

  let accessTime;
  if (accessClock instanceof Timestamp) {
    accessTime = accessClock.toDate(); // Convert Firestore Timestamp to JS Date
  } else {
    accessTime = new Date(accessClock); // Fallback for standard Date format
  }

  const now = new Date();
  const diffMs = accessTime - now; // Difference in milliseconds

  if (diffMs <= 0) return "Enabled"; // If access time has passed or is 0, user is enabled

  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  let timeString = "";
  if (diffDays > 0) timeString += `${diffDays}d `;
  if (diffHours > 0) timeString += `${diffHours}h `;
  if (diffMinutes > 0) timeString += `${diffMinutes}m`;

  return timeString.trim() || "Less than a minute";
};

// Generate a random ID
/* const generateID = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let randomID = "";
  for (let i = 0; i < 20; i++) {
    randomID += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return randomID;
}; */

// User Type Selection
const userTypes = [
  { value: "all", label: "All" },
  //{ value: "admin", label: "Admins" }, // Covers A1 & A2
  { value: "community", label: "Community" }, // D1
  { value: "responder", label: "Responders" }, // Covers B1, C1, C2, C3
  { value: "responder_fire", label: "Fire Responder" }, // C1
  { value: "responder_police", label: "Police Responder" }, // B1
  { value: "responder_disaster", label: "Disaster Responder" }, // C2
  { value: "responder_barangay", label: "Barangay Responder" }, // C3
];

// Sex Options
const sexOptions = ["Male", "Female", "Prefer not to say"];

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

export default Users;