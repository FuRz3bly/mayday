import React from 'react';
import { Box, Typography } from '@mui/material';

import PerformanceLineChart from './PerformanceLineChart';
import PerformanceTable from './PerformanceTable';
import PerformanceSummary from './PerformanceSummary';

import PerformanceBarChart from './PerformanceBarChart';
import PerformanceBarSummary from './PerformanceBarSummary';
import PerformanceReportBarChart from './PerformanceReportBarChart';
import PerformanceReportSummary from './PerformanceReportSummary';

import PerformanceHourBarChart from './PerformanceHourBarChart';
import PerformanceHourSummary from './PerformanceHourSummary';
import PerformanceResolvedLineChart from './PerformanceResolvedLineChart'
import PerformanceResolvedSummary from './PerfomanceResolvedSummary';

const PerformanceForm = ({
    refs,
    printResponses, 
    printReadyFilters, 
    printResponseTime, 
    printIndividual, 
    theme 
}) => {
    // Create refs for pages
    const { summaryRef, page1Ref, page2Ref, page3Ref } = refs;

    return (
        <Box ref={summaryRef}>
            {/* Page 1 */}
            <Box
                ref={page1Ref}
                className="page page1-print-align"
                display="flex"
                flexDirection="column"
                alignItems="center"
                sx={{ width: "650px", height: "900px", bgcolor: '#fff', padding: 3 }}
            >
                {/* Grid */}
                <Box
                    display="grid"
                    gridTemplateColumns="repeat(8, 1fr)"
                    gridAutoRows="auto"
                    gap="10px"
                    sx={{ width: "100%", overflow: 'hidden' }}
                >
                    {/* Document Title */}
                    <Box
                        gridColumn="span 8"
                        gridRow="span 1"
                        margin={1}
                        sx={{ overflow: 'hidden' }}
                        className="avoid-break"
                    >
                        <Typography
                            variant="h4"
                            fontWeight="600"
                            color="#000"
                            textAlign="center"
                            width="100%"
                        >
                            {printReadyFilters && printReadyFilters.primary === 'yearly' 
                                ? 'Annual Responder Performance Report'
                                : printReadyFilters 
                                    ? `${printReadyFilters.primary.charAt(0).toUpperCase() + printReadyFilters.primary.slice(1)} Responder Performance Report`
                                    : 'Responder Performance Report'}
                        </Typography>
                        <Typography width="100%" variant="h5" textAlign="center" fontWeight="400" color="#000">
                            {"Mayday Summarization of Responses"}
                        </Typography>
                    </Box>

                    {/* Response Time Line Chart */}
                    <Box
                        gridColumn="span 8"
                        gridRow="span 1"
                        sx={{ height: "300px", color: "black", border: "1px solid black", overflow: 'hidden' }}
                        className="avoid-break"
                    >
                        <PerformanceLineChart responses={printResponses} filters={printReadyFilters} />
                    </Box>

                    {/* Response Time Table */}
                    <Box
                        gridColumn="span 5"
                        gridRow="span 1"
                        sx={{ overflow: 'hidden' }}
                        className="avoid-break"
                    >
                        <PerformanceTable responses={printResponses} filters={printReadyFilters} />
                    </Box>

                    {/* Response Time Summary */}
                    <Box
                        gridColumn="span 3"
                        gridRow="span 1"
                        sx={{ overflow: 'hidden' }}
                        className="avoid-break"
                    >
                        <PerformanceSummary responses={printResponses} filters={printReadyFilters} targetResponseTime={7} user={printIndividual} />
                    </Box>
                </Box>
            </Box>

            {/* Page 2 */}
            <Box
                ref={page2Ref}
                className="page page2-print-align"
                display="flex"
                flexDirection="column"
                alignItems="center"
                sx={{ width: "650px", height: "900px", bgcolor: '#fff', padding: 3 }}
            >
                {/* Grid */}
                <Box
                    display="grid"
                    gridTemplateColumns="repeat(6, 1fr)"
                    gridAutoRows="auto"
                    gap="5px"
                    sx={{ width: "100%", overflow: 'hidden' }}
                >
                    {/* Fastest Response Time */}
                    <Box
                        gridColumn="span 2"
                        gridRow="span 1"
                        sx={{ color: "black", border: "1px solid black", overflow: 'hidden' }}
                        flexDirection="column"
                        alignItems="center"
                        justifyContent="center"
                        className="avoid-break"
                    >
                        <Typography
                            variant="h4"
                            fontWeight="600"
                            color="#000"
                            textAlign="center"
                            width="100%"
                        >
                            {printResponseTime.fastest ? `${printResponseTime.fastest.actualResponseTime} mins` : '0 mins'}
                        </Typography>
                        <Typography
                            variant="h6"
                            fontWeight="400"
                            fontStyle='italic'
                            color="#555"
                            textAlign="center"
                            width="100%"
                        >
                            {printResponseTime.fastest ? `Expected: ${printResponseTime.fastest.expectedResponseTime} mins` : '0 mins'}
                        </Typography>
                        <Typography width="100%" variant="h6" textAlign="center" fontWeight="400" color="#000">
                            {"Fastest Response Time"}
                        </Typography>
                    </Box>

                    {/* Slowest Response Time */}
                    <Box
                        gridColumn="span 2"
                        gridRow="span 1"
                        sx={{ color: "black", border: "1px solid black", overflow: 'hidden' }}
                        flexDirection="column"
                        alignItems="center"
                        justifyContent="center"
                        className="avoid-break"
                    >
                        <Typography
                            variant="h4"
                            fontWeight="600"
                            color="#000"
                            textAlign="center"
                            width="100%"
                        >
                            {printResponseTime.slowest ? `${printResponseTime.slowest.actualResponseTime} mins` : '0 mins'}
                        </Typography>
                        <Typography
                            variant="h6"
                            fontWeight="400"
                            fontStyle='italic'
                            color="#555"
                            textAlign="center"
                            width="100%"
                        >
                            {printResponseTime.slowest ? `Expected: ${printResponseTime.slowest.expectedResponseTime} mins` : '0 mins'}
                        </Typography>
                        <Typography width="100%" variant="h6" textAlign="center" fontWeight="400" color="#000">
                            {"Slowest Response Time"}
                        </Typography>
                    </Box>

                    {/* Average Response Time */}
                    <Box
                        gridColumn="span 2"
                        gridRow="span 1"
                        sx={{ color: "black", border: "1px solid black", overflow: 'hidden' }}
                        display="flex"
                        flexDirection="column"
                        alignItems="center"
                        justifyContent="center"
                        className="avoid-break"
                    >
                        <Typography
                            variant="h4"
                            fontWeight="600"
                            color="#000"
                            textAlign="center"
                            width="100%"
                        >
                            {printResponseTime.average ? `${printResponseTime.average} mins` : '0 mins'}
                        </Typography>
                        <Typography width="100%" variant="h6" textAlign="center" fontWeight="400" color="#000">
                            {"Average Response Time"}
                        </Typography>
                    </Box>

                    {/* Response Time Bar Chart */}
                    <Box
                        gridColumn="span 6"
                        gridRow="span 1"
                        sx={{ height: "300px", color: "black", border: "1px solid black", overflow: 'hidden' }}
                        className="avoid-break"
                    >
                        <PerformanceBarChart responses={printResponses} filters={printReadyFilters} />
                    </Box>

                    {/* Response Time Summary */}
                    <Box
                        gridColumn="span 6"
                        gridRow="span 1"
                        sx={{ overflow: 'hidden' }}
                        className="avoid-break"
                    >
                        <PerformanceBarSummary responses={printResponses} filters={printReadyFilters} targetResponseTime={7} user={printIndividual} />
                    </Box>

                    {/* Report Count Bar Chart */}
                    <Box
                        gridColumn="span 6"
                        gridRow="span 1"
                        sx={{ mt: "-15px", height: "200px", color: "black", border: "1px solid black", overflow: 'hidden' }}
                        className="avoid-break"
                    >
                        <PerformanceReportBarChart responses={printResponses} filters={printReadyFilters} theme={theme} />
                    </Box>

                    {/* Report Count Summary */}
                    <Box
                        gridColumn="span 6"
                        gridRow="span 1"
                        sx={{ overflow: 'hidden' }}
                        className="avoid-break"
                    >
                        <PerformanceReportSummary responses={printResponses} filters={printReadyFilters} />
                    </Box>
                </Box>
            </Box>

            {/* Page 3 */}
            <Box
                ref={page3Ref}
                className="page page3-print-align"
                display="flex"
                flexDirection="column"
                alignItems="center"
                sx={{ width: "650px", height: "900px", bgcolor: '#fff', padding: 3 }}
            >
                {/* Grid */}
                <Box
                    display="grid"
                    gridTemplateColumns="repeat(6, 1fr)"
                    gridAutoRows="auto"
                    gap="5px"
                    sx={{ width: "100%", overflow: 'hidden' }}
                >
                    {/* Response By Hour Bar Chart */}
                    <Box
                        gridColumn="span 6"
                        gridRow="span 1"
                        sx={{ height: "200px", color: "black", border: "1px solid black", overflow: 'hidden' }}
                        className="avoid-break"
                    >
                        <PerformanceHourBarChart responses={printResponses} filters={printReadyFilters} theme={theme} />
                    </Box>

                    {/* Response By Hour Summary */}
                    <Box
                        gridColumn="span 6"
                        gridRow="span 1"
                        sx={{ overflow: 'hidden', mb: 1 }}
                        className="avoid-break"
                    >
                        <PerformanceHourSummary responses={printResponses} filters={printReadyFilters} />
                    </Box>

                    {/* Fastest Resolve Time */}
                    <Box
                        gridColumn="span 2"
                        gridRow="span 1"
                        sx={{ color: "black", border: "1px solid black", overflow: 'hidden' }}
                        flexDirection="column"
                        alignItems="center"
                        justifyContent="center"
                        className="avoid-break"
                    >
                        <Typography
                            variant="h4"
                            fontWeight="600"
                            color="#000"
                            textAlign="center"
                            width="100%"
                        >
                            {printResponseTime.fastestResolve ? printResponseTime.fastestResolve.resolveTimeFormatted : '0 mins'}
                        </Typography>
                        <Typography width="100%" variant="h6" textAlign="center" fontWeight="400" color="#000">
                            {"Fastest Resolve Time"}
                        </Typography>
                    </Box>

                    {/* Slowest Resolve Time */}
                    <Box
                        gridColumn="span 2"
                        gridRow="span 1"
                        sx={{ color: "black", border: "1px solid black", overflow: 'hidden' }}
                        flexDirection="column"
                        alignItems="center"
                        justifyContent="center"
                        className="avoid-break"
                    >
                        <Typography
                            variant="h4"
                            fontWeight="600"
                            color="#000"
                            textAlign="center"
                            width="100%"
                        >
                            {printResponseTime.slowestResolve ? printResponseTime.slowestResolve.resolveTimeFormatted : '0 mins'}
                        </Typography>
                        <Typography width="100%" variant="h6" textAlign="center" fontWeight="400" color="#000">
                            {"Slowest Resolve Time"}
                        </Typography>
                    </Box>

                    {/* Average Resolve Time */}
                    <Box
                        gridColumn="span 2"
                        gridRow="span 1"
                        sx={{ color: "black", border: "1px solid black", overflow: 'hidden' }}
                        display="flex"
                        flexDirection="column"
                        alignItems="center"
                        justifyContent="center"
                        className="avoid-break"
                    >
                        <Typography
                            variant="h4"
                            fontWeight="600"
                            color="#000"
                            textAlign="center"
                            width="100%"
                        >
                            {printResponseTime.averageResolveTimeFormatted || '0 mins'}
                        </Typography>
                        <Typography width="100%" variant="h6" textAlign="center" fontWeight="400" color="#000">
                            {"Average Resolve Time"}
                        </Typography>
                    </Box>

                    {/* Response Time Line Chart */}
                    <Box
                        gridColumn="span 6"
                        gridRow="span 1"
                        sx={{ height: "250px", color: "black", border: "1px solid black", overflow: 'hidden', mt: 1 }}
                        className="avoid-break"
                    >
                        <PerformanceResolvedLineChart responses={printResponses} filters={printReadyFilters} />
                    </Box>

                    {/* Response Time Summary */}
                    <Box
                        gridColumn="span 6"
                        gridRow="span 1"
                        sx={{ overflow: 'hidden' }}
                        className="avoid-break"
                    >
                        <PerformanceResolvedSummary responses={printResponses} filters={printReadyFilters} user={printIndividual} />
                    </Box>
                </Box>
            </Box>
        </Box>
    );
};

export default PerformanceForm;