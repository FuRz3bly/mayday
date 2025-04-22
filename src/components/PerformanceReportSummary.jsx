import { Box, Typography } from "@mui/material";
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

// Parse filter based on format
const parseFilter = (filters) => {
  if (!filters || !filters.primary || !filters.secondary) return null;
  
  const { primary, secondary } = filters;
  
  switch (primary) {
    case 'daily':
      // Format: YYYY-MM-DD
      const [year, month, day] = secondary.split('-').map(num => parseInt(num, 10));
      return { type: 'daily', year, month: month - 1, day };
    
    case 'weekly':
      // Format: YYYY-WX
      const [weekYear, weekPart] = secondary.split('-');
      const weekNum = parseInt(weekPart.substring(1), 10);
      return { type: 'weekly', year: parseInt(weekYear, 10), week: weekNum };
    
    case 'monthly':
      // Format: YYYY-MM
      const [monthYear, monthNum] = secondary.split('-');
      return { 
        type: 'monthly', 
        year: parseInt(monthYear, 10), 
        month: parseInt(monthNum, 10) - 1 
      };
    
    case 'quarterly':
      // Format: YYYY-QX
      const [quarterYear, quarterPart] = secondary.split('-');
      const quarter = parseInt(quarterPart.substring(1), 10);
      return { 
        type: 'quarterly', 
        year: parseInt(quarterYear, 10), 
        quarter 
      };
    
    case 'yearly':
      // Format: YYYY
      return { 
        type: 'yearly', 
        year: parseInt(secondary, 10) 
      };
    
    default:
      return null;
  }
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
      const [dayYear, dayMonth, day] = secondary.split('-');
      const dayMonthIndex = parseInt(dayMonth) - 1;
      return `${monthNames[dayMonthIndex]} ${day}, ${dayYear}`;
    
    case 'weekly':
      const [weekYear, weekPart] = secondary.split('-');
      const weekNum = weekPart.substring(1);
      return `Week ${weekNum}, ${weekYear}`;
    
    case 'monthly':
      const [monthYear, month] = secondary.split('-');
      const monthIndex = parseInt(month) - 1;
      return `${monthNames[monthIndex]} ${monthYear}`;
    
    case 'quarterly':
      const [quarterYear, quarterPart] = secondary.split('-');
      const quarter = quarterPart.substring(1);
      return `Q${quarter} ${quarterYear}`;
    
    case 'yearly':
      return secondary;
    
    default:
      return "";
  }
};

// Check if a date matches the filter criteria
const dateMatchesFilter = (date, parsedFilter) => {
  if (!date || !parsedFilter) return false;
  
  switch (parsedFilter.type) {
    case 'daily':
      return (
        date.getFullYear() === parsedFilter.year &&
        date.getMonth() === parsedFilter.month &&
        date.getDate() === parsedFilter.day
      );
    
    case 'weekly':
      return (
        date.getFullYear() === parsedFilter.year &&
        getISOWeekNumber(date) === parsedFilter.week
      );
    
    case 'monthly':
      return (
        date.getFullYear() === parsedFilter.year &&
        date.getMonth() === parsedFilter.month
      );
    
    case 'quarterly':
      const month = date.getMonth();
      const quarter = Math.floor(month / 3) + 1;
      return (
        date.getFullYear() === parsedFilter.year &&
        quarter === parsedFilter.quarter
      );
    
    case 'yearly':
      return date.getFullYear() === parsedFilter.year;
    
    default:
      return false;
  }
};

// Get appropriate date grouping key based on filter type
const getDateGroupKey = (date, filterType) => {
  switch (filterType) {
    case 'daily':
      // For daily, group by hour
      return `${date.toISOString().split('T')[0]}-${date.getHours()}`;
    
    case 'weekly':
      // For weekly, group by day
      return date.toISOString().split('T')[0];
    
    case 'monthly':
      // For monthly, group by day
      return date.toISOString().split('T')[0];
    
    case 'quarterly':
      // For quarterly, group by week
      const weekNum = getISOWeekNumber(date);
      return `${date.getFullYear()}-W${weekNum}`;
    
    case 'yearly':
      // For yearly, group by month
      return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    
    default:
      return date.toISOString().split('T')[0];
  }
};

