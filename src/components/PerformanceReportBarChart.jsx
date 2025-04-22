import { ResponsiveBar } from "@nivo/bar";
import { tokens } from "../theme";

// Format date as DD/MM for the chart labels
const formatDayLabel = (date) => {
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    return `${day}/${month}`;
};

// Format hourly label
const formatHourlyLabel = (date) => {
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const hour = date.getHours().toString().padStart(2, "0");
    return `${day}/${month}|${hour}`;
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

// Format full readable date for tooltips
const toReadableDate = (date) => {
    const options = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' };
    return date.toLocaleDateString('en-US', options);
};

// Get quarter from date
const getQuarter = (date) => {
    return Math.floor((date.getMonth() / 3)) + 1;
};

// Parse filter string based on primary and secondary values
const parseFilter = (primary, secondary) => {
    if (!primary || !secondary) return null;
    
    switch (primary) {
        case "daily":
            // YYYY-MM-DD
            const [dYear, dMonth, dDay] = secondary.split('-');
            return {
                type: "daily",
                year: parseInt(dYear, 10),
                month: parseInt(dMonth, 10) - 1, // JavaScript months are 0-indexed
                day: parseInt(dDay, 10)
            };
        
        case "weekly":
            // YYYY-WX
            const [wYear, weekNum] = secondary.split('-W');
            return {
                type: "weekly",
                year: parseInt(wYear, 10),
                week: parseInt(weekNum, 10)
            };
        
        case "monthly":
            // YYYY-MM
            const [mYear, mMonth] = secondary.split('-');
            return {
                type: "monthly",
                year: parseInt(mYear, 10),
                month: parseInt(mMonth, 10) - 1 // JavaScript months are 0-indexed
            };
            
        case "quarterly":
            // YYYY-QX
            const [qYear, quarter] = secondary.split('-Q');
            return {
                type: "quarterly",
                year: parseInt(qYear, 10),
                quarter: parseInt(quarter, 10)
            };
            
        case "yearly":
            // YYYY
            return {
                type: "yearly",
                year: parseInt(secondary, 10)
            };
            
        default:
            return null;
    }
};

const PerformanceReportBarChart = ({ 
    responses, 
    filters = { primary: "monthly", secondary: "2025-03" }, 
    theme 
}) => {
    if (!responses || responses.length === 0) return null;

    const colors = tokens(theme.palette.mode);
    
    // Parse the filter
    const filterData = parseFilter(filters.primary, filters.secondary);
    if (!filterData) return null;

    // Filter and group responses based on the filter type
    const responsesByGroup = new Map();

    // Filter responses based on the filter criteria
    const filteredResponses = responses.filter(response => {
        const incident = response.date?.incident?.toDate?.() ?? response.date?.incident;
        if (!incident) return false;
        
        const incidentYear = incident.getFullYear();
        const incidentMonth = incident.getMonth();
        const incidentDay = incident.getDate();
        const incidentWeek = getISOWeekNumber(incident);
        const incidentQuarter = getQuarter(incident);
        
        switch (filterData.type) {
            case "daily":
                return (
                    incidentYear === filterData.year && 
                    incidentMonth === filterData.month && 
                    incidentDay === filterData.day
                );
                
            case "weekly":
                return (
                    incidentYear === filterData.year && 
                    incidentWeek === filterData.week
                );
                
            case "monthly":
                return (
                    incidentYear === filterData.year && 
                    incidentMonth === filterData.month
                );
                
            case "quarterly":
                return (
                    incidentYear === filterData.year && 
                    incidentQuarter === filterData.quarter
                );
                
            case "yearly":
                return incidentYear === filterData.year;
                
            default:
                return false;
        }
    });

    // Group responses based on the filter type
    filteredResponses.forEach(response => {
        const incident = response.date?.incident?.toDate?.() ?? response.date?.incident;
        if (!incident) return;
        
        let key, groupDate, label;
        
        switch (filterData.type) {
            case "daily":
                // For daily, group by hour with day/month|hour format
                key = formatHourlyLabel(incident);
                label = `${incident.getHours().toString().padStart(2, "0")}:00`;
                groupDate = new Date(incident);
                groupDate.setMinutes(0, 0, 0);
                break;
                
            case "weekly":
                // For weekly, group by day with day/month format, no day names
                key = formatDayLabel(incident);
                label = formatDayLabel(incident); // Just use DD/MM format without day names
                groupDate = new Date(incident);
                groupDate.setHours(0, 0, 0, 0);
                break;
                
            case "monthly":
                // For monthly, group by day with day/month format
                key = formatDayLabel(incident);
                label = key;
                groupDate = new Date(incident);
                groupDate.setHours(0, 0, 0, 0);
                break;
                
            case "quarterly":
                // For quarterly, group by month
                const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", 
                                  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                key = monthNames[incident.getMonth()];
                label = key;
                groupDate = new Date(incident);
                groupDate.setDate(1);
                groupDate.setHours(0, 0, 0, 0);
                break;
                
            case "yearly":
                // For yearly, group by quarter
                const quarter = getQuarter(incident);
                key = `Q${quarter}`;
                label = key;
                groupDate = new Date(incident);
                // Set to first day of the quarter
                groupDate.setMonth((quarter - 1) * 3);
                groupDate.setDate(1);
                groupDate.setHours(0, 0, 0, 0);
                break;
                
            default:
                return;
        }
        
        if (!responsesByGroup.has(key)) {
            responsesByGroup.set(key, { 
                key,
                group: label, 
                count: 1,
                fullDate: groupDate
            });
        } else {
            const entry = responsesByGroup.get(key);
            entry.count += 1;
        }
    });

    // Convert to array for the chart
    const chartData = Array.from(responsesByGroup.values()).map(data => ({
        key: data.key,
        group: data.group,
        "Responses": data.count,
        fullDate: data.fullDate
    }));

    // Sort by response count (lowest to highest)
    const sortedChartData = chartData.sort((a, b) => a.Responses - b.Responses);

    // Determine axis labels based on filter type
    let xAxisLegend;
    switch (filterData.type) {
        case "daily":
            xAxisLegend = "Hour";
            break;
        case "weekly":
            xAxisLegend = "Day (DD/MM)";
            break;
        case "monthly":
            xAxisLegend = "Day (DD/MM)";
            break;
        case "quarterly":
            xAxisLegend = "Month";
            break;
        case "yearly":
            xAxisLegend = "Quarter";
            break;
        default:
            xAxisLegend = "Group";
    }

    return (
        <ResponsiveBar
            data={sortedChartData}
            keys={["Responses"]}
            indexBy="group"
            margin={{ top: 10, right: 100, bottom: 50, left: 50 }}
            padding={0.3}
            valueScale={{ type: "linear" }}
            indexScale={{ type: "band", round: true }}
            colors={colors.greenAccent[500]}
            axisBottom={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: 0,
                legend: xAxisLegend,
                legendPosition: "middle",
                legendOffset: 40,
            }}
            axisLeft={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: 0,
                legend: "Number of Responses",
                legendPosition: "middle",
                legendOffset: -40,
                format: value => Number.isInteger(value) ? value : ''
            }}
            labelSkipWidth={12}
            labelSkipHeight={12}
            enableLabel={true}
            tooltip={({ indexValue, value }) => {
                // Find the full date object for this group
                const groupData = chartData.find(item => item.group === indexValue);
                const date = groupData ? groupData.fullDate : new Date();
                
                let tooltipLabel;
                switch (filterData.type) {
                    case "daily":
                        tooltipLabel = `Hour: ${indexValue}`;
                        break;
                    case "weekly":
                    case "monthly":
                        tooltipLabel = toReadableDate(date);
                        break;
                    case "quarterly":
                        const monthNames = ["January", "February", "March", "April", "May", "June",
                                           "July", "August", "September", "October", "November", "December"];
                        tooltipLabel = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
                        break;
                    case "yearly":
                        tooltipLabel = `${indexValue} ${date.getFullYear()}`;
                        break;
                    default:
                        tooltipLabel = indexValue;
                }

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
                        <strong>{tooltipLabel}</strong> <br />
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
                        { id: "Responses", label: "Responses", color: colors.greenAccent[500] }
                    ]
                }
            ]}
            role="application"
            ariaLabel="Performance Report Bar Chart"
            barAriaLabel={(e) =>
                `${e.indexValue}, Total Responses: ${e.formattedValue}`
            }
        />
    );
};

export default PerformanceReportBarChart;