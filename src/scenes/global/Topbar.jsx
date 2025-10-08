import { Box, IconButton, Tooltip, useTheme } from "@mui/material";
import { useContext } from "react";
import { ColorModeContext, tokens } from "../../theme";
//import InputBase from "@mui/material/InputBase";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
//import NotificationsOutlinedIcon from "@mui/icons-material/NotificationsOutlined";
//import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
//import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
//import SearchIcon from "@mui/icons-material/SearchOffOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import { useNavigate } from "react-router-dom";
import { auth } from "../../config/firebaseConfig"; // Import Firebase auth instance
import { signOut } from "firebase/auth";

const Topbar = () => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    const colorMode = useContext(ColorModeContext);
    const navigate = useNavigate();

    // Handle Logout
    const handleLogout = async () => {
        try {
            await signOut(auth);
            navigate("/"); // Redirect to login page after logout
        } catch (error) {
            console.error("Error logging out:", error);
        }
    };

    return (
        <Box display="flex" justifyContent="space-between" p={2}>
            {/* Search Bar */}
            <Box display="flex" backgroundColor={colors.primary[400]} borderRadius={"3px"}>
                {/* <InputBase sx={{ ml: 2, flex: 1 }} placeholder="Search" />
                <IconButton type="button" sx={{ p: 1 }}>
                    <SearchIcon />
                </IconButton> */}
            </Box>
            {/* Icons */}
            <Box display={'flex'}>
                {/* Theme Mode Button */}
                <Tooltip title={theme.palette.mode === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"} placement="bottom">
                    <IconButton onClick={colorMode.toggleColorMode}>
                        {theme.palette.mode === "dark" ? <DarkModeOutlinedIcon /> : <LightModeOutlinedIcon />}
                    </IconButton>
                </Tooltip>
                {/* <IconButton>
                    <NotificationsOutlinedIcon />
                </IconButton>
                <IconButton>
                    <SettingsOutlinedIcon />
                </IconButton>
                <IconButton>
                    <PersonOutlinedIcon />
                </IconButton> */}
                {/* Logout Button */}
                <Tooltip title={"Logout"} placement="bottom" sx={{ bgcolor: "gray.700", color: "white" }}>
                    <IconButton onClick={handleLogout}>
                        <LogoutOutlinedIcon sx={{ color: colors.redAccent[600]}}/>
                    </IconButton>
                </Tooltip>
            </Box>
        </Box>
    )
};

export default Topbar;