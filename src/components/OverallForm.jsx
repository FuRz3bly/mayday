import React from 'react';
import { Box, Typography } from '@mui/material';
import ResponseTable from "./ResponseTable";
import ResponseBarChart from "./ResponseBarChart";
import ReportBarChart from "./ReportBarChart";
import ReportTable from "./ReportTable";

const OverallForm = ({ 
  refs, 
  filters, 
  filteredReports, 
  getReportTitle, 
  getReportSubtitle, 
  getReportTime 
}) => {
  const { summaryOverallRef, overallTitleRef, responseBarangayRef, barBarangayRef } = refs;

  return (
    <Box ref={summaryOverallRef}>
      {/* Page 1 */}
      <Box
        ref={overallTitleRef}
        className="page page1-print-align"
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        sx={{ width: "900px", height: "650px", bgcolor: '#fff' }}
      >
        <Typography variant="h1" fontWeight="600" color="#000">
          {(filters?.global?.primary && filters?.global?.secondary) 
            ? getReportTitle(filters?.global?.primary, filters?.global?.secondary) 
            : 'Monthly Report for March 2025'}
        </Typography>
        <Typography variant="h2" fontWeight="400" color="#000">
          {filters?.global?.primary 
            ? getReportSubtitle(filters?.global?.primary) 
            : "Mayday Summarization of Operations"}
        </Typography>
      </Box>
      
      {/* Page 2 */}
      <Box
        ref={responseBarangayRef}
        className="page page2-print-align"
        display="flex"
        flexDirection="column"
        alignItems="center"
        sx={{ width: "900px", height: "650px", bgcolor: '#fff', padding: 3 }}
      >
        <Typography variant="h3" fontWeight="400" color="#000" marginBottom={2}>
          {`All Response Times by Barangay in Minutes - ${(filters?.global?.primary && filters?.global?.secondary) 
            ? getReportTime(filters?.global?.primary, filters?.global?.secondary) 
            : '2025'}`}
        </Typography>
        
        {/* Page 2 - Grid */}
        <Box
          display="grid"
          gridTemplateColumns="repeat(6, 1fr)"
          gridAutoRows="auto"
          gap="10px"
          sx={{ width: "100%", flexGrow: 1, overflow: 'hidden' }}
        >
          {/* Response Table Separated By Barangay */}
          <Box
            gridColumn="span 2"
            gridRow="span 3"
            sx={{ width: "100%", height: "100%", overflow: 'hidden' }}
            className="avoid-break"
          >
            <ResponseTable reports={filteredReports} />
          </Box>
          
          {/* Response Time Bar Chart Separated By Barangay */}
          <Box
            gridColumn="span 4"
            gridRow="span 2"
            sx={{ height: "100%", color: "black", border: "1px solid black", overflow: 'hidden' }}
            className="avoid-break"
          >
            <ResponseBarChart reports={filteredReports}/>
          </Box>
          
          {/* Description and Explanation */}
          <Box
            gridColumn="span 4"
            gridRow="span 1"
            margin={1}
            sx={{ overflow: 'hidden' }}
            className="avoid-break"
          >
            <Typography variant="h6" fontWeight="300" color="#000">
              • Includes 100% of resolved emergencies (fire, crime, medical, suspicious activity, etc.), even those with multiple responses.
            </Typography>
            <Typography variant="h6" fontWeight="300" color="#000">
              • Response time is measured from the station's response until the responder arrives on location.
            </Typography>
            <Typography variant="h6" fontWeight="300" color="#000">
              • Response time is displayed in MM:SS (minutes and seconds).
            </Typography>
            <Typography variant="h6" fontWeight="300" color="#000">
              • The response time for each barangay averages all recorded times within that area.
            </Typography>
            <Typography variant="h6" fontWeight="300" color="#000" marginTop={2}>
              NOTE: The average response time is less than 7 minutes. Barangays with response times exceeding 7 minutes are highlighted in red.
            </Typography>
          </Box>
        </Box>
      </Box>
      
      {/* Page 3 */}
      <Box
        ref={barBarangayRef}
        className="page page3-print-align"
        display="flex"
        flexDirection="column"
        alignItems="center"
        sx={{ width: "900px", height: "650px", bgcolor: '#fff', padding: 3 }}
      >
        <Typography variant="h3" fontWeight="400" color="#000" marginBottom={2}>
          {`Total Reports by Barangay - ${(filters?.global?.primary && filters?.global?.secondary) 
            ? getReportTime(filters?.global?.primary, filters?.global?.secondary) 
            : '2025'}`}
        </Typography>
        
        {/* Page 3 - Grid */}
        <Box
          display="grid"
          gridTemplateColumns="repeat(6, 1fr)"
          gridAutoRows="auto"
          gap="10px"
          sx={{ width: "100%", height: "100%", flexGrow: 1, overflow: 'hidden' }}
        >
          {/* Response Time Bar Chart Separated By Barangay */}
          <Box
            gridColumn="span 6"
            gridRow="span 2"
            sx={{ height: "100%", color: "black", border: "1px solid black", overflow: 'hidden' }}
            className="avoid-break"
          >
            <ReportBarChart reports={filteredReports}/>
          </Box>
          
          {/* Description and Explanation */}
          <Box
            gridColumn="span 6"
            gridRow="span 1"
            sx={{ height: "100%", overflow: 'hidden' }}
            className="avoid-break"
          >
            <ReportTable reports={filteredReports} />
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default OverallForm;