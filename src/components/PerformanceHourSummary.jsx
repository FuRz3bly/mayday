import { Box, Typography } from "@mui/material";
import { useMemo } from "react";

// Parse filter based on primary and secondary values
const parseFilterDate = (filters) => {
  if (!filters || !filters.primary || !filters.secondary) return null;
  
  const { primary, secondary } = filters;
  
  switch (primary) {
    case 'daily':
      // Format: YYYY-MM-DD
      const [year, month, day] = secondary.split('-').map(num => parseInt(num, 10));
      return { day, month: month - 1, year };
      
    case 'weekly':
      // Format: YYYY-WX
      const [weekYear, weekPart] = secondary.split('-');
      const weekNumber = parseInt(weekPart.substring(1), 10);
      return { weekNumber, year: parseInt(weekYear, 10) };
      
    case 'monthly':
      // Format: YYYY-MM
      const [monthYear, monthNumber] = secondary.split('-');
      return { month: parseInt(monthNumber, 10) - 1, year: parseInt(monthYear, 10) };
      
    case 'quarterly':
      // Format: YYYY-QX
      const [quarterYear, quarterPart] = secondary.split('-');
      const quarter = parseInt(quarterPart.substring(1), 10);
      return { quarter, year: parseInt(quarterYear, 10) };
      
    case 'yearly':
      // Format: YYYY
      return { year: parseInt(secondary, 10) };
      
    default:
      return null;
  }
};

// Get ISO week number
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
const formatFilterToLongForm = (filters) => {
  if (!filters || !filters.primary || !filters.secondary) return "";
  
  const { primary, secondary } = filters;
  
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  
  switch (primary) {
    case 'daily':
      // Format: YYYY-MM-DD
      const [dayYear, dayMonth, day] = secondary.split('-');
      const dayMonthIndex = parseInt(dayMonth) - 1;
      return `${monthNames[dayMonthIndex]} ${day}, ${dayYear}`;
      
    case 'weekly':
      // Format: YYYY-WX
      const [weekYear, weekPart] = secondary.split('-');
      const weekNumber = weekPart.substring(1);
      return `Week ${weekNumber}, ${weekYear}`;
      
    case 'monthly':
      // Format: YYYY-MM
      const [monthYear, month] = secondary.split('-');
      const monthIndex = parseInt(month) - 1;
      return `${monthNames[monthIndex]} ${monthYear}`;
      
    case 'quarterly':
      // Format: YYYY-QX
      const [quarterYear, quarterPart] = secondary.split('-');
      const quarter = quarterPart.substring(1);
      return `Q${quarter} ${quarterYear}`;
      
    case 'yearly':
      // Format: YYYY
      return `${secondary}`;
      
    default:
      return "";
  }
};

// Format hour for display (12-hour format with AM/PM)
const formatHourLabel = (hour) => {
  if (hour === 0) return "12 AM";
  if (hour === 12) return "12 PM";
  return hour < 12 ? `${hour} AM` : `${hour - 12} PM`;
};