// Get appropriate date format for display based on filter type
const getGroupDisplayName = (date, groupKey, filterType) => {
  const options = { weekday: 'long', month: 'short', day: 'numeric' };
  
  switch (filterType) {
    case 'daily':
      // For daily, show hour
      const hour = groupKey.split('-')[1];
      return `${hour}:00 - ${hour}:59`;
    
    case 'weekly':
      // For weekly, show day name and date
      return date.toLocaleDateString('en-US', options);
    
    case 'monthly':
      // For monthly, show day name and date
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    
    case 'quarterly':
      // For quarterly, show week
      const weekNum = groupKey.split('-W')[1];
      return `Week ${weekNum}`;
    
    case 'yearly':
      // For yearly, show month
      const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
      ];
      return monthNames[date.getMonth()];
    
    default:
      return date.toLocaleDateString('en-US', options);
  }
};

const PerformanceReportSummary = ({ responses = [], filters = { primary: "monthly", secondary: "2025-03" } }) => {
  const formattedFilter = formatFilterToLongForm(filters);
  
  // Process data to get response metrics based on selected filter
  const reportMetrics = useMemo(() => {
    if (!responses || responses.length === 0) {
      return {
        totalResponses: 0,
        groupsWithResponses: 0,
        avgPerGroup: 0,
        maxCount: 0,
        maxGroups: [],
        minCount: 0,
        minGroups: [],
        distributionQuality: 'N/A',
        filterType: filters?.primary || 'monthly'
      };
    }

    // Parse the filter object to get criteria
    const parsedFilter = parseFilter(filters);
    
    if (!parsedFilter) {
      return {
        totalResponses: 0,
        groupsWithResponses: 0,
        avgPerGroup: 0,
        maxCount: 0,
        maxGroups: [],
        minCount: 0,
        minGroups: [],
        distributionQuality: 'N/A',
        filterType: filters?.primary || 'monthly'
      };
    }
    
    // Filter responses based on the filter criteria
    const filteredResponses = responses.filter(response => {
      const incident = response.date?.incident?.toDate?.() ?? response.date?.incident;
      
      if (!incident) return false;
      
      return dateMatchesFilter(incident, parsedFilter);
    });

    if (filteredResponses.length === 0) {
      return {
        totalResponses: 0,
        groupsWithResponses: 0,
        avgPerGroup: 0,
        maxCount: 0,
        maxGroups: [],
        minCount: 0,
        minGroups: [],
        distributionQuality: 'N/A',
        filterType: parsedFilter.type
      };
    }

    // Group responses by appropriate time unit based on filter type
    const responsesByGroup = new Map();
    
    filteredResponses.forEach(response => {
      const incident = response.date?.incident?.toDate?.() ?? response.date?.incident;
      
      if (!incident) return;
      
      // Create a grouping key based on filter type
      const groupKey = getDateGroupKey(incident, parsedFilter.type);
      
      if (!responsesByGroup.has(groupKey)) {
        responsesByGroup.set(groupKey, { 
          count: 1,
          date: new Date(incident),
          groupKey
        });
      } else {
        const entry = responsesByGroup.get(groupKey);
        entry.count += 1;
      }
    });

    // Convert to array for analysis
    const groupCounts = Array.from(responsesByGroup.values());

    // Calculate summary metrics
    const totalResponses = filteredResponses.length;
    const groupsWithResponses = groupCounts.length;
    const avgPerGroup = totalResponses / groupsWithResponses;
    
    // Find groups with max and min responses (handling ties)
    let maxCount = 0;
    let minCount = Number.MAX_VALUE;
    let maxGroups = [];
    let minGroups = [];
    
    // First pass to find max and min values
    groupCounts.forEach(group => {
      if (group.count > maxCount) {
        maxCount = group.count;
      }
      if (group.count < minCount) {
        minCount = group.count;
      }
    });
    
    // Second pass to collect all groups with those values
    groupCounts.forEach(group => {
      const displayName = getGroupDisplayName(group.date, group.groupKey, parsedFilter.type);
      
      if (group.count === maxCount) {
        maxGroups.push({ 
          date: group.date, 
          displayName 
        });
      }
      if (group.count === minCount) {
        minGroups.push({ 
          date: group.date, 
          displayName 
        });
      }
    });

    // Evaluate distribution quality
    const variance = groupCounts.reduce((acc, group) => {
      return acc + Math.pow(group.count - avgPerGroup, 2);
    }, 0) / groupsWithResponses;
    
    const stdDev = Math.sqrt(variance);
    const coefficientOfVariation = stdDev / avgPerGroup;
    
    let distributionQuality;
    if (coefficientOfVariation < 0.25) {
      distributionQuality = 'very even';
    } else if (coefficientOfVariation < 0.5) {
      distributionQuality = 'reasonably even';
    } else if (coefficientOfVariation < 0.75) {
      distributionQuality = 'somewhat uneven';
    } else {
      distributionQuality = 'highly variable';
    }

    return {
      totalResponses,
      groupsWithResponses,
      avgPerGroup,
      maxCount,
      maxGroups,
      minCount,
      minGroups,
      distributionQuality,
      filterType: parsedFilter.type
    };
  }, [responses, filters]);

  // Format multiple groups nicely
  const formatMultipleGroups = (groups) => {
    if (!groups || groups.length === 0) return "N/A";
    
    if (groups.length === 1) {
      return groups[0].displayName;
    } else if (groups.length === 2) {
      return `${groups[0].displayName} and ${groups[1].displayName}`;
    } else {
      const formattedGroups = groups.map(g => g.displayName);
      const lastGroup = formattedGroups.pop();
      return `${formattedGroups.join(', ')}, and ${lastGroup}`;
    }
  };

  // Get appropriate time unit name based on filter type
  const getTimeUnitName = (filterType, plural = true) => {
    switch (filterType) {
      case 'daily':
        return plural ? 'hours' : 'hour';
      case 'weekly':
        return plural ? 'days' : 'day';
      case 'monthly':
        return plural ? 'days' : 'day';
      case 'quarterly':
        return plural ? 'weeks' : 'week';
      case 'yearly':
        return plural ? 'months' : 'month';
      default:
        return plural ? 'periods' : 'period';
    }
  };

  // Generate summary text based on metrics
  const getSummaryText = () => {
    if (reportMetrics.totalResponses === 0) {
      return `No response data is available for ${formattedFilter}.`;
    }
    
    const timeUnit = getTimeUnitName(reportMetrics.filterType, true);
    const timeUnitSingular = getTimeUnitName(reportMetrics.filterType, false);
    
    // Create message for highest groups
    const highestGroupsMessage = reportMetrics.maxGroups.length === 1
      ? `${reportMetrics.maxGroups[0].displayName} had the highest number with ${reportMetrics.maxCount} incidents`
      : `${formatMultipleGroups(reportMetrics.maxGroups)} tied for the highest number with ${reportMetrics.maxCount} incidents each`;
    
    // Create message for lowest groups
    const lowestGroupsMessage = reportMetrics.minGroups.length === 1
      ? `${reportMetrics.minGroups[0].displayName} had the lowest with ${reportMetrics.minCount} ${reportMetrics.minCount === 1 ? 'incident' : 'incidents'}`
      : `${formatMultipleGroups(reportMetrics.minGroups)} tied for the lowest with ${reportMetrics.minCount} ${reportMetrics.minCount === 1 ? 'incident' : 'incidents'} each`;
    
    return `There were ${reportMetrics.totalResponses} total responses recorded across ${reportMetrics.groupsWithResponses} ${reportMetrics.groupsWithResponses === 1 ? timeUnitSingular : timeUnit}, 
    averaging ${reportMetrics.avgPerGroup.toFixed(1)} responses per ${timeUnitSingular}. The distribution was ${reportMetrics.distributionQuality} throughout ${formattedFilter}.
    ${highestGroupsMessage}, while ${lowestGroupsMessage}.`;
  };

  return (
    <Box sx={{ width: "100%" }}>
      <Typography variant="h7" fontWeight="400" color="#000" paragraph sx={{ textAlign: "justify" }}>
        {getSummaryText()}
      </Typography>
      
      {reportMetrics.totalResponses > 0 && (
        <Typography variant="h7" fontWeight="400" color="#555" sx={{ mt: '-4px', fontStyle: "italic", textAlign: "justify" }}>
          NOTE: This chart displays the total number of responses per {getTimeUnitName(reportMetrics.filterType, false)} for {formattedFilter}.{' '}
          {getTimeUnitName(reportMetrics.filterType, true).charAt(0).toUpperCase() + getTimeUnitName(reportMetrics.filterType, true).slice(1)} with no responses may not appear on the chart.
        </Typography>
      )}
    </Box>
  );
};

export default PerformanceReportSummary;