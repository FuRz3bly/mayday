import { Typography, Box } from "@mui/material";
import { useMemo } from "react";

const PerformanceSummary = ({ 
  responses = [], 
  filters = { 
    primary: 'monthly', // daily, weekly, monthly, quarterly, yearly
    secondary: '2025-03' // YYYY-MM-DD, YYYY-WX, YYYY-MM, YYYY-QX, YYYY
  },
  targetResponseTime = 7,
  user = { name: { last_name: '' }, station: { rank: '' } }
}) => {
  // Get officer's full title (rank + last name)
  const officerTitle = `${user.station.rank} ${user.name.last_name}`;

  // Get ISO week number helper function
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

  // Format filter to long form (e.g., "April 2025" instead of "2025-03")
  const formatFilterToLongForm = (primary, secondary) => {
    if (!primary || !secondary) return "";
    
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];

    switch (primary) {
      case 'daily':
        if (secondary.match(/^\d{4}-\d{2}-\d{2}$/)) {
          const [year, month, day] = secondary.split('-');
          return `${monthNames[parseInt(month) - 1]} ${parseInt(day)}, ${year}`;
        }
        break;
      case 'weekly':
        if (secondary.match(/^\d{4}-W\d{1,2}$/)) {
          const [year, weekPart] = secondary.split('-');
          const weekNumber = weekPart.substring(1);
          return `Week ${weekNumber}, ${year}`;
        }
        break;
      case 'monthly':
        if (secondary.match(/^\d{4}-\d{2}$/)) {
          const [year, month] = secondary.split('-');
          return `${monthNames[parseInt(month) - 1]} ${year}`;
        }
        break;
      case 'quarterly':
        if (secondary.match(/^\d{4}-Q[1-4]$/)) {
          const [year, quarterPart] = secondary.split('-');
          const quarter = quarterPart.substring(1);
          return `Quarter ${quarter}, ${year}`;
        }
        break;
      case 'yearly':
        if (secondary.match(/^\d{4}$/)) {
          return `Year ${secondary}`;
        }
        break;
      default:
        return secondary;
    }

    return secondary; // Return the original if format doesn't match
  };
  
  const formattedFilter = filters ? formatFilterToLongForm(filters.primary, filters.secondary) : "";
  const safeFilters = filters || { primary: 'monthly', secondary: '2025-03' };

  // Process response data to get performance metrics
  const performanceMetrics = useMemo(() => {
    // Filter responses by the appropriate time period
    let filteredResponses = responses;
    
    if (safeFilters.secondary) {
      filteredResponses = responses.filter(response => {
        if (!response?.date?.incident) return false;
        const incidentDate = new Date(response.date.incident.toMillis());
        const incidentYear = incidentDate.getFullYear();
        const incidentMonth = incidentDate.getMonth() + 1;
        const incidentDay = incidentDate.getDate();
        const incidentWeek = getISOWeekNumber(incidentDate);
        const incidentQuarter = Math.ceil(incidentMonth / 3);
        
        switch (safeFilters.primary) {
          case 'daily':
            if (safeFilters.secondary.match(/^\d{4}-\d{2}-\d{2}$/)) {
              const [year, month, day] = safeFilters.secondary.split('-').map(num => parseInt(num));
              return (
                incidentYear === year &&
                incidentMonth === month &&
                incidentDay === day
              );
            }
            break;
          case 'weekly':
            if (safeFilters.secondary.match(/^\d{4}-W\d{1,2}$/)) {
              const [year, weekPart] = safeFilters.secondary.split('-');
              const weekNumber = parseInt(weekPart.substring(1));
              return (
                incidentYear === parseInt(year) &&
                incidentWeek === weekNumber
              );
            }
            break;
          case 'monthly':
            if (safeFilters.secondary.match(/^\d{4}-\d{2}$/)) {
              const [year, month] = safeFilters.secondary.split('-').map(num => parseInt(num));
              return (
                incidentYear === year &&
                incidentMonth === month
              );
            }
            break;
          case 'quarterly':
            if (safeFilters.secondary.match(/^\d{4}-Q[1-4]$/)) {
              const [year, quarterPart] = safeFilters.secondary.split('-');
              const quarter = parseInt(quarterPart.substring(1));
              return (
                incidentYear === parseInt(year) &&
                incidentQuarter === quarter
              );
            }
            break;
          case 'yearly':
            if (safeFilters.secondary.match(/^\d{4}$/)) {
              return incidentYear === parseInt(safeFilters.secondary);
            }
            break;
          default:
            return false;
        }
        
        return false;
      });
    }

    // Count only valid responses with timing data
    const validResponses = filteredResponses.filter(response => {
      return response?.date?.response && response?.date?.arrived;
    });

    if (validResponses.length === 0) {
      return {
        totalResponses: 0,
        meetingTarget: 0,
        exceedingTarget: 0,
        averageResponseTime: 0,
        maxResponseTime: 0,
        minResponseTime: 0
      };
    }

    // Calculate response metrics
    let meetingTarget = 0;
    let exceedingTarget = 0;
    let totalResponseTime = 0;
    let maxResponseTime = 0;
    let minResponseTime = Number.MAX_VALUE;

    validResponses.forEach(response => {
      const responseTime = response?.date?.response ? new Date(response.date.response.toMillis()) : null;
      const arrivedTime = response?.date?.arrived ? new Date(response.date.arrived.toMillis()) : null;
      
      if (responseTime && arrivedTime) {
        const responseTimeDiff = (arrivedTime.getTime() - responseTime.getTime()) / (1000 * 60);
        
        // Update counters
        if (responseTimeDiff <= targetResponseTime) {
          meetingTarget++;
        } else {
          exceedingTarget++;
        }
        
        // Update statistics
        totalResponseTime += responseTimeDiff;
        maxResponseTime = Math.max(maxResponseTime, responseTimeDiff);
        minResponseTime = Math.min(minResponseTime, responseTimeDiff);
      }
    });

    return {
      totalResponses: validResponses.length,
      meetingTarget,
      exceedingTarget,
      averageResponseTime: totalResponseTime / validResponses.length,
      maxResponseTime,
      minResponseTime: minResponseTime === Number.MAX_VALUE ? 0 : minResponseTime
    };
  }, [responses, safeFilters.primary, safeFilters.secondary, targetResponseTime]);

  // Generate personalized performance assessment based on metrics
  const getPersonalizedAssessment = () => {
    const { totalResponses, meetingTarget } = performanceMetrics;
    
    if (totalResponses === 0) {
      return `We don't have any response data for ${officerTitle} during this period.`;
    }
    
    const adherenceRate = (meetingTarget / totalResponses) * 100;
    
    if (adherenceRate >= 90) {
      return `${officerTitle} has demonstrated exceptional performance this period with ${adherenceRate.toFixed(2)}% of responses meeting the ${targetResponseTime.toFixed(2)}-minute target. Their consistent reliability and efficiency in emergency situations sets a high standard for the team. ${officerTitle}'s quick response times directly contribute to better outcomes in the field.`;
    } else if (adherenceRate >= 80) {
      return `${officerTitle} has shown strong performance this period with ${adherenceRate.toFixed(2)}% of responses meeting the ${targetResponseTime.toFixed(2)}-minute target. They show good reliability with room for minor improvements in response efficiency. ${officerTitle}'s dedication to prompt service is appreciated.`;
    } else if (adherenceRate >= 70) {
      return `${officerTitle} has delivered satisfactory performance this period with ${adherenceRate.toFixed(2)}% of responses meeting the ${targetResponseTime.toFixed(2)}-minute target. We recommend that ${officerTitle} review their routes and response procedures to further improve efficiency. Their commitment to service remains valuable to our team.`;
    } else if (adherenceRate >= 50) {
      return `${officerTitle}'s performance is currently below target with ${adherenceRate.toFixed(2)}% of responses meeting the ${targetResponseTime.toFixed(2)}-minute target. We suggest focused training to help ${officerTitle} improve response times and a review of their dispatch procedures. With the right support, we believe they can reach our expected standards.`;
    } else {
      return `${officerTitle}'s performance requires immediate attention with only ${adherenceRate.toFixed(2)}% of responses meeting the ${targetResponseTime.toFixed(2)}-minute target. We recommend an urgent review of ${officerTitle}'s response protocols and potential obstacles they may be facing. A personalized improvement plan would help address these challenges.`;
    }
  };

  // Create personalized summary text
  const getPersonalizedSummary = () => {
    if (performanceMetrics.totalResponses === 0) {
      return `We don't have any response data for ${officerTitle} during ${formattedFilter}.`;
    }
    
    return (
      `During ${formattedFilter}, ${officerTitle} responded to ${performanceMetrics.totalResponses} incidents. 
      They successfully arrived within our target time of ${targetResponseTime.toFixed(2)} minutes for 
      ${performanceMetrics.meetingTarget} reports (${(performanceMetrics.meetingTarget / performanceMetrics.totalResponses * 100).toFixed(2)}% of all reports). 
      ${performanceMetrics.exceedingTarget} incidents had response times exceeding our target. 
      ${officerTitle}'s average response time was ${performanceMetrics.averageResponseTime.toFixed(2)} minutes.`
    );
  };

  return (
    <Box sx={{ width: "100%" }}>
      <Typography variant="h7" fontWeight="400" color="#000" paragraph sx={{ textAlign: "justify" }}>
        {getPersonalizedSummary()}
      </Typography>
      
      <Typography variant="h7" fontWeight="400" color="#000" paragraph sx={{ textAlign: "justify" }}>
        {getPersonalizedAssessment()}
      </Typography>
      
      {performanceMetrics.totalResponses > 0 && (
        <Typography variant="h7" fontWeight="400" color="#555" sx={{ mt: 2, fontStyle: "italic", textAlign: "justify" }}>
          NOTE: This assessment covers the period of {formattedFilter}. Response time is measured from start of response to arrival on scene.
        </Typography>
      )}
    </Box>
  );
};

export default PerformanceSummary;