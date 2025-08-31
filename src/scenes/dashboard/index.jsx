// React & Hooks
import { useState, useEffect, useContext, useRef } from "react";

import { Box, Button, Dialog, DialogContent, IconButton, Typography, TextField, InputAdornment, Tooltip, FormControl, InputLabel, Select, MenuItem, useTheme } from "@mui/material";
import { tokens } from "../../theme";

// Data & Context  
import { DataContext } from "../../data";

// MUI Icons  
import ToggleOffOutlinedIcon from '@mui/icons-material/ToggleOffOutlined';  
import ToggleOnOutlinedIcon from '@mui/icons-material/ToggleOnOutlined';
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import ArchiveIcon from '@mui/icons-material/Archive';
import FireTruckIcon from '@mui/icons-material/FireTruck';
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import AddLocationAltIcon from '@mui/icons-material/AddLocationAlt';
import FilterListIcon from '@mui/icons-material/FilterList';
import SearchIcon from '@mui/icons-material/Search';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import PrintIcon from '@mui/icons-material/Print';
import ClearIcon from '@mui/icons-material/Clear';

import { db } from "../../config/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";

import html2canvas from "html2canvas";
import { saveAs } from "file-saver";
import html2pdf from 'html2pdf.js/dist/html2pdf.min.js';

import Header from "../../components/Header";
import LineChart from "../../components/LineChart";
//import GeographyChart from "../../components/GeographyChart";
import BarChart from "../../components/BarChart";
import StatBox from "../../components/StatBox";
import ProgressCircle from "../../components/ProgressCircle";
import OverallForm from "../../components/OverallForm";

import FilterPrint from "../../components/FilterPrint";
import PerformanceForm from "../../components/PerformanceForm";

