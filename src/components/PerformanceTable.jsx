import { useTheme } from "@mui/material";
import { tokens } from "../theme";
import { useMemo } from "react";
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from "@mui/material";
import { ArrowUpward, ArrowDownward } from "@mui/icons-material";

// Function to get ISO week number
const getISOWeekNumber = (date) => {
  const tempDate = new Date(date.getTime());
  // Set to Thursday in current week (ISO week starts on Monday)
  tempDate.setDate(tempDate.getDate() - (tempDate.getDay() + 6) % 7 + 3);
  // Get first Thursday of the year
  const firstThursday = new Date(tempDate.getFullYear(), 0, 4);
  firstThursday.setDate(firstThursday.getDate() - (firstThursday.getDay() + 6) % 7 + 3);
  // Calculate difference in days and divide by 7
  const diff = (tempDate - firstThursday) / 86400000;
  return Math.floor(diff / 7) + 1;
};

const processTableData = (responses, filters) => {
  if (responses.length === 0) {
    return {
      tableData: [],
      averageResponseTime: 0,
      totalReports: 0
    };
  }

  // Filter responses based on primary and secondary filters
  let filteredResponses = responses;
  if (filters && filters.primary && filters.secondary) {
    filteredResponses = responses.filter(response => {
      if (!response?.date?.incident) return false;
      
      const incidentDate = new Date(response.date.incident.toMillis());
      const year = incidentDate.getFullYear();
      const month = incidentDate.getMonth() + 1; // 1-12
      const week = getISOWeekNumber(incidentDate);
      const quarter = Math.ceil(month / 3);
      
      switch (filters.primary) {
        case 'daily':
          // YYYY-MM-DD format
          const [filterYear, filterMonth, filterDay] = filters.secondary.split('-').map(Number);
          return year === filterYear && 
                 month === filterMonth && 
                 incidentDate.getDate() === filterDay;
        
        case 'weekly':
          // YYYY-WX format
          const [weekFilterYear, weekNum] = filters.secondary.split('-W').map(Number);
          return year === weekFilterYear && week === weekNum;
        
        case 'monthly':
          // YYYY-MM format
          const [monthFilterYear, monthNum] = filters.secondary.split('-').map(Number);
          return year === monthFilterYear && month === monthNum;
        
        case 'quarterly':
          // YYYY-QX format
          const [quarterFilterYear, quarterStr] = filters.secondary.split('-Q');
          const quarterNum = parseInt(quarterStr);
          return year === parseInt(quarterFilterYear) && quarter === quarterNum;
        
        case 'yearly':
          // YYYY format
          return year === parseInt(filters.secondary);
        
        default:
          return true;
      }
    });
  }

  // Process data for table display
  const tableData = filteredResponses
    .filter(response => 
      response?.date?.incident && 
      response?.date?.response && 
      response?.date?.arrived
    )
    .map(response => {
      const incidentDateObj = new Date(response.date.incident.toMillis());
      const responseTime = new Date(response.date.response.toMillis());
      const arrivedTime = new Date(response.date.arrived.toMillis());
      
      const responseTimeDiff = ((arrivedTime.getTime() - responseTime.getTime()) / (1000 * 60)).toFixed(1);
      
      const estimatedTime = response?.date?.estimated ? new Date(response.date.estimated.toMillis()) : null;
      const defaultETA = 7;

      let estimatedTimeValue;
      if (estimatedTime) {
        estimatedTimeValue = (estimatedTime.getTime() - responseTime.getTime()) / (1000 * 60);
      } else {
        estimatedTimeValue = defaultETA;
      }

      const actualResponseTime = parseFloat(responseTimeDiff);
      const diffPercentage = Math.round((Math.abs(actualResponseTime - estimatedTimeValue) / estimatedTimeValue) * 100);
      const isDelayed = actualResponseTime > estimatedTimeValue;

      return {
        reportId: response.report_id || "Unknown ID",
        incidentDate: incidentDateObj.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric"
        }),
        incidentDateObj, // keep raw date for sorting
        responseTime: actualResponseTime,
        etaAdherence: {
          percentage: diffPercentage,
          isFaster: !isDelayed
        }
      };
    })
    .sort((a, b) => b.incidentDateObj - a.incidentDateObj); // newest first


  // Calculate summary statistics
  const validResponseTimes = tableData.map(item => item.responseTime).filter(time => !isNaN(time));
  const averageResponseTime = validResponseTimes.length > 0 
    ? (validResponseTimes.reduce((sum, time) => sum + time, 0) / validResponseTimes.length).toFixed(1)
    : 0;
  
  return {
    tableData,
    averageResponseTime,
    totalReports: tableData.length
  };
};

const PerformanceTable = ({ responses = [], filters = { primary: 'monthly', secondary: '2025-03' } }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  const { tableData, averageResponseTime, totalReports } = useMemo(
    () => processTableData(responses, filters),
    [responses, filters]
  );

  return (
    <TableContainer component={Paper} sx={{ 
        width: '100%', 
        height: '100%', 
        overflow: 'auto', 
        padding: 0,
        backgroundColor: "white" 
    }}>
      <Table sx={{ 
        minWidth: 300,
        "& .MuiTableCell-root": {
          border: "1px solid black",
          padding: "6px"
        }
      }}>
        <TableHead>
          <TableRow sx={{ backgroundColor: "white" }}>
            <TableCell sx={{ fontWeight: 'bold', color: '#000000' }}>Incident Date</TableCell>
            <TableCell sx={{ fontWeight: 'bold', color: '#000000' }}>Response Time</TableCell>
            <TableCell sx={{ fontWeight: 'bold', color: '#000000' }}>ETA</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {tableData.length > 0 ? (
            <>
              {tableData.slice(0, 12).map((item, index) => (
                <TableRow
                  key={item.reportId + index}
                  sx={{ backgroundColor: "white" }}
                >
                  <TableCell sx={{ color: '#000000' }}>{item.incidentDate}</TableCell>
                  <TableCell sx={{ color: '#000000' }}>{item.responseTime} mins</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography 
                        variant="body2"
                        sx={{ 
                          color: '#000000',
                          mr: 1
                        }}
                      >
                        {item.etaAdherence.percentage}%
                      </Typography>
                      {item.etaAdherence.isFaster ? (
                        <ArrowUpward fontSize="small" sx={{ color: '#00AA00' }} />
                      ) : (
                        <ArrowDownward fontSize="small" sx={{ color: colors.redAccent[500] }} />
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
              {/* Summary Row */}
              <TableRow sx={{ backgroundColor: "white" }}>
                <TableCell colSpan={3} sx={{ fontWeight: 'bold', color: '#000000', textAlign: 'center' }}>
                  All Reports: {totalReports} | Average: {averageResponseTime} mins
                </TableCell>
              </TableRow>
            </>
          ) : (
            <TableRow>
              <TableCell colSpan={3} sx={{ textAlign: 'center', color: '#000000' }}>
                No data available for the selected period
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default PerformanceTable;