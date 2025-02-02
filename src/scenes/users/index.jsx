import { useState } from "react";
import { Box, MenuItem, Select, FormControl, InputLabel } from "@mui/material";
import {
  DataGrid,
  GridToolbarContainer,
  GridToolbarQuickFilter,
  GridToolbarDensitySelector,
  GridToolbarExport,
  GridToolbarColumnsButton,
  GridToolbarFilterButton,
} from "@mui/x-data-grid"; // Import Gridbar Tools for User's Toolbar
import { tokens } from "../../theme"; // Themes
import { mockDataContacts } from "../../data/mockData"; // Mock User Data
import Header from "../../components/Header"; // For Header
import { useTheme } from "@mui/material";

const Users = () => {
  const theme = useTheme(); // For Usage of Themes
  const colors = tokens(theme.palette.mode); // Mode Appropriate Colors
  const [selectedType, setSelectedType] = useState("all"); // Highest Filter - User Type
  // eslint-disable-next-line
  const [exportFileName, setExportFileName] = useState(
    `Users_Data_${new Date().toISOString().slice(0, 10)}` // YYYY-MM-DD format
  );  

  // Filtered Rows Based on selectedType
  const filteredRows = mockDataContacts.filter((row) => {
    if (selectedType === "all") return true; // Show all Users
  
    if (selectedType === "responder") {
      return row.type.startsWith("responder_"); // Show all Responders
    }
  
    return row.type === selectedType; // Show Exact Match of Selection
  });  

  // Select User Type on Dropdown Button
  const handleTypeSelect = (event) => {
    setSelectedType(event.target.value);
  };

  // Table Columns
  const columns = [
    { field: "id", 
      headerName: "ID", 
      flex: 0.5 
    },
    { field: "registrarId", 
      headerName: "Registrar ID" 
    },
    {
      field: "name",
      headerName: "Name",
      flex: 1,
      cellClassName: "name-column--cell",
    },
    {
      field: "age",
      headerName: "Age",
      type: "number",
      headerAlign: "left",
      align: "left",
    },
    {
      field: "phone",
      headerName: "Phone Number",
      flex: 1,
    },
    {
      field: "email",
      headerName: "Email",
      flex: 1,
    },
    {
      field: "type",
      headerName: "Type",
      flex: 1,
    },
    {
      field: "address",
      headerName: "Address",
      flex: 1,
    },
    {
      field: "city",
      headerName: "City",
      flex: 1,
    },
    {
      field: "zipCode",
      headerName: "Zip Code",
      flex: 1,
    },
  ];

  // Users Management Toolbar Component
  const UserTooldbar = () => {
    return (
      <GridToolbarContainer sx={{ display: "flex", justifyContent: "space-between", p: 1 }}>
        {/* Default Toolbar Tools */}
        <Box display="flex" gap={2}>
          {/* Show / Hide Columns Button */}
          <GridToolbarColumnsButton />
          {/* Advance Filtering Button */}
          <GridToolbarFilterButton />
          {/* Density Selector Button */}
          <GridToolbarDensitySelector />
          {/* Export to CSV Button  with Custom Name */}
          <GridToolbarExport />
        </Box>
        {/* Search Input */}
        <GridToolbarQuickFilter />
        {/* User Type Dropdown */}
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
      </GridToolbarContainer>
    );
  };

  return (
    <Box m="20px">
      {/* Headers */}
      <Header 
        title="USERS" 
        subtitle="List of Registered Users"
      />
      
      {/* Database Table */}
      <Box
        m="0 0 0 0"
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
          slots={{ toolbar: UserTooldbar }}
        />
      </Box>
    </Box>
  );
};

// User Type Selection
const userTypes = [
  { value: "all", label: "All" },
  { value: "community", label: "Community" },
  { value: "responder_fire", label: "Fire Responder" },
  { value: "responder_police", label: "Police Responder" },
  { value: "responder_disaster", label: "Disaster Responder" },
  { value: "responder_barangay", label: "Barangay Responder" },
  { value: "responder", label: "All Responders" }
];

export default Users;