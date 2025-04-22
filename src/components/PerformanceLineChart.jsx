import { useTheme } from "@mui/material";
import { ResponsiveLine } from "@nivo/line";
import { tokens } from "../theme";
import { useMemo } from "react";

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

const processResponseData = (responses, filters, colors) => {
    if (responses.length === 0) {
        // Fallback if no responses
        const today = new Date();
        const formattedDate = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}|${today.getHours().toString().padStart(2, '0')}`;
        return {
            filledResponseData: [
                {
                    id: "Response Time",
                    color: colors.greenAccent[500],
                    data: [{ x: formattedDate, y: 0 }],
                },
            ],
            yMin: 0,
            yMax: 12,
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

    // Calculate response times and ETA metrics
    const responseData = filteredResponses.reduce((acc, response) => {
        if (!response?.date?.incident) return acc;

        const incidentDate = new Date(response.date.incident.toMillis());
        if (isNaN(incidentDate.getTime())) return acc;

        const responseTime = response?.date?.response ? new Date(response.date.response.toMillis()) : null;
        const arrivedTime = response?.date?.arrived ? new Date(response.date.arrived.toMillis()) : null;
        
        // Skip if missing critical timing data
        if (!responseTime || !arrivedTime) return acc;

        // Calculate response time (time from dispatch to arrival)
        const responseTimeDiff = ((arrivedTime.getTime() - responseTime.getTime()) / (1000 * 60)).toFixed(1);

        // Calculate ETA adherence
        const estimatedTime = response?.date?.estimated ? new Date(response.date.estimated.toMillis()) : null;
        const defaultETA = 7; // Default ETA in minutes
        
        // Calculate estimated time value and adherence metrics for tooltip
        let estimatedTimeValue;
        let adherenceInfo = {};
        
        if (estimatedTime) {
            // Calculate actual vs. estimated time difference
            estimatedTimeValue = (estimatedTime.getTime() - responseTime.getTime()) / (1000 * 60);
        } else {
            // Use default ETA if not provided
            estimatedTimeValue = defaultETA;
        }
        
        // Calculate adherence for tooltip
        const actualResponseTime = parseFloat(responseTimeDiff);
        const isDelayed = actualResponseTime > estimatedTimeValue;
        
        // Calculate difference in minutes and percentage
        const diffInMinutes = Math.abs(actualResponseTime - estimatedTimeValue).toFixed(1);
        const diffPercentage = Math.round((Math.abs(actualResponseTime - estimatedTimeValue) / estimatedTimeValue) * 100);
        
        adherenceInfo = {
            diffMinutes: diffInMinutes,
            diffPercentage: diffPercentage,
            status: isDelayed ? "slower" : "faster",
            estimatedTime: estimatedTimeValue.toFixed(1),
            isDelayed: isDelayed
        };

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
        if (!acc["Response Time"]) {
            acc["Response Time"] = { 
                id: "Response Time", 
                color: colors.greenAccent[500], 
                data: [] 
            };
        }

        // Add data points with report_id and adherence info for tooltip
        acc["Response Time"].data.push({ 
            x, 
            y: parseFloat(responseTimeDiff),
            reportId: response.report_id || "Unknown ID",
            adherenceInfo: adherenceInfo,
            fullDate: fullDateFormat
        });

        return acc;
    }, {});

    // Get all data points
    const responseDataArray = Object.values(responseData);
    
    // Sort data points by date/time for each series
    responseDataArray.forEach(series => {
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
    const allValues = responseDataArray.flatMap(series => 
        series.data.map(d => d.y).filter(y => y !== null)
    );
    
    const maxValue = allValues.length > 0 ? Math.max(...allValues) : 8;
    const yMin = 0;  // Start from zero to show full response time
    const yMax = maxValue > 10 ? maxValue + 2 : 12; // Add padding to y-axis max
    
    return { filledResponseData: responseDataArray, yMin, yMax };
};

const PerformanceLineChart = ({ responses = [], filters = { primary: 'monthly', secondary: '2025-03' } }) => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);

    const memoizedData = useMemo(() => processResponseData(responses, filters, colors), [responses, filters, colors]);
    const { filledResponseData, yMin, yMax } = memoizedData;
  
    // Generate legend title based on filter type
    let timeframeText = "Incident Date/Hour (DD/MM|HH)";
    if (filters && filters.primary) {
        switch (filters.primary) {
            case 'daily':
                timeframeText = "Incident Hour (HH)";
                break;
            case 'weekly':
                timeframeText = "Incident Day (DD/MM)";
                break;
            case 'monthly':
                timeframeText = "Incident Date (DD/MM)";
                break;
            case 'quarterly':
                timeframeText = "Incident Month (MM)";
                break;
            case 'yearly':
                timeframeText = "Incident Quarter (Q)";
                break;
            default:
                timeframeText = "Incident Date/Hour (DD/MM|HH)";
        }
    }

    return (
        <div style={{ width: '100%', height: '100%' }}>
            <ResponsiveLine
                data={filledResponseData}
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
                    //const x = point.data.x || "N/A";
                    const fullDate = point.data.fullDate || "N/A";
                    const responseTime = point.data.y;
                    const info = point.data.adherenceInfo;
                    
                    // Define text color based on if response time is faster or slower than estimated
                    const responseTimeColor = info && info.isDelayed ? "#FF0000" : "#00AA00";
                    
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
                            <span style={{ color: responseTimeColor }}>
                                Response Time: {responseTime} minutes
                            </span> <br />
                            {info && (
                                <span>
                                    ETA: {info.estimatedTime} min | {info.diffPercentage}% {info.status} ({info.diffMinutes} min {info.status})
                                </span>
                            )}
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
                    legend: timeframeText,
                    legendOffset: 80,
                    legendPosition: "middle",
                }}
                axisLeft={{
                    orient: "left",
                    tickValues: 5,
                    tickSize: 3,
                    tickPadding: 5,
                    tickRotation: 0,
                    legend: "Response Time (minutes)",
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

export default PerformanceLineChart;