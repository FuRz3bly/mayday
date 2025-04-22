import { useTheme } from "@mui/material";
import { ResponsiveLine } from "@nivo/line";
import { tokens } from "../theme";
import { useMemo } from "react";

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

const processResolvedTimeData = (responses, filters = { primary: 'monthly', secondary: '2025-03' }, colors) => {
    if (responses.length === 0) {
        // Fallback if no responses
        const today = new Date();
        const formattedDate = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}|${today.getHours().toString().padStart(2, '0')}`;
        return {
            filledResolvedTimeData: [
                {
                    id: "Resolved Time",
                    color: colors.blueAccent[500],
                    data: [{ x: formattedDate, y: 0 }],
                },
            ],
            yMin: 0,
            yMax: 12,
        };
    }

    // Filter responses based on the filter criteria
    let filteredResponses = responses;
    
    if (filters && filters.primary && filters.secondary) {
        const { primary, secondary } = filters;
        
        filteredResponses = responses.filter(response => {
            if (!response?.date?.incident) return false;
            
            const incidentDate = new Date(response.date.incident.toMillis());
            if (isNaN(incidentDate.getTime())) return false;
            
            switch (primary) {
                case 'daily':
                    // Format: YYYY-MM-DD
                    const [dayYear, dayMonth, day] = secondary.split('-');
                    return (
                        incidentDate.getFullYear() === parseInt(dayYear) &&
                        incidentDate.getMonth() + 1 === parseInt(dayMonth) &&
                        incidentDate.getDate() === parseInt(day)
                    );
                    
                case 'weekly':
                    // Format: YYYY-WX
                    const [weekYear, weekPart] = secondary.split('-');
                    const weekNum = parseInt(weekPart.substring(1));
                    return (
                        incidentDate.getFullYear() === parseInt(weekYear) &&
                        getISOWeekNumber(incidentDate) === weekNum
                    );
                    
                case 'monthly':
                    // Format: YYYY-MM
                    const [monthYear, month] = secondary.split('-');
                    return (
                        incidentDate.getFullYear() === parseInt(monthYear) &&
                        incidentDate.getMonth() + 1 === parseInt(month)
                    );
                    
                case 'quarterly':
                    // Format: YYYY-QX
                    const [quarterYear, quarterPart] = secondary.split('-');
                    const quarter = parseInt(quarterPart.substring(1));
                    // Calculate incident's quarter (1-4)
                    const incidentQuarter = Math.floor(incidentDate.getMonth() / 3) + 1;
                    return (
                        incidentDate.getFullYear() === parseInt(quarterYear) &&
                        incidentQuarter === quarter
                    );
                    
                case 'yearly':
                    // Format: YYYY
                    return incidentDate.getFullYear() === parseInt(secondary);
                    
                default:
                    return false;
            }
        });
    }

    // Calculate resolved times
    const resolvedTimeData = filteredResponses.reduce((acc, response) => {
        if (!response?.date?.incident) return acc;

        const incidentDate = new Date(response.date.incident.toMillis());
        if (isNaN(incidentDate.getTime())) return acc;

        const arrivedTime = response?.date?.arrived ? new Date(response.date.arrived.toMillis()) : null;
        const resolvedTime = response?.date?.resolved ? new Date(response.date.resolved.toMillis()) : null;
        
        // Skip if missing critical timing data
        if (!arrivedTime || !resolvedTime) return acc;

        // Calculate resolved time (time from arrival to resolution)
        const resolvedTimeDiff = ((resolvedTime.getTime() - arrivedTime.getTime()) / (1000 * 60)).toFixed(1);

        // Format date for x-axis with hour - format: DD/MM|HH
        const day = incidentDate.getDate().toString().padStart(2, '0');
        const month = (incidentDate.getMonth() + 1).toString().padStart(2, '0');
        const hour = incidentDate.getHours().toString().padStart(2, '0');
        const x = `${day}/${month}|${hour}`;
        
        // Create full date format for tooltip with correct AM/PM
        const hours = incidentDate.getHours();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12; // Convert 0 to 12 for 12 AM
        
        const fullDateFormat = incidentDate.toLocaleDateString("en-GB", {
            day: "numeric",
            month: "long",
        }) + ", " + displayHours + ampm;

        // Add data point
        if (!acc["Resolved Time"]) {
            acc["Resolved Time"] = { 
                id: "Resolved Time", 
                color: colors.blueAccent[500], 
                data: [] 
            };
        }

        // Add data points with report_id for tooltip
        acc["Resolved Time"].data.push({ 
            x, 
            y: parseFloat(resolvedTimeDiff),
            reportId: response.report_id || "Unknown ID",
            fullDate: fullDateFormat,
            arrivalTime: arrivedTime.toLocaleTimeString("en-GB", {
                hour: "2-digit",
                minute: "2-digit"
            }),
            resolutionTime: resolvedTime.toLocaleTimeString("en-GB", {
                hour: "2-digit",
                minute: "2-digit"
            })
        });

        return acc;
    }, {});

    // Get all data points
    const resolvedTimeDataArray = Object.values(resolvedTimeData);
    
    // Sort data points by date/time for each series
    resolvedTimeDataArray.forEach(series => {
        series.data.sort((a, b) => {
            const [dayA, restA] = a.x.split('/');
            const [monthA, hourA] = restA.split('|');
            
            const [dayB, restB] = b.x.split('/');
            const [monthB, hourB] = restB.split('|');
            
            // Create date objects for proper comparison
            const dateA = new Date(2025, parseInt(monthA) - 1, parseInt(dayA), parseInt(hourA));
            const dateB = new Date(2025, parseInt(monthB) - 1, parseInt(dayB), parseInt(hourB));
            
            return dateA - dateB;
        });
    });

    // Calculate y-axis range
    const allValues = resolvedTimeDataArray.flatMap(series => 
        series.data.map(d => d.y).filter(y => y !== null)
    );
    
    const maxValue = allValues.length > 0 ? Math.max(...allValues) : 8;
    const yMin = 0;  // Start from zero to show full resolved time
    const yMax = maxValue > 10 ? maxValue + 2 : 12; // Add padding to y-axis max
    
    return { filledResolvedTimeData: resolvedTimeDataArray, yMin, yMax };
};

// Format filter to display string
const formatFilterLabel = (filters) => {
    if (!filters || !filters.primary || !filters.secondary) {
        return "Date/Hour (DD/MM|HH)";
    }
    
    const { primary } = filters;
    
    switch (primary) {
        case 'daily':
            return "Hour (HH)";
        case 'weekly':
            return "Day/Hour (DD|HH)";
        case 'monthly':
            return "Date/Hour (DD/MM|HH)";
        case 'quarterly':
            return "Month/Day/Hour (MM/DD|HH)";
        case 'yearly':
            return "Month/Day/Hour (MM/DD|HH)";
        default:
            return "Date/Hour (DD/MM|HH)";
    }
};

const PerformanceResolvedTimeLineChart = ({ 
    responses = [], 
    filters = { primary: "monthly", secondary: "2025-03" } 
}) => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);

    const memoizedData = useMemo(() => 
        processResolvedTimeData(responses, filters, colors), 
        [responses, filters, colors]
    );
    
    const { filledResolvedTimeData, yMin, yMax } = memoizedData;
    const xAxisLabel = formatFilterLabel(filters);
  
    return (
        <div style={{ width: '100%', height: '100%' }}>
            <ResponsiveLine
                data={filledResolvedTimeData}
                theme={{
                    axis: {
                        domain: {
                            line: {
                                stroke: "#000000",
                            },
                        },
                        legend: {
                            text: {
                                fill: "#000000",
                                fontSize: 12,
                                fontWeight: 600,
                            },
                        },
                        ticks: {
                            line: {
                                stroke: "#000000",
                                strokeWidth: 1,
                            },
                            text: {
                                fill: "#000000",
                                fontSize: 11,
                            },
                        },
                    },
                    legends: {
                        text: {
                            fill: "#000000",
                            fontSize: 11,
                        },
                    },
                    tooltip: {
                        container: {
                            background: "#ffffff",
                            color: "#000000",
                            fontSize: 12,
                            boxShadow: "0 3px 6px rgba(0, 0, 0, 0.15)",
                            borderRadius: "4px",
                        },
                    },
                    grid: {
                        line: {
                            stroke: "#dddddd",
                        },
                    },
                }}
                tooltip={({ point }) => {
                    if (point.data.y === null || point.data.y === undefined) return null;
                    
                    const reportId = point.data.reportId || "N/A";
                    const fullDate = point.data.fullDate || "N/A";
                    const resolvedTime = point.data.y;
                    const arrivalTime = point.data.arrivalTime || "N/A";
                    const resolutionTime = point.data.resolutionTime || "N/A";
                    
                    return (
                        <div
                            style={{
                                background: "#ffffff",
                                padding: "8px 12px",
                                borderRadius: "4px",
                                color: "#000000",
                                boxShadow: "0 3px 6px rgba(0, 0, 0, 0.15)",
                                border: "1px solid #dddddd",
                            }}
                        >
                            <strong>Report ID: {reportId}</strong> <br />
                            <span>Date: {fullDate}</span> <br />
                            <span style={{ color: "#0066CC" }}>
                                Resolution Time: {resolvedTime} minutes
                            </span> <br />
                            <span>
                                Arrived: {arrivalTime} | Resolved: {resolutionTime}
                            </span>
                        </div>
                    );
                }}
                colors={{ datum: "color" }}
                margin={{ top: 20, right: 100, bottom: 50, left: 60 }}
                xScale={{ type: "point" }}
                yScale={{
                    type: "linear",
                    min: yMin,
                    max: yMax,
                    stacked: false,
                    reverse: false,
                }}
                yFormat=" >-.1f"
                curve="catmullRom"
                axisTop={null}
                axisRight={null}
                axisBottom={{
                    orient: "bottom",
                    tickSize: 5,
                    tickPadding: 5,
                    tickRotation: -45,
                    legend: xAxisLabel,
                    legendOffset: 80,
                    legendPosition: "middle",
                }}
                axisLeft={{
                    orient: "left",
                    tickValues: 5,
                    tickSize: 3,
                    tickPadding: 5,
                    tickRotation: 0,
                    legend: "Resolution Time (minutes)",
                    legendOffset: -40,
                    legendPosition: "middle",
                }}
                enableGridX={false}
                enableGridY={true}
                gridYValues={5}
                pointSize={8}
                pointColor={{ theme: "background" }}
                pointBorderWidth={2}
                pointBorderColor={{ from: "serieColor" }}
                pointLabelYOffset={-12}
                useMesh={true}
                legends={[
                    {
                        anchor: "bottom-right",
                        direction: "column",
                        justify: false,
                        translateX: 100,
                        translateY: 0,
                        itemsSpacing: 0,
                        itemDirection: "left-to-right",
                        itemWidth: 100,
                        itemHeight: 20,
                        itemOpacity: 0.75,
                        symbolSize: 12,
                        symbolShape: "circle",
                        symbolBorderColor: "rgba(0, 0, 0, .5)",
                        effects: [
                            {
                                on: "hover",
                                style: {
                                    itemBackground: "rgba(0, 0, 0, .03)",
                                    itemOpacity: 1,
                                },
                            },
                        ],
                    }
                ]}
            />
        </div>
    );
};

export default PerformanceResolvedTimeLineChart;