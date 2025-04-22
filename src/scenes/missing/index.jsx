import { Box, Button, Typography, useTheme } from "@mui/material";
import { tokens } from "../../theme";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import { useNavigate } from "react-router-dom";

const Missing = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const navigate = useNavigate();

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      height="80vh"
      textAlign="center"
      p={3}
    >
      <ErrorOutlineIcon 
        sx={{ 
          fontSize: "100px", 
          color: colors.primary[500],
          mb: 2
        }} 
      />
      
      <Typography
        variant="h1"
        fontWeight="bold"
        color={colors.grey[100]}
        mb={2}
      >
        404
      </Typography>
      
      <Typography
        variant="h3"
        color={colors.grey[100]}
        mb={3}
      >
        Page Not Found
      </Typography>
      
      <Typography
        variant="h5"
        color={colors.greenAccent[400]}
        mb={5}
      >
        The page you're looking for doesn't exist or has been moved.
      </Typography>
      
      <Button
        variant="contained"
        startIcon={<HomeOutlinedIcon />}
        onClick={() => navigate("/")}
        sx={{
          backgroundColor: colors.blueAccent[700],
          color: colors.grey[100],
          fontSize: "14px",
          fontWeight: "bold",
          padding: "10px 20px",
          "&:hover": {
            backgroundColor: colors.blueAccent[600],
          }
        }}
      >
        Back to Dashboard
      </Button>
    </Box>
  );
};

export default Missing;