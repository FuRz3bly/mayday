import { Typography, Box } from "@mui/material";
import { useMemo } from "react";

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

const PerformanceResolvedSummary = ({ 
  responses = [], 
  filters = { primary: "monthly", secondary: "2025-03" }, 
  user = { name: { last_name: '' }, station: { rank: '' } }
}) => {
  // Get officer's full title (rank + last name)
  const officerTitle = `${user.station.rank} ${user.name.last_name}`;

  // Format filter to long form based on primary and secondary values
  const formatFilterToLongForm = (filters) => {
    if (!filters || !filters.primary || !filters.secondary) return "";
    
    const { primary, secondary } = filters;
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    
    switch (primary) {
      case "daily":
        // Format: YYYY-MM-DD
        const [year, month, day] = secondary.split('-');
        return `${monthNames[parseInt(month) - 1]} ${parseInt(day)}, ${year}`;
      
      case "weekly":
        // Format: YYYY-WX (where X is week number)
        const [weekYear, weekNum] = secondary.split('-W');
        return `Week ${weekNum}, ${weekYear}`;
      
      case "monthly":
        // Format: YYYY-MM
        const [monthYear, monthIdx] = secondary.split('-');
        return `${monthNames[parseInt(monthIdx) - 1]} ${monthYear}`;
      
      case "quarterly":
        // Format: YYYY-QX (where X is quarter number)
        const [quarterYear, quarter] = secondary.split('-Q');
        return `Q${quarter} ${quarterYear}`;
      
      case "yearly":
        // Format: YYYY
        return secondary;
      
      default:
        return secondary;
    }
  };
  
  const formattedFilter = formatFilterToLongForm(filters);

  // Format time duration based on length (seconds, minutes, or hours)
  const formatTimeDuration = (minutes) => {
    if (minutes < 1) {
      // Convert to seconds for short durations
      const seconds = Math.round(minutes * 60);
      return `${seconds} second${seconds !== 1 ? 's' : ''}`;
    } else if (minutes >= 60) {
      // Convert to hours and minutes for long durations
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = Math.round(minutes % 60);
      
      if (remainingMinutes === 0) {
        return `${hours} hour${hours !== 1 ? 's' : ''}`;
      }
      return `${hours} hour${hours !== 1 ? 's' : ''} and ${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}`;
    }
    
    // Use minutes for mid-range durations
    return `${minutes.toFixed(1)} minute${minutes !== 1 ? 's' : ''}`;
  };

  // Process response data to get resolution performance metrics
  const resolutionMetrics = useMemo(() => {
    // Filter responses based on primary and secondary filters
    let filteredResponses = responses;
    
    if (filters && filters.primary && filters.secondary) {
      const { primary, secondary } = filters;
      
      filteredResponses = responses.filter(response => {
        if (!response?.date?.incident) return false;
        
        const incidentDate = new Date(response.date.incident.toMillis());
        const incidentYear = incidentDate.getFullYear();
        const incidentMonth = incidentDate.getMonth() + 1; // 1-12
        const incidentDay = incidentDate.getDate();
        const incidentWeek = getISOWeekNumber(incidentDate);
        const incidentQuarter = Math.floor((incidentMonth - 1) / 3) + 1;
        
        switch (primary) {
          case "daily":
            // YYYY-MM-DD
            const [filterYear, filterMonth, filterDay] = secondary.split('-').map(Number);
            return incidentYear === filterYear && 
                   incidentMonth === filterMonth && 
                   incidentDay === filterDay;
          
          case "weekly":
            // YYYY-WX
            const [weekYear, weekNum] = secondary.split('-W').map(Number);
            return incidentYear === weekYear && incidentWeek === weekNum;
          
          case "monthly":
            // YYYY-MM
            const [monthYear, monthIdx] = secondary.split('-').map(Number);
            return incidentYear === monthYear && incidentMonth === monthIdx;
          
          case "quarterly":
            // YYYY-QX
            const [quarterYear, quarter] = secondary.split('-Q').map(Number);
            return incidentYear === quarterYear && incidentQuarter === quarter;
          
          case "yearly":
            // YYYY
            return incidentYear === Number(secondary);
          
          default:
            return true;
        }
      });
    }

    // Count only valid responses with arrival and resolution timing data
    const validResponses = filteredResponses.filter(response => {
      return response?.date?.arrived && response?.date?.resolved;
    });

    if (validResponses.length === 0) {
      return {
        totalIncidents: 0,
        averageResolvedTime: 0,
        maxResolvedTime: 0,
        minResolvedTime: 0
      };
    }

    // Calculate resolution metrics
    let totalResolvedTime = 0;
    let maxResolvedTime = 0;
    let minResolvedTime = Number.MAX_VALUE;

    validResponses.forEach(response => {
      const arrivedTime = response?.date?.arrived ? new Date(response.date.arrived.toMillis()) : null;
      const resolvedTime = response?.date?.resolved ? new Date(response.date.resolved.toMillis()) : null;
      
      // Calculate resolution time (arrived to resolved)
      if (arrivedTime && resolvedTime) {
        const resolvedTimeDiff = (resolvedTime.getTime() - arrivedTime.getTime()) / (1000 * 60);
        
        // Update statistics
        totalResolvedTime += resolvedTimeDiff;
        maxResolvedTime = Math.max(maxResolvedTime, resolvedTimeDiff);
        minResolvedTime = Math.min(minResolvedTime, resolvedTimeDiff);
      }
    });

    return {
      totalIncidents: validResponses.length,
      averageResolvedTime: totalResolvedTime / validResponses.length,
      maxResolvedTime,
      minResolvedTime: minResolvedTime === Number.MAX_VALUE ? 0 : minResolvedTime
    };
  }, [responses, filters]);

  // Generate personalized resolution performance assessment based on metrics
  const getPersonalizedAssessment = () => {
    const { totalIncidents, averageResolvedTime, maxResolvedTime, minResolvedTime } = resolutionMetrics;
    
    if (totalIncidents === 0) {
      return `We don't have any resolution data for ${officerTitle} during this period.`;
    }
    
    const formattedAvgTime = formatTimeDuration(averageResolvedTime);
    const formattedMinTime = formatTimeDuration(minResolvedTime);
    const formattedMaxTime = formatTimeDuration(maxResolvedTime);
    
    // Assessment based on average resolution time
    if (averageResolvedTime <= 15) {
      return `${officerTitle} has demonstrated exceptional efficiency this period with an average resolution time of ${formattedAvgTime}. Their ability to resolve incidents quickly is remarkable, with their fastest resolution taking only ${formattedMinTime}. ${officerTitle}'s efficiency in handling situations contributes significantly to department effectiveness and public satisfaction.`;
    } else if (averageResolvedTime <= 30) {
      return `${officerTitle} has shown strong efficiency this period with an average resolution time of ${formattedAvgTime}. Their consistent performance in resolving incidents is commendable, resolving situations in as little as ${formattedMinTime} in the best cases.`;
    } else if (averageResolvedTime <= 45) {
      return `${officerTitle} has delivered satisfactory resolution performance this period with an average resolution time of ${formattedAvgTime}. We recommend that ${officerTitle} review their incident handling procedures to further enhance their resolution times, though their fastest resolution of ${formattedMinTime} shows good potential.`;
    } else if (averageResolvedTime <= 60) {
      return `${officerTitle}'s resolution performance could benefit from improvement, with an average resolution time of ${formattedAvgTime}. We suggest focused training on incident management techniques to help ${officerTitle} improve their on-scene efficiency. Additional support and resources may help them resolve incidents more effectively.`;
    } else {
      return `${officerTitle}'s resolution performance requires attention with an average resolution time of ${formattedAvgTime}. We recommend a review of ${officerTitle}'s incident management protocols and a personalized improvement plan to address these challenges. Their most complex incident took ${formattedMaxTime} to resolve.`;
    }
  };

  // Create personalized summary text
  const getPersonalizedSummary = () => {
    if (resolutionMetrics.totalIncidents === 0) {
      return `We don't have any resolution data for ${officerTitle} during ${formattedFilter}.`;
    }
    
    const formattedAvgTime = formatTimeDuration(resolutionMetrics.averageResolvedTime);
    const formattedMinTime = formatTimeDuration(resolutionMetrics.minResolvedTime);
    const formattedMaxTime = formatTimeDuration(resolutionMetrics.maxResolvedTime);
    
    return (
      `${officerTitle} handled ${resolutionMetrics.totalIncidents} incidents. 
      Their average resolution time was ${formattedAvgTime} from arrival on scene.
      ${officerTitle}'s fastest incident resolution was ${formattedMinTime}, 
      while their longest took ${formattedMaxTime}.`
    );
  };

  return (
    <Box sx={{ width: "100%" }}>
      <Typography variant="h7" fontWeight="400" color="#000" paragraph sx={{ textAlign: "justify" }}>
        {getPersonalizedSummary()}{' '}{getPersonalizedAssessment()}
      </Typography>
      
      {resolutionMetrics.totalIncidents > 0 && (
        <Typography variant="h7" fontWeight="400" color="#555" sx={{ mt: 2, fontStyle: "italic", textAlign: "justify" }}>
          NOTE: This assessment covers the period of {formattedFilter}. Resolution time is measured from arrival on scene to incident resolution.
        </Typography>
      )}
    </Box>
  );
};

export default PerformanceResolvedSummary;