const PerformanceHourSummary = ({ 
  responses = [], 
  filters = { primary: "monthly", secondary: "2025-03" } 
}) => {
  const formattedFilter = formatFilterToLongForm(filters);
  
  // Process data to get hourly metrics
  const hourlyMetrics = useMemo(() => {
    if (!responses || responses.length === 0) {
      return {
        totalResponses: 0,
        peakHour: null,
        peakHourCount: 0,
        quietHours: [],
        morningResponses: 0,
        morningPercentage: 0,
        afternoonResponses: 0,
        afternoonPercentage: 0,
        eveningResponses: 0,
        eveningPercentage: 0,
        nightResponses: 0,
        nightPercentage: 0
      };
    }

    // Parse the filter to get date parameters
    const filterDate = parseFilterDate(filters);
    
    // Initialize counts for all 24 hours
    const hourCounts = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      count: 0
    }));
    
    // Filter responses based on the filters
    const filteredResponses = responses.filter(response => {
      // Skip if no response time is available
      if (!response?.date?.response) return false;
      
      const responseTime = response.date?.response?.toDate?.() ?? response.date?.response;
      
      if (!responseTime) return false;
      
      // Check if the response date matches the filter criteria
      switch (filters.primary) {
        case 'daily':
          return (
            responseTime.getDate() === filterDate.day &&
            responseTime.getMonth() === filterDate.month && 
            responseTime.getFullYear() === filterDate.year
          );
          
        case 'weekly':
          return (
            getISOWeekNumber(responseTime) === filterDate.weekNumber &&
            responseTime.getFullYear() === filterDate.year
          );
          
        case 'monthly':
          return (
            responseTime.getMonth() === filterDate.month && 
            responseTime.getFullYear() === filterDate.year
          );
          
        case 'quarterly':
          // Calculate which quarter the month belongs to (1-4)
          const responseQuarter = Math.floor(responseTime.getMonth() / 3) + 1;
          return (
            responseQuarter === filterDate.quarter &&
            responseTime.getFullYear() === filterDate.year
          );
          
        case 'yearly':
          return (
            responseTime.getFullYear() === filterDate.year
          );
          
        default:
          return false;
      }
    });

    if (filteredResponses.length === 0) {
      return {
        totalResponses: 0,
        peakHour: null,
        peakHourCount: 0,
        quietHours: [],
        morningResponses: 0,
        morningPercentage: 0,
        afternoonResponses: 0,
        afternoonPercentage: 0,
        eveningResponses: 0,
        eveningPercentage: 0,
        nightResponses: 0,
        nightPercentage: 0
      };
    }

    // Count responses by hour
    filteredResponses.forEach(response => {
      const responseTime = response.date?.response?.toDate?.() ?? response.date?.response;
      
      if (!responseTime) return;
      
      const hour = responseTime.getHours();
      hourCounts[hour].count++;
    });
    
    // Find peak hours (handling ties)
    let peakHourCount = 0;
    let peakHours = [];
    
    // First pass to find the max value
    hourCounts.forEach(hourData => {
      if (hourData.count > peakHourCount) {
        peakHourCount = hourData.count;
      }
    });
    
    // Second pass to collect all hours with those values
    hourCounts.forEach(hourData => {
      if (hourData.count === peakHourCount) {
        peakHours.push(hourData.hour);
      }
    });
    
    // Find quiet hours (hours with no responses)
    const quietHours = hourCounts
      .filter(hourData => hourData.count === 0)
      .map(hourData => hourData.hour);
    
    // Count responses by time of day
    const morningResponses = hourCounts.slice(6, 12).reduce((sum, h) => sum + h.count, 0);
    const afternoonResponses = hourCounts.slice(12, 18).reduce((sum, h) => sum + h.count, 0);
    const eveningResponses = hourCounts.slice(18, 24).reduce((sum, h) => sum + h.count, 0);
    const nightResponses = hourCounts.slice(0, 6).reduce((sum, h) => sum + h.count, 0);
    
    // Calculate percentages
    const total = filteredResponses.length;
    const morningPercentage = total > 0 ? (morningResponses / total) * 100 : 0;
    const afternoonPercentage = total > 0 ? (afternoonResponses / total) * 100 : 0;
    const eveningPercentage = total > 0 ? (eveningResponses / total) * 100 : 0;
    const nightPercentage = total > 0 ? (nightResponses / total) * 100 : 0;
    
    return {
      totalResponses: filteredResponses.length,
      peakHours,
      peakHourCount,
      quietHours,
      morningResponses,
      morningPercentage,
      afternoonResponses,
      afternoonPercentage,
      eveningResponses,
      eveningPercentage,
      nightResponses,
      nightPercentage
    };
  }, [responses, filters]);

  // Format multiple hours nicely
  const formatMultipleHours = (hours) => {
    if (!hours || hours.length === 0) return "N/A";
    
    const formattedHours = hours.map(hour => formatHourLabel(hour));
    
    if (formattedHours.length === 1) {
      return formattedHours[0];
    } else if (formattedHours.length === 2) {
      return `${formattedHours[0]} and ${formattedHours[1]}`;
    } else {
      const lastHour = formattedHours.pop();
      return `${formattedHours.join(', ')}, and ${lastHour}`;
    }
  };

  // Identify quiet hour ranges (only include ranges of 3+ hours)
  const getSignificantQuietPeriods = () => {
    if (!hourlyMetrics.quietHours || hourlyMetrics.quietHours.length === 0) {
      return [];
    }
    
    // Sort quiet hours
    const sortedHours = [...hourlyMetrics.quietHours].sort((a, b) => a - b);
    
    // Group consecutive hours
    const ranges = [];
    let currentRange = [sortedHours[0]];
    
    for (let i = 1; i < sortedHours.length; i++) {
      if (sortedHours[i] === sortedHours[i-1] + 1) {
        // Consecutive hour, add to current range
        currentRange.push(sortedHours[i]);
      } else {
        // Not consecutive, start a new range if current range is valid
        if (currentRange.length >= 3) {
          ranges.push([...currentRange]);
        }
        currentRange = [sortedHours[i]];
      }
    }
    
    // Add the last range if it's valid
    if (currentRange.length >= 3) {
      ranges.push(currentRange);
    }
    
    // Format ranges
    return ranges.map(range => {
      return `${formatHourLabel(range[0])} to ${formatHourLabel(range[range.length - 1])}`;
    });
  };

  // Find the period with the highest percentage of responses
  const findBusiestPeriod = () => {
    const periods = [
      { name: "morning", percentage: hourlyMetrics.morningPercentage },
      { name: "afternoon", percentage: hourlyMetrics.afternoonPercentage },
      { name: "evening", percentage: hourlyMetrics.eveningPercentage },
      { name: "night", percentage: hourlyMetrics.nightPercentage }
    ];
    
    return periods.reduce((busiest, current) => 
      current.percentage > busiest.percentage ? current : busiest, periods[0]).name;
  };

  // Generate summary text based on metrics
  const getSummaryText = () => {
    if (hourlyMetrics.totalResponses === 0) {
      return `No response time data is available for ${formattedFilter}.`;
    }
    
    // Create message for peak hours
    const peakHoursMessage = hourlyMetrics.peakHours.length === 1
      ? `${formatHourLabel(hourlyMetrics.peakHours[0])}`
      : formatMultipleHours(hourlyMetrics.peakHours);
    
    // Get significant quiet periods (3+ consecutive hours)
    const quietPeriods = getSignificantQuietPeriods();
    const quietPeriodsMessage = quietPeriods.length > 0 
      ? quietPeriods.length === 1 
        ? `The significant quiet period with no responses was ${quietPeriods[0]}.` 
        : `The significant quiet periods with no responses were ${quietPeriods.join(' and ')}.`
      : '';
    
    // Find busiest period and use it in the summary
    const busiestPeriod = findBusiestPeriod();
    
    return `Response activity peaked at ${peakHoursMessage} with ${hourlyMetrics.peakHourCount} 
    ${hourlyMetrics.peakHourCount === 1 ? 'response' : 'responses'}. 
    ${quietPeriodsMessage}
    
    The morning (6 AM - 12 PM) accounted for ${Math.round(hourlyMetrics.morningPercentage)}% of responses, 
    the afternoon (12 PM - 6 PM) accounted for ${Math.round(hourlyMetrics.afternoonPercentage)}%, 
    the evening (6 PM - 12 AM) accounted for ${Math.round(hourlyMetrics.eveningPercentage)}%, and 
    the night (12 AM - 6 AM) accounted for ${Math.round(hourlyMetrics.nightPercentage)}% of responses. 
    The ${busiestPeriod} was the busiest period, handling ${Math.round(hourlyMetrics[`${busiestPeriod}Percentage`])}% of all responses.`;
  };

  return (
    <Box sx={{ width: "100%" }}>
      <Typography variant="h7" fontWeight="400" color="#000" paragraph sx={{ textAlign: "justify" }}>
        {getSummaryText()}
      </Typography>
      
      {hourlyMetrics.totalResponses > 0 && (
        <Typography variant="h7" fontWeight="400" color="#555" sx={{ mt: 2, fontStyle: "italic", textAlign: "justify" }}>
          NOTE: This chart displays response frequency by hour of day for {formattedFilter}. The time represents when responses were initiated, not incident times.
        </Typography>
      )}
    </Box>
  );
};

export default PerformanceHourSummary;