// React & Hooks
import { useEffect, useState, useContext, useRef } from "react";

// Material UI Components
import { Box, Typography, Button, useTheme, Tooltip, IconButton, InputLabel, FormControl, Select, MenuItem, Dialog, DialogContent, CircularProgress } from "@mui/material";
import ToggleOffOutlinedIcon from '@mui/icons-material/ToggleOffOutlined';
import ToggleOnOutlinedIcon from '@mui/icons-material/ToggleOnOutlined';
import AddLocationAltOutlinedIcon from '@mui/icons-material/AddLocationAltOutlined';
import BorderColorOutlinedIcon from '@mui/icons-material/BorderColorOutlined';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import DeleteSweepOutlinedIcon from '@mui/icons-material/DeleteSweepOutlined';
import OpenWithIcon from '@mui/icons-material/OpenWith';
import DoNotDisturbAltIcon from '@mui/icons-material/DoNotDisturbAlt';
import BeenhereIcon from '@mui/icons-material/Beenhere';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import FlagIcon from '@mui/icons-material/Flag';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

// Leaflet Map Components
import { MapContainer, TileLayer, Popup, Marker as OSMMarker, Polygon, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import 'leaflet-easyprint';
import "leaflet.heat"; // For Crime Mapping
import L from "leaflet";
//import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// Context & Theming
import { DataContext } from "../../data";
import { tokens } from "../../theme";

// Local Data and Components
import Header from "../../components/Header";
import boundaryData from "../../data/indangBoundary.json";
import AddStationForm from "../../components/AddStation";
import AddReportForm from "../../components/AddReport";
import EditStationForm from "../../components/EditStation";
import EditReportForm from "../../components/EditReport";
import ExpandStation from "../../components/ExpandStation";
import ExpandReports from "../../components/ExpandReports";
//import { mockCrimeData } from "../../data/mockData";

// Firebase
import { setDoc, getDoc, deleteDoc, updateDoc, doc, GeoPoint } from "firebase/firestore";  
import { db } from "../../config/firebaseConfig";

const Map = ({ isCollapsed }) => {
  const { 
    users, stations, reports, startStationsListener, 
    startReportsListener, stopStationsListener, 
    stopReportsListener } = useContext(DataContext); // Context for Stations and Reports data  
  const theme = useTheme(); // MUI Theme Hook  
  const colors = tokens(theme.palette.mode); // Color tokens based on Theme Mode

  const mapCenter = {
    lat: 14.197811048999133,
    lng: 120.88149481077414,
  };
  
  const mapRef = useRef(null);
  
  const [indangBoundary, setIndangBoundary] = useState([]); // State for Indang boundary data  
  const [isListening, setIsListening] = useState(false); // State to track if station listener is active  
  const [selectedCategory, setSelectedCategory] = useState("stations"); // Categories of Markers

  const [selectedStations, setSelectedStations] = useState([]); // Selected Stations
  const [editingStation, setEditingStation] = useState(null); // Edit this Station
  const [editingReport, setEditingReport] = useState(null); // Edit this Report
  const [isUpdating, setUpdating] = useState(false); // Moving a Station Indicator
  const [movingStation, setMovingStation] = useState(null); // Station on the Move
  const [isMoving, setIsMoving] = useState(false); // If the Station is Moving

  const [selectedReports, setSelectedReports] = useState([]); // Selected Reports

  const [mapType, setMapType] = useState("normal"); // Default to 'normal' map
  const [addStationVisible, setAddStationVisible] = useState(false); // Add Station Dialog Visibility
  const [editStationVisible, setEditStationVisible] = useState(false); // Edit Station Dialog Visibility
  const [expandStationVisible, setExpandStationVisible] = useState(false); // Expand Station Dialog Visibility

  const [addingStationValues, setAddingStationValues] = useState(null);
  const [viewableEvidence, setViewableEvidence] = useState(null);
  const [markerCoords, setMarkerCoords] = useState(null);

  const [addReportVisible, setAddReportVisible] = useState(false); // Add Report Dialog Visibility
  const [editReportVisible, setEditReportVisible] = useState(false); // Edit Report Dialog Visibility
  const [expandReportVisible, setExpandReportVisible] = useState(false); // Expand Report Dialog Visibility
  const [reportEvidenceVisible, setReportEvidenceVisible] = useState(false); // Report Evidence Visibility
  const [reportSuspiciousVisible, setReportSuspiciousVisible] = useState(false); // Show Only Reports With Pictures Visibility
  const [isImageLoading, setIsImageLoading] = useState(true);

  //const geoapifyApiKey = process.env.REACT_APP_GEOAPIFY_API_KEY; // API key for Geoapify services  

  /* useEffect(() => {
    const fetchBoundary = async () => {
      try {
        const response = await fetch(
          `https://api.geoapify.com/v1/boundaries/consists-of?id=5120e3fd2e8c2e5e40599a697ef277a52c40f00101f90138f1160000000000920306436176697465&geometry=geometry_1000&apiKey=${geoapifyApiKey}`
        );
        const data = await response.json();

        console.log("Geoapify API Response:", data); // Logs full API response

        if (data.features && data.features.length >= 8) {
          const feature = data.features[7]; // 8th polygon (index 7)
          const geometry = feature.geometry;

          if (geometry.type === "Polygon") {
            setIndangBoundary([geometry.coordinates[0].map(coord => [coord[1], coord[0]])]); 
          } else {
            console.error("❌ Expected a Polygon but got:", geometry.type);
          }
        } else {
          console.error("❌ Not enough boundary data! Expected at least 8, but got:", data.features.length);
        }
      } catch (error) {
        console.error("🚨 Error fetching boundary data:", error);
      }
    };

    if (geoapifyApiKey) {
      fetchBoundary();
    }
  }, [geoapifyApiKey]); */

  useEffect(() => {
    setIndangBoundary([boundaryData.coordinates]);
  }, []);

  // Fixing the Suspicious Report => Stations Markers Bug
  useEffect(() => {
    if (selectedCategory === "stations" || selectedCategory === "all") {
      setReportSuspiciousVisible(false);
    }
  }, [selectedCategory]);

  // Toggle Real-time Listener
  const handleToggleListener = () => {
    if (isListening) {
      stopStationsListener();
      stopReportsListener()
    } else {
      startStationsListener();
      startReportsListener();
    }
    setIsListening(!isListening);
  };

  // Change to Crime or Regular Map
  const handleMapTypeChange = (event) => {
    setMapType(event.target.value);
  };  

  // Selecting Category Function (All, Stations or Reports)
  const handleCategorySelect = (event) => {
    setSelectedCategory(event.target.value);
  };

  // Add Station Function
  const handleStationAdd = () => {
    setAddStationVisible(true);
  };

  // Close Add Station
  const closeStationAdd = () => {
    setAddStationVisible(false);
  };

  // Add Report Function
  const handleReportAdd = () => {
    setAddReportVisible(true);
  };

  // Close Add Report
  const closeReportAdd = () => {
    setAddReportVisible(false);
  };

  // Edit Station Function
  const handleStationEdit = () => {
    if (selectedStations.length === 1) {
      const selectedStation = selectedStations[0];
      setEditingStation(selectedStation);
      setEditStationVisible(true);
      console.log("Selected Station:", selectedStation);
    }
  };

  // Close Station Edit
  const closeStationEdit = () => {
    setEditStationVisible(false);
  };

  // Edit Report Function
  const handleReportEdit = () => {
    if (selectedReports.length === 1) {
      const selectedReport = selectedReports[0];
      setEditingReport(selectedReport);
      setEditReportVisible(true);
      console.log("Selected Report:", selectedReport);
    }
  };

  // Close Report Edit
  const closeReportEdit = () => {
    setEditReportVisible(false);
  };
  
  // Delete Station Function
  const handleStationDelete = async () => {
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

  // Delete Report Function
  const handleReportDelete = async () => {
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

  // Move Station Function
  const handleStationMove = () => {
    const selectedStation = selectedStations[0];
    //console.log("Selected station for moving:", selectedStation);
    
    setMovingStation(selectedStation);
    
    setIsMoving(true);
    setUpdating(true);
    
    setSelectedStations([]);
  };

  // Save Move Station
  const handleStationSave = async () => {
    if (!movingStation) return;
    
    try {
      // Create a reference to the station document
      const stationRef = doc(db, "stations", movingStation.station.id);
      
      // Create updated data with new coordinates from movingStation
      const updatedData = {
        'address.location': new GeoPoint(
          movingStation.address.location.latitude,
          movingStation.address.location.longitude
        )
      };
      
      // Update the document
      await updateDoc(stationRef, updatedData);
      
      // Reset states
      setIsMoving(false);
      setUpdating(false);
      setMovingStation(null);
      
      // You might want to refresh your station data here
      
      //console.log('Station location updated successfully');
      alert("Station location updated successfully.");
    } catch (error) {
      console.error('Error updating station location:', error);
      // Handle error
    }
  };

  // Cancel Move Station
  const handleStationCancel = () => {
    setMovingStation(null);
    setIsMoving(false);
    setUpdating(false);
  };

  // Function for Camera Reset on Map
  const handleCenterMap = () => {
    if (mapRef.current) {
      try {
        // Handle centering with error protection
        mapRef.current.setView([mapCenter.lat, mapCenter.lng], 12, {
          animate: true,
          duration: 1
        });
      } catch (error) {
        console.error("Error centering map:", error);
      }
    }
  };

  // Expand Station
  const handleStationExpand = () => {
    setExpandStationVisible(true);
  };

  // Close Station Expand
  const closeStationExpand = () => {
    setExpandStationVisible(false);
  };

  // Expand Report
  const handleReportExpand = () => {
    setExpandReportVisible(true);
    console.log(selectedReports);
  };

  // Close Report Expand
  const closeReportExpand = () => {
    setExpandReportVisible(false);
  };

  // Edit Expanded Station
  const handleStationEditExpand = (editStation) => {
    setEditingStation(editStation);
    setEditStationVisible(true);
    console.log("Selected Station:", editStation);
  };

  // Edit Expanded Report
  const handleReportEditExpand = (editReport) => {
    setEditingReport(editReport);
    setEditReportVisible(true);
    console.log("Selected Report:", editReport);
  };

  const handleViewEvidence = (evidence) => {
    setViewableEvidence(evidence);
    setReportEvidenceVisible(true);
  };

  const closeEvidence = () => {
    setReportEvidenceVisible(false);
  };

  const MapPrintControl = () => {
    const map = useMap();
    
    useEffect(() => {
      if (!map) return;
      
      // Create print plugin with simplified options
      const printPlugin = L.easyPrint({
        title: 'Download Map',
        position: 'topleft',
        sizeModes: ['Current'], // Only one option
        defaultSizeTitles: { Current: 'Download Map' },
        filename: 'crime-heatmap',
        exportOnly: true,
        hideControlContainer: false,
        tileWait: 800,
        // This is the key change - this makes it print immediately when the button is clicked
        // without showing the dropdown
        printModes: ['download'],
        // Custom styling for the button
        buttonClass: 'easy-print-button',
        // Use custom element with clear text
        elementsToHide: 'p, h2' // Don't hide any elements
      }).addTo(map);
      
      // Add custom styles to make the button more obvious
      const style = document.createElement('style');
      style.innerHTML = `
        .easy-print-button {
          padding: 0 8px !important;
          width: auto !important;
          line-height: 30px !important;
        }
        .easy-print-button:after {
          content: " Download Map" !important;
          font-size: 12px;
        }
      `;
      document.head.appendChild(style);
      
      return () => {
        // Clean up
        map.removeControl(printPlugin);
        document.head.removeChild(style);
      };
    }, [map]);
    
    return null;
  };

  const toggleViewSuspicious = () => {
    setReportSuspiciousVisible(!reportSuspiciousVisible);
  };

  return (
    <Box m="20px">
      {/* Add Station Modal */}
      <Dialog open={addStationVisible} onClose={closeStationAdd} fullWidth maxWidth="md">
        <DialogContent sx={{ backgroundColor: theme.palette.mode === "dark" ? colors.primary[500] : colors.primary[900] }}>
          <AddStationForm 
            onClose={closeStationAdd} 
            selectedCoords={markerCoords}
            formValues={addingStationValues}
            setFormValues={setAddingStationValues}
            onSubmit={() => setMarkerCoords(null)}
          />
        </DialogContent>
      </Dialog>

      {/* Add Report Modal */}
      <Dialog open={addReportVisible} onClose={closeReportAdd} fullWidth maxWidth="md">
        <DialogContent sx={{ backgroundColor: theme.palette.mode === "dark" ? colors.primary[500] : colors.primary[900] }}>
          <AddReportForm onClose={closeReportAdd} users={users} />
        </DialogContent>
      </Dialog>

      {/* Edit Station Modal */}
      <Dialog open={editStationVisible} onClose={closeStationEdit} fullWidth maxWidth="md">
        <DialogContent sx={{ backgroundColor: theme.palette.mode === "dark" ?  colors.primary[500] : colors.primary[900] }}>
          {editingStation && <EditStationForm onClose={closeStationEdit} station={editingStation} />}
        </DialogContent>
      </Dialog>

      {/* Edit Station Modal */}
      <Dialog open={editReportVisible} onClose={closeReportEdit} fullWidth maxWidth="md">
        <DialogContent sx={{ backgroundColor: theme.palette.mode === "dark" ?  colors.primary[500] : colors.primary[900] }}>
          {editingReport && <EditReportForm onClose={closeReportEdit} users={users} stations={stations} report={editingReport} />}
        </DialogContent>
      </Dialog>

      {/* Expand Station Modal */}
      <Dialog open={expandStationVisible} onClose={closeStationExpand} fullWidth maxWidth="md">
        <DialogContent sx={{ backgroundColor: theme.palette.mode === "dark" ?  colors.primary[500] : colors.primary[900] }}>
          <ExpandStation onClose={closeStationExpand} stations={selectedStations} editStation={handleStationEditExpand} />
        </DialogContent>
      </Dialog>

      {/* Expand Report Modal */}
      <Dialog open={expandReportVisible} onClose={closeReportExpand} fullWidth maxWidth="md">
        <DialogContent sx={{ backgroundColor: theme.palette.mode === "dark" ? colors.primary[500] : colors.primary[900] }}>
          <ExpandReports onClose={closeReportExpand} reports={selectedReports} editReport={handleReportEditExpand} />
        </DialogContent>
      </Dialog>

      {/* Evidence Popup */}
      <Dialog
          open={reportEvidenceVisible}
          onClose={closeEvidence}
          PaperProps={{
              sx: {
                  backgroundColor: colors.primary[500],
                  boxShadow: 'none',
                  padding: 2,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
              },
              elevation: 0,
          }}
      >
          <DialogContent
              sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  backgroundColor: 'transparent',
                  minHeight: '200px', // to avoid layout shift
              }}
          >
              {isImageLoading && (
                  <CircularProgress size={40} sx={{ color: 'white', position: 'absolute' }} />
              )}
              {viewableEvidence && (
                  <Box
                      component="img"
                      src={viewableEvidence}
                      alt="Evidence"
                      onLoad={() => setIsImageLoading(false)}
                      onError={() => setIsImageLoading(false)} // fallback if it fails
                      sx={{
                          maxWidth: '100%',
                          maxHeight: '80vh',
                          borderRadius: 2,
                          boxShadow: 3,
                          display: isImageLoading ? 'none' : 'block',
                      }}
                  />
              )}
          </DialogContent>
      </Dialog>

      <Header title="MAP" subtitle="Manage Indang's Map, Stations and Reports" />

      {/* Database Connector Radio Button */}
      <Box display="flex" width="100%">
        {/* Listener Toggle Button */}
        <Box display="flex" alignItems="center" flex="1 1 15%">
          <Tooltip
            title={isListening ? "Disconnect from Database" : "Connect to Database"}
            placement="bottom" 
            sx={{ bgcolor: "gray.700", color: "white" }}
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

        {/* Map Type Dropdown - 30% */}
        <Box display="flex" alignItems="center" flex="1 1 30%">
          
        </Box>

        {/* Category Dropdown - 65% (Only in Normal Map) */}
        <Box flex="1 1 55%" display="flex" gap={2} alignContent={'end'} justifyContent={'end'}>
          {/* Map Type Dropdown */}
          <Box sx={{ width: "50%", maxWidth: "250px" }}>
            <Tooltip 
              title={"Select Map Type"} 
              placement="bottom" 
              sx={{ bgcolor: "gray.700", color: "white" }}
            >
              <FormControl sx={{ width: "100%", mb: 2 }}>
                <InputLabel
                  sx={{
                    backgroundColor: theme.palette.mode === "dark" ? colors.primary[500] : "#fcfcfc",
                    color: colors.grey[100],
                    fontSize: "16px",
                    paddingX: "15px"
                  }}>
                  {"Map Type"}
                </InputLabel>
                <Select value={mapType} onChange={handleMapTypeChange}>
                  <MenuItem value="normal">Regular Map</MenuItem>
                  <MenuItem value="crime">Crime Map</MenuItem>
                </Select>
              </FormControl>
            </Tooltip>
          </Box>

          {/* Category Dropdown (Only in Normal Map) */}
          {mapType !== 'crime' && (
            <Box sx={{ width: "50%", maxWidth: "250px", visibility: mapType === "normal" ? "visible" : "hidden" }}>
              <Tooltip 
                title={"Categorize Markers"} 
                placement="bottom" 
                sx={{ bgcolor: "gray.700", color: "white" }}
              >
                <FormControl sx={{ width: "100%", mb: 2 }}>
                  <InputLabel
                    sx={{
                      backgroundColor: theme.palette.mode === "dark" ? colors.primary[500] : "#fcfcfc",
                      color: colors.grey[100],
                      fontSize: "16px",
                      paddingX: "15px"
                    }}>
                    {"Select Category"}
                  </InputLabel>
                  <Select value={selectedCategory} onChange={handleCategorySelect}>
                    <MenuItem value="reports">All Reports</MenuItem>
                    <MenuItem value="stations">All Stations</MenuItem>
                    <MenuItem value="all">Show All</MenuItem>
                  </Select>
                </FormControl>
              </Tooltip>
            </Box>
          )}
        </Box>
      </Box>

      {/* Map Container */}
      <Box mt="10px">
        {/* Location Button */}
        <Box 
          sx={{ 
            position: 'absolute', 
            top: '240px', 
            right: '30px', 
            zIndex: 1000,
            borderRadius: '4px',
            backgroundColor: '#fff',
            boxShadow: '0 2px 6px rgba(0,0,0,0.3)'
          }}
        >
          <IconButton 
            onClick={handleCenterMap}
            color="primary"
            size="medium"
            sx={{ padding: '8px' }}
          >
            <MyLocationIcon />
          </IconButton>
        </Box>

        <MapContainer
          center={mapCenter}
          zoom={12} 
          style={containerStyle}
          maxBounds={indangBoundary.length > 0 ? L.latLngBounds(indangBoundary[0]) : undefined}
          maxBoundsViscosity={1.0}
          minZoom={12}
          maxZoom={18}
          doubleClickZoom={false}
          whenCreated={(map) => {
            mapRef.current = map;
          }}
        >
          <MapController 
            mapRef={mapRef} 
            isMoving={isMoving}
            isUpdating={isUpdating}
            movingStation={movingStation}
            setMovingStation={setMovingStation}
            setIsMoving={setIsMoving}
          />

          <TileLayer 
            url={
              mapType === "crime" 
                ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" // Dark Mode Map
                : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" // Regular Map
            } 
          />

          <ClickMarkers 
            handleAdd={handleStationAdd}
            isMoving={isUpdating}
            setCoordinates={(coords) => {
              setMarkerCoords(coords);
            }}
            existingMarker={markerCoords ? { position: markerCoords } : null}
          />

          {/* Center Marker */}
          {/* <OSMMarker position={mapCenter} icon={getMarkerIcon("green")}>
            <Popup>
              <b>You are here!</b>
              <br />
              Latitude: {mapCenter.lat.toFixed(6)}
              <br />
              Longitude: {mapCenter.lng.toFixed(6)}
            </Popup>
          </OSMMarker> */}

          {/* Heatmap Layer */}
          {mapType === 'crime' ? <HeatmapLayer reports={reports} /> : null}

          {mapType === 'crime' && <MapPrintControl />}

          {/* Station Markers */}
          {(selectedCategory === "stations" || selectedCategory === "all") && mapType === "normal" && stations.map((station, index) => {
            // Check if this station is currently selected
            const isSelected = selectedStations.some(s => s.station.id === station.station.id);
            
            // Check if this station is the one being moved
            const isMovingThisStation = movingStation && movingStation.station.id === station.station.id;
            
            // Skip rendering this station if it's the one being moved
            if (isMovingThisStation) return null;

            // Use a guaranteed unique key - either the station ID if it exists, or a fallback using index
            const uniqueKey = station.station.id || `temp-station-${index}`;
            
            return (
              <OSMMarker
                key={uniqueKey}
                position={[
                  station.address.location.latitude,
                  station.address.location.longitude,
                ]}
                icon={getMarkerIcon(isSelected ? "yellow" : "orange")}
                eventHandlers={{
                  click: (e) => {
                    if (e.originalEvent.button === 0) { // Left Click
                      e.originalEvent.preventDefault(); // Prevent default popup opening
                      e.target.closePopup(); // Ensure popup stays closed on left click

                      // First, clear any selected reports if we're selecting a station
                      if (selectedReports.length > 0) {
                        setSelectedReports([]);
                      }
                      
                      // Then handle station selection/deselection
                      setSelectedStations(prev => {
                        const isAlreadySelected = prev.some(s => s.station.id === station.station.id);
                        return isAlreadySelected ? prev.filter(s => s.station.id !== station.station.id) : [...prev, station];
                      });
                    }
                  },
                  contextmenu: (e) => {
                    e.originalEvent.preventDefault(); // Prevent default right-click menu
                    e.target.openPopup(); // Open popup on right-click

                    setTimeout(() => {
                      e.target.closePopup(); // Close after 3 seconds
                    }, 3000);
                  }
                }}
              >
                <Popup>
                  <b>{station.station.name}</b>
                  <br />
                  {station.address.barangay}, {station.address.municipality}, {station.address.province}
                  <br />
                  <strong>Status: </strong>
                  {isSelected ? 'Selected' : 'Not Selected'}
                </Popup>
              </OSMMarker>
            );
          })}

          {/* Report Markers */}
          {(selectedCategory === "reports" || selectedCategory === "all") && mapType === "normal" && reports
            .filter(report => {
              // If only Show only Suspicious Activity is true, only show reports that is Suspicious and has evidence
              if (reportSuspiciousVisible) {
                return report.type === 8 && report.evidence;
              }
              // Otherwise show all reports
              return true;
            })
            .map((report) => {
            // Check if this report is currently selected
            const isSelected = selectedReports.some(r => r.id === report.id);
            
            return (
              <OSMMarker
                key={report.id}
                position={[
                  report.address.location.latitude,
                  report.address.location.longitude,
                ]}
                icon={getMarkerIcon(isSelected ? "green" : "blue")} // Change icon when selected
                eventHandlers={{
                  click: (e) => {
                    if (e.originalEvent.button === 0) { // Left Click
                      e.originalEvent.preventDefault(); // Prevent default popup opening
                      e.target.closePopup(); // Ensure popup stays closed on left click

                      // First, clear any selected stations if we're selecting a report
                      if (selectedStations.length > 0) {
                        setSelectedStations([]);
                      }
                      
                      // Then handle report selection/deselection
                      setSelectedReports(prev => {
                        const isAlreadySelected = prev.some(r => r.id === report.id);
                        return isAlreadySelected 
                          ? prev.filter(r => r.id !== report.id) 
                          : [...prev, report];
                      });
                    }
                  },
                  contextmenu: (e) => {
                    e.originalEvent.preventDefault(); // Prevent default right-click menu
                    e.target.openPopup(); // Open popup on right-click

                    setTimeout(() => {
                      e.target.closePopup(); // Close after 6 seconds
                    }, 6000);
                  }
                }}
              >
                <Popup>
                  {report.address.barangay}, {report.address.municipality}, {report.address.province}
                  <br />
                  <strong>Status: </strong>
                  {isSelected ? 'Selected' : 'Not Selected'}
                  
                  {/* Display image if evidence URL exists, regardless of status */}
                  {report.type === 8 && report.evidence && (
                    <div style={{ marginTop: '10px', position: 'relative', cursor: 'pointer' }} 
                        onClick={() => handleViewEvidence(report.evidence)}>
                      {/* Small indicator in corner to show it's clickable */}
                      <div style={{ 
                        position: 'absolute', 
                        top: '3px', 
                        right: '13px', 
                        zIndex: 1000,
                        borderRadius: '50%',
                        padding: '2px'
                      }}>
                        <OpenInNewIcon style={{ fontSize: '14px', color: '#fff' }} />
                      </div>
                      <img 
                        src={report.evidence} 
                        alt="Report Evidence" 
                        style={{ 
                          maxWidth: '110px',
                          maxHeight: '160px',
                          display: 'block',
                          margin: '5px auto',
                          transition: 'transform 0.2s',
                          ':hover': {
                            transform: 'scale(1.05)'
                          }
                        }} 
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.parentNode.innerHTML += '<p>Image could not be loaded</p>';
                        }}
                      />
                    </div>
                  )}
                </Popup>
              </OSMMarker>
            );
          })}

          {/* Indang Boundary */}
          {indangBoundary.length > 0 && (
            <>
              {/* Boundary Outline */}
              <Polygon 
                positions={indangBoundary[0]} 
                pathOptions={{ 
                  color: "#ffc55a", 
                  fillOpacity: 0, 
                  weight: 5 // Adjust this value for thickness 
                }}
              >
                {/* <Popup>
                  <b>Indang Boundary</b>
                  <br />
                  Clicked on the boundary!
                </Popup> */}
              </Polygon>

              {/* Hide Outside */}
              <Polygon
                positions={[worldBounds[0], indangBoundary[0].reverse()]} // Outer and hole
                pathOptions={{ color: "black", fillColor: "black", fillOpacity: 0.3, weight: 0 }}
              />
              
              {/* Boundary Camera Lock */}
              <MapBounds boundary={indangBoundary} isCollapsed={isCollapsed} />
            </>
          )}
        </MapContainer>
      </Box>

      {/* Map Foot Tools */}
      <Box
        sx={{
          height: '70px',
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center", 
          p: 1, 
          backgroundColor: colors.blueAccent[700],
          borderRadius: '0 0 10px 10px'
        }}
      >
        {/* Left Section: Reports and Reports Counter */}
        {/* <Typography color={colors.grey[100]} fontSize="14px" ml={2}>
          {mapType === "normal" && (
            selectedCategory === "stations"
              ? `${stations.length || 0} Stations`
              : selectedCategory === "reports"
              ? `${reports.length || 0} Reports`
              : selectedCategory === "all"
              ? `${stations.length || 0} Stations | ${reports.length || 0} Reports`
              : ""
          )}
        </Typography> */}
        
        <Typography color={colors.grey[100]} fontSize="14px" ml={2}>
          {selectedStations.length > 0 
            ? `${selectedStations.length} Station${selectedStations.length !== 1 ? 's' : ''}` 
            : selectedReports.length > 0 
              ? `${selectedReports.length} Report${selectedReports.length !== 1 ? 's' : ''}` 
              : ''}
        </Typography>

        {((selectedCategory === "stations" && mapType === "normal") || 
          (selectedCategory === "all" && selectedStations.length >= 1 && mapType === "normal") ||
          (movingStation && isUpdating)) && (
          <Box>
            {/* Add Station */}
            <Tooltip
              title={"Add Station"}
              placement="top"
              sx={{ bgcolor: "gray.700", color: "white" }} // Tooltip styling
            >
              <span>
                <Button
                  sx={{
                    backgroundColor:
                      !isUpdating
                        ? colors.greenAccent[400]
                        : colors.blueAccent[900],
                    color: colors.grey[900],
                    fontSize: "12px",
                    fontWeight: "bold",
                    padding: "5px 10px",
                    marginX: 1,
                    "&:hover": {
                      backgroundColor:
                        !isUpdating
                          ? colors.greenAccent[500]
                          : colors.blueAccent[800],
                    },
                  }}
                  onClick={handleStationAdd}
                  disabled={isUpdating}
                >
                  <AddLocationAltOutlinedIcon sx={{ mr: "10px" }} />
                  Add
                </Button>
              </span>
            </Tooltip>
            {/* Expand Station */}
            <Tooltip
              title={"Expand Station(s)"}
              placement="top"
              sx={{ bgcolor: "gray.700", color: "white" }}
            >
              <span>
                <Button
                  sx={{
                    backgroundColor:
                      selectedStations.length < 1
                        ? colors.blueAccent[900]
                        : colors.greenAccent[400],
                    color: colors.grey[900],
                    fontSize: "12px",
                    fontWeight: "bold",
                    padding: "5px 10px",
                    marginX: 1,
                    "&:hover": {
                      backgroundColor:
                        selectedStations.length < 1
                          ? colors.blueAccent[800]
                          : colors.greenAccent[500],
                    },
                  }}
                  onClick={handleStationExpand}
                  disabled={selectedStations.length < 1}
                >
                  <OpenInNewIcon sx={{ mr: "10px" }} />
                  Expand
                </Button>
              </span>
            </Tooltip>
            {/* Save & Cancel */}
            {isUpdating && (
                <>
                  {/* Save Station */}
                  <Tooltip
                    title={"Save Location"}
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
                        }}
                        onClick={handleStationSave}
                      >
                        <BeenhereIcon sx={{ mr: "10px" }} />
                        Save
                      </Button>
                    </span>
                  </Tooltip>
                  
                  <Tooltip
                    title={"Cancel Station Move"}
                    placement="top"
                    sx={{ bgcolor: "gray.700", color: "white" }}
                  >
                    <span>
                      <Button
                        sx={{
                          backgroundColor: colors.redAccent[400],
                          color: colors.grey[900],
                          fontSize: "12px",
                          fontWeight: "bold",
                          padding: "5px 10px",
                          marginX: 1,
                          "&:hover": {
                            backgroundColor: colors.redAccent[500],
                          },
                        }}
                        onClick={handleStationCancel}
                      >
                        <DoNotDisturbAltIcon sx={{ mr: "10px" }} />
                        Cancel
                      </Button>
                    </span>
                  </Tooltip>
                </>
            )}
            {/* Move Station */}
            <Tooltip
              title={
                selectedStations.length > 1
                  ? "Moving multiple stations is not allowed"
                  : "Adjust Station"
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
                  onClick={handleStationMove}
                  disabled={selectedStations.length !== 1} // Disable if multiple or no stations selected
                >
                  <OpenWithIcon sx={{ mr: "10px" }} />
                  Move
                </Button>
              </span>
            </Tooltip>
            {/* Edit Station */}
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
                  onClick={handleStationEdit}
                  disabled={selectedStations.length !== 1} // Disable if multiple or no stations selected
                >
                  <BorderColorOutlinedIcon sx={{ mr: "10px" }} />
                  Edit
                </Button>
              </span>
            </Tooltip>
            {/* Delete Station */}
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
                  onClick={handleStationDelete}
                  disabled={selectedStations.length === 0}
                >
                  <DeleteSweepOutlinedIcon sx={{ mr: "10px" }} />
                  Delete
                </Button>
              </span>
            </Tooltip>
          </Box>
        )}

        {((selectedCategory === "reports" && mapType === "normal") || 
          (selectedCategory === "all" && selectedReports.length >= 1 && mapType === "normal")) && (
          <Box>
            {/* Add Reports */}
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
                  onClick={handleReportAdd}
                  //disabled={isUpdating}
                >
                  <FlagIcon sx={{ mr: "10px" }} />
                  Add
                </Button>
              </span>
            </Tooltip>
            {/* Show Only Reports with Photo */}
            <Tooltip
              title={reportSuspiciousVisible ? "Show all Reports" : "Show only Reports with Photo"}
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
                  onClick={toggleViewSuspicious}
                  //disabled={isUpdating}
                >
                  {reportSuspiciousVisible ? <VisibilityOffIcon sx={{ mr: "10px" }} /> : <VisibilityIcon sx={{ mr: "10px" }}/>}
                  Suspicious Activity
                </Button>
              </span>
            </Tooltip>
            {/* Expand Reports */}
            <Tooltip
              title={"Expand Report(s)"}
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
                  onClick={handleReportExpand}
                  disabled={selectedReports.length < 1}
                >
                  <OpenInNewIcon sx={{ mr: "10px" }} />
                  Expand
                </Button>
              </span>
            </Tooltip>
            {/* Edit Report */}
            <Tooltip
              title={
                selectedReports.length > 1
                  ? "Editing multiple reports is not allowed"
                  : "Edit Reports"
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
                  onClick={handleReportEdit}
                  disabled={selectedReports.length !== 1}
                >
                  <BorderColorOutlinedIcon sx={{ mr: "10px" }} />
                  Edit
                </Button>
              </span>
            </Tooltip>
            {/* Delete Report */}
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
                  onClick={handleReportDelete}
                  disabled={selectedReports.length === 0}
                >
                  <DeleteSweepOutlinedIcon sx={{ mr: "10px" }} />
                  Delete
                </Button>
              </span>
            </Tooltip>
          </Box>
        )}
      </Box>
    </Box>
  );
};

