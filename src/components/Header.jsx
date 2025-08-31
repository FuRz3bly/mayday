import { Typography, Box, useTheme } from "@mui/material";
import { tokens } from "../theme";

const Header = ({ title, subtitle }) => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    const themeMode = theme?.palette?.mode ? theme.palette.mode : 'dark'

    return (
        <Box>
            <Typography variant="h2" color={colors.grey[100]} fontWeight="bold" sx={{ mb: "5px" }}>{title}</Typography>
            <Typography variant="h5" color={themeMode === 'dark' ? colors.greenAccent[400] : colors.blueAccent[500]}>{subtitle}</Typography>
        </Box>
    )
}

export default Header;