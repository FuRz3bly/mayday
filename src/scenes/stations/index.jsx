// React & Hooks
import { useState, useEffect, useContext } from "react";  

// Material UI (MUI) Components  
import {  
  Box, IconButton, Button, Typography, MenuItem, Select,  
  FormControl, InputLabel, Tooltip, Dialog, DialogContent, useTheme  
} from "@mui/material";  

// MUI Data Grid Components  
import {  
  DataGrid,  
  GridToolbarContainer, GridToolbarQuickFilter,  
  GridToolbarDensitySelector, GridToolbarExport,  
  GridToolbarColumnsButton, GridToolbarFilterButton,  
  GridPagination  
} from "@mui/x-data-grid";  

// Theme & Styling  
import { tokens } from "../../theme";  

// MUI Icons  
import ToggleOffOutlinedIcon from '@mui/icons-material/ToggleOffOutlined';  
import ToggleOnOutlinedIcon from '@mui/icons-material/ToggleOnOutlined';  
import DeleteSweepOutlinedIcon from '@mui/icons-material/DeleteSweepOutlined';
import VpnKeyOutlinedIcon from '@mui/icons-material/VpnKeyOutlined';  
import BorderColorOutlinedIcon from '@mui/icons-material/BorderColorOutlined';  
import AddLocationAltOutlinedIcon from '@mui/icons-material/AddLocationAltOutlined';  

// Data & Context  
import { DataContext } from "../../data";  
// import { mockDataInvoices } from "../../data/mockData"; // Commented out permanently

// Local Components
import Header from "../../components/Header";  
import AddStationForm from "../../components/AddStation";  
import EditStationForm from "../../components/EditStation";  

// Firebase
import { deleteDoc, updateDoc, doc, serverTimestamp } from "firebase/firestore";  
import { db } from "../../config/firebaseConfig";  

