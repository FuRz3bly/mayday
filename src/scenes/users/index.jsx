import { useState, useEffect, useContext } from "react";
import { Box, IconButton, Button, Typography, MenuItem, Select, FormControl, InputLabel, Tooltip, Dialog, DialogContent } from "@mui/material";
import {
  DataGrid,
  GridToolbarContainer,
  GridToolbarQuickFilter,
  GridToolbarDensitySelector,
  GridToolbarExport,
  GridToolbarColumnsButton,
  GridToolbarFilterButton,
  GridPagination
} from "@mui/x-data-grid"; // Import Gridbar Tools for User's Toolbar
import DeleteSweepOutlinedIcon from '@mui/icons-material/DeleteSweepOutlined';
import BlockOutlinedIcon from '@mui/icons-material/BlockOutlined';
import ForwardToInboxOutlinedIcon from '@mui/icons-material/ForwardToInboxOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import BorderColorOutlinedIcon from '@mui/icons-material/BorderColorOutlined';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import PersonAddAlt1OutlinedIcon from '@mui/icons-material/PersonAddAlt1Outlined';
import ToggleOffOutlinedIcon from '@mui/icons-material/ToggleOffOutlined';
import ToggleOnOutlinedIcon from '@mui/icons-material/ToggleOnOutlined';
import { tokens } from "../../theme"; // Themes
import Header from "../../components/Header"; // For Header
import { useTheme } from "@mui/material";
import { deleteDoc, updateDoc, doc, serverTimestamp, Timestamp } from "firebase/firestore";
import { sendPasswordResetEmail } from "firebase/auth";
import { db, auth } from "../../config/firebaseConfig";
import { DataContext } from "../../data";
import AddUserForm from "../../components/AddUser"
import EditUserForm from "../../components/EditUser";