const Dashboard = () => {
    const { 
            records, reports, responds, startMetadataListener, stopMetadataListener,
            startResponsesListener, stopResponsesListener,
            startReportsListener, stopReportsListener,
            resetDailyCount, resetWeeklyCount, resetMonthlyCount, 
            resetQuarterlyCount, resetYearlyCount, 
            updateWeeklyCount, updateMonthlyCount, updatePreMonthlyCount, updateQuarterlyCount, updateGlobalCount
        } = useContext(DataContext); // Reports and listeners
    
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    const chartRef = useRef(null); // Line Chart Reference
    const summaryOverallRef = useRef(null); // Overall Summary Pages Reference 
    const overallTitleRef = useRef(null); // Overall Title Page Reference
    const responseBarangayRef = useRef(null); // Overall Response Time Page Reference
    const barBarangayRef = useRef(null); // Overall Response Per Barangay Page Reference

    const [isPrinting, setPrinting] = useState(false); // If the user is Printing
    const [isListening, setIsListening] = useState(false); // If the Table has Real-time updates
    const [filterVisible, setFilterVisible] = useState(false); // Filter User Dialog State

    const [performanceFilter, setPerformanceFilter] = useState({ primary: "", secondary: "" });
    const [printPerformance, setPrintPerformance] = useState(false);
    const [printResponseTime, setPrintResponseTime] = useState(null);
    const [printResponses, setPrintResponses] = useState(null);
    const [printIndividual, setPrintIndividual] = useState(null);

    const summaryPerformanceRef = useRef(null); // Performance Pages Reference 
    const performanceRTRef = useRef(null); // Response Time Performance Page Reference
    const performanceStatRef = useRef(null); // Response Time Statistics Performance Page Reference
    const resolvedStatRef = useRef(null); // Resolved Time Statistics Page Reference

    const [expandTools, setExpandTool] = useState({
        responsePrint: false,
        responseFilter: false,
        responseSearch: false
    });

    const [searchQuery, setSearchQuery] = useState("");

    const [currentReports, setCurrentReports] = useState({
        today: 0,
        total: 0,
        weekly: 0,
        monthly: 0,
        progress: 0,
        increase: "0%",
    });

    const [responses, setResponses] = useState({
        today: 0,
        total: 0,
        weekly: 0,
        monthly: 0,
        progress: 0,
        increase: "0%",
    });

    const [users, setUsers] = useState({
        today: 0,
        total: 0,
        weekly: 0,
        monthly: 0,
        progress: 0,
        increase: "0%",
    });

    const [stations, setStations] = useState({
        today: 0,
        total: 0,
        weekly: 0,
        monthly: 0,
        progress: 0,
        increase: "0%",
    });
    
    // Routes and Credits State
    const [routes, setRoutes] = useState({
        today: 0,
        total: 0,
        weekly: 0,
        monthly: 0,
        progress: 0,
        increase: "0%",
    });

    const [credits, setCredits] = useState({
        today: 0,
        total: 0,
        weekly: 0,
        monthly: 0,
        progress: 0,
        increase: "0%",
    });

    // Filters for Tabs
    const [filters, setFilters] = useState({
        global: { primary: '', secondary: '' },
        response: { primary: 'weekly', secondary: '' },
        bar: { primary: 'weekly', secondary: '' },
        credits: { primary: 'daily', secondary: '' },
    });

    const [availablePeriods, setAvailablePeriods] = useState({
        global: [],
        response: [],
        bar: [],
        credits: [],
    });

    // Call Update on Daily Count, Weekly and Global Updates
    useEffect(() => {
        let morningTimeout = null;
        let eveningTimeout = null;
        let dailyInterval = null;
        let globalInterval = null;
        let nextGlobalUpdate = null; // Track next global update time

        const now = new Date();
        const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    
        if (isListening) {
            // ✅ Helper to check if the need to reset daily count
            const checkAndResetIfOverdue = async () => {
                try {
                    const dailyRef = doc(db, "metadata", "daily", "records", today);
                    const dailyDoc = await getDoc(dailyRef);
    
                    if (!dailyDoc.exists()) {
                        console.warn(`📅 No daily record found for ${today} — Resetting now.`);
                        await resetDailyCount();
                        console.log("✅ Daily count reset on overdue check.");
                    } else {
                        console.log(`✅ Daily record for ${today} exists.`);
                    }
                } catch (error) {
                    console.error("❌ Error during overdue daily check:", error);
                }
            };

            // 
            const checkAndResetWeeklyOverdue = async () => {
                try {
                    const currentWeek = getCurrentWeek();
                    const weeklyRef = doc(db, "metadata", "weekly", "records", currentWeek);
                    const weeklyDoc = await getDoc(weeklyRef);

                    if (!weeklyDoc.exists()) {
                        console.warn(`📆 No weekly record found for ${currentWeek} — Resetting now.`);
                        await resetWeeklyCount();
                        console.log("✅ Weekly count reset.");
                    } else {
                        console.log(`✅ Weekly record for ${currentWeek} exists. No reset needed.`);
                    }
                } catch (error) {
                    console.error("❌ Error during overdue weekly check:", error);
                }
            }

            // ✅ Helper to check if the current time is 6:00 AM or 6:00 PM
            const isRightTime = () => {
                const now = new Date();
                const currentHour = now.getHours();
                return currentHour === 6 || currentHour === 18;
            };
    
            const checkAndUpdateDaily = async () => {
                if (!isRightTime()) {
                    console.log(`⏩ Skipping daily update — Not the right time (${new Date().toLocaleTimeString()})`);
                    return;
                }
                try {
                    console.log(`⏰ Running daily updates for ${new Date().getHours() === 6 ? "6:00 AM" : "6:00 PM"}`);
                    await resetDailyCount();
                    await resetWeeklyCount();
                    await updateWeeklyCount();
                    console.log("✅ Daily and Weekly counts updated.");
                } catch (error) {
                    console.error("❌ Error during daily check:", error);
                }
            };
    
            // ✅ Helper to get the next occurrence of a given hour
            const getNextOccurrence = (hour) => {
                const now = new Date();
                const next = new Date();
                next.setHours(hour, 0, 0, 0);
                if (now >= next) {
                    next.setDate(next.getDate() + 1);
                }
                return next.getTime() - now.getTime();
            };
    
            // ✅ Function to get the next hourly occurrence based on last global update
            const getNextHourlyOccurrence = (lastUpdate) => {
                const now = new Date();
                const nextHour = new Date(lastUpdate);
                nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0);
                return Math.max(0, nextHour.getTime() - now.getTime());
            };
    
            const checkAndUpdateGlobal = async () => {
                try {
                    const globalRef = doc(db, "metadata", "global");
                    const globalDoc = await getDoc(globalRef);
    
                    if (globalDoc.exists()) {
                        const lastUpdate = globalDoc.data()?.updated_at?.toDate?.() || new Date();
                        const nextUpdateIn = getNextHourlyOccurrence(lastUpdate);
    
                        nextGlobalUpdate = Date.now() + nextUpdateIn; // Store next update time
    
                        console.log(`⏰ Next global update in ${Math.round(nextUpdateIn / (1000 * 60))} minutes`);
    
                        // Set timeout for next global update
                        setTimeout(async () => {
                            console.log("⏳ Running hourly global update...");
                            await updateGlobalCount();
                            console.log("✅ Global count updated.");
                            nextGlobalUpdate = Date.now() + 60 * 60 * 1000; // Set next hour
                        }, nextUpdateIn);
                    } else {
                        console.warn("⚠️ No global_count document found.");
                    }
                } catch (error) {
                    console.error("❌ Error during global check:", error);
                }
            };
    
            // ✅ Ensure it also runs if tab is reopened but only if update is overdue
            const handleVisibilityChange = () => {
                const now = Date.now();
                if (document.visibilityState === "visible") {
                    console.log("👁️ Tab became visible — Checking for overdue updates...");
                    
                    // Check for global update
                    if (now >= nextGlobalUpdate) {
                        console.log("⏳ Overdue global update found — Running now.");
                        checkAndUpdateGlobal();
                    } else if (isRightTime()) {
                        console.log("⏳ Overdue daily update found — Running now.");
                        checkAndUpdateDaily();
                    } else {
                        console.log("👁️ No update needed.");
                    }
                }
            };

            // ✅ Check if daily count is overdue on mount
            checkAndResetIfOverdue();

            // ✅ Check if weekly count is overdue on mount
            checkAndResetWeeklyOverdue();
    
            // ✅ Set timeouts for 6 AM and 6 PM
            morningTimeout = setTimeout(() => {
                checkAndUpdateDaily(); // Run at 6:00 AM
                dailyInterval = setInterval(checkAndUpdateDaily, 12 * 60 * 60 * 1000); // Every 12 hours
            }, getNextOccurrence(6));
    
            eveningTimeout = setTimeout(() => {
                checkAndUpdateDaily(); // Run at 6:00 PM
                if (!dailyInterval) {
                    dailyInterval = setInterval(checkAndUpdateDaily, 12 * 60 * 60 * 1000); // Every 12 hours
                }
            }, getNextOccurrence(18));
    
            // ✅ Start the global hourly check
            checkAndUpdateGlobal();
            globalInterval = setInterval(checkAndUpdateGlobal, 60 * 60 * 1000); // Fallback every hour
    
            document.addEventListener("visibilitychange", handleVisibilityChange);
    
            // ✅ Cleanup on unmount
            return () => {
                clearTimeout(morningTimeout);
                clearTimeout(eveningTimeout);
                clearInterval(dailyInterval);
                clearInterval(globalInterval);
                document.removeEventListener("visibilitychange", handleVisibilityChange);
            };
        }
    }, [isListening, resetDailyCount, resetWeeklyCount, updateWeeklyCount, updateGlobalCount]);

    // Pre-Monthly Updates (10th, 20th, End of Month)
    useEffect(() => {
        if (!isListening) return;
      
        const today = new Date();
        const day = today.getDate();
        const month = today.getMonth();
        const year = today.getFullYear();
        
        // Format current month as YYYY-MM
        const currentMonth = `${year}-${String(month + 1).padStart(2, "0")}`;
        
        // Check if updates should run today
        const isDay10 = day === 10;
        const isDay20 = day === 20;
        const isLastDayOfMonth = day === new Date(year, month + 1, 0).getDate();
        
        // Helper function to check if an update is overdue
        const checkIfUpdateOverdue = async () => {
          try {
            const monthlyRef = doc(db, "metadata", "monthly", "records", currentMonth);
            const monthlyDoc = await getDoc(monthlyRef);
            
            if (!monthlyDoc.exists()) {
              // No document exists yet for this month
              return true;
            }
            
            const lastUpdateDate = monthlyDoc.data()?.date?.toDate?.() || new Date(0);
            const daysSinceLastUpdate = Math.floor((today - lastUpdateDate) / (1000 * 60 * 60 * 24));
            
            // If last update was more than 7 days ago, consider it overdue
            return daysSinceLastUpdate > 7;
          } catch (error) {
            console.error("❌ Error checking overdue status:", error);
            return false; // Assume not overdue in case of error
          }
        };
        
        // Check if we should run the update for a specific period
        const shouldRunPeriodUpdate = async (periodType) => {
          try {
            // Get the monthly document
            const monthlyRef = doc(db, "metadata", "monthly", "records", currentMonth);
            const monthlyDoc = await getDoc(monthlyRef);
            
            // Get the relevant "processed" flag based on period
            let processedFlag;
            if (periodType === "period1") processedFlag = "p1_processed";
            else if (periodType === "period2") processedFlag = "p2_processed";
            else if (periodType === "period3") processedFlag = "p3_processed";
            
            // If document doesn't exist or period not yet processed, we should run the update
            if (!monthlyDoc.exists() || monthlyDoc.data()[processedFlag] !== true) {
              return true;
            }
            
            return false;
          } catch (error) {
            console.error(`❌ Error checking if period ${periodType} should run:`, error);
            return false;
          }
        };
        
        const runPreMonthlyUpdates = async () => {
          try {
            console.log("⏳ Checking for pre-monthly updates...");
            const isUpdateOverdue = await checkIfUpdateOverdue();
            
            // Period 1 update (days 1-10)
            if (isDay10 || (day > 10 && day <= 20 && isUpdateOverdue)) {
              const shouldRun = await shouldRunPeriodUpdate("period1");
              if (shouldRun) {
                console.log("⏳ Running update for days 1-10...");
                await updatePreMonthlyCount("period1");
              } else {
                console.log("⏭️ Period 1 already processed for this month. Skipping.");
              }
            }
            
            // Period 2 update (days 11-20)
            if (isDay20 || (day > 20 && isUpdateOverdue)) {
              const shouldRun = await shouldRunPeriodUpdate("period2");
              if (shouldRun) {
                console.log("⏳ Running update for days 11-20...");
                await updatePreMonthlyCount("period2");
              } else {
                console.log("⏭️ Period 2 already processed for this month. Skipping.");
              }
            }
            
            // Period 3 update (days 21-end)
            if (isLastDayOfMonth || (day === 1 && month > 0 && isUpdateOverdue)) {
              const shouldRun = await shouldRunPeriodUpdate("period3");
              if (shouldRun) {
                console.log("⏳ Running update for days 21-end of month...");
                await updatePreMonthlyCount("period3");
              } else {
                console.log("⏭️ Period 3 already processed for this month. Skipping.");
              }
            }
            
            console.log("✅ Pre-monthly updates check completed.");
          } catch (error) {
            console.error("❌ Error during pre-monthly updates:", error);
          }
        };
        
        // Run updates check on mount
        runPreMonthlyUpdates();
        
        // Also check when tab becomes visible
        const handleVisibilityChange = () => {
          if (document.visibilityState === "visible") {
            console.log("👁️ Tab became visible — Checking for pre-monthly updates...");
            runPreMonthlyUpdates();
          }
        };
        
        document.addEventListener("visibilitychange", handleVisibilityChange);
        
        return () => {
          document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, [isListening, updatePreMonthlyCount]);

    // Weekly Update
    useEffect(() => {
        if (!isListening) return;
    
        const today = new Date();
        const isEndOfWeek = today.getDay() === 0; // Sunday
    
        const checkWeeklyUpdate = async () => {
            try {
                if (isEndOfWeek) {
                    await updateWeeklyCount();
                    console.log("✅ Weekly counts updated.");
                }
            } catch (error) {
                console.error("❌ Error during weekly update:", error);
            }
        };
    
        checkWeeklyUpdate();
    
        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible") {
                checkWeeklyUpdate();
            }
        };
    
        document.addEventListener("visibilitychange", handleVisibilityChange);
    
        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, [isListening, updateWeeklyCount]);    

    // Monthly, Quarterly Update & Reset, and Yearly Reset
    useEffect(() => {
        if (!isListening) return;
    
        const today = new Date();
        const month = today.getMonth(); // 0 = Jan
        const day = today.getDate(); // 1 - 31
    
        // Format today's date as YYYY-MM-DD
        const todayString = today.toISOString().split('T')[0];
    
        const checkPeriodicResets = async () => {
            try {
                const lastRun = localStorage.getItem("lastPeriodicReset");
    
                // Run only if last run is not today
                if (lastRun !== todayString) {
                    console.log("⏳ Running daily periodic resets...");
    
                    if (day === 1) {
                        await updateMonthlyCount();
                        await resetMonthlyCount();
                        await updateQuarterlyCount();
                    }
                    if ((month % 3 === 0) && day === 1) {
                        await resetQuarterlyCount();
                    }
                    if (month === 0 && day === 1) {
                        await resetYearlyCount();
                    }
    
                    // Save today's date as last execution
                    localStorage.setItem("lastPeriodicReset", todayString);
                    console.log("✅ Periodic resets completed for", todayString);
                } else {
                    console.log("⏭ Already executed today. Skipping.");
                }
            } catch (error) {
                console.error("❌ Error during periodic check:", error);
            }
        };
    
        checkPeriodicResets();
    
        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible") {
                checkPeriodicResets();
            }
        };
    
        document.addEventListener("visibilitychange", handleVisibilityChange);
    
        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, [isListening, updateQuarterlyCount, updateMonthlyCount, resetMonthlyCount, resetQuarterlyCount, resetYearlyCount]);    

    // Toggle Real-time Listener
    const handleToggleListener = () => {
        if (isListening) {
            stopMetadataListener();
            stopResponsesListener();
            stopReportsListener();
        } else {
            startMetadataListener();
            startResponsesListener();
            startReportsListener();
        }
        setIsListening(!isListening);
    };
    
    // Retriving Total and Daily Count, Progress (.) and Increase (%)
    useEffect(() => {
        if (!records) return;
    
        // Define limits for each category
        const dailyLimit = 15000; // Credits limit for routes
        const dailyLimits = {
            reports: 100,
            responses: 100,
            users: 175,
            stations: 30,
        };
        const LIMITS = {
            routes: dailyLimit
        };
    
        // Get current and previous dates
        const today = new Date();
        const currentDate = getCurrentDate();
        const currentWeek = getCurrentWeek();
        const currentMonth = getCurrentMonth();
        const currentQuarter = `2025-Q${Math.ceil((today.getMonth() + 1) / 3)}`; // e.g., 2025-Q1

        // Destructure filters
        const { primary: globalPrimary, secondary: globalSecondary } = filters.global;
        const { primary: creditsPrimary, secondary: creditsSecondary } = filters.credits;

        // Use raw secondary key directly
        const creditsKey = creditsSecondary || 
            (creditsPrimary === 'weekly' ? currentWeek
                : creditsPrimary === 'monthly' ? currentMonth
                : creditsPrimary === 'quarterly' ? currentQuarter
                : currentDate
            );

        // Define globalKey based on primary & secondary selection
        const globalKey =
        globalSecondary || // Prioritize user selection
        (globalPrimary === "weekly" ? currentWeek
            : globalPrimary === "monthly" ? currentMonth
            : globalPrimary === "quarterly" ? currentQuarter
            : currentDate); // Fallback to daily
    
        // Extract daily counts
        const todayCounts = {
            reports: records?.daily?.[globalKey]?.reports || 0,
            responses: records?.daily?.[globalKey]?.responses || 0,
            users: records?.daily?.[globalKey]?.users || 0,
            stations: records?.daily?.[globalKey]?.stations || 0,
            routes: records?.daily?.[globalKey]?.routes || records?.daily?.[creditsKey]?.routes || 0,
            credits: records?.daily?.[globalKey]?.credits || records?.daily?.[creditsKey]?.credits || 0,
        };
    
        // Extract global counts
        const totalCounts = {
            reports: records?.global?.reports || 0,
            responses: records?.global?.responses || 0,
            users: records?.global?.users || 0,
            stations: records?.global?.stations || 0,
            routes: records?.global?.routes || 0,
            credits: records?.global?.credits || 0,
        };

        // Extract weekly counts
        const weeklyCounts = {
            reports: records?.weekly?.[globalKey]?.reports || 0,
            responses: records?.weekly?.[globalKey]?.responses || 0,
            users: records?.weekly?.[globalKey]?.users || 0,
            stations: records?.weekly?.[globalKey]?.stations || 0,
            routes: records?.weekly?.[globalKey]?.routes || records?.weekly?.[creditsKey]?.routes || 0,
            credits: records?.weekly?.[globalKey]?.credits || records?.weekly?.[creditsKey]?.credits || 0,
        };

        // Extract monthly counts
        const monthlyCounts = {
            reports: records?.monthly?.[globalKey]?.reports || 0,
            responses: records?.monthly?.[globalKey]?.responses || 0,
            users: records?.monthly?.[globalKey]?.users || 0,
            stations: records?.monthly?.[globalKey]?.stations || 0,
            routes: records?.monthly?.[globalKey]?.routes || records?.monthly?.[creditsKey]?.routes || 0,
            credits: records?.monthly?.[globalKey]?.credits || records?.monthly?.[creditsKey]?.credits || 0,
        };

        // Extract quarterly counts
        const quarterlyCounts = {
            reports: records?.quarterly?.[globalKey]?.reports || 0,
            responses: records?.quarterly?.[globalKey]?.responses || 0,
            users: records?.quarterly?.[globalKey]?.users || 0,
            stations: records?.quarterly?.[globalKey]?.stations || 0,
            routes: records?.quarterly?.[globalKey]?.routes || records?.quarterly?.[creditsKey]?.routes || 0,
            credits: records?.quarterly?.[globalKey]?.credits || records?.quarterly?.[creditsKey]?.credits || 0,
        };

        // Calculate dynamic limits based on filter
        const getLimit = (type) => {
            const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
            const daysInQuarter = daysInMonth * 3;

            switch (globalPrimary) {
                case "daily":
                    return dailyLimits[type];
                case "weekly":
                    return dailyLimits[type] * 7;
                case "monthly":
                    return dailyLimits[type] * daysInMonth;
                case "quarterly":
                    return dailyLimits[type] * daysInQuarter;
                default:
                    return dailyLimits[type];
            }
        };

        // Calculate dynamic limits based on filter
        const getCreditLimit = (type) => {
            const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
            switch (creditsPrimary) {
                case "daily":
                    return LIMITS[type];
                case "weekly":
                    return LIMITS[type] * 7;
                case "monthly":
                    return LIMITS[type] * daysInMonth;
                default:
                    return LIMITS[type];
            }
        };
    
        // Function to calculate progress and increase
        const calculateMetrics = (current, total, limit) => {
            const progress = Math.min(total / limit, 1);
            const increase = `+${Math.round((current / limit) * 100)}%`;
            return { progress, increase };
        };

        // Get limit dynamically based on filter
        const reportsLimit = getLimit("reports");
        const responsesLimit = getLimit("responses");
        const usersLimit = getLimit("users");
        const stationsLimit = 30; // Always 30
        const routesLimit = getCreditLimit("routes");
        const creditsLimit = getCreditLimit("routes"); // Same limit as routes

        const periodCounts = {
            reports:
                globalPrimary === "daily"
                    ? todayCounts.reports
                    : globalPrimary === "weekly"
                    ? weeklyCounts.reports
                    : globalPrimary === "monthly"
                    ? monthlyCounts.reports
                    : quarterlyCounts.reports,
            responses:
                globalPrimary === "daily"
                    ? todayCounts.responses
                    : globalPrimary === "weekly"
                    ? weeklyCounts.responses
                    : globalPrimary === "monthly"
                    ? monthlyCounts.responses
                    : quarterlyCounts.responses,
            users:
                globalPrimary === "daily"
                    ? todayCounts.users
                    : globalPrimary === "weekly"
                    ? weeklyCounts.users
                    : globalPrimary === "monthly"
                    ? monthlyCounts.users
                    : quarterlyCounts.users,
            stations:
                globalPrimary === "daily"
                    ? todayCounts.stations
                    : globalPrimary === "weekly"
                    ? weeklyCounts.stations
                    : globalPrimary === "monthly"
                    ? monthlyCounts.stations
                    : quarterlyCounts.stations,
            routes:
                globalPrimary
                    ? (globalPrimary === "daily"
                        ? todayCounts.routes
                        : globalPrimary === "weekly"
                        ? weeklyCounts.routes
                        : globalPrimary === "monthly"
                        ? monthlyCounts.routes
                        : quarterlyCounts.routes)
                    : (creditsPrimary === "daily"
                        ? todayCounts.routes
                        : creditsPrimary === "weekly"
                        ? weeklyCounts.routes
                        : monthlyCounts.routes),
            
            credits:
                globalPrimary
                    ? (globalPrimary === "daily"
                        ? todayCounts.credits
                        : globalPrimary === "weekly"
                        ? weeklyCounts.credits
                        : globalPrimary === "monthly"
                        ? monthlyCounts.credits
                        : quarterlyCounts.credits)
                    : (creditsPrimary === "daily"
                        ? todayCounts.credits
                        : creditsPrimary === "weekly"
                        ? weeklyCounts.credits
                        : monthlyCounts.credits),                
        };
    
        // Update states
        setCurrentReports({
            today: todayCounts.reports,
            total: totalCounts.reports,
            weekly: weeklyCounts.reports,
            monthly: monthlyCounts.reports,
            quarterly: quarterlyCounts.reports,
            ...calculateMetrics(periodCounts.reports, totalCounts.reports, reportsLimit),
        });
    
        setResponses({
            today: todayCounts.responses,
            total: totalCounts.responses,
            weekly: weeklyCounts.responses,
            monthly: monthlyCounts.responses,
            quarterly: quarterlyCounts.responses,
            ...calculateMetrics(todayCounts.responses, totalCounts.responses, responsesLimit),
        });
    
        setUsers({
            today: todayCounts.users,
            total: totalCounts.users,
            weekly: weeklyCounts.users,
            monthly: monthlyCounts.users,
            quarterly: quarterlyCounts.users,
            ...calculateMetrics(todayCounts.users, totalCounts.users, usersLimit),
        });
    
        setStations({
            today: todayCounts.stations,
            total: totalCounts.stations,
            weekly: weeklyCounts.stations,
            monthly: monthlyCounts.stations,
            quarterly: quarterlyCounts.stations,
            ...calculateMetrics(todayCounts.stations, totalCounts.stations, stationsLimit),
        });

        // Update Routes State
        setRoutes({
            today: todayCounts.routes,
            total: totalCounts.routes,
            weekly: weeklyCounts.routes,
            monthly: monthlyCounts.routes,
            quarterly: quarterlyCounts.routes,
            ...calculateMetrics(periodCounts.routes, totalCounts.routes, routesLimit),
        });

        // Update Credits State
        setCredits({
            today: todayCounts.credits,
            total: totalCounts.credits,
            weekly: weeklyCounts.credits,
            monthly: monthlyCounts.credits,
            quarterly: quarterlyCounts.credits,
            ...calculateMetrics(periodCounts.credits, totalCounts.credits, creditsLimit),
        });
    }, [records, filters]);

    const getSortedPeriods = (items, primary) => {
        const periods = new Set();

        if (!records || !primary) return [];
    
        items.forEach(item => {
            const incidentDate = item?.date?.incident?.toMillis?.();
            if (!incidentDate) return;
            const date = new Date(incidentDate);
    
            if (primary === 'daily') {
                periods.add(date.toISOString().slice(0, 10)); // YYYY-MM-DD
            } 
            else if (primary === 'weekly') {
                const weekNumber = getISOWeekNumber(date);
                periods.add(`Week ${weekNumber}`); // e.g., Week 12
            } 
            else if (primary === 'monthly') {
                const month = date.toLocaleString('default', { month: 'long' });
                periods.add(month); // e.g., March
            } 
            else if (primary === 'quarterly') {
                const quarter = Math.floor((date.getMonth() + 3) / 3);
                periods.add(`Q${quarter}`); // e.g., Q1
            }
        });
    
        // Sort the periods logically
        const sortedPeriods = [...periods].sort((a, b) => {
            if (primary === 'daily') return new Date(a) - new Date(b);
            if (primary === 'weekly') return parseInt(a.split(" ")[1]) - parseInt(b.split(" ")[1]);
            if (primary === 'monthly') return new Date(`1 ${a} 2025`) - new Date(`1 ${b} 2025`);
            if (primary === 'quarterly') return parseInt(a[1]) - parseInt(b[1]);
            return 0;
        });
    
        return sortedPeriods;
    };

    useEffect(() => {
        if ((!responds || responds.length === 0) && (!reports || reports.length === 0)) return;
        const today = new Date();
    
        // Get periods for responses
        const responsePeriods = getSortedPeriods(responds, filters.response.primary);
    
        // Get periods for reports
        const reportPeriods = getSortedPeriods(reports, filters.bar.primary);
    
        setAvailablePeriods({
            response: responsePeriods,
            bar: reportPeriods,
        });
    
        // Set secondary filter for response ONLY if empty
        if (filters.response.primary === 'weekly' && !filters.response.secondary) {
            const currentWeek = `Week ${getISOWeekNumber(today)}`;
            if (responsePeriods.includes(currentWeek)) {
                setFilters(prev => ({
                    ...prev,
                    response: { ...prev.response, secondary: currentWeek },
                }));
            }
        } else if (responsePeriods.length > 0 && !filters.response.secondary) {
            setFilters(prev => ({
                ...prev,
                response: { ...prev.response, secondary: responsePeriods[responsePeriods.length - 1] },
            }));
        }
    
        // Set secondary filter for bar ONLY if empty
        if (filters.bar.primary === 'weekly' && !filters.bar.secondary) {
            const currentWeek = `Week ${getISOWeekNumber(today)}`;
            if (reportPeriods.includes(currentWeek)) {
                setFilters(prev => ({
                    ...prev,
                    bar: { ...prev.bar, secondary: currentWeek },
                }));
            }
        } else if (reportPeriods.length > 0 && !filters.bar.secondary) {
            setFilters(prev => ({
                ...prev,
                bar: { ...prev.bar, secondary: reportPeriods[reportPeriods.length - 1] },
            }));
        }
    // eslint-disable-next-line
    }, [
        filters.response.primary,
        filters.response.secondary,
        filters.bar.primary,
        filters.bar.secondary,
        responds,
        reports,
    ]);

    // Helper function to get periods with existing credits or routes
    const getRecordPeriods = (records, primary) => {
        const periods = [];
        const displayMap = {};

        if (!records || !primary) return { periods: [], displayMap: {} };

        let periodRecords;
        if (primary === 'daily') periodRecords = records.daily;
        if (primary === 'weekly') periodRecords = records.weekly;
        if (primary === 'monthly') periodRecords = records.monthly;
        if (primary === 'quarterly') periodRecords = records.quarterly;

        if (!periodRecords) return { periods: [], displayMap: {} };

        // Iterate through period records
        Object.keys(periodRecords).forEach(period => {
            const hasCredits = periodRecords[period]?.credits > 0;
            const hasRoutes = periodRecords[period]?.routes > 0;

            if (hasCredits || hasRoutes) {
                periods.push(period); // Store raw keys

                // Create a display map for formatting
                if (primary === 'daily') {
                    displayMap[period] = period; // 2025-03-27
                } else if (primary === 'weekly') {
                    const weekNumber = period.split("-W")[1];
                    displayMap[period] = `Week ${weekNumber}`; // Week 12
                } else if (primary === 'monthly') {
                    const [year, month] = period.split("-");
                    const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long' });
                    displayMap[period] = monthName; // March
                } else if (primary === 'quarterly') {
                    displayMap[period] = period.toUpperCase(); // Q1
                }
            }
        });

        // Sort periods logically
        periods.sort((a, b) => {
            if (primary === 'daily') return new Date(a) - new Date(b);
            if (primary === 'weekly') return parseInt(a.split("-W")[1]) - parseInt(b.split("-W")[1]);
            if (primary === 'monthly') return new Date(`1 ${displayMap[a]} 2025`) - new Date(`1 ${displayMap[b]} 2025`);
            if (primary === 'quarterly') return parseInt(a[1]) - parseInt(b[1]);
            return 0;
        });

        return { periods, displayMap };
    };

    // Helper function to get periods with existing global
    const getGlobalPeriods = (records, primary) => {
        const periodsSet = new Set();
        const displayMap = {};
    
        if (!records || !primary) return { periods: [], displayMap: {} };
    
        const types = ['reports', 'responses', 'stations', 'users'];
        types.forEach(type => {
            let periodRecords;
            if (primary === 'daily') periodRecords = records.daily;
            if (primary === 'weekly') periodRecords = records.weekly;
            if (primary === 'monthly') periodRecords = records.monthly;
            if (primary === 'quarterly') periodRecords = records.quarterly;
    
            if (periodRecords) {
                Object.keys(periodRecords).forEach(period => {
                    const hasData = periodRecords[period]?.[type] > 0;
                    if (hasData) {
                        periodsSet.add(period); // Add unique period
                        // Create display map
                        if (primary === 'daily') {
                            displayMap[period] = period; 
                        } else if (primary === 'weekly') {
                            const weekNumber = period.split("-W")[1];
                            displayMap[period] = `Week ${weekNumber}`; 
                        } else if (primary === 'monthly') {
                            const [year, month] = period.split("-");
                            const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long' });
                            displayMap[period] = monthName; 
                        } else if (primary === 'quarterly') {
                            displayMap[period] = period.toUpperCase(); 
                        }
                    }
                });
            }
        });
    
        const periods = Array.from(periodsSet);
        periods.sort((a, b) => {
            if (primary === 'daily') return new Date(a) - new Date(b);
            if (primary === 'weekly') return parseInt(a.split("-W")[1]) - parseInt(b.split("-W")[1]);
            if (primary === 'monthly') return new Date(`1 ${displayMap[a]} 2025`) - new Date(`1 ${displayMap[b]} 2025`);
            if (primary === 'quarterly') return parseInt(a[1]) - parseInt(b[1]);
            return 0;
        });
    
        return { periods, displayMap };
    };    

    // Effect to populate available periods and set default secondary to today if none
    useEffect(() => {
        if (records) {
            const today = new Date();
            const currentDate = getCurrentDate(); // e.g., 2025-03-27
            const currentWeek = `Week ${getISOWeekNumber(today)}`; // e.g., Week 12
            const currentMonth = today.toLocaleString('default', { month: 'long' }); // March
            const currentQuarter = `Q${Math.ceil((today.getMonth() + 1) / 3)}`; // Q1-Q4

            // Determine which filter to process
            const isGlobalActive = !!filters.global.primary;
            const targetFilter = isGlobalActive ? 'global' : 'credits';
            const primaryFilter = filters[targetFilter].primary;
            const secondaryFilter = filters[targetFilter].secondary;

            // Get the appropriate periods and display map
            const { periods, displayMap } = isGlobalActive 
                ? getGlobalPeriods(records, primaryFilter) 
                : getRecordPeriods(records, primaryFilter);

            // Store displayable text instead of raw keys
            setAvailablePeriods(prev => ({
                ...prev,
                [targetFilter]: periods.map(period => ({
                    value: period,
                    label: displayMap[period],
                })),
            }));

            // Automatically set secondary if not set yet
            if (!secondaryFilter) {
                let defaultSecondary = periods.find(period => {
                    if (primaryFilter === "daily") return period === currentDate;
                    if (primaryFilter === "weekly") return displayMap[period] === currentWeek;
                    if (primaryFilter === "monthly") return displayMap[period] === currentMonth;
                    if (primaryFilter === "quarterly") {
                        // Handle the format difference - extract just the quarter part for comparison
                        const quarterPart = period.includes('-Q') ? period.split('-Q')[1] : period;
                        return `Q${quarterPart}` === currentQuarter;
                    }
                    return false;
                });

                defaultSecondary = defaultSecondary || periods.at(-1);

                if (defaultSecondary) {
                    setFilters(prev => ({
                        ...prev,
                        [targetFilter]: { 
                            ...prev[targetFilter], 
                            secondary: defaultSecondary // Raw key
                        },
                    }));
                }
            }
        }
    }, [
        records,
        filters,
        filters.credits.primary, 
        filters.credits.secondary, 
        filters.global.primary, 
        filters.global.secondary,
    ]);

    // Function to calculate average response time of all responses
    const getAverageResponseTime = (responses) => {
        if (!responses || responses.length === 0) {
            console.log("No responses found");
            return 0;
        }

        // Filter responses with valid timestamps
        const validResponses = responses.filter((response) => {
            const hasValidDates = response?.date?.response && response?.date?.arrived;
            if (!hasValidDates) {
                console.log("Found response with invalid dates:", response);
            }
            return hasValidDates;
        });

        console.log("Valid responses with timestamps:", validResponses.length);
        
        if (validResponses.length === 0) {
            console.log("No valid responses with timestamps");
            return 0;
        }

        // Sum of response times
        const totalResponseTime = validResponses.reduce((acc, response) => {
            const responseTimestamp = response.date.response.toMillis();
            const arrivedTimestamp = response.date.arrived.toMillis();
            
            const timeDiff = (arrivedTimestamp - responseTimestamp) / (1000 * 60); // Convert ms to minutes
            return acc + timeDiff;
        }, 0);

        // Calculate and return the average response time
        const averageTime = totalResponseTime / validResponses.length;
        return averageTime.toFixed(1); // 1 decimal place
    };

    const filteredResponses = responds
        .filter(response => {
        const incidentDate = response?.date?.incident?.toMillis?.();
        if (!incidentDate) return false;
        const date = new Date(incidentDate);

        if (filters.response.primary === 'daily') {
            return date.toISOString().slice(0, 10) === filters.response.secondary;
        } 
        else if (filters.response.primary === 'weekly') {
            const week = getISOWeekNumber(date);
            return `Week ${week}` === filters.response.secondary;
        } 
        else if (filters.response.primary === 'monthly') {
            const month = date.toLocaleString('default', { month: 'long' });
            return month === filters.response.secondary;
        } 
        else if (filters.response.primary === 'quarterly') {
            // Correct quarterly calculation: Jan-Mar is Q1, Apr-Jun is Q2, etc.
            const quarter = Math.ceil((date.getMonth() + 1) / 3);
            return `Q${quarter}` === filters.response.secondary;
        }
        return true;
    })
    .sort((a, b) => b.date.incident.toMillis() - a.date.incident.toMillis());

    const filteredReports = reports
        .filter(report => {
            const incidentDate = report?.date?.incident?.toMillis?.();
            if (!incidentDate) return false;
            const date = new Date(incidentDate);

            if (filters.bar.primary === 'daily') {
                return date.toISOString().slice(0, 10) === filters.bar.secondary;
            } 
            else if (filters.bar.primary === 'weekly') {
                const week = getISOWeekNumber(date);
                return `Week ${week}` === filters.bar.secondary;
            } 
            else if (filters.bar.primary === 'monthly') {
                const month = date.toLocaleString('default', { month: 'long' });
                return month === filters.bar.secondary;
            } 
            else if (filters.bar.primary === 'quarterly') {
                const quarter = Math.floor((date.getMonth() + 3) / 3);
                return `Q${quarter}` === filters.bar.secondary;
            }
            return true;
    })
    .sort((a, b) => b.date.incident.toMillis() - a.date.incident.toMillis());

    useEffect(() => {
        if (filters.global.primary) {
            console.log(filters.global);
    
            let adjustedSecondary = filters.global.secondary;
    
            if (filters.global.primary === 'weekly' && filters.global.secondary?.includes('-W')) {
                adjustedSecondary = `Week ${filters.global.secondary.split('-W')[1]}`;
            }
    
            if (filters.global.primary === 'monthly' && filters.global.secondary?.includes('-')) {
                const monthNumber = parseInt(filters.global.secondary.split('-')[1], 10);
                const monthNames = [
                    "January", "February", "March", "April", "May", "June",
                    "July", "August", "September", "October", "November", "December"
                ];
                adjustedSecondary = monthNames[monthNumber - 1] || filters.global.secondary;
            }
            
            // Add handling for quarterly format: convert "2025-Q1" to "Q1"
            if (filters.global.primary === 'quarterly' && filters.global.secondary?.includes('-Q')) {
                adjustedSecondary = `Q${filters.global.secondary.split('-Q')[1]}`;
            }
    
            setFilters(prev => ({
                ...prev,
                response: {
                    primary: filters.global.primary,
                    secondary: adjustedSecondary,
                },
                bar: {
                    primary: filters.global.primary,
                    secondary: adjustedSecondary,
                },
                credits: {
                    primary: filters.global.primary,
                    secondary: filters.global.secondary, // Keep original format for credits
                }
            }));
        }
    }, [filters.global]);

    const downloadChart = async () => {
        if (!chartRef.current) return;
    
        const downloadButton = document.getElementById("download-btn");
    
        // Hide the button
        if (downloadButton) downloadButton.style.display = "none";
    
        setTimeout(async () => {
            const canvas = await html2canvas(chartRef.current, {
                backgroundColor: null, // Keeps original background color
                useCORS: true
            });
    
            // Restore the button after screenshot
            if (downloadButton) downloadButton.style.display = "block";
    
            canvas.toBlob(blob => {
                if (blob) saveAs(blob, "linechart.png");
            });
        }, 100); // Small delay to ensure styles are applied
    };

    const downloadOverallSummary = () => {
        // First set printing to true
        setPrinting(true);
        
        // Use setTimeout to allow React to render the components before proceeding
        setTimeout(() => {
            // Now check if refs are available
            if (!summaryOverallRef.current || !overallTitleRef.current || !responseBarangayRef.current || !barBarangayRef.current) {
                console.error("Refs not ready yet");
                setPrinting(false);
                return;
            }
            
            const style = document.createElement("style");
            style.id = "print-styles";
            style.innerHTML = `
                @media print {
                    /* Basic page setup */
                    .page {
                        width: 900px !important;
                        height: 650px !important;
                        background-color: white !important;
                        page-break-inside: avoid !important;
                        overflow: hidden;
                        box-sizing: border-box;
                        display: flex !important;
                        flex-direction: column !important;
                        margin-top: 0 !important;
                    }
                    
                    /* Only apply page breaks between pages, not after the last one */
                    .page:not(:last-child) {
                        page-break-after: always;
                    }
                    
                    /* Explicitly prevent page break after the last page */
                    .page:last-child {
                        page-break-after: avoid !important;
                    }
                    
                    /* --- Keep your alignment classes --- */
                    .page1-print-align {
                        justify-content: center !important;
                        align-items: center !important;
                        text-align: center !important;
                    }
                    .page2-print-align, .page3-print-align {
                        justify-content: flex-start !important;
                        align-items: center !important;
                    }
                    
                    /* --- Keep body margin reset --- */
                    body {
                        margin: 0 !important;
                    }
                    
                    /* --- Keep nested grid styles --- */
                    .page .MuiBox-root[class*="grid"] {
                        height: auto !important;
                        flex-grow: 1;
                    }
                }
            `;
            document.getElementById("print-styles")?.remove();
            document.head.appendChild(style);
            
            // PDF generation with another timeout to ensure styles are applied
            setTimeout(() => {
                html2pdf()
                    .set({
                        margin: [5, 5],
                        filename: `Summary_${filters?.global?.primary ? getReportTime(filters?.global?.primary, filters?.global?.secondary) : 'Report'}.pdf`,
                        image: { type: "jpeg", quality: 0.98 },
                        html2canvas: {
                            scale: 2,
                            useCORS: true,
                        },
                        jsPDF: { orientation: "landscape", unit: "px", format: [910, 660] },
                        pagebreak: { mode: ['css'], avoid: '.avoid-break' }
                    })
                    .from(summaryOverallRef.current)
                    .save()
                    .then(() => {
                        document.getElementById("print-styles")?.remove();
                        console.log("PDF Generated and styles removed.");
                        // Only set printing to false after PDF generation is complete
                        setPrinting(false);
                    })
                    .catch((error) => {
                        console.error("Error generating PDF:", error);
                        document.getElementById("print-styles")?.remove();
                        setPrinting(false);
                    });
            }, 300);
        }, 500); // Give React time to render
    };

    // Report Title
    const getReportTitle = (primary, secondary) => {
        if (!primary || !secondary) return "Report";
    
        const year = secondary.split("-")[0];
    
        switch (primary) {
        case "daily": {
            const date = new Date(secondary);
            const formattedDate = date.toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
            });
            return `Daily Report for ${formattedDate}`;
        }
        case "weekly": {
            const weekNumber = secondary.split("-W")[1];
            return `Weekly Report for ${weekNumber}th Week of ${year}`;
        }
        case "monthly": {
            const monthNumber = parseInt(secondary.split("-")[1], 10);
            const monthName = new Date(2025, monthNumber - 1, 1).toLocaleDateString("en-US", {
                month: "long",
            });
            return `Monthly Report for ${monthName} ${year}`;
        }
        case "quarterly": {
            const quarter = secondary.split("-Q")[1];
            const quarterName = ["First", "Second", "Third", "Fourth"][quarter - 1];
            return `Quarterly Report for ${quarterName} Quarter of ${year}`;
        }
        case "yearly":
            return `Annual Report for ${secondary}`;
        default:
            return "Report";
        }
    };

    // Report Subtitle
    const getReportSubtitle = (primary) => {
        if (!primary) return "Mayday Summarization of Operations";
    
        switch (primary) {
            case "daily":
                return "Mayday Summarization of Daily Operations";
            case "weekly":
                return "Mayday Summarization of Weekly Operations";
            case "monthly":
                return "Mayday Summarization of Monthly Operations";
            case "quarterly":
                return "Mayday Summarization of Quarterly Operations";
            case "yearly":
                return "Mayday Summarization of Yearly Operations";
            default:
                return "Mayday Summarization of Operations";
        }
    };

    // Report Time
    const getReportTime = (primary, secondary) => {
        if (!primary || !secondary) return "";

        const year = secondary.split("-")[0];

        switch (primary) {
        case "daily": {
            const date = new Date(secondary);
            const formattedDate = date.toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
            });
            return formattedDate; // March 28, 2025
        }
        case "weekly": {
            const weekNumber = secondary.split("-W")[1];
            return `${weekNumber}th Week of ${year}`; // 13th Week of 2025
        }
        case "monthly": {
            const monthNumber = parseInt(secondary.split("-")[1], 10);
            const monthName = new Date(2025, monthNumber - 1, 1).toLocaleDateString("en-US", {
                month: "long",
            });
            return `${monthName} ${year}`; // March 2025
        }
        case "quarterly": {
            const quarter = secondary.split("-Q")[1];
            const quarterName = ["First", "Second", "Third", "Fourth"][quarter - 1];
            return `${quarterName} Quarter of ${year}`; // First Quarter of 2025
        }
        case "yearly":
            return year; // 2025
        default:
            return "";
        }
    };

    // This function will filter responses based on the search query
    const getFilteredData = () => {
        if (!searchQuery.trim()) {
            return filteredResponses; // Return all responses if search is empty
        }
        
        const query = searchQuery.toLowerCase();
        
        return filteredResponses.filter(response => {
        // Extract the searchable fields
        const reportId = (response.report_id || "").toLowerCase();
        const firstName = (response.responder?.name?.first_name || "").toLowerCase();
        const lastName = (response.responder?.name?.last_name || "").toLowerCase();
        const responderName = `${firstName} ${lastName}`.trim();
        
        // Calculate response time
        const responseTimestamp = response?.date?.response?.toMillis?.() || 0;
        const arrivedTimestamp = response?.date?.arrived?.toMillis?.() || 0;
        const timeDiff = ((arrivedTimestamp - responseTimestamp) / (1000 * 60)).toFixed(1);
        
        // Check if any field matches the query
        return reportId.includes(query) || 
                responderName.includes(query) || 
                timeDiff.includes(query);
        });
    };

    // Close Filter Function
    const closeFilter = () => {
        setFilterVisible(false);
        setExpandTool({
            responsePrint: false
        });
    };

    // Use this function to get the data to display
    const displayData = getFilteredData();

    // Print Responder Performance Report
    const handlePrint = (filter, user) => {
        // Make sure we have valid filter data
        if (!filter || !filter.primary || !filter.secondary) {
            console.error("Invalid filter provided to handlePrint", filter);
            return;
        }

        if (!filteredResponses) {
            console.error("No Responses Available", filteredResponses);
            return;
        }
        
        if (user) {
            // Filter responses for this responder
            const userResponses = filteredResponses.filter(response => 
                response.responder?.user_id === (user.user_id || user.id)
            );

            setPrintResponses(userResponses);
            
            // Filter responses by date based on primary and secondary filters
            let filteredForCalculation = [...userResponses];
            
            // Process filter
            const { primary, secondary } = filter;
            
            // Filter responses based on the filter type and value
            filteredForCalculation = userResponses.filter(response => {
                // Verify incident date exists before processing
                if (!response?.date?.incident) {
                    return false;
                }
                
                try {
                // Convert Firebase timestamp to JavaScript Date
                let incidentDate;
                
                // Handle different timestamp formats
                if (response.date.incident.toMillis) {
                    // Firebase Timestamp object
                    incidentDate = new Date(response.date.incident.toMillis());
                } else if (typeof response.date.incident === 'object' && 'seconds' in response.date.incident) {
                    // Firestore Timestamp object format
                    incidentDate = new Date(response.date.incident.seconds * 1000 + (response.date.incident.nanoseconds || 0) / 1000000);
                } else if (typeof response.date.incident === 'number') {
                    // Unix timestamp in milliseconds
                    incidentDate = new Date(response.date.incident);
                } else if (typeof response.date.incident === 'string') {
                    // String timestamp that can be parsed
                    incidentDate = new Date(response.date.incident);
                } else {
                    return false;
                }
                
                if (isNaN(incidentDate.getTime())) {
                    return false;
                }
                
                const incidentYear = incidentDate.getFullYear();
                const incidentMonth = incidentDate.getMonth() + 1; // JavaScript months are 0-indexed
                const incidentDay = incidentDate.getDate();
                const incidentWeek = getISOWeekNumber(incidentDate);
                const incidentQuarter = Math.ceil(incidentMonth / 3);
                
                switch (primary) {
                    case "daily": 
                    // Format: YYYY-MM-DD
                    const dailyFormat = `${incidentYear}-${String(incidentMonth).padStart(2, '0')}-${String(incidentDay).padStart(2, '0')}`;
                    return dailyFormat === secondary;
                    
                    case "weekly":
                    // Format: YYYY-WX
                    const weeklyFormat = `${incidentYear}-W${incidentWeek}`;
                    return weeklyFormat === secondary;
                    
                    case "monthly":
                    // Format: YYYY-MM
                    const monthlyFormat = `${incidentYear}-${String(incidentMonth).padStart(2, '0')}`;
                    return monthlyFormat === secondary;
                    
                    case "quarterly":
                    // Format: YYYY-QX
                    const quarterlyFormat = `${incidentYear}-Q${incidentQuarter}`;
                    return quarterlyFormat === secondary;
                    
                    case "yearly":
                    // Format: YYYY
                    return incidentYear.toString() === secondary;
                    
                    default:
                    return false;
                }
                } catch (error) {
                console.error("Error filtering response:", error);
                return false;
                }
            });
            
            // Calculate response times and adherence to estimated times
            const responsesWithTimes = filteredForCalculation.map(response => {
                try {
                // Extract timestamps with error handling
                const responseTime = response?.date?.response ? new Date(response.date.response.toMillis()) : null;
                const arrivedTime = response?.date?.arrived ? new Date(response.date.arrived.toMillis()) : null;
                const estimatedTime = response?.date?.estimated ? new Date(response.date.estimated.toMillis()) : null;
                const resolvedTime = response?.date?.resolved ? new Date(response.date.resolved.toMillis()) : null;
                
                // Skip if missing critical timing data
                if (!responseTime || !arrivedTime) {
                    return { ...response, actualResponseTime: null, adherenceRatio: null, resolveTime: null };
                }
                
                // Calculate actual response time in minutes (rounded to 2 decimal places)
                const actualResponseTime = Math.round(((arrivedTime.getTime() - responseTime.getTime()) / (1000 * 60)) * 100) / 100;
                
                // Calculate estimated time (or use default 7 minutes)
                let expectedResponseTime;
                if (estimatedTime) {
                    expectedResponseTime = Math.round(((estimatedTime.getTime() - responseTime.getTime()) / (1000 * 60)) * 100) / 100;
                } else {
                    expectedResponseTime = 7; // Default ETA in minutes
                }
                
                // Calculate adherence ratio (actual/expected)
                // Values > 1 mean slower than expected, < 1 mean faster than expected
                const adherenceRatio = actualResponseTime / expectedResponseTime;
                
                // Calculate resolve time (time between arrival and resolution) in hours
                let resolveTime = null;
                let resolveTimeInMinutes = null;
                let resolveTimeFormatted = null;
                
                if (resolvedTime && arrivedTime) {
                    // Calculate in minutes first for accurate sorting
                    resolveTimeInMinutes = Math.round(((resolvedTime.getTime() - arrivedTime.getTime()) / (1000 * 60)) * 100) / 100;
                    
                    // Format for display - handle days, hours, minutes based on duration
                    if (resolveTimeInMinutes >= 1440) { // More than 24 hours (1 day)
                        const days = Math.floor(resolveTimeInMinutes / 1440);
                        const remainingMinutes = resolveTimeInMinutes % 1440;
                        const hours = Math.floor(remainingMinutes / 60);
                        const minutes = Math.round(remainingMinutes % 60);
                        
                        // Format with days, hours, minutes
                        resolveTimeFormatted = `${days}d ${hours}h ${minutes}m`;
                        
                        // Also store in hours for calculations (with 2 decimal precision)
                        resolveTime = Math.round((resolveTimeInMinutes / 60) * 100) / 100;
                    }
                    else if (resolveTimeInMinutes >= 60) { // More than 1 hour but less than 1 day
                        const hours = Math.floor(resolveTimeInMinutes / 60);
                        const minutes = Math.round(resolveTimeInMinutes % 60);
                        resolveTimeFormatted = `${hours}h ${minutes}m`;
                        resolveTime = Math.round((resolveTimeInMinutes / 60) * 100) / 100;
                    } else { // Less than 1 hour
                        resolveTimeFormatted = `${resolveTimeInMinutes} mins`;
                        resolveTime = resolveTimeInMinutes / 60; // Convert to hours for calculations
                    }
                }
                
                // Return enhanced response object
                return {
                    ...response,
                    actualResponseTime,
                    expectedResponseTime,
                    adherenceRatio,
                    diffFromExpected: Math.round((actualResponseTime - expectedResponseTime) * 100) / 100,
                    resolveTime,
                    resolveTimeInMinutes,
                    resolveTimeFormatted
                };
                } catch (error) {
                console.error("Error calculating response metrics:", error);
                return { 
                    ...response, 
                    actualResponseTime: null, 
                    adherenceRatio: null, 
                    resolveTime: null,
                    resolveTimeInMinutes: null,
                    resolveTimeFormatted: null
                };
                }
            }).filter(response => response.actualResponseTime !== null);
            
            // Calculate average response time (rounded to 2 decimal places)
            const validResponseTimes = responsesWithTimes.map(r => r.actualResponseTime).filter(time => time !== null);
            const averageResponseTime = validResponseTimes.length > 0 
                ? Math.round((validResponseTimes.reduce((sum, time) => sum + time, 0) / validResponseTimes.length) * 100) / 100
                : 0;
            
            // Calculate resolve time metrics
            const validResolveTimes = responsesWithTimes
                .map(r => r.resolveTimeInMinutes)
                .filter(time => time !== null && time !== undefined);
            
            // Calculate average resolve time in minutes first
            const averageResolveTimeInMinutes = validResolveTimes.length > 0
                ? Math.round((validResolveTimes.reduce((sum, time) => sum + time, 0) / validResolveTimes.length) * 100) / 100
                : 0;
            
            // Format average resolve time for display with days support
            let averageResolveTimeFormatted;
            if (averageResolveTimeInMinutes >= 1440) { // More than 24 hours
                const days = Math.floor(averageResolveTimeInMinutes / 1440);
                const remainingMinutes = averageResolveTimeInMinutes % 1440;
                const hours = Math.floor(remainingMinutes / 60);
                const minutes = Math.round(remainingMinutes % 60);
                averageResolveTimeFormatted = `${days}d ${hours}h ${minutes}m`;
            } else if (averageResolveTimeInMinutes >= 60) { // Between 1 hour and 24 hours
                const hours = Math.floor(averageResolveTimeInMinutes / 60);
                const minutes = Math.round(averageResolveTimeInMinutes % 60);
                averageResolveTimeFormatted = `${hours}h ${minutes}m`;
            } else { // Less than 1 hour
                averageResolveTimeFormatted = `${averageResolveTimeInMinutes} mins`;
            }
            
            // Sort responses from fastest to slowest compared to estimated time
            const sortedResponses = [...responsesWithTimes].sort((a, b) => a.adherenceRatio - b.adherenceRatio);
            
            // Sort responses by resolve time for fastest/slowest calculations
            const resolveTimeSorted = [...responsesWithTimes]
                .filter(r => r.resolveTimeInMinutes !== null && r.resolveTimeInMinutes !== undefined)
                .sort((a, b) => a.resolveTimeInMinutes - b.resolveTimeInMinutes);
            
            // Get fastest and slowest resolve times
            const fastestResolve = resolveTimeSorted.length > 0 ? resolveTimeSorted[0] : null;
            const slowestResolve = resolveTimeSorted.length > 0 ? resolveTimeSorted[resolveTimeSorted.length - 1] : null;
            
            // Store calculated response time data
            setPrintResponseTime({
                responses: sortedResponses,
                average: averageResponseTime,
                fastest: sortedResponses.length > 0 ? sortedResponses[0] : null,
                slowest: sortedResponses.length > 0 ? sortedResponses[sortedResponses.length - 1] : null,
                totalResponses: sortedResponses.length,
                // Add resolve time data
                averageResolveTime: averageResolveTimeInMinutes,
                averageResolveTimeFormatted: averageResolveTimeFormatted,
                fastestResolve: fastestResolve,
                slowestResolve: slowestResolve,
                // Add filter information for reference
                filter: {
                    primary,
                    secondary,
                    label: `${primary.charAt(0).toUpperCase() + primary.slice(1)}: ${secondary}`
                }
            });

            console.log({
                filter: `${primary}: ${secondary}`,
                responses: sortedResponses.length,
                average: averageResponseTime,
                fastest: sortedResponses.length > 0 ? sortedResponses[0].actualResponseTime : null,
                slowest: sortedResponses.length > 0 ? sortedResponses[sortedResponses.length - 1].actualResponseTime : null,
                totalResponses: sortedResponses.length,
                // Logging resolve time data
                averageResolveTime: averageResolveTimeInMinutes,
                averageResolveTimeFormatted: averageResolveTimeFormatted,
                fastestResolve: fastestResolve ? fastestResolve.resolveTimeFormatted : null,
                slowestResolve: slowestResolve ? slowestResolve.resolveTimeFormatted : null
            });

            setPrintPerformance(true);
            setPrinting(true);
        }
    };

    // Performance Review Title
    const getPRTitle = (primary, secondary, lastName) => {
        if (!primary || !secondary || !lastName) return "Performance Report";
    
        const year = secondary.split("-")[0];
    
        switch (primary) {
            case "daily": {
                const date = new Date(secondary);
                const formattedDate = date.toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                });
                return `${lastName} Daily Performance Review - ${formattedDate}`;
            }
            case "weekly": {
                const weekNumber = secondary.split("-W")[1];
                return `${lastName} Weekly Performance Review - Week ${weekNumber}, ${year}`;
            }
            case "monthly": {
                const monthNumber = parseInt(secondary.split("-")[1], 10);
                const monthName = new Date(2025, monthNumber - 1, 1).toLocaleDateString("en-US", {
                    month: "long",
                });
                return `${lastName} Monthly Performance Review - ${monthName} ${year}`;
            }
            case "quarterly": {
                const quarter = secondary.split("-Q")[1];
                const quarterName = ["Q1", "Q2", "Q3", "Q4"][quarter - 1];
                return `${lastName} Quarterly Performance Review - ${quarterName} ${year}`;
            }
            case "yearly":
                return `${lastName} Annual Performance Review - ${year}`;
            default:
                return `${lastName} Performance Report`;
        }
    };

    // Downloading Summary Function
    const downloadPerformanceSummary = () => { 
        // Now check if refs are available
        if (!summaryPerformanceRef.current || !performanceRTRef.current || !performanceStatRef.current || !resolvedStatRef.current) {
            console.error("Refs not ready yet");
            setPrinting(false);
            return;
        }

        if (!printIndividual) {
            console.error("Responder Data Unavailable");
            setPrinting(false);
            return;
        }

        if (!performanceFilter) {
            console.error("Filter Unavailable");
            setPrinting(false);
            return;
        }
        
        const style = document.createElement("style");
        style.id = "print-styles";
        style.innerHTML = `
            @media print {
                /* Basic page setup */
                .page {
                    width: 650px !important;
                    height: 900px !important;
                    background-color: white !important;
                    page-break-inside: avoid !important;
                    overflow: hidden;
                    box-sizing: border-box;
                    display: flex !important;
                    flex-direction: column !important;
                    margin-top: 0 !important;
                }
                
                /* Only apply page breaks between pages, not after the last one */
                .page:not(:last-child) {
                    page-break-after: always;
                }
                
                /* Explicitly prevent page break after the last page */
                .page:last-child {
                    page-break-after: avoid !important;
                }
                
                /* --- Keep your alignment classes --- */
                .page1-print-align {
                    justify-content: center !important;
                    align-items: center !important;
                    text-align: center !important;
                }
                .page2-print-align, .page3-print-align {
                    justify-content: flex-start !important;
                    align-items: center !important;
                }
                
                /* --- Keep body margin reset --- */
                body {
                    margin: 0 !important;
                }
                
                /* --- Keep nested grid styles --- */
                .page .MuiBox-root[class*="grid"] {
                    height: auto !important;
                    flex-grow: 1;
                }
            }
        `;
        document.getElementById("print-styles")?.remove();
        document.head.appendChild(style);
        
        html2pdf()
            .set({
                margin: [5, 5],
                filename: getPRTitle(
                    performanceFilter?.primary, 
                    performanceFilter?.secondary, 
                    printIndividual?.name?.last_name || 'Responder'
                ) + '.pdf',
                image: { type: "jpeg", quality: 0.98 },
                html2canvas: {
                    scale: 2,
                    useCORS: true,
                },
                jsPDF: { orientation: "portrait", unit: "px", format: [660, 910] }, // Changed to portrait and swapped dimensions
                pagebreak: { mode: ['css'], avoid: '.avoid-break' }
            })
            .from(summaryPerformanceRef.current)
            .save()
            .then(() => {
                document.getElementById("print-styles")?.remove();
                console.log("PDF Generated and styles removed.");
                // Only set printing to false after PDF generation is complete
                setPrinting(false);
                setPrintPerformance(false)
                setPerformanceFilter({ primary: "", secondary: "" });
                setPrintIndividual(null);
            })
            .catch((error) => {
                console.error("Error generating PDF:", error);
                document.getElementById("print-styles")?.remove();
                setPrinting(false);
                setPrintPerformance(false);
                setPerformanceFilter({ primary: "", secondary: "" });
                setPrintIndividual(null);
            });
    };

    const waitForRefs = (callback, retries = 20) => {
        if (
            summaryPerformanceRef.current &&
            performanceRTRef.current &&
            performanceStatRef.current &&
            resolvedStatRef.current
        ) {
            callback();
        } else if (retries > 0) {
            setTimeout(() => waitForRefs(callback, retries - 1), 200);
        } else {
            console.error("Refs not ready after multiple retries");
            setPrinting(false);
        }
    };  

    useEffect(() => {
        if (isPrinting && performanceFilter) {
            waitForRefs(() => {
            // Add extra delay so the charts are fully rendered visually
            setTimeout(() => {
                downloadPerformanceSummary(); // Now download the PDF after additional delay
                //setPerformanceFilter(null);
            }, 500);
            });
        }
    // eslint-disable-next-line
    }, [isPrinting, performanceFilter]); 

    return (
        <Box m={isPrinting ? "0px" : "20px"} justifyItems={isPrinting ? 'center' : ''}>
            {isPrinting ? (
                <>
                    {printPerformance ? 
                        <PerformanceForm
                            refs={{ 
                                summaryRef: summaryPerformanceRef, 
                                page1Ref: performanceRTRef, 
                                page2Ref: performanceStatRef, 
                                page3Ref: resolvedStatRef 
                            }}
                            printResponses={printResponses}
                            printReadyFilters={performanceFilter}
                            printResponseTime={printResponseTime}
                            printIndividual={printIndividual}
                            theme={theme}
                        />
                     : (
                        <OverallForm
                            refs={{
                                summaryOverallRef,
                                overallTitleRef,
                                responseBarangayRef,
                                barBarangayRef
                            }}
                            filters={filters}
                            filteredReports={filteredReports}
                            getReportTitle={getReportTitle}
                            getReportSubtitle={getReportSubtitle} 
                            getReportTime={getReportTime}
                        />
                    )}
                </>
                
            ) : (
                <>
                    {/* Filter Print Modal */}
                    <Dialog open={filterVisible} onClose={closeFilter} fullWidth maxWidth="md">
                        <DialogContent sx={{ backgroundColor: theme.palette.mode === "dark" ?  colors.primary[500] : colors.primary[900] }}>
                            {displayData && 
                                <FilterPrint 
                                    onClose={closeFilter}
                                    currentFilter={filters.response}
                                    setFilter={(selectedFilters, selectedUser) => {
                                        setPerformanceFilter(selectedFilters);
                                        setPrintIndividual(selectedUser);
                                        handlePrint(selectedFilters, selectedUser);
                                        console.log("Print initiated with:", { filters: selectedFilters, user: selectedUser });
                                    }}
                                    responses={displayData}
                                    isResponder={true}
                                    setUser={setPrintIndividual}
                                />
                            }
                        </DialogContent>
                    </Dialog>

                    {/* HEADER */}
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Header title="DASHBOARD" subtitle="Welcome to your dashboard" />
                        
                        <Box display="flex" gap={2}>
                            {/* Listener Toggle Buttons */}
                            <Box display="flex" gap={1}>
                                <Tooltip 
                                    title={isListening ? "Disconnect from Database" : "Connect to Database"} 
                                    placement="bottom" 
                                    sx={{ bgcolor: "gray.700", color: "white" }} // Tooltip styling
                                >
                                    <IconButton 
                                        onClick={handleToggleListener} 
                                        color={isListening ? "secondary" : "default"}
                                        sx={{ fontSize: "2rem", padding: '10px', marginTop: '6px' }}
                                    >
                                        {isListening ? (
                                            <ToggleOnOutlinedIcon sx={{ fontSize: "1.5rem" }} />
                                        ) : (
                                            <ToggleOffOutlinedIcon sx={{ fontSize: "1.5rem" }} />
                                        )}
                                    </IconButton>
                                </Tooltip>
                            </Box>

                            <Box
                                display="flex" 
                                justifyContent="flex-end" 
                            >
                                {/* Filter by Timeframe for Global */}
                                <Tooltip
                                    title={"Filter All"}
                                    placement="top"
                                    sx={{ bgcolor: "gray.700", color: "white" }} // Tooltip styling
                                >
                                    <FormControl sx={{ minWidth: 150, marginRight: 1 }}>
                                        <InputLabel
                                            sx={{
                                                backgroundColor: theme.palette.mode === 'dark' ? colors.primary[500] : "#fcfcfc",
                                                color: colors.grey[100],
                                                fontSize: "16px",
                                                paddingX: "15px"
                                            }}
                                        >
                                            {"Timeframe"}
                                        </InputLabel>
                                        <Select
                                            value={filters.global.primary}
                                            onChange={(e) =>
                                                setFilters(prev => ({
                                                    ...prev,
                                                    global: { ...prev.global, primary: e.target.value, secondary: '' },
                                                }))
                                            }
                                        >
                                            <MenuItem value="daily">Daily</MenuItem>
                                            <MenuItem value="weekly">Weekly</MenuItem>
                                            <MenuItem value="monthly">Monthly</MenuItem>
                                            <MenuItem value="quarterly">Quarterly</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Tooltip>

                                {/* Secondary Filter by Time */}
                                {filters.global.primary && Array.isArray(availablePeriods.global) && availablePeriods.global.length > 0 && (
                                    <Tooltip
                                        title={"Select Specific Period"}
                                        placement="top"
                                        sx={{ bgcolor: "gray.700", color: "white" }}
                                    >
                                        <FormControl sx={{ minWidth: 100 }}>
                                            <InputLabel
                                                sx={{
                                                    backgroundColor: theme.palette.mode === 'dark' ? colors.primary[500] : "#fcfcfc",
                                                    color: colors.grey[100],
                                                    fontSize: "16px",
                                                    paddingX: "15px"
                                                }}
                                            >
                                                {"Period"}
                                            </InputLabel>
                                            <Select
                                                value={filters.global.secondary || ""}
                                                onChange={(e) =>
                                                    setFilters(prev => ({
                                                        ...prev,
                                                        global: { ...prev.global, secondary: e.target.value },
                                                    }))
                                                }
                                            >
                                                {availablePeriods.global.map(period => (
                                                    <MenuItem key={period.value} value={period.value}>
                                                        {period.label} 
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Tooltip>
                                )}
                            </Box>

                            {/* Download Button */}
                            <Tooltip
                                title={`Print ${(filters?.global?.primary && filters?.global?.secondary) ? getReportTime(filters?.global?.primary, filters?.global?.secondary) : ''} Summary`}
                                placement="bottom"
                                sx={{ bgcolor: "gray.700", color: "white" }} // Tooltip styling
                            >
                                <Button
                                    sx={{
                                        backgroundColor: colors.blueAccent[700],
                                        color: colors.grey[100],
                                        fontSize: "14px",
                                        fontWeight: "bold",
                                        padding: "10px 20px",
                                    }}
                                    onClick={downloadOverallSummary}
                                >
                                    <DownloadOutlinedIcon sx={{ mr: "10px" }} />
                                        Download Summary
                                </Button>
                            </Tooltip>
                        </Box>
                    </Box>

                    <Box mt="20px"/>
                    {/* GRID & CHARTS */}
                    <Box
                        display="grid"
                        gridTemplateColumns="repeat(12, 1fr)"
                        gridAutoRows="140px"
                        gap="20px"
                    >
                        {/* ROW 1 */}
                        {/* Reports */}
                        <Box
                            gridColumn="span 3"
                            backgroundColor={colors.primary[400]}
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                        >
                            <StatBox
                                title={
                                    filters.global.primary === 'daily' ? currentReports.today : 
                                    filters.global.primary === 'weekly' ? currentReports.weekly :
                                    filters.global.primary === 'monthly' ? currentReports.monthly : 
                                    filters.global.primary === 'quarterly' ? currentReports.quarterly : 
                                    currentReports.total
                                }
                                subtitle="Reports"
                                progress={currentReports.progress}
                                increase={currentReports.increase}
                                icon={
                                    <ArchiveIcon
                                        sx={{ color: colors.greenAccent[600], fontSize: "26px" }}
                                    />
                                }
                            />
                        </Box>
                        {/* Responses */}
                        <Box
                            gridColumn="span 3"
                            backgroundColor={colors.primary[400]}
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                        >
                        <StatBox
                            title={
                                filters.global.primary === 'daily' ? responses.today : 
                                filters.global.primary === 'weekly' ? responses.weekly :
                                filters.global.primary === 'monthly' ? responses.monthly : 
                                filters.global.primary === 'quarterly' ? responses.quarterly : 
                                responses.total
                            }
                            subtitle="Responses"
                            progress={responses.progress}
                            increase={responses.increase}
                            icon={
                                <FireTruckIcon
                                    sx={{ color: colors.greenAccent[600], fontSize: "26px" }}
                                />
                            }
                        />
                        </Box>
                        {/* Users */}
                        <Box
                            gridColumn="span 3"
                            backgroundColor={colors.primary[400]}
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                        >
                        <StatBox
                            title={
                                filters.global.primary === 'daily' ? users.today : 
                                filters.global.primary === 'weekly' ? users.weekly :
                                filters.global.primary === 'monthly' ? users.monthly : 
                                filters.global.primary === 'quarterly' ? users.quarterly : 
                                users.total
                            }
                            subtitle="Users"
                            progress={users.progress}
                            increase={users.increase}
                            icon={
                                <PersonAddIcon
                                    sx={{ color: colors.greenAccent[600], fontSize: "26px" }}
                                />
                            }
                        />
                        </Box>
                        {/* Stations */}
                        <Box
                            gridColumn="span 3"
                            backgroundColor={colors.primary[400]}
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                        >
                        <StatBox
                            title={
                                filters.global.primary === 'daily' ? stations.today : 
                                filters.global.primary === 'weekly' ? stations.weekly :
                                filters.global.primary === 'monthly' ? stations.monthly : 
                                filters.global.primary === 'quarterly' ? stations.quarterly : 
                                stations.total
                            }
                            subtitle="Stations"
                            progress={stations.progress}
                            increase={stations.increase}
                            icon={
                                <AddLocationAltIcon
                                    sx={{ color: colors.greenAccent[600], fontSize: "26px" }}
                                />
                            }
                        />
                        </Box>

                        {/* ROW 2 */}
                        <Box 
                            gridColumn="span 7"
                            gridRow="span 2"
                            backgroundColor={colors.primary[400]}
                            ref={chartRef}
                        >
                            <Box
                                mt="25px"
                                p="0 30px"
                                display="flex"
                                justifyContent="space-between"
                                alignItems="center"
                            >
                                <Box>
                                    <Typography variant="h5" fontWeight="600" color={colors.grey[100]}>
                                        Average Response Time
                                    </Typography>
                                    <Typography variant="h3" fontWeight="bold" color={colors.greenAccent[500]}>
                                        {getAverageResponseTime(filteredResponses)} mins
                                    </Typography>
                                </Box>

                                <Box>
                                    <IconButton id="download-btn" onClick={downloadChart}>
                                        <DownloadOutlinedIcon 
                                            sx={{
                                                fontSize: "26px", color: colors.greenAccent[500]
                                            }}
                                        />
                                    </IconButton>
                                </Box>
                            </Box>

                            <Box height="250px" mt="-20px">
                                <LineChart
                                    responses={filteredResponses} 
                                    isDashboard={true}
                                    primaryFilter={filters.response.primary}
                                />
                            </Box>
                        </Box>

                        {/* RESPONSES TABS */}
                        <Box gridColumn="span 5" gridRow="span 2" backgroundColor={colors.primary[400]} overflow="auto">
                            <Box
                                display="flex" 
                                justifyContent="space-between" 
                                alignItems="center"
                                borderBottom={`1px solid ${colors.primary[500]}`}
                                colors={colors.grey[100]}
                                p="10px"
                            >
                                <Box flex="1" maxWidth="50%">
                                    <Typography color={colors.grey[100]} variant="h5" fontWeight="600">
                                        Recent Responses
                                    </Typography>
                                </Box>
                                {/* Filter Buttons */}
                                <Box
                                    display="flex" 
                                    justifyContent="flex-end"
                                >
                                    {expandTools.responseSearch && (
                                        <Box sx={{ width: '100%' }}>
                                            <TextField
                                                fullWidth
                                                variant="outlined"
                                                placeholder="Search"
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                sx={{
                                                    backgroundColor: theme.palette.mode === 'dark' ? colors.primary[400] : "#fcfcfc",
                                                    color: colors.grey[100],
                                                    fontSize: "16px",
                                                    paddingX: "15px",
                                                    '& .MuiOutlinedInput-root': {
                                                        '& fieldset': {
                                                            borderColor: colors.greenAccent[400],
                                                        },
                                                        '&:hover fieldset': {
                                                            borderColor: colors.greenAccent[300],
                                                        },
                                                        '&.Mui-focused fieldset': {
                                                            borderColor: colors.greenAccent[500],
                                                        },
                                                        '& .MuiInputAdornment-positionEnd': {
                                                            marginLeft: 'auto',
                                                        }
                                                    }
                                                }}
                                                slotProps={{
                                                    inputLabel: {
                                                        style: { color: colors.grey[100] }
                                                    },
                                                    input: {
                                                        startAdornment: (
                                                            <InputAdornment position="start">
                                                                <SearchIcon sx={{ color: colors.grey[100] }} />
                                                            </InputAdornment>
                                                        ),
                                                        endAdornment: searchQuery ? (
                                                            <InputAdornment position="end" sx={{ marginRight: '-12px' }}>
                                                                <IconButton onClick={() => setSearchQuery("")}>
                                                                    <ClearIcon />
                                                                </IconButton>
                                                            </InputAdornment>
                                                        ) : null
                                                    }
                                                }}
                                                size="small"
                                            />
                                        </Box>
                                    )}

                                    {/* Search Options */}
                                    <IconButton onClick={() => {
                                            // Clear search query when closing
                                            if (expandTools.responseSearch) {
                                                setSearchQuery("");
                                            }
                                            // Toggle the tools state
                                            setExpandTool(prev => ({
                                                ...prev,
                                                responseSearch: !prev.responseSearch,
                                                responseFilter: false,
                                                responsePrint: false
                                            }));
                                        }}
                                    >
                                        {expandTools.responseSearch
                                            ? <HighlightOffIcon sx={{ fontSize: "26px", color: colors.greenAccent[500] }} />
                                            : <SearchIcon sx={{ fontSize: "26px", color: colors.greenAccent[500] }} />
                                        }
                                    </IconButton>

                                    {/* Show filter controls when responseFilter is true */}
                                    {expandTools.responseFilter && (
                                        <>
                                            <Tooltip
                                                title={"Filter Response By Timeframe"}
                                                placement="top"
                                                sx={{ bgcolor: "gray.700", color: "white" }}
                                            >
                                                <FormControl sx={{ minWidth: 120, marginRight: 1 }}>
                                                    <InputLabel
                                                        sx={{
                                                            backgroundColor: theme.palette.mode === 'dark' ? colors.primary[400] : "#fcfcfc",
                                                            color: colors.grey[100],
                                                            fontSize: "16px",
                                                            paddingX: "15px"
                                                        }}
                                                    >
                                                        {"Timeframe"}
                                                    </InputLabel>
                                                    <Select
                                                        value={filters.response.primary}
                                                        onChange={(e) =>
                                                            setFilters(prev => ({
                                                                ...prev,
                                                                response: { ...prev.response, primary: e.target.value, secondary: '' },
                                                            }))
                                                        }
                                                    >
                                                        <MenuItem value="daily">Daily</MenuItem>
                                                        <MenuItem value="weekly">Weekly</MenuItem>
                                                        <MenuItem value="monthly">Monthly</MenuItem>
                                                        <MenuItem value="quarterly">Quarterly</MenuItem>
                                                    </Select>
                                                </FormControl>
                                            </Tooltip>

                                            {filters.response.primary && availablePeriods.response.length > 0 && (
                                                <Tooltip
                                                    title={"Select Specific Period"}
                                                    placement="top"
                                                    sx={{ bgcolor: "gray.700", color: "white" }}
                                                >
                                                    <FormControl sx={{ minWidth: 100 }}>
                                                        <InputLabel
                                                            sx={{
                                                                backgroundColor: theme.palette.mode === 'dark' ? colors.primary[400] : "#fcfcfc",
                                                                color: colors.grey[100],
                                                                fontSize: "16px",
                                                                paddingX: "15px"
                                                            }}
                                                        >
                                                            {"Period"}
                                                        </InputLabel>
                                                        <Select
                                                            value={filters.response.secondary}
                                                            onChange={(e) =>
                                                                setFilters(prev => ({
                                                                    ...prev,
                                                                    response: { ...prev.response, secondary: e.target.value },
                                                                }))
                                                            }
                                                        >
                                                            {availablePeriods.response.map((period) => (
                                                                <MenuItem key={period} value={period}>
                                                                    {period}
                                                                </MenuItem>
                                                            ))}
                                                        </Select>
                                                    </FormControl>
                                                </Tooltip>
                                            )}
                                        </>
                                    )}

                                    {/* Filter Options */}
                                    <Tooltip
                                        title={expandTools.responseFilter ? "Hide Filters" : "Show Filters"}
                                        placement="bottom"
                                        sx={{ bgcolor: "gray.700", color: "white" }}
                                    >
                                        <IconButton onClick={() => setExpandTool(prev => ({
                                            ...prev,
                                            responseFilter: !prev.responseFilter,
                                            responseSearch: false,
                                            responsePrint: false
                                        }))}>
                                            {expandTools.responseFilter
                                                ? <HighlightOffIcon sx={{ fontSize: "26px", color: colors.greenAccent[500] }} />
                                                : <FilterListIcon sx={{ fontSize: "26px", color: colors.greenAccent[500] }} />
                                            }
                                        </IconButton>
                                    </Tooltip>

                                    {/* Print Option */}
                                    <Tooltip
                                        title={expandTools.responsePrint ? "Hide Print" : "Print"}
                                        placement="bottom"
                                        sx={{ bgcolor: "gray.700", color: "white" }}
                                    >
                                        <IconButton onClick={() => {
                                            setExpandTool(prev => ({
                                                ...prev,
                                                responsePrint: !prev.responsePrint,
                                                responseFilter: false,
                                                //responseSearch: false,
                                            }));
                                            setFilterVisible(true);
                                        }}>
                                            {expandTools.responsePrint
                                                ? <HighlightOffIcon sx={{ fontSize: "24px", color: colors.greenAccent[500] }} />
                                                : <PrintIcon sx={{ fontSize: "24px", color: colors.greenAccent[500] }} />
                                            }
                                        </IconButton>
                                    </Tooltip>
                                </Box>
                            </Box>

                            {displayData.map((response, i) => {
                                // Calculate response time in minutes
                                const responseTimestamp = response?.date?.response?.toMillis?.() || 0;
                                const arrivedTimestamp = response?.date?.arrived?.toMillis?.() || 0;
                                const timeDiff = ((arrivedTimestamp - responseTimestamp) / (1000 * 60)).toFixed(1);

                                // Combine first and last name
                                const responderName = `${response?.responder?.name?.first_name || "N/A"} ${response?.responder?.name?.last_name || ""}`.trim();

                                // Dynamic background color based on timeDiff
                                const bgColor = timeDiff > 7 ? colors.redAccent[400] : colors.blueAccent[500];

                                return (
                                    <Box
                                        key={`${response.report_id}-${i}`}
                                        display="flex"
                                        justifyContent="space-between"
                                        alignItems="center"
                                        borderBottom={`1px solid ${colors.primary[500]}`}
                                        p="15px"
                                    >
                                        {/* Report ID and Responder Name */}
                                        <Box>
                                            <Typography color={colors.greenAccent[500]} variant="h6" fontWeight="600">
                                                {response.report_id || "N/A"}
                                            </Typography>
                                            <Typography color={colors.grey[100]}>
                                                {responderName}
                                            </Typography>
                                        </Box>

                                        {/* Response Time Box */}
                                        <Box
                                            backgroundColor={bgColor}
                                            p="5px 10px"
                                            borderRadius="4px"
                                        >
                                            {timeDiff > 0 ? `${timeDiff} mins` : "No data"}
                                        </Box>
                                    </Box>
                                );
                            })}
                        </Box>

                        {/* ROW 3 */}
                        <Box gridColumn="span 6" gridRow="span 2" backgroundColor={colors.primary[400]}>
                            <Box
                                display="flex" 
                                justifyContent="space-between" 
                                alignItems="center"
                                borderBottom={`1px solid ${colors.primary[500]}`}
                                colors={colors.grey[100]}
                                padding="15px"
                            >
                                <Box flex="1" maxWidth="50%" alignItems="center">
                                    <Typography variant="h5" fontWeight="600">
                                        Routes and Credits
                                    </Typography>
                                </Box>

                                <Box
                                    display="flex" 
                                    justifyContent="flex-end" 
                                >
                                    {/* Filter by Timeframe for Reports */}
                                    <Tooltip
                                        title={"Filter Routes & Credits By Timeframe"}
                                        placement="top"
                                        sx={{ bgcolor: "gray.700", color: "white" }} // Tooltip styling
                                    >
                                        <FormControl sx={{ minWidth: 120, marginRight: 1 }}>
                                            <InputLabel
                                                sx={{
                                                    backgroundColor: theme.palette.mode === 'dark' ? colors.primary[400] : "#fcfcfc",
                                                    color: colors.grey[100],
                                                    fontSize: "16px",
                                                    paddingX: "15px"
                                                }}
                                            >
                                                {"Timeframe"}
                                            </InputLabel>
                                            <Select
                                                value={filters.credits.primary}
                                                onChange={(e) =>
                                                    setFilters(prev => ({
                                                        ...prev,
                                                        credits: { ...prev.credits, primary: e.target.value, secondary: '' },
                                                    }))
                                                }
                                            >
                                                <MenuItem value="daily">Daily</MenuItem>
                                                <MenuItem value="weekly">Weekly</MenuItem>
                                                <MenuItem value="monthly">Monthly</MenuItem>
                                                <MenuItem value="quarterly">Quarterly</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Tooltip>

                                    {/* Secondary Filter by Time */}
                                    {filters.credits.primary && Array.isArray(availablePeriods.credits) && availablePeriods.credits.length > 0 && (
                                        <Tooltip
                                            title={"Select Specific Period"}
                                            placement="top"
                                            sx={{ bgcolor: "gray.700", color: "white" }}
                                        >
                                            <FormControl sx={{ minWidth: 100 }}>
                                                <InputLabel
                                                    sx={{
                                                        backgroundColor: theme.palette.mode === 'dark' ? colors.primary[400] : "#fcfcfc",
                                                        color: colors.grey[100],
                                                        fontSize: "16px",
                                                        paddingX: "15px"
                                                    }}
                                                >
                                                    {"Period"}
                                                </InputLabel>
                                                <Select
                                                    value={filters.credits.secondary || ""}
                                                    onChange={(e) =>
                                                        setFilters(prev => ({
                                                            ...prev,
                                                            credits: { ...prev.credits, secondary: e.target.value },
                                                        }))
                                                    }
                                                >
                                                    {availablePeriods.credits.map(period => (
                                                        <MenuItem key={period.value} value={period.value}>
                                                            {period.label} 
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                        </Tooltip>
                                    )}
                                </Box>
                            </Box>

                            <Box display="flex" flexDirection="column" alignItems="center" mt="25px">
                                <ProgressCircle progress={credits.progress} size="125" />
                                
                                <Typography variant="h5" color={colors.greenAccent[500]} sx={{ mt: "15px" }}>
                                    {filters.credits.primary === 'daily' && `${routes.today.toLocaleString()} routes generated`}
                                    {filters.credits.primary === 'weekly' && `${routes.weekly.toLocaleString()} routes generated this week`}
                                    {filters.credits.primary === 'monthly' && `${routes.monthly.toLocaleString()} routes generated this month`}
                                </Typography>

                                <Typography>
                                    {Math.round(credits.progress * 100)}% credits consumed
                                </Typography>
                            </Box>
                        </Box>

                        {/* Bar Chart */}
                        <Box
                            gridColumn="span 6"
                            gridRow="span 2"
                            backgroundColor={colors.primary[400]}
                            overflow="auto"
                        >
                            <Box
                                display="flex" 
                                justifyContent="space-between" 
                                alignItems="center"
                                borderBottom={`1px solid ${colors.primary[500]}`}
                                colors={colors.grey[100]}
                                padding="15px"
                            >
                                <Box flex="1" maxWidth="50%" alignItems="center">
                                    <Typography
                                        variant="h5"
                                        fontWeight="600"
                                    >
                                        Reports Quantity
                                    </Typography>
                                </Box>
                                <Box
                                    display="flex" 
                                    justifyContent="flex-end" 
                                >
                                    {/* Filter by Timeframe for Reports */}
                                    <Tooltip
                                        title={"Filter Reports By Timeframe"}
                                        placement="top"
                                        sx={{ bgcolor: "gray.700", color: "white" }} // Tooltip styling
                                    >
                                        <FormControl sx={{ minWidth: 120, marginRight: 1 }}>
                                            <InputLabel
                                                sx={{
                                                    backgroundColor: theme.palette.mode === 'dark' ? colors.primary[400] : "#fcfcfc",
                                                    color: colors.grey[100],
                                                    fontSize: "16px",
                                                    paddingX: "15px"
                                                }}
                                            >
                                                {"Timeframe"}
                                            </InputLabel>
                                            <Select
                                                value={filters.bar.primary}
                                                onChange={(e) =>
                                                    setFilters(prev => ({
                                                        ...prev,
                                                        bar: { ...prev.bar, primary: e.target.value, secondary: '' },
                                                    }))
                                                }
                                            >
                                                <MenuItem value="daily">Daily</MenuItem>
                                                <MenuItem value="weekly">Weekly</MenuItem>
                                                <MenuItem value="monthly">Monthly</MenuItem>
                                                <MenuItem value="quarterly">Quarterly</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Tooltip>

                                    {/* Secondary Filter by Time */}
                                    {filters.bar.primary && availablePeriods.bar.length > 0 && (
                                        <Tooltip
                                            title={"Select Specific Period"}
                                            placement="top"
                                            sx={{ bgcolor: "gray.700", color: "white" }}
                                        >
                                            <FormControl sx={{ minWidth: 100 }}>
                                                <InputLabel
                                                    sx={{
                                                        backgroundColor: theme.palette.mode === 'dark' ? colors.primary[400] : "#fcfcfc",
                                                        color: colors.grey[100],
                                                        fontSize: "16px",
                                                        paddingX: "15px"
                                                    }}
                                                >
                                                    {"Period"}
                                                </InputLabel>
                                                <Select
                                                    value={filters.bar.secondary}
                                                    onChange={(e) =>
                                                        setFilters(prev => ({
                                                            ...prev,
                                                            bar: { ...prev.bar, secondary: e.target.value },
                                                        }))
                                                    }
                                                >
                                                    {availablePeriods.bar.map((period) => (
                                                        <MenuItem key={period} value={period}>
                                                            {period}
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                        </Tooltip>
                                    )}
                                </Box>
                            </Box>
                            
                            <Box height="240px" mt="-30px">
                                <BarChart reports={filteredReports} isDashboard={true} />
                            </Box>
                        </Box>
                    </Box>
                </>
            )}
        </Box>
    )
};

// Helper functions to format dates
const getCurrentDate = () => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
};

const getCurrentWeek = () => {
    const date = new Date();
    const year = date.getFullYear();
    const week = getISOWeekNumber(date);
    return `${year}-W${week.toString().padStart(2, "0")}`;
};

const getCurrentMonth = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    return `${year}-${month}`;
};

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

/* const getYesterdayDate = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, "0")}-${String(yesterday.getDate()).padStart(2, "0")}`;
}; */

export default Dashboard;   