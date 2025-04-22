// React & Hooks
import { useState, useEffect, useContext, useRef } from "react";  

// Material UI (MUI) Components 
import {  
  Box, IconButton, Button, Typography, MenuItem, Select,  
  FormControl, InputLabel, Tooltip, Dialog, DialogContent, useTheme,
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
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

// Firebase
import { doc, setDoc, getDoc, deleteDoc } from "firebase/firestore";  
import { db } from "../../config/firebaseConfig";

// Local Components
import Header from "../../components/Header";
import AddReportForm from "../../components/AddReport";
import EditReportForm from "../../components/EditReport";
import DispatchReportForm from "../../components/DispatchReport";
import ExpandReports from "../../components/ExpandReports";

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
  const [expandVisible, setExpandVisible] = useState(false); // Expand Station Dialog Visibility

  const [viewableReports, setViewableReports] = useState([]);

  const [selectedStatus, setSelectedStatus] = useState("all"); // 0 - Pending / all - Every Status / active - Every Process of Responding
  const prevSelectedStatus = useRef(selectedStatus);

  const [isTimeMinimal, setTimeMinimal] = useState(false); // If the Table has Real-time updates

  // Format reports when "reports" changes
  useEffect(() => {
    if (!loadingReports) {
      const formatted = reports.map((report) => {
        const incidentDateTime = report.date?.incident ? report.date.incident.toDate() : null;
        const receivedDateTime = report.date?.received ? report.date.received.toDate() : null;

        // Extract responders info
        const respondersList = report.responders?.providers?.length
          ? report.responders.providers
              .map((provider) => {
                const firstName = provider.personnel?.name?.first_name || "";
                const lastName = provider.personnel?.name?.last_name || "";
                return firstName && lastName ? `${firstName} ${lastName}`.trim() : "Pending Assignment";
              })
              .filter((name) => name !== "Pending Assignment")
              .join(", ") || "Pending Assignment"
          : "N/A";

        // Extract timestamps per station
        const responseTimes = [];
        const arrivedTimes = [];
        const resolvedTimes = [];

        // Extract numeric times per station
        const estimatedTimes = [];
        const arrivedDurations = [];
        const resolvedDurations = [];

        report.responders?.providers?.forEach((provider) => {
          const stationId = provider.station.id;

          // Extract timestamps (Firebase timestamps)
          if (report.date?.[stationId]?.response) {
            responseTimes.push(
              report.date[stationId].response.toDate().toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: true,
              })
            );
          }

          if (report.date?.[stationId]?.arrived) {
            arrivedTimes.push(
              report.date[stationId].arrived.toDate().toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: true,
              })
            );
          }

          if (report.date?.[stationId]?.resolved) {
            resolvedTimes.push(
              report.date[stationId].resolved.toDate().toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: true,
              })
            );
          }

          // Extract numeric values (time in minutes)
          if (report.time?.[stationId]?.estimated) {
            estimatedTimes.push(`${report.time[stationId].estimated} mins`);
          }

          if (report.time?.[stationId]?.arrived) {
            arrivedDurations.push(`${report.time[stationId].arrived} mins`);
          }

          if (report.time?.[stationId]?.resolved) {
            resolvedDurations.push(`${report.time[stationId].resolved} mins`);
          }
        });

        return {
          id: report.id,
          name: `${report.reporter.name.first_name} ${report.reporter.name.last_name}`,
          responder: respondersList,
          phone: report.reporter.phone,
          type: getTypeLabel(report.type),
          status: statusText[report.status] || "Unknown",
          address: `${report.address.barangay}, ${report.address.municipality}, ${report.address.province}`,
          date: incidentDateTime
            ? incidentDateTime.toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })
            : "N/A",
          time: incidentDateTime
            ? incidentDateTime.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: true,
              })
            : "N/A",
          service: serviceText[report.service] || "Unknown",

          // Timestamps
          received: receivedDateTime
            ? receivedDateTime.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: true,
              })
            : "N/A",
          response: responseTimes.length > 0 ? responseTimes.join(", ") : "N/A",
          arrived: arrivedTimes.length > 0 ? arrivedTimes.join(", ") : "N/A",
          resolved: resolvedTimes.length > 0 ? resolvedTimes.join(", ") : "N/A",

          // Numeric time durations
          eta: estimatedTimes.length > 0 ? estimatedTimes.join(", ") : "N/A",
          arrived_duration: arrivedDurations.length > 0 ? arrivedDurations.join(", ") : "N/A",
          resolved_duration: resolvedDurations.length > 0 ? resolvedDurations.join(", ") : "N/A",

          timestamp: incidentDateTime ? report.date.incident.toMillis() : 0,
        };
      }).sort((a, b) => b.timestamp - a.timestamp);

      setFormattedReports(formatted);
    }
  }, [reports, loadingReports]);

  const columns = [
    { field: "id", headerName: "ID", flex: 1 },
    { field: "name", headerName: "Reporter", flex: 1, cellClassName: "name-column--cell" },
    { field: "responder", headerName: "Responder", flex: 1, cellClassName: "name-column--cell" },
    { field: "phone", headerName: "Phone", flex: 1 },
    { field: "type", headerName: "Type", flex: 1 },
    { field: "status", headerName: "Status", flex: 1 },
    { field: "address", headerName: "Location", flex: 1 },
    { field: "date", headerName: "Date", flex: 1 },
    { field: "time", headerName: "Time", flex: 1 },
    { field: "service", headerName: "Service", flex: 1 },
    { field: "eta", headerName: "ETA (mins)", flex: 1 },
    { field: "received", headerName: "Received Time", flex: 1 },
    { field: "response", headerName: "Response Time", flex: 1 },
    { field: "arrived", headerName: "Arrived Time", flex: 1 },
    { field: "arrived_duration", headerName: "ATA (mins)", flex: 1 },
    { field: "resolved", headerName: "Resolved Time", flex: 1 },
    { field: "resolved_duration", headerName: "Resolution (mins)", flex: 1 },
  ];

  useEffect(() => {
    if (expandVisible && selectedReports.length > 0) {
      const fullReports = reports.filter(report => 
        selectedReports.includes(report.id)
      );
      setViewableReports(fullReports);
    }
  }, [reports, selectedReports, expandVisible]);

  // Filtered Rows Based on Report Type and Status
  const filteredRows = formattedReports.filter((row) => {
    const matchesType = selectedType === "all" || row.service === serviceText[Number(selectedType)];
    const matchesStatus =
      selectedStatus === "all" ||
      (selectedStatus === "active" && ["Acknowledged", "Responding", "Resolved"].includes(row.status)) ||
      row.status === statusText[Number(selectedStatus)];
    return matchesType && matchesStatus;
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
      const today = new Date();
      const formattedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
      
      // Reference to the daily report counter document
      const counterRef = doc(db, "metadata", "daily", "records", formattedDate);
      const counterSnap = await getDoc(counterRef);
  
      // Retrieve and decrement report count
      const currentCount = counterSnap.exists() ? counterSnap.data().reports || 0 : 0;
      const newCount = Math.max(0, currentCount - selectedReports.length); // Prevent negative count
  
      // Delete reports
      await Promise.all(
        selectedReports.map(async (reportID) => {
          const reportRef = doc(db, "reports", reportID);
          await deleteDoc(reportRef);
        })
      );
  
      // Update Firestore with the new count
      await setDoc(counterRef, { reports: newCount }, { merge: true });
  
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

  // Edit Expand Function
  const handleExpandEdit = (editingReport) => {
    setEditingReport(editingReport);
    setEditVisible(true);
    console.log("Selected Station:", editingReport);
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
          {/* Display only Times */}
          {selectedStatus === "active" && (
            <Tooltip
              title={!isTimeMinimal ? "Show Time Records" : "Hide Time Records"} 
              placement="bottom" 
              sx={{ bgcolor: "gray.700", color: "white" }} // Tooltip styling
            >
              <IconButton 
                onClick={() => setTimeMinimal(!isTimeMinimal)} 
                color={isTimeMinimal ? "secondary" : "default"}
                sx={{ fontSize: "2rem", padding: '10px', marginX: 5, marginTop: '6px' }}
              >
                {isTimeMinimal ? (
                  <ToggleOnOutlinedIcon sx={{ fontSize: "1.5rem" }} />
                ) : (
                  <ToggleOffOutlinedIcon sx={{ fontSize: "1.5rem" }} />
                )}
              </IconButton>
            </Tooltip>
          )}

          {/* Report Status Dropdown */}
          <Tooltip
            title={"Filter Reports By Status"} 
            placement="bottom" 
            sx={{ bgcolor: "gray.700", color: "white" }} // Tooltip styling
          >
            <FormControl sx={{ minWidth: 200, marginRight: 3 }}>
              <InputLabel
                sx={{
                  backgroundColor: theme.palette.mode === 'dark' ? colors.primary[500] : "#fcfcfc",
                  color: colors.grey[100],
                  fontSize: "16px",
                  paddingX: "15px"
                }}
              >
                {"Report Status"}
              </InputLabel>
              <Select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
                {reportStatus.map((status) => (
                  <MenuItem key={status.value} value={status.value}>
                    {status.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Tooltip>

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

        {/* Add Report */}
        <Tooltip
          title={"Add Report"} 
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
              <LoupeOutlinedIcon sx={{ mr: "10px" }} />
              Add
            </Button>
          </span>
        </Tooltip>

        {/* Expand Reports */}
        <Tooltip
          title={"Expand Station(s)"}
          placement="top"
          sx={{ bgcolor: "gray.700", color: "white" }}
        >
          <span>
            <Button
              sx={{
                backgroundColor:
                  selectedReports.length < 1
                    ? colors.blueAccent[900]
                    : colors.greenAccent[400],
                color: colors.grey[900],
                fontSize: "12px",
                fontWeight: "bold",
                padding: "5px 10px",
                marginX: 1,
                "&:hover": {
                  backgroundColor:
                    selectedReports.length < 1
                      ? colors.blueAccent[800]
                      : colors.greenAccent[500],
                },
              }}
              onClick={handleExpand}
              disabled={selectedReports.length < 1}
            >
              <OpenInNewIcon sx={{ mr: "10px" }} />
              Expand
            </Button>
          </span>
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
          <span>
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
          </span>
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
          <span>
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
          </span>
        </Tooltip>
        
        {/* Delete Button */}
        <Tooltip 
          title={"Delete Report(s)"} 
          placement="top" 
          sx={{ bgcolor: "gray.700", color: "white" }} // Tooltip styling
        >
          <span>
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
          </span>
        </Tooltip>
      </Box>
    );
  };

  const getColumns = (selectedStatus, isTimeMinimal) => ({
    name: !isTimeMinimal && selectedStatus !== "active",
    responder: isTimeMinimal || selectedStatus === "active",
    phone: !isTimeMinimal,
    type: !isTimeMinimal,
    status: !isTimeMinimal && ["active", "all"].includes(selectedStatus),
    address: !isTimeMinimal,
    date: true, // Always show date
    time: true, // Always show time
    service: !isTimeMinimal,
    
    // Show all time-related fields when isTimeMinimal is true
    eta: isTimeMinimal || selectedStatus === "active",
    received: isTimeMinimal,
    response: isTimeMinimal,
    arrived: isTimeMinimal,
    resolved: isTimeMinimal,

    // Show numeric time durations when isTimeMinimal is true
    arrived_duration: isTimeMinimal,
    resolved_duration: isTimeMinimal,
  });

  const [columnVisibilityModel, setColumnVisibilityModel] = useState(getColumns(selectedStatus, isTimeMinimal));

  // Expand Report
  const handleExpand = () => {
    if (selectedReports.length === 0) return;
    
    // Filter reports to get only the selected ones
    const fullReports = reports.filter(report => 
      selectedReports.includes(report.id)
    );
    
    setViewableReports(fullReports);
    console.log(fullReports);
    setExpandVisible(true);
  };

  // Close Station Expand
  const closeExpand = () => {
    setExpandVisible(false);
  };

  // Update visibility when `selectedStatus` changes
  useEffect(() => {
    if (prevSelectedStatus.current === "active" && selectedStatus !== "active") {
        setTimeMinimal(false);
    }

    setColumnVisibilityModel(getColumns(selectedStatus, isTimeMinimal));

    // Update previous status
    prevSelectedStatus.current = selectedStatus;
  }, [selectedStatus, isTimeMinimal]);

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

      {/* Expand Report Modal */}
      <Dialog open={expandVisible} onClose={closeExpand} fullWidth maxWidth="md">
        <DialogContent sx={{ backgroundColor: theme.palette.mode === "dark" ? colors.primary[500] : colors.primary[900] }}>
          <ExpandReports onClose={closeExpand} reports={viewableReports} editReport={handleExpandEdit} />
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
          columnVisibilityModel={columnVisibilityModel}
          onRowSelectionModelChange={(ids) => setSelectedReports(ids)}
          onColumnVisibilityModelChange={setColumnVisibilityModel}
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

// Report Status Selection
const reportStatus = [
  { value: "all", label: "All" },        // Show all reports
  { value: "0", label: "Pending" },      // Reports not yet received
  { value: "active", label: "Active" },  // Includes Acknowledged, Responding, Resolved
];

// Convert numbers to readable text
const statusText = ["Pending", "Acknowledged", "Responding", "Resolved", "Archived", "Reopened"];
const serviceText = ["None", "Firetruck", "Ambulance", "Firetruck & Ambulance"];

const TYPE_CRIME = 0b001;    // 1
const TYPE_FIRE = 0b010;     // 2
const TYPE_MEDICAL = 0b100;  // 4
const TYPE_SUSPICIOUS = 0b1000; // 8 (for suspicion reports)

const getTypeLabel = (bitmask) => {
  let types = [];

  if (bitmask & TYPE_CRIME) types.push("Crime");
  if (bitmask & TYPE_FIRE) types.push("Fire");
  if (bitmask & TYPE_MEDICAL) types.push("Medical");
  if (bitmask & TYPE_SUSPICIOUS) types.push("Suspicious Activity");

  if (types.length === 0) return "Unknown";
  if (types.length === 1) return types[0];
  if (types.length === 2) return types.join(" & ");

  return types.slice(0, -1).join(", ") + " & " + types[types.length - 1];
};

export default Reports;