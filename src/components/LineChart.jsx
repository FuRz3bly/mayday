import { useMemo } from "react";

import { ResponsiveLine } from "@nivo/line";
import { useTheme } from "@mui/material";
import { tokens } from "../theme";
//import { mockLineData as data } from "../data/mockData";

const serviceTypes = {
    0: "Crime",
    1: "Fire",
    2: "Medical",
    3: "Fire & Medical",
};

const serviceColors = {
    0: tokens("dark").blueAccent[300],
    1: tokens("dark").redAccent[200],
    2: tokens("dark").greenAccent[400],
    3: "#868dfb",
};

const LineChart = ({ responses = [], isCustomLineColors = false, isDashboard = false, primaryFilter }) => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);

    function processResponseData(responses, primaryFilter) {
        if (responses.length === 0) {
            // Fallback if no responses
            const today = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit" });
            return {
                filledResponseData: [
                    {
                        id: "No Data",
                        color: colors.grey[400],
                        data: [{ x: today, y: 0 }], // Avoid null values entirely
                    },
                ],
                yMin: 3,
                yMax: 8,
            };
        }
    
        const allDatesSet = new Set();
    
        // Populate dates for non-daily views
        responses.forEach(response => {
            const incidentDate = response?.date?.incident ? new Date(response.date.incident.toMillis()) : null;
            if (!incidentDate || isNaN(incidentDate.getTime())) return;
            const dateString = incidentDate.toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "2-digit",
            });
            allDatesSet.add(dateString);
        });
    
        // Fallback to today's date if no valid dates
        if (allDatesSet.size === 0) {
            allDatesSet.add(new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit" }));
        }
    
        const allDates = Array.from(allDatesSet).sort((a, b) => {
            const [dayA, monthA] = a.split("-").map(Number);
            const [dayB, monthB] = b.split("-").map(Number);
            return new Date(2025, monthA - 1, dayA) - new Date(2025, monthB - 1, dayB);
        });
    
        // Generate response data
        const responseData = Object.values(responses.reduce((acc, response) => {
            const service = serviceTypes[response.service] || "Unknown";
            const color = serviceColors[response.service] || "#fff";
    
            if (service === "Unknown") return acc;
    
            const incidentDate = response?.date?.incident ? new Date(response.date.incident.toMillis()) : null;
            if (!incidentDate || isNaN(incidentDate.getTime())) return acc;
    
            const responseTime = response?.date?.response ? new Date(response.date.response.toMillis()) : null;
            const arrivedTime = response?.date?.arrived ? new Date(response.date.arrived.toMillis()) : null;
    
            if (!responseTime || !arrivedTime) return acc;
    
            // Calculate time difference
            const responseTimestamp = responseTime.getTime();
            const arrivedTimestamp = arrivedTime.getTime();
            const timeDiff = ((arrivedTimestamp - responseTimestamp) / (1000 * 60)).toFixed(1);
    
            if (!acc[service]) {
                acc[service] = { id: service, color: color, data: [] };
            }
    
            // Format "x" based on primaryFilter
            let x;
            if (primaryFilter === "daily") {
                // Show individual response times in military format
                x = responseTime
                    .toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
                    .replace(":", "")
                    .concat("H"); // Example: "0800H"
            } else {
                // Group by incident date for non-daily views
                x = incidentDate.toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "2-digit",
                });
            }
    
            acc[service].data.push({ x, y: parseFloat(timeDiff) });
    
            return acc;
        }, {}));
    
        // Fill response data
        const filledResponseData = responseData.map(service => {
            if (primaryFilter === "daily") {
                // Sort by time for daily view in descending order (latest to oldest)
                const sortedData = service.data.sort((a, b) => {
                    // Convert military time (e.g., "0800H") to Date object for accurate comparison
                    const parseTime = (timeString) => {
                        const hour = parseInt(timeString.substring(0, 2), 10);
                        const minute = parseInt(timeString.substring(2, 4), 10);
                        return new Date(2025, 0, 1, hour, minute).getTime(); // Dummy date for sorting
                    };
            
                    return parseTime(b.x) - parseTime(a.x); // Descending order
                });
                return { ...service, data: sortedData };
            } else {
                // Fill missing dates for non-daily views
                const dateMap = new Map(service.data.map(d => [d.x, d.y]));
                const filledData = allDates.map(date => ({
                    x: date,
                    y: dateMap.has(date) ? dateMap.get(date) : null, // Null for missing points
                }));
                return { ...service, data: filledData };
            }
        });
    
        // Prevent errors when calculating maxTime
        const allTimes = filledResponseData.flatMap(service =>
            service.data.map(d => d.y).filter(y => y !== null)
        );
        const maxTime = allTimes.length > 0 ? Math.max(...allTimes) : 8;
    
        const yMin = 3;
        const yMax = maxTime > 7 ? maxTime : 8;
    
        return { filledResponseData, yMin, yMax };
    };
    
    const memoizedData = useMemo(() => processResponseData(responses, primaryFilter), [responses, primaryFilter]);
    const { filledResponseData, yMin, yMax } = memoizedData;
  
    return (
        <ResponsiveLine
            key={responses}
            data={filledResponseData}
            theme={{
                axis: {
                    domain: {
                        line: {
                            stroke: colors.grey[100],
                        },
                    },
                    legend: {
                        text: {
                            fill: colors.grey[100],
                        },
                    },
                    ticks: {
                        line: {
                            stroke: colors.grey[100],
                            strokeWidth: 1,
                        },
                        text: {
                            fill: colors.grey[100],
                        },
                    },
                },
                legends: {
                    text: {
                        fill: colors.grey[100],
                    },
                },
                tooltip: {
                    container: {
                        color: colors.primary[500],
                    },
                },
            }}
            tooltip={({ point }) => {
                if (point.data.y === null || point.data.y === undefined) return null; // Prevent tooltip if no data
            
                const x = point?.data?.xFormatted ?? "N/A";
                const y = point?.data?.yFormatted ?? "N/A";
            
                return (
                    <div
                        style={{
                            background: colors.primary[500],
                            padding: "8px 12px",
                            borderRadius: "8px",
                            color: "#fff",
                            boxShadow: "0 3px 6px rgba(0, 0, 0, 0.15)",
                        }}
                    >
                        <strong>{point.serieId ?? "Unknown"}</strong> <br />
                        <span>D: {x}</span> <br />
                        <span>RT: {y} min</span>
                    </div>
                );
            }}            
            colors={isDashboard ? { datum: "color" } : { scheme: "nivo" }} // added
            margin={{ top: 50, right: 110, bottom: 50, left: 60 }}
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
                tickSize: 0,
                tickPadding: 5,
                tickRotation: 0,
                legend: isDashboard ? undefined : "transportation",
                legendOffset: 36,
                legendPosition: "middle",
            }}
            axisLeft={{
                orient: "left",
                tickValues: 5,
                tickSize: 3,
                tickPadding: 5,
                tickRotation: 0,
                legend: isDashboard ? undefined : "count", 
                legendPosition: "middle",
            }}
            enableGridX={false}
            enableGridY={false}
            pointSize={8}
            pointColor={{ theme: "background" }}
            pointBorderWidth={2}
            pointBorderColor={{ from: "serieColor" }}
            pointLabelYOffset={-12}
            useMesh={responses.length > 0}
            legends={[
                {
                    anchor: "bottom-right",
                    direction: "column",
                    justify: false,
                    translateX: 100,
                    translateY: 0,
                    itemsSpacing: 0,
                    itemDirection: "left-to-right",
                    itemWidth: 80,
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
                },
                {
                    anchor: "bottom-left",
                    direction: "column",
                    translateX: -10,
                    translateY: 50,
                    itemsSpacing: 4,
                    itemWidth: 100,
                    itemHeight: 20,
                    itemOpacity: 0.75,
                    symbolSize: 0, // No symbol, just text
                    itemTextColor: colors.grey[100],
                    data: [
                        { id: "D = Date" },
                        { id: "RT = Response Time (min)" },
                    ],
                },
            ]}
        />
    );
};

export default LineChart;