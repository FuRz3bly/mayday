import { ResponsiveBar } from "@nivo/bar";

const ResponseBarChart = ({ reports }) => {
    if (!reports || reports.length === 0) return null;

    const barangayData = {};

    reports.forEach((report) => {
        // Skip reports with status 0 or 1
        if (report.status === 0 || report.status === 1) return;
        
        const barangay = report.address?.barangay;
        if (!barangay) return;

        if (!barangayData[barangay]) {
            barangayData[barangay] = { totalTime: 0, count: 0, dates: [] };
        }

        if (!report.responders?.providers || !Array.isArray(report.responders.providers)) return;

        report.responders.providers.forEach((responder) => {
            const stationId = responder?.station?.id;
            if (!stationId) return;

            const responseTimestamp = report.date?.[stationId]?.response;
            const arrivalTimestamp = report.date?.[stationId]?.arrived;

            // Skip if no response time or arrival time exists
            if (!responseTimestamp || !arrivalTimestamp) return;

            // Convert Firebase Timestamps to JavaScript Dates
            const responseTime = responseTimestamp.toDate();
            const arrivalTime = arrivalTimestamp.toDate();

            const duration = (arrivalTime - responseTime) / (1000 * 60); // Convert ms to minutes
            
            // Additional check to ensure duration is valid (positive number)
            if (isNaN(duration) || duration <= 0) return;

            barangayData[barangay].totalTime += duration;
            barangayData[barangay].count += 1;
            barangayData[barangay].dates.push(responseTime.toLocaleDateString());
        });
    });

    // Transform data for Nivo Bar Chart
    const chartData = Object.keys(barangayData).map((barangay) => ({
        barangay,
        "Response Time":
        barangayData[barangay].count > 0
            ? parseFloat((barangayData[barangay].totalTime / barangayData[barangay].count).toFixed(2))
            : 0,
        total: barangayData[barangay].totalTime.toFixed(2), // Store total response time for display
        dates: [...new Set(barangayData[barangay].dates)], // Unique dates
    }));

    // Filter out barangays with no valid response times
    const filteredChartData = chartData.filter(item => item["Response Time"] > 0);

    // Sort filtered chartData by "Response Time" (ascending)
    const sortedChartData = filteredChartData.sort((a, b) => a["Response Time"] - b["Response Time"]);

    // If no valid data after filtering, return null
    if (sortedChartData.length === 0) return null;

    // Function to determine bar color
    const barColor = (bar) => (bar.value <= 7 ? "#007BFF" : "#FF4136"); // Blue if ≤7 mins, Red otherwise

    return (
        <ResponsiveBar
            data={sortedChartData}
            keys={["Response Time"]}
            indexBy="barangay"
            margin={{ top: 20, right: 130, bottom: 70, left: 60 }}
            padding={0.3}
            valueScale={{ type: "linear" }}
            indexScale={{ type: "band", round: true }}
            colors={barColor} // Apply dynamic color function
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
                legend: "Average Response Time (minutes)",
                legendPosition: "middle",
                legendOffset: -40,
            }}
            labelSkipWidth={12} // Hide labels inside bars
            labelSkipHeight={12} // Hide labels inside bars
            labelTextColor="white"
            theme={{
                labels: {
                    text: {
                        fontWeight: 600, // Semi-bold
                        fill: "white",   // White color
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
                    <strong>Average Response Time:</strong> {value} min <br />
                </div>
            )}
            label={(d) => ``}
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
            ariaLabel="Response Time Bar Chart"
            barAriaLabel={(e) =>
                `Barangay: ${e.indexValue}, Average Response Time: ${e.formattedValue} min`
            }
        />
    );
};

export default ResponseBarChart;