// Function when Double Clicking Empty Map
const ClickMarkers = ({ setCoordinates, handleAdd, existingMarker, isMoving }) => {
  // Initialize state with existingMarker
  const [marker, setMarker] = useState(existingMarker);
  
  // Add useEffect to update marker when existingMarker changes
  useEffect(() => {
    setMarker(existingMarker);
  }, [existingMarker]);

  useMapEvents({
    dblclick: (e) => {
      // Extra check to prevent marker creation when moving
      if (isMoving) return;
      
      const { lat, lng } = e.latlng;

      // Set a single marker
      const newMarker = { id: Date.now(), position: [lat, lng] };
      setMarker(newMarker);
      
      // Update coordinates in parent
      setCoordinates([lat, lng]);
    },
  });

  if (isMoving || !marker) {
    return null;
  }

  return marker ? (
    <OSMMarker
      key={marker.id || "marker"}
      position={marker.position}
      icon={getMarkerIcon("red")}
      eventHandlers={{
        click: () => {
          // Prevent click handler when moving
          if (!isMoving) handleAdd();
        }
      }}
    />
  ) : null;
};

// Create a component to store the map reference safely
const MapController = ({ mapRef, isMoving, isUpdating, movingStation, setMovingStation, setIsMoving }) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [markerPosition, setMarkerPosition] = useState(null);
  const [markerVisible, setMarkerVisible] = useState(false); // Changed to false initially
  
  // Initialize marker position from movingStation when it's first set, but keep it hidden
  useEffect(() => {
    if (movingStation && !markerPosition) {
      setMarkerPosition([
        movingStation.address.location.latitude,
        movingStation.address.location.longitude
      ]);
      // Don't set markerVisible to true here to keep it hidden initially
    }
  }, [movingStation, markerPosition]);

  // Reset marker position and visibility when isUpdating is false
  useEffect(() => {
    if (!isUpdating) {
      setMarkerVisible(false);
      setMarkerPosition(null);
    }
  }, [isUpdating]);
  
  const map = useMapEvents({
    load: () => {
      mapRef.current = map;
    },
    click: (e) => {
      if (isMoving && movingStation) {
        const newPosition = [e.latlng.lat, e.latlng.lng];
        //console.log("New position for station:", newPosition);
        
        // Update marker position
        setMarkerPosition(newPosition);
        
        const updatedStation = {
          ...movingStation,
          address: {
            ...movingStation.address,
            location: {
              latitude: newPosition[0],
              longitude: newPosition[1]
            }
          }
        };
        
        //console.log("Updated station:", updatedStation);
        
        // Update the movingStation using setMovingStation
        setMovingStation(updatedStation);
        
        // Stop moving mode and show the marker now that it's placed
        setIsMoving(false);
        setMarkerVisible(true);
      }
    },
    mousemove: (e) => {
      if (isMoving && movingStation) {
        setMousePosition({ x: e.originalEvent.clientX, y: e.originalEvent.clientY });
      }
    }
  });
  
  // Handle marker click to start moving again
  const handleMarkerClick = (e) => {
    // Prevent the map click event
    if (e && e.originalEvent) {
      L.DomEvent.stopPropagation(e.originalEvent);
    }
    
    // "Pick up" the marker - hide it and enable moving mode
    setMarkerVisible(false);
    setIsMoving(true);
  };
  
  // Store map reference
  useEffect(() => {
    mapRef.current = map;
  }, [map, mapRef]);
  
  // Handle cursor change when in moving mode
  useEffect(() => {
    if (map) {
      const mapContainer = map.getContainer();
      
      if (isMoving && movingStation) {
        // Hide the default cursor
        mapContainer.style.cursor = 'none';
      } else {
        mapContainer.style.cursor = 'grab';
      }
    }
    
    return () => {
      if (map) {
        const mapContainer = map.getContainer();
        mapContainer.style.cursor = 'grab';
      }
    };
  }, [map, isMoving, movingStation]);
  
  return (
    <>
      {/* Custom cursor marker */}
      {isMoving && movingStation && (
        <div 
          style={{
            position: 'fixed',
            left: mousePosition.x - 12,
            top: mousePosition.y - 41,
            pointerEvents: 'none',
            zIndex: 9999
          }}
        >
          <img 
            src={markerColors.yellow} 
            alt="marker"
            width="25" 
            height="41" 
          />
        </div>
      )}
      
      {/* Placed marker that can be moved - only show if markerVisible is true */}
      {markerPosition && movingStation && markerVisible && (
        <OSMMarker
          position={markerPosition}
          icon={getMarkerIcon("yellow")}
          eventHandlers={{
            click: handleMarkerClick
          }}
        />
      )}
    </>
  );
};