const Stations = () => {
  const { 
    stations, loadingStations, 
    startStationsListener, stopStationsListener 
  } = useContext(DataContext); // Stations and listeners  

  const theme = useTheme(); // MUI Theme Hook
  const colors = tokens(theme.palette.mode); // Theme Colors  

  const [isListening, setIsListening] = useState(false); // If the Table has Real-time updates  
  const [selectedType, setSelectedType] = useState("all"); // Filter based on Station Type 
  const [selectedStations, setSelectedStations] = useState([]); // Selected Stations  
  const [formattedStations, setFormattedStations] = useState([]); // Format Stations for Display
  const [editingStation, setEditingStation] = useState(null); // Edit this Station 
  const [addVisible, setAddVisible] = useState(false); // Add Station Dialog Visibility
  const [editVisible, setEditVisible] = useState(false); // Edit Station Dialog Visibility


  // Format Stations For Table
  useEffect(() => {
    if (loadingStations) return;

    setFormattedStations(
      stations.map(({ id, station, address, key, responders, service }) => {
        const keyDate = key?.date?.toDate ? key.date.toDate() : null;
        const { status, timeRemaining } = checkKeyExpiration(keyDate);

        // Determine the service type
        let serviceDisplay = "None";
        if (service?.vehicle && Array.isArray(service.vehicle)) {
          const firetruckCount = service.vehicle.filter(v => v.firetruck).length;
          const ambulanceCount = service.vehicle.filter(v => v.ambulance).length;

          const firetruckText = firetruckCount > 1 ? `Firetruck (${firetruckCount})` : firetruckCount === 1 ? "Firetruck" : "";
          const ambulanceText = ambulanceCount > 1 ? `Ambulance (${ambulanceCount})` : ambulanceCount === 1 ? "Ambulance" : "";

          // Combine service types with commas if both exist
          serviceDisplay = [firetruckText, ambulanceText].filter(Boolean).join(", ") || "None";
        }

        return {
          id: id || "N/A",
          name: station?.name || "N/A",
          address: address ? `${address.barangay || ""}, ${address.municipality || ""}, ${address.province || ""}` : "N/A",
          type: station?.type ? `${station.type.charAt(0).toUpperCase()}${station.type.slice(1)}` : "N/A",
          key_date: keyDate
            ? keyDate.toLocaleString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: true,
              })
            : "N/A",
          key_pass: key?.pass || "N/A",
          key_status: status,
          key_timeRemaining: timeRemaining,
          responder_count: responders ? responders.length : 0,
          service_type: serviceDisplay,
        };
      })
    );
  }, [stations, loadingStations]);

  // Filtered Rows Based on selectedType
  const filteredStations = formattedStations.filter((station) => {
    if (selectedType === "all") return true; // Show all Stations

    const stationType = station.type.toLowerCase(); // Ensure case consistency

    switch (selectedType) {
      case "fire":
        return stationType === "fire";
      case "police":
        return stationType === "police";
      case "disaster":
        return stationType === "disaster";
      case "barangay":
        return stationType === "barangay";
      default:
        return false;
    }
  });

  const columns = [
    { field: "name", headerName: "Name", flex: 1.5, cellClassName: "name-column--cell" },
    { field: "address", headerName: "Address", flex: 1.5 },
    { field: "type", headerName: "Type", flex: 1 },
    { field: "key_date", headerName: "Key Date", flex: 1 },
    { 
      field: "key_pass", 
      headerName: "Key Pass", 
      flex: 1,
      renderCell: ({ row }) => (
        <Tooltip title={row.key_status === "Active" ? row.key_timeRemaining : "Expired"} arrow>
          <span>
            {row.key_pass}
          </span>
        </Tooltip>
      ),
    },    
    { field: "responder_count", headerName: "Responders", type: "number", headerAlign: "left", align: "left", flex: 0.5 },
    { field: "service_type", headerName: "Service", flex: 1 },
  ];  

  // Toggle Real-time Listener
  const handleToggleListener = () => {
    if (isListening) {
      stopStationsListener();
    } else {
      startStationsListener();
    }
    setIsListening(!isListening);
  };

  // Select Station Type on Dropdown Button
  const handleTypeSelect = (event) => {
    setSelectedType(event.target.value);
  };

  // Delete Function
  const handleDelete = async () => {
    if (selectedStations.length === 0) {
      alert("Please select stations to delete.");
      return;
    }
  
    const confirmDelete = window.confirm(`Are you sure you want to delete ${selectedStations.length} station(s)?`);
    if (!confirmDelete) return;
  
    try {
      await Promise.all(
        selectedStations.map(async (stationId) => {
          const stationRef = doc(db, "stations", stationId);
          await deleteDoc(stationRef);
        })
      );
  
      alert("Selected stations deleted successfully.");
      setSelectedStations([]); // Clear selection after deletion
    } catch (error) {
      console.error("Error deleting stations:", error);
      alert("Failed to delete stations.");
    }
  };

  // Reset Key Function
  const handleResetKey = async () => {
    if (selectedStations.length === 0) {
      alert("Please select stations to reset the key.");
      return;
    }
  
    try {
      await Promise.all(
        selectedStations.map(async (stationId) => {
          const stationRef = doc(db, "stations", stationId);
          await updateDoc(stationRef, {
            "key.date": serverTimestamp(),
            "key.pass": Math.floor(1000 + Math.random() * 9000), // Generates a random 4-digit number
          });
        })
      );
  
      alert("Key(s) reset successfully.");
      setSelectedStations([]); // Clear selection
    } catch (error) {
      console.error("Error resetting keys:", error);
      alert("Failed to reset key(s).");
    }
  };

  // Edit Function
  const handleEdit = () => {
    if (selectedStations.length === 1) {
      const selectedStation = stations.find((station) => station.station.id === selectedStations[0]);
      setEditingStation(selectedStation);
      setEditVisible(true);
      console.log("Selected Station:", selectedStation);
    }
  };

  const closeEdit = () => {
    setEditVisible(false);
  };

  // Add Station Function
  const handleAdd = () => {
    setAddVisible(true);
  };

  const closeAdd = () => {
    setAddVisible(false);
  };

  // Stations Management Toolbar Component
  const StationToolbar = () => {
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
          {/* Station Type Dropdown */}
          <Tooltip 
            title={"Categorize Station By Type"} 
            placement="bottom" 
            sx={{ bgcolor: "gray.700", color: "white" }} // Tooltip styling
          >
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel
              sx={{
                backgroundColor: theme.palette.mode === 'dark' ? colors.primary[500] : "#fcfcfc",
                color: colors.grey[100],
                fontSize: "16px",
                paddingX: "15px"
              }}>
                {'Station Type'}
              </InputLabel>
            <Select value={selectedType} onChange={handleTypeSelect}>
              {stationTypes.map((type) => (
                <MenuItem key={type.value} value={type.value}>
                  {type.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          </Tooltip>

          {/* Add Station */}
          <Tooltip 
            title={"Add Station"} 
            placement="bottom" 
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
              <AddLocationAltOutlinedIcon sx={{ mr: "10px" }} />
              Add Station
            </Button>
          </Tooltip>
        </Box>
      </GridToolbarContainer>
    );
  };

  // Stations Management Footer Tools Component
  const StationFootTools = () => {
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
          {selectedStations.length > 0 && `${selectedStations.length} selected`}
        </Typography>
        {/* Default Pagination Component */}
        <GridPagination />
        
        {/* Delete Button */}
        <Tooltip 
          title={"Delete Station(s)"} 
          placement="top" 
          sx={{ bgcolor: "gray.700", color: "white" }} // Tooltip styling
        >
          <span>
            <Button
              sx={{
                backgroundColor: selectedStations.length > 0 ? colors.greenAccent[400] : colors.blueAccent[900],
                color: colors.grey[900],
                fontSize: "12px",
                fontWeight: "bold",
                padding: "5px 10px",
                marginX: 1,
                "&:hover": {
                  backgroundColor: selectedStations.length > 0 ? colors.greenAccent[500] : colors.blueAccent[800],
                },
              }}
              onClick={handleDelete}
              disabled={selectedStations.length === 0}
            >
              <DeleteSweepOutlinedIcon sx={{ mr: "10px" }} />
              Delete
            </Button>
          </span>
        </Tooltip>

        {/* Edit Button */}
        <Tooltip
          title={
            selectedStations.length > 1
              ? "Editing multiple stations is not allowed"
              : "Edit Station"
          }
          placement="top"
          sx={{ bgcolor: "gray.700", color: "white" }}
        >
          <span>
            <Button
              sx={{
                backgroundColor:
                  selectedStations.length === 1
                    ? colors.greenAccent[400]
                    : colors.blueAccent[900],
                color: colors.grey[900],
                fontSize: "12px",
                fontWeight: "bold",
                padding: "5px 10px",
                marginX: 1,
                "&:hover": {
                  backgroundColor:
                    selectedStations.length === 1
                      ? colors.greenAccent[500]
                      : colors.blueAccent[800],
                },
              }}
              onClick={handleEdit}
              disabled={selectedStations.length !== 1} // Disable if multiple or no stations selected
            >
              <BorderColorOutlinedIcon sx={{ mr: "10px" }} />
              Edit
            </Button>
          </span>
        </Tooltip>

        {/* Reset Key Button */}
        <Tooltip 
          title="Reset Key(s)"
          placement="top" 
          sx={{ bgcolor: "gray.700", color: "white" }} // Tooltip styling
        >
          <span>
            <Button
              sx={{
                backgroundColor: selectedStations.length > 0 ? colors.greenAccent[400] : colors.blueAccent[900],
                color: colors.grey[900],
                fontSize: "12px",
                fontWeight: "bold",
                padding: "5px 10px",
                marginX: 1,
                "&:hover": {
                  backgroundColor: selectedStations.length > 0 ? colors.greenAccent[500] : colors.blueAccent[800],
                },
              }}
              onClick={handleResetKey} // Toggle function
              disabled={selectedStations.length === 0}
            >
              <VpnKeyOutlinedIcon sx={{ mr: "10px" }} />
              {"Reset Key(s)"}
            </Button>
          </span>
        </Tooltip>
      </Box>
    );
  };

  return (
    <Box m="20px">
      {/* Add Station Modal */}
      <Dialog open={addVisible} onClose={closeAdd} fullWidth maxWidth="md">
        <DialogContent sx={{ backgroundColor: theme.palette.mode === "dark" ? colors.primary[500] : colors.primary[900] }}>
          <AddStationForm onClose={closeAdd} />
        </DialogContent>
      </Dialog>

      {/* Edit Station Modal */}
      <Dialog open={editVisible} onClose={closeEdit} fullWidth maxWidth="md">
        <DialogContent sx={{ backgroundColor: theme.palette.mode === "dark" ?  colors.primary[500] : colors.primary[900] }}>
          {editingStation && <EditStationForm onClose={closeEdit} station={editingStation} />}
        </DialogContent>
      </Dialog>

      <Header title="STATIONS" subtitle="Managing Indang's Stations" />
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
          rows={filteredStations} 
          columns={columns}
          slots={{
            toolbar: StationToolbar,
            footer: StationFootTools
          }}
          onRowSelectionModelChange={(ids) => setSelectedStations(ids)} // Track selected IDs
        />
      </Box>
    </Box>
  );
};

// Station Type Selection
const stationTypes = [
  { value: "all", label: "All" },
  { value: "fire", label: "Fire Stations" }, // C1
  { value: "police", label: "Police Stations" }, // B1
  { value: "disaster", label: "Disaster Stations" }, // C2
  { value: "barangay", label: "Barangay Stations" }, // C3
];

// Checking the Expiration of Key
const checkKeyExpiration = (keyDate) => {
  if (!keyDate) return { status: "Expired", timeRemaining: "N/A" };

  const now = new Date(); // Current time
  //const keyDayStart = new Date(keyDate.getFullYear(), keyDate.getMonth(), keyDate.getDate(), 0, 0, 0);
  const keyDayEnd = new Date(keyDate.getFullYear(), keyDate.getMonth(), keyDate.getDate(), 23, 59, 59);

  if (now > keyDayEnd) {
    return { status: "Expired", timeRemaining: "N/A" };
  }

  // Calculate remaining time
  const timeDiff = keyDayEnd - now;
  const hours = Math.floor(timeDiff / (1000 * 60 * 60));
  const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

  return {
    status: "Active",
    timeRemaining: `${hours}h ${minutes}m remaining`,
  };
};

export default Stations;