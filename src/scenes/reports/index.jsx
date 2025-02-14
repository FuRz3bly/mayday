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

import { tokens } from "../../theme";

// Data & Context  
import { DataContext } from "../../data";
//import { mockDataTeam } from "../../data/mockData"; // Commented out permanently

// MUI Icons  
import ToggleOffOutlinedIcon from '@mui/icons-material/ToggleOffOutlined';  
import ToggleOnOutlinedIcon from '@mui/icons-material/ToggleOnOutlined';
import LoupeOutlinedIcon from '@mui/icons-material/LoupeOutlined';
import DeleteSweepOutlinedIcon from '@mui/icons-material/DeleteSweepOutlined';
import BorderColorOutlinedIcon from '@mui/icons-material/BorderColorOutlined';
import IosShareOutlinedIcon from '@mui/icons-material/IosShareOutlined';

// Firebase
import { doc, setDoc, getDoc, deleteDoc } from "firebase/firestore";  
import { db } from "../../config/firebaseConfig";

// Local Components
import Header from "../../components/Header";
import AddReportForm from "../../components/AddReport";
import EditReportForm from "../../components/EditReport";
import DispatchReportForm from "../../components/DispatchReport";

const Reports = () => {
  const { 
      users, stations, reports, loadingReports, 
      startReportsListener, stopReportsListener 
    } = useContext(DataContext); // Reports and listeners

  const theme = useTheme(); // MUI Theme Hook
  const colors = tokens(theme.palette.mode); // Theme Colors

  const [isListening, setIsListening] = useState(false); // If the Table has Real-time updates
  const [selectedType, setSelectedType] = useState("all"); // Filter based on Reports
  const [selectedReports, setSelectedReports] = useState([]); // Selected Reports
  const [addVisible, setAddVisible] = useState(false); // Add Station Dialog Visibility
  const [formattedReports, setFormattedReports] = useState([]);
  const [editingReport, setEditingReport] = useState(null); // Edit this Report
  const [editVisible, setEditVisible] = useState(false); // Edit Report Dialog Visibility
  const [dispatchingReport, setDispatchingReport] = useState(null); // Dispatch this Report
  const [dispatchVisible, setDispatchVisible] = useState(false); // Dispatch Report Visibility

  // Format reports when "reports" changes
  useEffect(() => {
    if (!loadingReports) {
        const formatted = reports.map((report) => ({
            id: report.id,
            name: `${report.reporter.name.first_name} ${report.reporter.name.last_name}`,
            status: statusText[report.status] || "Unknown",
            address: `${report.address.barangay}, ${report.address.municipality}, ${report.address.province}`,
            date: report.date.incident 
              ? report.date.incident.toDate().toLocaleString("en-US", { 
                  year: "numeric", 
                  month: "long", 
                  day: "numeric", 
                  hour: "2-digit", 
                  minute: "2-digit", 
                  second: "2-digit", 
                  hour12: true 
              }) 
              : "N/A",
            service: serviceText[report.service] || "Unknown",
        }));

        setFormattedReports(formatted);
    }
  }, [reports, loadingReports]);

  const columns = [
    { field: "id", headerName: "ID", flex: 1 },
    { field: "name", headerName: "Reporter", flex: 1, cellClassName: "name-column--cell" },
    { field: "status", headerName: "Status", flex: 1 },
    { field: "address", headerName: "Address", flex: 1 },
    { field: "date", headerName: "Date", flex: 1 },
    { field: "service", headerName: "Service", flex: 1 },
  ];

  // Filtered Rows Based on ReportType
  const filteredRows = formattedReports.filter((row) => {
    return selectedType === "all" || row.service === serviceText[Number(selectedType)];
  });

  // Select Station Type on Dropdown Button
  const handleTypeSelect = (event) => {
    setSelectedType(event.target.value);
  };

  // Toggle Real-time Listener
  const handleToggleListener = () => {
    if (isListening) {
      stopReportsListener();
    } else {
      startReportsListener();
    }
    setIsListening(!isListening);
  };

  // Add Station Function
  const handleAdd = () => {
    setAddVisible(true);
  };

  const closeAdd = () => {
    setAddVisible(false);
  };

  // Delete Function
  const handleDelete = async () => {
    if (selectedReports.length === 0) {
      alert("Please select reports to delete.");
      return;
    }
  
    const confirmDelete = window.confirm(`Are you sure you want to delete ${selectedReports.length} report(s)?`);
    if (!confirmDelete) return;
  
    try {
      // Reference to the report counter document
      const counterRef = doc(db, "metadata", "reports_count");
      const counterSnap = await getDoc(counterRef);
  
      // Retrieve and decrement report count
      const currentCount = counterSnap.exists() ? counterSnap.data().count : 0;
      const newCount = Math.max(0, currentCount - selectedReports.length); // Prevent negative count
  
      // Delete reports
      await Promise.all(
        selectedReports.map(async (reportID) => {
          const reportRef = doc(db, "reports", reportID);
          await deleteDoc(reportRef);
        })
      );
  
      // Update Firestore with the new count
      await setDoc(counterRef, { count: newCount }, { merge: true });
  
      alert("Selected report(s) deleted successfully.");
      setSelectedReports([]); // Clear selection after deletion
    } catch (error) {
      console.error("Error deleting report(s):", error);
      alert("Failed to delete report(s).");
    }
  };

  // Edit Function
  const handleEdit = () => {
    if (selectedReports.length === 1) {
      const selectedReport = reports.find((report) => report.id === selectedReports[0]);
      setEditingReport(selectedReport);
      setEditVisible(true);
    }
  };

  const closeEdit = () => {
    setEditVisible(false);
  };

  // Dispatch Function
  const handleDispatch = () => {
    if (selectedReports.length === 1) {
        const selectedReport = reports.find((report) => report.id === selectedReports[0]);

        if (!selectedReport || selectedReport.status !== 0) {
            return; // Exit if the report is not found or its status is not Pending (0)
        }

        setDispatchingReport(selectedReport);
        setDispatchVisible(true);
    }
  };

  const closeDispatch = () => {
    setDispatchVisible(false);
  };

  // Reports Management Toolbar Component
  const ReportToolbar = () => {
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
          {/* Report Service Dropdown */}
          <Tooltip 
            title={"Categorize Reports By Service"} 
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
                {'Services Required'}
              </InputLabel>
            <Select value={selectedType} onChange={handleTypeSelect}>
              {reportTypes.map((type) => (
                <MenuItem key={type.value} value={type.value}>
                  {type.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          </Tooltip>

          {/* Add Report */}
          <Tooltip 
            title={"Add Report"} 
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
              <LoupeOutlinedIcon sx={{ mr: "10px" }} />
              Add Report
            </Button>
          </Tooltip>
        </Box>
      </GridToolbarContainer>
    );
  };

  // Reports Management Footer Tools Component
  const ReportFootTools = () => {
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
          {selectedReports.length > 0 && `${selectedReports.length} selected`}
        </Typography>
        {/* Default Pagination Component */}
        <GridPagination />
        
        {/* Delete Button */}
        <Tooltip 
          title={"Delete Report(s)"} 
          placement="top" 
          sx={{ bgcolor: "gray.700", color: "white" }} // Tooltip styling
        >
          <Button
            sx={{
              backgroundColor: selectedReports.length > 0 ? colors.greenAccent[400] : colors.blueAccent[900],
              color: colors.grey[900],
              fontSize: "12px",
              fontWeight: "bold",
              padding: "5px 10px",
              marginX: 1,
              "&:hover": {
                backgroundColor: selectedReports.length > 0 ? colors.greenAccent[500] : colors.blueAccent[800],
              },
            }}
            onClick={handleDelete}
            disabled={selectedReports.length === 0}
          >
            <DeleteSweepOutlinedIcon sx={{ mr: "10px" }} />
            Delete
          </Button>
        </Tooltip>

        {/* Edit Button */}
        <Tooltip
          title={
            selectedReports.length > 1
              ? "Editing multiple reports is not allowed"
              : "Edit Report"
          }
          placement="top"
          sx={{ bgcolor: "gray.700", color: "white" }}
        >
          <Button
            sx={{
              backgroundColor:
                selectedReports.length === 1
                  ? colors.greenAccent[400]
                  : colors.blueAccent[900],
              color: colors.grey[900],
              fontSize: "12px",
              fontWeight: "bold",
              padding: "5px 10px",
              marginX: 1,
              "&:hover": {
                backgroundColor:
                  selectedReports.length === 1
                    ? colors.greenAccent[500]
                    : colors.blueAccent[800],
              },
            }}
            onClick={handleEdit}
            disabled={selectedReports.length !== 1} // Disable if multiple or no stations selected
          >
            <BorderColorOutlinedIcon sx={{ mr: "10px" }} />
            Edit
          </Button>
        </Tooltip>

        {/* Dispatch Button */}
        <Tooltip
          title={
            selectedReports.length > 1
              ? "Dispatching multiple reports is not allowed"
              : selectedReports.length === 1 && reports.find(report => report.id === selectedReports[0])?.status !== 0
              ? "Only pending reports can be dispatched"
              : "Dispatch Report"
          }
          placement="top"
          sx={{ bgcolor: "gray.700", color: "white" }}
        >
          <Button
            sx={{
              backgroundColor:
                selectedReports.length === 1 &&
                reports.find(report => report.id === selectedReports[0])?.status === 0
                  ? colors.greenAccent[400]
                  : colors.blueAccent[900],
              color: colors.grey[900],
              fontSize: "12px",
              fontWeight: "bold",
              padding: "5px 10px",
              marginX: 1,
              "&:hover": {
                backgroundColor:
                  selectedReports.length === 1 &&
                  reports.find(report => report.id === selectedReports[0])?.status === 0
                    ? colors.greenAccent[500]
                    : colors.blueAccent[800],
              },
            }}
            onClick={handleDispatch}
            disabled={
              selectedReports.length !== 1 ||
              reports.find(report => report.id === selectedReports[0])?.status !== 0
            } // Disable if multiple, none, or report is not Pending (0)
          >
            <IosShareOutlinedIcon sx={{ mr: "10px" }} />
            Dispatch
          </Button>
        </Tooltip>
      </Box>
    );
  };

  return (
    <Box m="20px">
      {/* Add Report Modal */}
      <Dialog open={addVisible} onClose={closeAdd} fullWidth maxWidth="md">
        <DialogContent sx={{ backgroundColor: theme.palette.mode === "dark" ? colors.primary[500] : colors.primary[900] }}>
          <AddReportForm onClose={closeAdd} users={users} />
        </DialogContent>
      </Dialog>

      {/* Edit Station Modal */}
      <Dialog open={editVisible} onClose={closeEdit} fullWidth maxWidth="md">
        <DialogContent sx={{ backgroundColor: theme.palette.mode === "dark" ?  colors.primary[500] : colors.primary[900] }}>
          {editingReport && <EditReportForm onClose={closeEdit} users={users} stations={stations} report={editingReport} />}
        </DialogContent>
      </Dialog>

      {/* Dispatch Report Modal */}
      <Dialog open={dispatchVisible} onClose={closeDispatch} fullWidth maxWidth="md">
        <DialogContent sx={{ backgroundColor: theme.palette.mode === "dark" ?  colors.primary[500] : colors.primary[900] }}>
          {dispatchingReport && <DispatchReportForm onClose={closeDispatch} users={users} stations={stations} report={dispatchingReport} />}
        </DialogContent>
      </Dialog>

      <Header title="REPORTS" subtitle="Managing the Community Reports" />
      
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
            toolbar: ReportToolbar,
            footer: ReportFootTools
          }}
          onRowSelectionModelChange={(ids) => setSelectedReports(ids)}
        />
      </Box>
    </Box>
  );
};

// Report Type Selection
const reportTypes = [
  { value: "all", label: "All" },
  { value: "0", label: "None" },
  { value: "1", label: "Firetruck" },
  { value: "2", label: "Ambulance" },
  { value: "3", label: "Both" },
];

// Convert numbers to readable text
const statusText = ["Pending", "Acknowledged", "Responding", "Resolved", "Archived", "Reopened"];
const serviceText = ["None", "Firetruck", "Ambulance", "Firetruck & Ambulance"];

export default Reports;