// Function inside MapContainer to fit bounds
const MapBounds = ({ boundary, isCollapsed }) => {
  const map = useMap();

  useEffect(() => {
    if (boundary.length > 0) {
      const bounds = L.latLngBounds(boundary[0]);
      map.fitBounds(bounds, { padding: [50, 50] });
      map.setMaxBounds(bounds);
    }
  }, [boundary, map]);

  // Refresh map size when sidebar collapses
  useEffect(() => {
    setTimeout(() => {
      map.invalidateSize();
    }, 300); // Adjust timeout based on sidebar animation speed
  }, [isCollapsed, map]);

  return null;
};

// Crime Mapping Component
const HeatmapLayer = ({ reports }) => {
  const map = useMap();

  useEffect(() => {
    if (!map || reports.length === 0) return;

    // Calculate intensity based on report type
    const getIntensity = (reportType) => {
      // Types with more services involved get higher intensity
      switch(reportType) {
        case 1: // Crime only
          return 3;
        case 2: // Fire only
          return 3;
        case 3: // Crime & Fire
          return 5;
        case 4: // Medical only
          return 3;
        case 5: // Crime & Medical
          return 5;
        case 6: // Fire & Medical
          return 5;
        case 7: // Crime, Fire & Medical
          return 8; // Highest intensity - all services involved
        case 8: // Suspicious Activity
          return 2;
        default:
          return 1;
      }
    };

    const heatLayer = L.heatLayer(
      reports.map((report) => [
        report.address.location.latitude,
        report.address.location.longitude,
        getIntensity(report.type), // Dynamic intensity based on report type
      ]),
      {
        radius: 25, // Increased radius for better visibility
        blur: 15,
        maxZoom: 18,
        minOpacity: 0.4, // Set minimum opacity so points are always somewhat visible
        max: 8, // Maximum value to normalize the intensity
        gradient: { 
          0.2: "blue",    // Low intensity
          0.4: "green",   // Medium-low
          0.6: "yellow",  // Medium
          0.8: "orange",  // Medium-high
          1.0: "red"      // High intensity
        }
      }
    );    

    // Add an immediate setView to the center of the data points to ensure visibility
    if (reports.length > 0) {
      const latitudes = reports.map(r => r.address.location.latitude);
      const longitudes = reports.map(r => r.address.location.longitude);
      
      const centerLat = latitudes.reduce((a, b) => a + b, 0) / latitudes.length;
      const centerLng = longitudes.reduce((a, b) => a + b, 0) / longitudes.length;
      
      // Only set the view if we're not already looking at this area
      const center = map.getCenter();
      if (Math.abs(center.lat - centerLat) > 0.05 || Math.abs(center.lng - centerLng) > 0.05) {
        map.setView([centerLat, centerLng], 13);
      }
    }

    map.addLayer(heatLayer);

    return () => {
      map.removeLayer(heatLayer);
    };
  }, [map, reports]);

  return null;
};

/* const HeatmapLayer = () => {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    const heatLayer = L.heatLayer(
      mockCrimeData.map((report) => [report.lat, report.lng, report.intensity]),
      {
        radius: 25,
        blur: 20,
        maxZoom: 18,
        gradient: { 0.3: "blue", 0.6: "lime", 1: "red" }
      }
    );

    map.addLayer(heatLayer);

    return () => {
      map.removeLayer(heatLayer);
    };
  }, [map]);

  return null;
}; // With Mock Data */

const containerStyle = {
  width: "100%",
  height: "600px",
};

const worldBounds = [
  [
    [-90, -180],
    [-90, 180],
    [90, 180],
    [90, -180],
    [-90, -180],
  ],
];

/* const customIcon = new L.Icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
}); */

const markerColors = {
  blue: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png",
  red: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  green: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
  orange: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png",
  yellow: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-yellow.png",
  violet: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-violet.png",
  grey: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-grey.png",
  black: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-black.png",
};

const getMarkerIcon = (color = "blue") => {
  return new L.Icon({
    iconUrl: markerColors[color] || markerColors.blue, // Default to blue if color not found
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
  });
};

export default Map;