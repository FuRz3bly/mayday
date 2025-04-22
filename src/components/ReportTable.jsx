import React from "react";
import { Table, TableHead, TableRow, TableCell, TableBody } from "@mui/material";

const ReportTable = ({ reports }) => {
    if (!reports || reports.length === 0) return null;

    const barangayData = {};
    let totalReports = 0;

    // Group reports by barangay
    reports.forEach((report) => {
        const barangay = report.address?.barangay;
        if (!barangay) return;

        if (!barangayData[barangay]) {
            barangayData[barangay] = 0;
        }

        barangayData[barangay] += 1;
        totalReports += 1;
    });

    // Convert data to an array of objects for better handling
    const barangayArray = Object.keys(barangayData).map(barangay => ({
        name: barangay,
        reports: barangayData[barangay],
        percentage: ((barangayData[barangay] / totalReports) * 100).toFixed(2)
    }));

    // Sort barangays by number of reports (ascending)
    const sortedBarangays = [...barangayArray].sort((a, b) => a.reports - b.reports);
    
    // Select most interesting barangays if we have more than 8
    let displayBarangays = sortedBarangays;
    
    if (sortedBarangays.length > 8) {
        // Get the highest and lowest
        const lowest = sortedBarangays[0];
        const highest = sortedBarangays[sortedBarangays.length - 1];
        
        // Get second highest and second lowest
        const secondLowest = sortedBarangays[1];
        const secondHighest = sortedBarangays[sortedBarangays.length - 2];
        
        // Calculate midpoints for selecting middle range samples
        const midIndex = Math.floor(sortedBarangays.length / 2);
        const lowerMidIndex = Math.floor(sortedBarangays.length / 4);
        const upperMidIndex = midIndex + lowerMidIndex;
        
        // Get middle values
        const middle = sortedBarangays[midIndex];
        const lowerMid = sortedBarangays[lowerMidIndex];
        const upperMid = sortedBarangays[upperMidIndex];
        
        // Find the most common value (mode)
        const reportCounts = {};
        sortedBarangays.forEach(b => {
            if (!reportCounts[b.reports]) reportCounts[b.reports] = [];
            reportCounts[b.reports].push(b);
        });
        
        let mostCommonCount = 0;
        let mostCommonBarangays = [];
        Object.keys(reportCounts).forEach(count => {
            if (reportCounts[count].length > mostCommonCount) {
                mostCommonCount = reportCounts[count].length;
                mostCommonBarangays = reportCounts[count];
            }
        });
        
        // Take the first most common barangay if we have any
        const mostCommon = mostCommonBarangays.length > 0 ? mostCommonBarangays[0] : null;
        
        // Combine selections, filtering out duplicates and nulls
        displayBarangays = [lowest, secondLowest, lowerMid, middle, upperMid, secondHighest, highest];
        
        // Add the most common if it's not already included
        if (mostCommon && !displayBarangays.includes(mostCommon)) {
            displayBarangays.push(mostCommon);
        }
        
        // Remove any potential duplicates (can happen with small datasets)
        displayBarangays = displayBarangays.filter((item, index, self) => 
            item && self.findIndex(b => b?.name === item.name) === index
        );
        
        // Ensure we don't have more than 8
        if (displayBarangays.length > 8) {
            displayBarangays = displayBarangays.slice(0, 8);
        }
        
        // Sort again for display
        displayBarangays.sort((a, b) => a.reports - b.reports);
    }

    // Common cell style with reduced padding
    const cellStyle = {
        border: "1px solid black",
        color: "black",
        padding: "4px 6px" // Reduced padding
    };

    return (
        <Table sx={{ border: "1px solid black" }} size="small">
            <TableHead>
                <TableRow>
                    <TableCell sx={{ ...cellStyle, fontWeight: "bold" }}>
                        Barangay
                    </TableCell>
                    {displayBarangays.map((barangay) => (
                        <TableCell key={barangay.name} sx={cellStyle}>
                            {barangay.name}
                        </TableCell>
                    ))}
                    <TableCell sx={cellStyle}>
                        Total Reports
                    </TableCell>
                </TableRow>
            </TableHead>
            <TableBody>
                <TableRow>
                    <TableCell sx={{ ...cellStyle, fontWeight: "bold" }}>
                        Total Reports
                    </TableCell>
                    {displayBarangays.map((barangay) => (
                        <TableCell key={barangay.name} sx={cellStyle}>
                            {barangay.reports}
                        </TableCell>
                    ))}
                    <TableCell sx={cellStyle}>
                        {totalReports}
                    </TableCell>
                </TableRow>
                <TableRow>
                    <TableCell sx={{ ...cellStyle, fontWeight: "bold" }}>
                        % Total
                    </TableCell>
                    {displayBarangays.map((barangay) => (
                        <TableCell key={barangay.name} sx={cellStyle}>
                            {barangay.percentage}%
                        </TableCell>
                    ))}
                    <TableCell sx={cellStyle}>
                        100%
                    </TableCell>
                </TableRow>
            </TableBody>
        </Table>
    );
};

export default ReportTable;