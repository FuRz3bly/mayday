import { ResponsiveBar } from "@nivo/bar";
import { tokens } from "../theme";
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

// Format hour for display (12-hour format with AM/PM)
const formatHourLabel = (hour) => {
  if (hour === 0) return "12 AM";
  if (hour === 12) return "12 PM";
  return hour < 12 ? `${hour} AM` : `${hour - 12} PM`;
};

const PerformanceHourBarChart = ({ responses, filters = { primary: "monthly", secondary: "2025-03" }, theme }) => {
  const colors = tokens(theme.palette.mode);
  
  // Process data to get hourly response counts
  const hourlyData = useMemo(() => {
    if (!responses || responses.length === 0) return [];

    // Parse the filter object to get criteria
    const parsedFilter = parseFilter(filters);
    
    if (!parsedFilter) return [];
    
    // Initialize counts for all 24 hours
    const hourCounts = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      formattedHour: formatHourLabel(i),
      "Responses": 0
    }));
    
    // Filter responses based on the filter criteria
    const filteredResponses = responses.filter(response => {
      // Skip if no response time is available
      if (!response?.date?.response) return false;
      
      const responseTime = response.date?.response?.toDate?.() ?? response.date?.response;
      
      if (!responseTime) return false;
      
      return dateMatchesFilter(responseTime, parsedFilter);
    });

    if (filteredResponses.length === 0) return [];

    // Count responses by hour
    filteredResponses.forEach(response => {
      const responseTime = response.date?.response?.toDate?.() ?? response.date?.response;
      
      if (!responseTime) return;
      
      const hour = responseTime.getHours();
      hourCounts[hour]["Responses"]++;
    });

    // Filter to only include hours with responses and always include 12 AM and 12 PM
    const filteredHourCounts = hourCounts.filter((hourData) => {
      return hourData["Responses"] > 0 || hourData.hour === 0 || hourData.hour === 12;
    });

    return filteredHourCounts;
  }, [responses, filters]);

  if (!hourlyData.length) return null;

  return (
    <ResponsiveBar
      data={hourlyData}
      keys={["Responses"]}
      indexBy="formattedHour"
      margin={{ top: 10, right: 100, bottom: 60, left: 60 }}
      padding={0.3}
      valueScale={{ type: "linear" }}
      indexScale={{ type: "band", round: true }}
      colors={colors.blueAccent[400]}
      axisBottom={{
        tickSize: 5,
        tickPadding: 5,
        tickRotation: 45,
        legend: "Time of Day",
        legendPosition: "middle",
        legendOffset: 50,
      }}
      axisLeft={{
        tickSize: 5,
        tickPadding: 5,
        tickRotation: 0,
        legend: "Number of Responses",
        legendPosition: "middle",
        legendOffset: -50,
        format: value => Number.isInteger(value) ? value : ''
      }}
      labelSkipWidth={12}
      labelSkipHeight={12}
      enableLabel={true}
      tooltip={({ indexValue, value }) => {
        return (
          <div
            style={{
              background: "white",
              color: "black",
              padding: "6px 12px",
              borderRadius: "4px",
              boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.2)",
              fontSize: "14px",
            }}
          >
            <strong>{indexValue}</strong> <br />
            Total Responses: <strong>{value}</strong>
          </div>
        );
      }}
      legends={[
        {
          anchor: "bottom-right",
          direction: "column",
          translateX: 120,
          translateY: 0,
          itemsSpacing: 2,
          itemWidth: 100,
          itemHeight: 20,
          symbolSize: 12,
          symbolShape: "circle",
          itemOpacity: 0.85,
          effects: [{ on: "hover", style: { itemOpacity: 1 } }],
          data: [
            { id: "Responses", label: "Responses", color: colors.blueAccent[400] }
          ]
        }
      ]}
      role="application"
      ariaLabel="Performance Report Hour Bar Chart"
      barAriaLabel={(e) =>
        `Time: ${e.indexValue}, Total Responses: ${e.formattedValue}`
      }
    />
  );
};

export default PerformanceHourBarChart;