import { Box, useTheme } from "@mui/material";
import Header from "../../components/Header";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import Typography from "@mui/material/Typography";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { tokens } from "../../theme";

const FAQ = () => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);

    return (
        <Box m="20px">
            <Header title="FAQ" subtitle="Frequently Asked Questions Page" />
            
            {/* Scrollable container for accordions */}
            <Box 
                mt="20px" 
                sx={{ 
                    maxHeight: "68vh", 
                    overflowY: "auto",
                    paddingRight: "10px",
                    "&::-webkit-scrollbar": {
                        width: "8px",
                    },
                    "&::-webkit-scrollbar-track": {
                        background: colors.primary[400],
                        borderRadius: "4px",
                    },
                    "&::-webkit-scrollbar-thumb": {
                        background: colors.greenAccent[500],
                        borderRadius: "4px",
                    },
                    "&::-webkit-scrollbar-thumb:hover": {
                        background: colors.greenAccent[400],
                    },
                }}
            >
                <Accordion defaultExpanded>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography color={colors.greenAccent[500]} variant="h5">
                            What is the purpose of Mayday Web?
                        </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Typography>
                            Mayday Web is designed to help authorized personnel manage reports, users, and stations; view and download performance summaries; 
                            dispatch responders; and monitor report locations through an integrated map interface.
                        </Typography>
                    </AccordionDetails>
                </Accordion>

                <Accordion defaultExpanded>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography color={colors.greenAccent[500]} variant="h5">
                            How can I download daily/weekly/monthly/quarterly overall reports?
                        </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Typography>
                            You can download overall summaries from the Dashboard. Simply choose the filter (daily, weekly, monthly, or quarterly), and click the 
                            Download button. You can hover over the tooltip to confirm if the filters are working properly.
                        </Typography>
                    </AccordionDetails>
                </Accordion>

                <Accordion defaultExpanded>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography color={colors.greenAccent[500]} variant="h5">
                            How can I download responder performance reports?
                        </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Typography>
                            Navigate to the Recent Responses section and select a filter (daily, weekly, monthly, or quarterly) before pressing the Print button.
                            In the Print Filter Modal, you can select an available user for generating a performance report and preview the applied filter settings.
                        </Typography>
                    </AccordionDetails>
                </Accordion>

                <Accordion defaultExpanded>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography color={colors.greenAccent[500]} variant="h5">
                            What information is included in the performance reports?
                        </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Typography>
                            The performance report includes all reports responded to, response times, and statistics such as fastest, slowest, and average response times, 
                            most common hour of response, as well as fastest, slowest, and average resolution times.
                        </Typography>
                    </AccordionDetails>
                </Accordion>
                
                <Accordion defaultExpanded>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography color={colors.greenAccent[500]} variant="h5">
                            How do I view and manage incoming reports?
                        </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Typography>
                            Navigate to the Reports section to view all submitted reports. You can filter by type (crime, fire, medical, suspicious), 
                            status (pending, acknowledged, resolved, etc.), or date.
                        </Typography>
                    </AccordionDetails>
                </Accordion>

                <Accordion defaultExpanded>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography color={colors.greenAccent[500]} variant="h5">
                            Can I assign or reassign responders to a report?
                        </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Typography>
                            Yes and no. You can select a report and use the Dispatch feature to assign responders in real-time; however, you cannot reassign responders once they have been assigned.
                        </Typography>
                    </AccordionDetails>
                </Accordion>

                <Accordion defaultExpanded>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography color={colors.greenAccent[500]} variant="h5">
                            How do I manage community and responder users?
                        </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Typography>
                            Go to the Users tab to view all users. From here, you can update roles, add users, edit information, reset passwords, 
                            review IDs, delete accounts, and manage access. You can filter by user type (community, responders, fire responders, etc.) and use the search function.
                        </Typography>
                    </AccordionDetails>
                </Accordion>

                <Accordion defaultExpanded>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography color={colors.greenAccent[500]} variant="h5">
                            Can I add or delete a station?
                        </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Typography>
                            Yes, under the Map tab, you can add new stations, delete existing ones, or update their type and location.
                        </Typography>
                    </AccordionDetails>
                </Accordion>

                <Accordion defaultExpanded>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography color={colors.greenAccent[500]} variant="h5">
                            How can I view images from suspicious reports submitted by users?
                        </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Typography>
                            There are two ways to view submitted images: Navigate to the Map and select "All Reports" or "Show All Category," then left-click on a Report Marker (Blue). 
                            Alternatively, select a report, expand it, and click the "View Evidence" button at the top to see the uploaded evidence.
                        </Typography>
                    </AccordionDetails>
                </Accordion>
            </Box>
            <Box height="10px"/>
        </Box>
    );
};

export default FAQ;