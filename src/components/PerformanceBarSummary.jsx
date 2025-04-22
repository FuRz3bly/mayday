import { Typography, Box } from "@mui/material";
import { useMemo } from "react";

const PerformanceBarSummary = ({ 
  responses = [], 
  filters = { primary: "monthly", secondary: "2025-03" },
  targetResponseTime = 7,
  user = { name: { last_name: '' }, station: { rank: '' } }
}) => {
  // Get officer's full title (rank + last name)
  const officerTitle = `${user.station.rank} ${user.name.last_name}`;

  // Helper function to get ISO week number
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

  // Format filter to long form (e.g., "March 2025" instead of "2025-03")
  const formatFilterToLongForm = (primary, secondary) => {
    if (!secondary) return "";
    
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    
    switch (primary) {
      case "daily":
        const [year, month, day] = secondary.split('-');
        return `${monthNames[parseInt(month) - 1]} ${parseInt(day)}, ${year}`;
      
      case "weekly":
        const [weekYear, weekNum] = secondary.split('-W');
        return `Week ${weekNum}, ${weekYear}`;
      
      case "monthly":
        const [monthYear, monthNum] = secondary.split('-');
        return `${monthNames[parseInt(monthNum) - 1]} ${monthYear}`;
      
      case "quarterly":
        const [qYear, quarter] = secondary.split('-Q');
        return `Q${quarter} ${qYear}`;
      
      case "yearly":
        return secondary;
      
      default:
        return secondary;
    }
  };
  
  const formattedFilter = formatFilterToLongForm(filters.primary, filters.secondary);

  // Process response data to get performance metrics with focus on time patterns
  const performanceAnalysis = useMemo(() => {
    // Filter responses based on primary and secondary filters
    let filteredResponses = responses;
    
    if (filters.primary && filters.secondary) {
      filteredResponses = responses.filter(response => {
        if (!response?.date?.incident) return false;
        
        const incidentDate = response.date?.incident?.toDate?.() ?? response.date?.incident;
        const year = incidentDate.getFullYear();
        const month = incidentDate.getMonth() + 1;
        const day = incidentDate.getDate();
        const weekNum = getISOWeekNumber(incidentDate);
        const quarter = Math.floor((month - 1) / 3) + 1;
        
        switch (filters.primary) {
          case "daily":
            const [dYear, dMonth, dDay] = filters.secondary.split('-');
            return (
              year === parseInt(dYear) &&
              month === parseInt(dMonth) &&
              day === parseInt(dDay)
            );
          
          case "weekly":
            const [wYear, wNum] = filters.secondary.split('-W');
            return (
              year === parseInt(wYear) &&
              weekNum === parseInt(wNum)
            );
          
          case "monthly":
            const [mYear, mMonth] = filters.secondary.split('-');
            return (
              year === parseInt(mYear) &&
              month === parseInt(mMonth)
            );
          
          case "quarterly":
            const [qYear, qNum] = filters.secondary.split('-Q');
            return (
              year === parseInt(qYear) &&
              quarter === parseInt(qNum)
            );
          
          case "yearly":
            return year === parseInt(filters.secondary);
          
          default:
            return true;
        }
      });
    }

    // Count only valid responses with timing data
    const validResponses = filteredResponses.filter(response => {
      return response?.date?.response && response?.date?.arrived;
    });

    if (validResponses.length === 0) {
      return {
        totalResponses: 0,
        fastestResponse: null,
        slowestResponse: null,
        timeOfDayAnalysis: null,
        dayOfWeekAnalysis: null,
        consistencyScore: 0
      };
    }

    // Calculate timings and create detailed analysis
    const responseDetails = validResponses.map(response => {
      const incidentTime = response.date?.incident?.toDate?.() ?? response.date?.incident;
      const responseTime = response.date?.response?.toDate?.() ?? response.date?.response;
      const arrivedTime = response.date?.arrived?.toDate?.() ?? response.date?.arrived;
      
      if (responseTime && arrivedTime && incidentTime) {
        const responseTimeDiff = (arrivedTime - responseTime) / (1000 * 60); // in minutes
        const hour = incidentTime.getHours();
        const dayOfWeek = incidentTime.getDay();
        
        return {
          responseTimeDiff,
          incidentTime,
          hour,
          dayOfWeek,
          withinTarget: responseTimeDiff <= targetResponseTime
        };
      }
      return null;
    }).filter(Boolean);

    if (responseDetails.length === 0) {
      return {
        totalResponses: 0,
        fastestResponse: null,
        slowestResponse: null,
        timeOfDayAnalysis: null,
        dayOfWeekAnalysis: null,
        consistencyScore: 0
      };
    }

    // Sort by response time
    responseDetails.sort((a, b) => a.responseTimeDiff - b.responseTimeDiff);
    
    // Get fastest and slowest responses
    const fastestResponse = responseDetails[0];
    const slowestResponse = responseDetails[responseDetails.length - 1];
    
    // Group by time of day
    const hourGroups = {};
    responseDetails.forEach(detail => {
      const hourKey = detail.hour;
      if (!hourGroups[hourKey]) {
        hourGroups[hourKey] = {
          count: 0,
          totalTime: 0,
          withinTarget: 0
        };
      }
      
      hourGroups[hourKey].count++;
      hourGroups[hourKey].totalTime += detail.responseTimeDiff;
      if (detail.withinTarget) {
        hourGroups[hourKey].withinTarget++;
      }
    });
    
    // Determine best and worst hours
    let bestHour = null;
    let worstHour = null;
    let bestHourAvg = Number.MAX_VALUE;
    let worstHourAvg = 0;
    
    Object.entries(hourGroups).forEach(([hour, data]) => {
      const avgTime = data.totalTime / data.count;
      if (avgTime < bestHourAvg && data.count > 1) {
        bestHourAvg = avgTime;
        bestHour = parseInt(hour);
      }
      if (avgTime > worstHourAvg && data.count > 1) {
        worstHourAvg = avgTime;
        worstHour = parseInt(hour);
      }
    });
    
    // Get time consistency (standard deviation analysis)
    const avg = responseDetails.reduce((sum, detail) => sum + detail.responseTimeDiff, 0) / responseDetails.length;
    const variance = responseDetails.reduce((sum, detail) => sum + Math.pow(detail.responseTimeDiff - avg, 2), 0) / responseDetails.length;
    const stdDev = Math.sqrt(variance);
    
    // Convert to a 0-100 consistency score (lower stdDev means higher consistency)
    const consistencyScore = Math.max(0, Math.min(100, 100 - (stdDev / targetResponseTime * 50)));
    
    return {
      totalResponses: responseDetails.length,
      fastestResponse: {
        time: fastestResponse.responseTimeDiff,
        when: fastestResponse.incidentTime
      },
      slowestResponse: {
        time: slowestResponse.responseTimeDiff,
        when: slowestResponse.incidentTime
      },
      timeOfDayAnalysis: {
        bestHour,
        bestHourAvg,
        worstHour,
        worstHourAvg
      },
      consistencyScore: consistencyScore
    };
  }, [responses, filters, targetResponseTime]);

  // Format hour to AM/PM display
  const formatHour = (hour) => {
    if (hour === null || hour === undefined) return "N/A";
    const suffix = hour < 12 ? "AM" : "PM";
    const hour12 = hour % 12 || 12;
    return `${hour12}${suffix}`;
  };

  // Format date and time
  const formatDateTime = (date) => {
    if (!date) return "N/A";
    
    const options = { 
      month: 'long', 
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    };
    
    return date.toLocaleDateString('en-US', options);
  };

  // Create the bar chart summary text
  const getBarChartSummary = () => {
    if (performanceAnalysis.totalResponses === 0) {
      return `No response data is available for ${officerTitle} during ${formattedFilter}.`;
    }
    
    const { fastestResponse, slowestResponse, timeOfDayAnalysis, consistencyScore } = performanceAnalysis;
    
    let summaryText = `During ${formattedFilter}, ${officerTitle}'s response times varied from ${fastestResponse.time.toFixed(2)} minutes (fastest) to ${slowestResponse.time.toFixed(2)} minutes (slowest). `;
    
    summaryText += `The fastest response was on ${formatDateTime(fastestResponse.when)}, while the slowest response was on ${formatDateTime(slowestResponse.when)}. `;
    
    if (timeOfDayAnalysis.bestHour !== null) {
      summaryText += `${officerTitle} tends to respond most quickly during the ${formatHour(timeOfDayAnalysis.bestHour)} hour (${timeOfDayAnalysis.bestHourAvg.toFixed(2)} min average) `;
    }
    
    if (timeOfDayAnalysis.worstHour !== null) {
      summaryText += `and has longer response times around ${formatHour(timeOfDayAnalysis.worstHour)} (${timeOfDayAnalysis.worstHourAvg.toFixed(2)} min average). `;
    }
    
    // Add consistency analysis
    if (consistencyScore >= 85) {
      summaryText += `Overall, ${officerTitle}'s response times are very consistent across different incidents.`;
    } else if (consistencyScore >= 70) {
      summaryText += `${officerTitle} maintains fairly consistent response times, with some variation between incidents.`;
    } else if (consistencyScore >= 50) {
      summaryText += `${officerTitle}'s response times show moderate variability between incidents.`;
    } else {
      summaryText += `${officerTitle}'s response times vary significantly between incidents, which may warrant further review.`;
    }
    
    return summaryText;
  };

  return (
    <Box sx={{ width: "100%" }}>
      <Typography variant="h7" fontWeight="400" color="#000" paragraph sx={{ textAlign: "justify" }}>
        {getBarChartSummary()}
      </Typography>
    </Box>
  );
};

export default PerformanceBarSummary;