const Users = () => {
  const { users, loadingUsers, startUsersListener, stopUsersListener } = useContext(DataContext); // Data Context
  const [isListening, setIsListening] = useState(false); // Check if Is Listening
  const theme = useTheme(); // For Usage of Themes
  const colors = tokens(theme.palette.mode); // Mode Appropriate Colors
  const [selectedUsers, setSelectedUsers] = useState([]); // Selected Users
  const [editingUser, setEditingUser] = useState(null); // Editing Users
  const [formattedUsers, setFormattedUsers] = useState([]); // Formatted Users
  const [selectedType, setSelectedType] = useState("all"); // Highest Filter - User Type
  const [addVisible, setAddVisible] = useState(false); // Add User Dialog State
  const [editVisible, setEditVisible] = useState(false); // Edit User Dialog State
  // eslint-disable-next-line
  const [exportFileName, setExportFileName] = useState(
    `Users_Data_${new Date().toISOString().slice(0, 10)}` // YYYY-MM-DD format
  );

  // Format Users For Table
  useEffect(() => {
    if (!loadingUsers) {
      console.log("Users Data:", users);
      setFormattedUsers(
        users.map((user) => {
          const isDisabled = !user.account?.access;
          const accessTime = user.account?.access_clock;
          const timeUntilAccess = isDisabled ? String(calculateTimeLeft(accessTime) === "Enabled" ? "Enabled" : String(calculateTimeLeft(accessTime))) : "Enabled";

          return {
            name: user.name ? `${user.name.first_name || ""} ${user.name.last_name || ""}` : "N/A",
            username: user.username || "N/A",
            id: user.user_id || user.id,
            email: user.email || "N/A",
            phone: user.phone || "N/A",
            age: user.birthdate ? calculateAge(user.birthdate) : "N/A",
            role_id: user.role?.id || "",
            role_name: user.role?.name || "N/A",
            reports: user.role?.reports || 0,
            address: user.address
              ? `${user.address.barangay || ""}, ${user.address.municipality || ""}, ${user.address.province || ""}`
              : "N/A",
            verified:
              user.verified?.id === null && user.verified?.barangay === null
                ? "Rejected"
                : user.verified?.id && user.verified?.barangay
                ? "Yes"
                : "No",
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
        })
      );
    }
  }, [users, loadingUsers]);

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

  // Check if Selected Users Need Approval
  const allUnverified = selectedUsers.length > 0 && selectedUsers.every((userId) => {
    const user = users.find((u) => u.user_id === userId || u.id === userId);
    return user?.verified?.id === false && user?.verified?.barangay === false;
  });

  // If ANY user has either id OR barangay as TRUE, return TRUE
  // eslint-disable-next-line
  const hasAnyVerified = selectedUsers.some((userId) => {
      const user = users.find((u) => u.user_id === userId || u.id === userId);
      return user?.verified?.id === true || user?.verified?.barangay === true;
  });

  // Select User Type on Dropdown Button
  const handleTypeSelect = (event) => {
    setSelectedType(event.target.value);
  };

  // Table Columns
  const columns = [
    { field: "name", headerName: "Full Name", flex: 1.5, cellClassName: "name-column--cell" },
    { field: "username", headerName: "Username", flex: 1 },
    { field: "email", headerName: "Email", flex: 1 },
    { field: "phone", headerName: "Phone Number", flex: 1 },
    { field: "age", headerName: "Age", type: "number", headerAlign: "left", align: "left", flex: 0.5 },
    { field: "role_name", headerName: "Role", flex: 1 },
    { field: "reports", headerName: "Reports", type: "number", headerAlign: "left", align: "left", flex: 0.5 },
    { field: "address", headerName: "Address", flex: 1.5 },
    { field: "verified", headerName: "Verified", flex: 0.7 },
    { field: "last_login", headerName: "Last Login", flex: 1 },
    {
      field: "account_status",
      headerName: "Account Status",
      width: 200,
      renderCell: (params) => params.value,
    },
  ];

  // Toggle Real-time Listener
  const handleToggleListener = () => {
    if (isListening) {
      stopUsersListener();
    } else {
      startUsersListener();
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

  // Approve / Verify Function
  const handleApprove = async () => {
    if (selectedUsers.length === 0) {
      alert("Please select users to approve.");
      return;
    }
  
    try {
      await Promise.all(
        selectedUsers.map(async (userId) => {
          const userRef = doc(db, "users", userId);
          await updateDoc(userRef, {
            "verified.id": true,
            "verified.barangay": true,
            "verified.barangay_id": generateID(),
            "account.last_updated": serverTimestamp(),
          });
        })
      );
  
      alert("Selected users approved successfully.");
      setSelectedUsers([]); // Clear selection
    } catch (error) {
      console.error("Error approving users:", error);
      alert("Failed to approve users.");
    }
  };
  
  // Decline / Reject Function
  const handleDecline = async () => {
    if (selectedUsers.length === 0) {
      alert("Please select users to decline.");
      return;
    }
  
    try {
      await Promise.all(
        selectedUsers.map(async (userId) => {
          const userRef = doc(db, "users", userId);
          await updateDoc(userRef, {
            "verified.id": null,
            "verified.barangay": null,
            "verified.barangay_id": generateID(),
            "account.last_updated": serverTimestamp(),
          });
        })
      );
  
      alert("Selected users declined successfully.");
      setSelectedUsers([]); // Clear selection
    } catch (error) {
      console.error("Error declining users:", error);
      alert("Failed to decline users.");
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

  // Users Management Toolbar Component
  const UserToolbar = () => {
    return (
      <GridToolbarContainer sx={{ display: "flex", justifyContent: "space-between", p: 1 }}>
        {/* Default Toolbar Tools */}
        <Box display="flex" gap={2}>
          {/* Listener Toggle Buttons */}
          <Box display="flex" gap={1}>
            <Tooltip 
              title={isListening ? "Stop Listening" : "Start Listening"} 
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

          {/* Add User */}
          <Tooltip 
            title={"Add User"} 
            placement="top" 
            sx={{ bgcolor: "gray.700", color: "white" }} // Tooltip styling
          >
            <Button
              sx={{
                backgroundColor: colors.blueAccent[700],
                color: colors.grey[100],
                fontSize: "12px",
                fontWeight: "bold",
                padding: "5px 10px",
                marginLeft: 3,
                marginTop: "10px",
                "&:hover": {
                  backgroundColor: colors.blueAccent[800],
                },
              }}
              onClick={handleAdd}
            >
              <PersonAddAlt1OutlinedIcon sx={{ mr: "10px" }} />
              Add User
            </Button>
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
          p: 2, 
          backgroundColor: colors.blueAccent[700] 
        }}
      >
        {/* Left Section: Selection Counter */}
        <Typography color={colors.grey[100]} fontSize="14px">
          {selectedUsers.length > 0 && `${selectedUsers.length} selected`}
        </Typography>
        {/* Default Pagination Component */}
        <GridPagination />
        
        {/* Delete Button */}
        <Tooltip 
          title={"Delete User(s)"} 
          placement="top" 
          sx={{ bgcolor: "gray.700", color: "white" }} // Tooltip styling
        >
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
        </Tooltip>

        {/* Disable/Ban Button */}
        <Tooltip 
          title={allDisabled ? "Enable User(s)" : "Disable User(s)"} 
          placement="top" 
          sx={{ bgcolor: "gray.700", color: "white" }} // Tooltip styling
        >
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
        </Tooltip>

        {/* Approve/Reject Button */}
        {allUnverified && (
          <>
            {/* Approve Button */}
            <Tooltip title="Approve User(s)" placement="top">
              <Button
                sx={{
                  backgroundColor: colors.greenAccent[400],
                  color: colors.grey[900],
                  fontSize: "12px",
                  fontWeight: "bold",
                  padding: "5px 10px",
                  marginX: 1,
                  "&:hover": { backgroundColor: colors.greenAccent[500] },
                }}
                onClick={handleApprove}
              >
                <CheckCircleIcon sx={{ mr: "10px" }} />
                Approve
              </Button>
            </Tooltip>
            {/* Reject Button */}
            <Tooltip title="Decline User(s)" placement="top">
              <Button
                sx={{
                  backgroundColor: colors.redAccent[400],
                  color: colors.grey[900],
                  fontSize: "12px",
                  fontWeight: "bold",
                  padding: "5px 10px",
                  marginX: 1,
                  "&:hover": { backgroundColor: colors.redAccent[500] },
                }}
                onClick={handleDecline}
              >
                <CancelIcon sx={{ mr: "10px" }} />
                Decline
              </Button>
            </Tooltip>
          </>
        )}

        {/* Reset Password Button */}
        <Tooltip 
          title={"Reset User(s) Password(s)"} 
          placement="top" 
          sx={{ bgcolor: "gray.700", color: "white" }} // Tooltip styling
        >
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
        </Tooltip>
      </Box>
    );
  };

  return (
    <Box m="20px">
      {/* Add User Modal */}
      <Dialog open={addVisible} onClose={closeAdd} fullWidth maxWidth="md">
        <DialogContent sx={{ backgroundColor: theme.palette.mode === "dark" ? colors.primary[500] : colors.primary[900] }}>
          <AddUserForm onClose={closeAdd} />
        </DialogContent>
      </Dialog>

      {/* Edit User Modal */}
      <Dialog open={editVisible} onClose={closeEdit} fullWidth maxWidth="md">
        <DialogContent sx={{ backgroundColor: theme.palette.mode === "dark" ?  colors.primary[500] : colors.primary[900] }}>
          {editingUser && <EditUserForm onClose={closeEdit} user={editingUser} onSubmit={(data) => console.log("Updated Data:", data)} onChangePass={handleResetPassword} />}
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
          onRowSelectionModelChange={(ids) => setSelectedUsers(ids)} // Track selected IDs
        />
      </Box>
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
const generateID = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let randomID = "";
  for (let i = 0; i < 20; i++) {
    randomID += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return randomID;
};

// User Type Selection
const userTypes = [
  { value: "all", label: "All" },
  { value: "admin", label: "Admins" }, // Covers A1 & A2
  { value: "community", label: "Community" }, // D1
  { value: "responder", label: "Responders" }, // Covers B1, C1, C2, C3
  { value: "responder_fire", label: "Fire Responder" }, // C1
  { value: "responder_police", label: "Police Responder" }, // B1
  { value: "responder_disaster", label: "Disaster Responder" }, // C2
  { value: "responder_barangay", label: "Barangay Responder" }, // C3
];

export default Users;