// React & Hooks
import { useEffect, useState, useContext } from "react";

// Material UI Components
import { Box, useTheme, Tooltip, IconButton } from "@mui/material";
import ToggleOffOutlinedIcon from '@mui/icons-material/ToggleOffOutlined';
import ToggleOnOutlinedIcon from '@mui/icons-material/ToggleOnOutlined';

// Google Maps Components
//import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api";

// Leaflet Map Components
import { MapContainer, TileLayer, Popup, Marker as OSMMarker, Polygon, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// Context & Theming
import { DataContext } from "../../data";
import { tokens } from "../../theme";

// Local Data and Components
import Header from "../../components/Header";
import boundaryData from "../../data/indangBoundary.json";

const Map = ({ isCollapsed }) => {
  const { stations, startStationsListener, stopStationsListener } = useContext(DataContext); // Context for Station data  
  const theme = useTheme(); // MUI Theme Hook  
  const colors = tokens(theme.palette.mode); // Color tokens based on Theme Mode  

  const [mapCenter, setMapCenter] = useState(center); // State for map center  
  const [indangBoundary, setIndangBoundary] = useState([]); // State for Indang boundary data  
  const [isListening, setIsListening] = useState(false); // State to track if station listener is active  

  const geoapifyApiKey = process.env.REACT_APP_GEOAPIFY_API_KEY; // API key for Geoapify services  

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

  // Toggle Real-time Listener
  const handleToggleListener = () => {
    if (isListening) {
      stopStationsListener();
    } else {
      startStationsListener();
    }
    setIsListening(!isListening);
  };

  return (
    <Box m="20px">
      <Header title="MAP" subtitle="View your current location" />
      {/* Listener Toggle Buttons */}
      <Box mt="10px" display="flex" gap={1}>
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
      <Box mt="10px">
          <MapContainer
            center={mapCenter}
            zoom={12} 
            style={containerStyle}
            maxBounds={indangBoundary.length > 0 ? L.latLngBounds(indangBoundary[0]) : undefined}
            maxBoundsViscosity={1.0}
            minZoom={12}
            maxZoom={18}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

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

            {/* Station Markers */}
            {stations.map((station) => (
              <OSMMarker
                key={station.station.id}
                position={[
                  station.address.location.latitude,
                  station.address.location.longitude,
                ]}
                icon={getMarkerIcon("orange")}
              >
                <Popup>
                  <b>{station.station.name}</b>
                  <br />
                  {station.address.barangay}, {station.address.municipality}, {station.address.province}
                </Popup>
              </OSMMarker>
            ))}

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
    </Box>
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

const containerStyle = {
  width: "100%",
  height: "500px",
};

const center = {
  lat: 14.197811048999133,
  lng: 120.88149481077414,
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

const customIcon = new L.Icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

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