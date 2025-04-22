import { ResponsiveBar } from "@nivo/bar";

const hourTo12HourFormat = (hour) => {
    const suffix = hour < 12 ? "AM" : "PM";
    const hour12 = hour % 12 || 12;
    return `${hour12}${suffix}`;
};

const formatIncidentLabel = (date, primary) => {
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const hour = date.getHours().toString().padStart(2, "0");

    switch (primary) {
        case "daily":
            return `${hour}:00`;
        case "weekly":
            // Just use the standard day/month|hour format for consistency
            return `${day}/${month}|${hour}`;
        case "monthly":
            return `${day}/${month}|${hour}`;
        case "quarterly":
            return `${day}/${month}|${hour}`;
        case "yearly":
            return `${day}/${month}`;
        default:
            return `${day}/${month}|${hour}`;
    }
};

const toReadableDate = (date) => {
    const options = { month: 'long', day: 'numeric' };
    const hour = date.getHours();
    return `${date.toLocaleDateString('en-US', options)}, ${hourTo12HourFormat(hour)}`;
};

// Helper function to convert milliseconds to minutes
const msToMinutes = (ms) => {
    return ms / (1000 * 60);
};

// Get ISO week number for a date
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

// Function to find the date of the Monday of a given ISO week
const getDateOfISOWeek = (week, year) => {
    const simple = new Date(year, 0, 1 + (week - 1) * 7);
    const dayOfWeek = simple.getDay();
    const isoWeekStart = simple;
    
    if (dayOfWeek <= 4) {
        // Day is between Monday and Thursday, go back to Monday
        isoWeekStart.setDate(simple.getDate() - simple.getDay() + 1);
    } else {
        // Day is Friday, Saturday or Sunday, go forward to next Monday
        isoWeekStart.setDate(simple.getDate() + 8 - simple.getDay());
    }
    
    return isoWeekStart;
};

// Parse filter string to get date range
const parseFilter = (primary, secondary) => {
    if (!primary || !secondary) return null;
    
    const [year, rest] = secondary.split('-');
    const numYear = parseInt(year, 10);
    
    let startDate, endDate;
    
    switch (primary) {
        case "daily":
            // Format: YYYY-MM-DD
            const [month, day] = rest.split('-');
            startDate = new Date(numYear, parseInt(month, 10) - 1, parseInt(day, 10), 0, 0, 0);
            endDate = new Date(numYear, parseInt(month, 10) - 1, parseInt(day, 10), 23, 59, 59);
            break;
            
        case "weekly":
            // Format: YYYY-WXX (week number)
            const weekNum = parseInt(rest.substring(1), 10);
            
            // Get Monday of the specified ISO week
            startDate = getDateOfISOWeek(weekNum, numYear);
            startDate.setHours(0, 0, 0, 0);
            
            // Sunday is end of ISO week
            endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + 6);
            endDate.setHours(23, 59, 59, 999);
            break;
            
        case "monthly":
            // Format: YYYY-MM
            const monthNum = parseInt(rest, 10) - 1;
            startDate = new Date(numYear, monthNum, 1, 0, 0, 0);
            endDate = new Date(numYear, monthNum + 1, 0, 23, 59, 59); // Last day of month
            break;
            
        case "quarterly":
            // Format: YYYY-QX
            const quarter = parseInt(rest.substring(1), 10);
            const startMonth = (quarter - 1) * 3;
            startDate = new Date(numYear, startMonth, 1, 0, 0, 0);
            endDate = new Date(numYear, startMonth + 3, 0, 23, 59, 59);
            break;
            
        case "yearly":
            // Format: YYYY
            startDate = new Date(numYear, 0, 1, 0, 0, 0);
            endDate = new Date(numYear, 11, 31, 23, 59, 59);
            break;
            
        default:
            return null;
    }
    
    return { startDate, endDate, primary, secondary };
};

