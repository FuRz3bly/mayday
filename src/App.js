import "./config/firebaseConfig"; // Ensure Firebase initializes
import { useState } from "react";
import { ColorModeContext, useMode } from "./theme";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { useLocation, Routes, Route } from 'react-router-dom';
import Topbar from "./scenes/global/Topbar";
import Sidebar from "./scenes/global/Sidebar";
import Login from "./scenes/login";
import Dashboard from "./scenes/dashboard";
import Users from "./scenes/users";
import Reports from "./scenes/reports";
import Stations from "./scenes/stations";
import Map from "./scenes/map";
import Form from "./scenes/form";
import Calendar from "./scenes/calendar";
import FAQ from "./scenes/faq";
import Bar from "./scenes/bar";
import Pie from "./scenes/pie";
import Line from "./scenes/line";
import Geography from "./scenes/geography";
import PrivateRoute from "./components/PrivateRoute";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DataProvider } from "./data";

function App() {
  const [theme, colorMode] = useMode();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();

  const isLoginPage = location.pathname === "/login";
  
  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <DataProvider>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <CssBaseline />
            <div className="app">
              {!isLoginPage && <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />}
              {/* Routes */}
              <main className="content">
                {!isLoginPage && <Topbar />}
                <Routes>
                  {/* Public Route */}
                  <Route path="/login" element={<Login />} />

                  {/* Private Routes (Only logged-in users can access) */}
                  <Route element={<PrivateRoute />}>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/users" element={<Users />} />
                    <Route path="/reports" element={<Reports />} />
                    <Route path="/stations" element={<Stations />} />
                    <Route path="/map" element={<Map isCollapsed={isCollapsed} />} />
                    <Route path="/form" element={<Form />} />
                    <Route path="/calendar" element={<Calendar />} />
                    <Route path="/faq" element={<FAQ />} />
                    <Route path="/bar" element={<Bar />} />
                    <Route path="/pie" element={<Pie />} />
                    <Route path="/line" element={<Line />} />
                    <Route path="/geography" element={<Geography />} />
                  </Route>
                </Routes>
              </main>
            </div>
          </LocalizationProvider>
        </DataProvider>
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}

export default App;
