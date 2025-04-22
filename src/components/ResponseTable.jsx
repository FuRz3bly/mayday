import React from "react";
import { Table, TableHead, TableRow, TableCell, TableBody } from "@mui/material";

const ResponseTable = ({ reports }) => {
    if (!reports || reports.length === 0) return null;

    const barangayData = {};

    // Filter out reports with status 0 or 1
    const validReports = reports.filter(report => report.status !== 0 && report.status !== 1);

    validReports.forEach((report) => {
        const barangay = report.address?.barangay;
        if (!barangay) return;

        if (!barangayData[barangay]) {
            barangayData[barangay] = { dailyTimes: {}, totalReports: 0 };
        }

        if (!report.responders?.providers || !Array.isArray(report.responders.providers)) return;

        report.responders.providers.forEach((responder) => {
            const stationId = responder?.station?.id;
            if (!stationId) return;

            const responseTimestamp = report.date?.[stationId]?.response;
            const arrivalTimestamp = report.date?.[stationId]?.arrived;

            // Skip if there's no response time or arrival time
            if (!responseTimestamp || !arrivalTimestamp) return;

            // Convert Firebase Timestamps to JavaScript Dates
            const responseTime = responseTimestamp.toDate();
            const arrivalTime = arrivalTimestamp.toDate();

            const duration = (arrivalTime - responseTime) / (1000 * 60); // Convert ms to minutes
            const dateKey = responseTime.toLocaleDateString(); // Group by day

            if (!barangayData[barangay].dailyTimes[dateKey]) {
                barangayData[barangay].dailyTimes[dateKey] = { totalTime: 0, count: 0 };
            }

            barangayData[barangay].dailyTimes[dateKey].totalTime += duration;
            barangayData[barangay].dailyTimes[dateKey].count += 1;
            barangayData[barangay].totalReports += 1;
        });
    });

    // Transform data for the table
    const tableData = Object.keys(barangayData).map((barangay) => {
        let totalResponseTime = 0;
        let totalDays = 0;

        Object.values(barangayData[barangay].dailyTimes).forEach((day) => {
            if (day.count > 0) {
                totalResponseTime += day.totalTime / day.count; // Get average per day
                totalDays += 1;
            }
        });

        const avgResponseTime = totalDays > 0 ? (totalResponseTime / totalDays).toFixed(2) : "N/A";

        return {
            barangay,
            avgResponseTime,
            totalReports: barangayData[barangay].totalReports,
        };
    });

    // Compute total reports for all barangays
    const totalReports = tableData.reduce((sum, row) => sum + row.totalReports, 0);

    // Sort tableData by totalReports (descending) to show the most interesting ones
    const sortedTableData = tableData.sort((a, b) => b.totalReports - a.totalReports);

    // Limit to 8 rows
    const limitedTableData = sortedTableData.slice(0, 12);

    return (
        <Table sx={{ border: "1px solid black" }}>
            <TableHead>
                <TableRow>
                    <TableCell sx={{ color: "black", border: "1px solid black", padding: "8px" }}>Barangay</TableCell>
                    <TableCell sx={{ color: "black", border: "1px solid black", padding: "8px" }}>Response Time (minutes)</TableCell>
                    <TableCell sx={{ color: "black", border: "1px solid black", padding: "8px" }}>Reports</TableCell>
                </TableRow>
            </TableHead>
            <TableBody>
                {limitedTableData.map((row) => (
                    <TableRow key={row.barangay}>
                        <TableCell sx={{ color: "black", border: "1px solid black", padding: "8px" }}>{row.barangay}</TableCell>
                        <TableCell sx={{ color: "black", border: "1px solid black", padding: "8px" }}>{row.avgResponseTime}</TableCell>
                        <TableCell sx={{ color: "black", border: "1px solid black", padding: "8px" }}>{row.totalReports}</TableCell>
                    </TableRow>
                ))}
                <TableRow>
                    <TableCell sx={{ color: "black", border: "1px solid black", fontWeight: "bold", padding: "8px" }}>Total Reports</TableCell>
                    <TableCell sx={{ color: "black", border: "1px solid black", padding: "8px" }}></TableCell>
                    <TableCell sx={{ color: "black", border: "1px solid black", fontWeight: "bold", padding: "8px" }}>{totalReports}</TableCell>
                </TableRow>
            </TableBody>
        </Table>
    );    
};

export default ResponseTable;