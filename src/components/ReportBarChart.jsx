import { ResponsiveBar } from "@nivo/bar";

const ReportBarChart = ({ reports }) => {
    if (!reports || reports.length === 0) return null;

    const barangayData = {};

    reports.forEach((report) => {
        const barangay = report.address?.barangay;
        if (!barangay) return;

        if (!barangayData[barangay]) {
            barangayData[barangay] = 0;
        }

        barangayData[barangay] += 1;
    });

    // Transform data for Nivo Bar Chart
    const chartData = Object.keys(barangayData).map((barangay) => ({
        barangay,
        "Total Reports": barangayData[barangay],
    }));

    // Sort chartData by report count (descending)
    const sortedChartData = chartData.sort((a, b) => a["Total Reports"] - b["Total Reports"]);

    return (
        <ResponsiveBar
            data={sortedChartData}
            keys={["Total Reports"]}
            indexBy="barangay"
            margin={{ top: 20, right: 130, bottom: 70, left: 60 }}
            padding={0.3}
            valueScale={{ type: "linear" }}
            indexScale={{ type: "band", round: true }}
            colors="#007BFF"
            axisBottom={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: -45,
                legend: "Barangay",
                legendPosition: "middle",
                legendOffset: 60
            }}
            axisLeft={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: 0,
                legend: "Total Reports",
                legendPosition: "middle",
                legendOffset: -40,
            }}
            labelSkipWidth={12}
            labelSkipHeight={12}
            labelTextColor="white"
            theme={{
                labels: {
                    text: {
                        fontWeight: 600,
                        fill: "white",
                    },
                },
            }}
            tooltip={({ id, value, indexValue }) => (
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
                    <strong>Barangay:</strong> {indexValue} <br />
                    <strong>Total Reports:</strong> {value}
                </div>
            )}
            label={(d) => `${d.value}`}
            legends={[
                {
                    dataFrom: "keys",
                    anchor: "bottom-right",
                    direction: "column",
                    translateX: 120,
                    itemsSpacing: 2,
                    itemWidth: 100,
                    itemHeight: 20,
                    itemOpacity: 0.85,
                    symbolSize: 20,
                    effects: [{ on: "hover", style: { itemOpacity: 1 } }],
                },
            ]}
            role="application"
            ariaLabel="Report Count Bar Chart"
            barAriaLabel={(e) =>
                `Barangay: ${e.indexValue}, Total Reports: ${e.formattedValue}`
            }
        />
    );
};

export default ReportBarChart;