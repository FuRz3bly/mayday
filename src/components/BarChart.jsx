import { useTheme } from "@mui/material";
import { ResponsiveBar } from "@nivo/bar";
import { tokens } from "../theme";

const TYPE_CRIME = 0b001;       // 1
const TYPE_FIRE = 0b010;        // 2
const TYPE_MEDICAL = 0b100;     // 4
const TYPE_SUSPICIOUS = 0b1000; // 8

const typeColors = {
    crime: tokens("dark").blueAccent[400],         // Blue
    fire: tokens("dark").redAccent[400],           // Red
    medical: tokens("dark").greenAccent[400],      // Green
    suspicious: "#868dfb",                         // Purple
};

const typeLabels = {
    crime: "Crime",
    fire: "Fire",
    medical: "Medical",
    suspicious: "Suspicious Act",
};

// Function to increment the counts based on bitmask
const incrementCounts = (type, counts) => {
    if (type & TYPE_CRIME) counts.crime += 1;
    if (type & TYPE_FIRE) counts.fire += 1;
    if (type & TYPE_MEDICAL) counts.medical += 1;
    if (type & TYPE_SUSPICIOUS) counts.suspicious += 1;
};

// Function to process reports data
const processData = (reports) => {
    const groupedData = {};

    reports.forEach((report) => {
        if (report?.date?.incident) {
            const date = new Date(report.date.incident.toMillis()).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "2-digit",
            });

            if (!groupedData[date]) {
                groupedData[date] = {
                    date,
                    crime: 0,
                    fire: 0,
                    medical: 0,
                    suspicious: 0,
                };
            }

            incrementCounts(report.type, groupedData[date]);
        }
    });

    // Convert to array format
    return Object.values(groupedData).map((item) => ({
        country: item.date,
        crime: item.crime,
        crimeColor: typeColors.crime,
        fire: item.fire,
        fireColor: typeColors.fire,
        medical: item.medical,
        medicalColor: typeColors.medical,
        suspicious: item.suspicious,
        suspiciousColor: typeColors.suspicious,
    }));
};

const BarChart = ({ reports = [], isDashboard = false }) => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    const data = processData(reports);

    return (
        <ResponsiveBar
            data={data}
            theme={{
                grid: {
                    line: {
                        strokeWidth: 0, // Removes all grid lines
                    },
                },
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
                        fill: colors.grey[200],
                    },
                },
            }}
            keys={["fire", "crime", "medical", "suspicious"]}
            indexBy="country"
            margin={{ top: 50, right: 130, bottom: 50, left: 60 }}
            padding={0.3}
            valueScale={{ type: "linear" }}
            indexScale={{ type: "band", round: true }}
            colors={({ id, data }) => data[`${id}Color`]}
            borderColor={{
                from: "color",
                modifiers: [["darker", "1.6"]],
            }}
            axisTop={null}
            axisRight={null}
            axisBottom={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: 0,
                legend: isDashboard ? undefined : "Date", 
                legendPosition: "middle",
                legendOffset: 32,
            }}
            axisLeft={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: 0,
                legend: isDashboard ? undefined : "Count",
                legendPosition: "middle",
                legendOffset: -40,
                // Force whole numbers
                tickValues: 5, // Show ticks every 5 units or adjust as needed
                format: (value) => Math.round(value),
            }}
            enableLabel={false}
            labelSkipWidth={12}
            labelSkipHeight={12}
            labelTextColor={{
                from: "color",
                modifiers: [["darker", 1.6]],
            }}
            tooltip={({ id, value, indexValue }) => (
                <div
                    style={{
                        background: colors.primary[500],
                        padding: "8px 12px",
                        borderRadius: "8px",
                        color: "#fff",
                        boxShadow: "0 3px 6px rgba(0, 0, 0, 0.15)",
                    }}
                >
                    <strong>Date:</strong> {indexValue}<br />
                    <strong>Type:</strong> {id.charAt(0).toUpperCase() + id.slice(1)}<br />
                    <strong>Count:</strong> {value}
                </div>
            )}
            legends={[
                {
                    data: Object.keys(typeLabels).map((key) => ({
                        id: key,
                        label: typeLabels[key],
                        color: typeColors[key],
                    })),
                    anchor: "bottom-right",
                    direction: "column",
                    justify: false,
                    translateX: 120,
                    translateY: 0,
                    itemsSpacing: 4,
                    itemWidth: 100,
                    itemHeight: 20,
                    itemDirection: "left-to-right",
                    itemOpacity: 0.85,
                    symbolSize: 20,
                    symbolShape: "circle",
                    effects: [
                        {
                            on: "hover",
                            style: {
                                itemOpacity: 1,
                            },
                        },
                    ],
                },
            ]}
            role="application"
            barAriaLabel={({ id, formattedValue, indexValue }) =>
                `${id}: ${formattedValue} on ${indexValue}`
            }
        />
    )
};

export default BarChart;