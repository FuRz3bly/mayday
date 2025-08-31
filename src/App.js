import "./config/firebaseConfig"; // Ensure Firebase initializes
import { useState, useEffect } from "react";
import { ColorModeContext, useMode } from "./theme";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { useLocation, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './config/firebaseConfig';

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
import Missing from "./scenes/missing";

import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DataProvider } from "./data";

// Public Route redirects authenticated users away from Login Page
const PublicRoute = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe(); // Cleanup subscription on unmount
  }, []);
  
  // Show loading while checking auth state
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px',
        gap: '16px'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #3498db',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
        Please wait...
      </div>
    );
  }
  
  // If user is authenticated, redirect to dashboard
  if (user) {
    return <Navigate to="/" replace />;
  }
  
  // If not authenticated, show the public route (login page)
  return children;
};

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
                  <Route path="/login" element={
                    <PublicRoute>
                      <Login />
                    </PublicRoute>
                  } />

                  {/* Private Routes (Only logged-in admins can access) */}
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

                    {/* 404 Page for authenticated users */}
                    <Route path="*" element={<Missing />} />
                  </Route>

                  {/* 404 Page for unauthenticated users */}
                  <Route path="*" element={<Missing />} />
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