const ResponseTimeBarChart = ({ responses, filters = { primary: "monthly", secondary: "2025-03" } }) => {
    if (!responses || responses.length === 0) return null;

    // Parse the filters to get date range
    const filterDate = parseFilter(filters.primary, filters.secondary);
    if (!filterDate) return null;
    
    const chartDataMap = new Map();

    // Filter responses based on the filters
    const filteredResponses = responses.filter(response => {
        const incident = response.date?.incident?.toDate?.() ?? response.date?.incident;
        
        if (!incident) return false;
        
        // For weekly filter, check ISO week number
        if (filterDate.primary === "weekly") {
            const [year, rest] = filters.secondary.split('-');
            const weekNum = parseInt(rest.substring(1), 10);
            const incidentWeek = getISOWeekNumber(incident);
            const incidentYear = incident.getFullYear();
            
            return incidentWeek === weekNum && incidentYear === parseInt(year, 10);
        }
        
        // For other filters, check if the incident date is within the filter range
        return (
            incident >= filterDate.startDate && 
            incident <= filterDate.endDate
        );
    });

    filteredResponses.forEach((response) => {
        const incident = response.date?.incident?.toDate?.() ?? response.date?.incident;
        const arrived = response.date?.arrived?.toDate?.() ?? response.date?.arrived;
        const responseTime = response.date?.response?.toDate?.() ?? response.date?.response;
        const estimated = response.date?.estimated?.toDate?.() ?? response.date?.estimated;

        if (!incident || !arrived || !responseTime) return;

        const key = formatIncidentLabel(incident, filterDate.primary);
        const timeDifference = arrived - responseTime;
        
        // Calculate ETA (in milliseconds)
        const etaInMs = estimated ? (estimated - responseTime) : (7 * 60 * 1000); // 7 minutes in ms if no estimated time
        
        // Determine if response time exceeds ETA
        const exceedsETA = timeDifference > etaInMs;
        
        // Accumulate if multiple incidents at same time period
        if (!chartDataMap.has(key)) {
            chartDataMap.set(key, { label: key, total: timeDifference, count: 1, exceedsETACount: exceedsETA ? 1 : 0 });
        } else {
            const entry = chartDataMap.get(key);
            entry.total += timeDifference;
            entry.count += 1;
            if (exceedsETA) {
                entry.exceedsETACount += 1;
            }
        }
    });

    const chartData = Array.from(chartDataMap.entries()).map(([label, data]) => {
        // Determine if the majority of incidents for this time period exceeded ETA
        const exceedsETA = data.exceedsETACount > data.count / 2;
        
        return {
            incidentTime: label,
            "Response Time (min)": parseFloat((msToMinutes(data.total) / data.count).toFixed(2)),
            exceedsETA: exceedsETA
        };
    });

    // Sort data from fastest (lowest) to slowest (highest) response time
    const sortedChartData = chartData.sort((a, b) => a["Response Time (min)"] - b["Response Time (min)"]);

    // Color function based on whether response time exceeds ETA
    const getBarColor = bar => bar.data.exceedsETA ? "#FF4136" : "#007BFF";

    // Generate appropriate axis legend based on primary filter
    const getAxisLegend = () => {
        switch (filterDate.primary) {
            case "daily":
                return "Hour of Day";
            case "weekly":
                return "Incident Time (DD/MM|HH)";
            case "monthly":
                return "Incident Time (DD/MM|HH)";
            case "quarterly":
                return "Day/Month";
            case "yearly":
                return "Month";
            default:
                return "Incident Time";
        }
    };

    return (
        <ResponsiveBar
            data={sortedChartData}
            keys={["Response Time (min)"]}
            indexBy="incidentTime"
            margin={{ top: 20, right: 130, bottom: 70, left: 60 }}
            padding={0.3}
            valueScale={{ type: "linear" }}
            indexScale={{ type: "band", round: true }}
            colors={getBarColor}
            axisBottom={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: -45,
                legend: getAxisLegend(),
                legendPosition: "middle",
                legendOffset: 60,
            }}
            axisLeft={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: 0,
                legend: "Response Time (minutes)",
                legendPosition: "middle",
                legendOffset: -40,
            }}
            labelSkipWidth={12}
            labelSkipHeight={12}
            enableLabel={false} // Remove the text inside bars
            tooltip={({ indexValue, value, color }) => {
                let tooltipTitle = indexValue;
                
                // For monthly and weekly views, try to construct a readable date
                if ((filterDate.primary === "monthly" || filterDate.primary === "weekly") && indexValue.includes("|")) {
                    const [dayMonth, hour] = indexValue.split("|");
                    const [day, month] = dayMonth.split("/");
                    
                    const date = new Date(filterDate.startDate);
                    date.setDate(parseInt(day));
                    date.setMonth(parseInt(month) - 1);
                    date.setHours(parseInt(hour), 0, 0, 0);
                    
                    tooltipTitle = toReadableDate(date);
                }

                const statusText = color === "#FF4136" ? "Exceeds ETA" : "Within ETA";

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
                        <strong>{tooltipTitle}</strong> <br />
                        Response Time: <strong>{value} minutes</strong><br />
                        Status: <span style={{ color }}><strong>{statusText}</strong></span>
                    </div>
                );
            }}
            legends={[
                {
                    anchor: "bottom-right",
                    direction: "column",
                    translateX: 150,
                    translateY: 0,
                    itemsSpacing: 2,
                    itemWidth: 140,
                    itemHeight: 20,
                    symbolSize: 12,
                    symbolShape: "circle",
                    itemOpacity: 0.85,
                    effects: [{ on: "hover", style: { itemOpacity: 1 } }],
                    data: [
                        { id: "Within ETA", label: "Within ETA", color: "#007BFF" },
                        { id: "Exceeds ETA", label: "Exceeds ETA", color: "#FF4136" }
                    ]
                }
            ]}
            role="application"
            ariaLabel="Response Time Bar Chart"
            barAriaLabel={(e) =>
                `Time: ${e.indexValue}, Response Time: ${e.formattedValue} minutes, ${e.data.exceedsETA ? "Exceeds" : "Within"} ETA`
            }
        />
    );
};

export default ResponseTimeBarChart;