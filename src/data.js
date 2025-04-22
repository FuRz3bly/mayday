import { createContext, useState, useEffect, useCallback, useMemo, useRef } from "react";
import { collection, onSnapshot, query, where, getDocs, doc, getDoc, setDoc, getCountFromServer, updateDoc, Timestamp } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "./config/firebaseConfig";

// Create Context
export const DataContext = createContext();

// DataProvider Component
export const DataProvider = ({ children }) => {
  const [authUser, setAuthUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [stations, setStations] = useState([]);
  const [reports, setReports] = useState([]);
  const [metadata, setMetadata] = useState([]);
  const [responses, setResponses] = useState([]);

  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingStations, setLoadingStations] = useState(false);
  const [loadingReports, setLoadingReports] = useState(false);
  const [loadingMetadata, setLoadingMetadata] = useState(false);
  const [loadingResponses, setLoadingResponses] = useState(false);

  const unsubscribeUsersRef = useRef(null);
  const unsubscribeStationsRef = useRef(null);
  const unsubscribeReportsRef = useRef(null);
  const unsubscribeAuthRef = useRef(null);
  const unsubscribeMetadataRef = useRef(null);
  const unsubscribeResponsesRef = useRef(null);

  // Function to start the real-time listener for users
  const startUsersListener = () => {
    setLoadingUsers(true);
    unsubscribeUsersRef.current = onSnapshot(
      collection(db, "users"),
      (querySnapshot) => {
        const userData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setUsers(userData);
        setLoadingUsers(false);
      },
      (error) => {
        console.error("Error fetching users:", error);
        setLoadingUsers(false);
      }
    );
  };

  // Function to stop the real-time listener for users
  const stopUsersListener = () => {
    if (unsubscribeUsersRef.current) {
      unsubscribeUsersRef.current();
      unsubscribeUsersRef.current = null;
    }
  };

  // Function to start the real-time listener for stations
  const startStationsListener = () => {
    setLoadingStations(true);
    unsubscribeStationsRef.current = onSnapshot(
      collection(db, "stations"),
      (querySnapshot) => {
        const stationData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setStations(stationData);
        setLoadingStations(false);
      },
      (error) => {
        console.error("Error fetching stations:", error);
        setLoadingStations(false);
      }
    );
  };

  // Function to stop the real-time listener for stations
  const stopStationsListener = () => {
    if (unsubscribeStationsRef.current) {
      unsubscribeStationsRef.current();
      unsubscribeStationsRef.current = null;
    }
  };

  // Function to start the real-time listener for reports
  const startReportsListener = () => {
    setLoadingReports(true);
    unsubscribeReportsRef.current = onSnapshot(
      collection(db, "reports"),
      (querySnapshot) => {
        const reportData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setReports(reportData);
        setLoadingReports(false);
      },
      (error) => {
        console.error("Error fetching reports:", error);
        setLoadingReports(false);
      }
    );
  };

  // Function to stop the real-time listener for reports
  const stopReportsListener = () => {
    if (unsubscribeReportsRef.current) {
      unsubscribeReportsRef.current();
      unsubscribeReportsRef.current = null;
    }
  };

  // Function to start the real-time listener for metadata
  const startMetadataListener = () => {
    setLoadingMetadata(true);

    const parentDocs = ["daily", "weekly", "monthly", "quarterly", "yearly"];
    const unsubscribeList = [];

    // Listen to each parent document
    parentDocs.forEach((parent) => {
      const recordsRef = collection(db, "metadata", parent, "records");

      const unsubscribe = onSnapshot(
        recordsRef,
        (querySnapshot) => {
          setMetadata((prevMetadata) => {
            const updatedMetadata = { ...prevMetadata };
            updatedMetadata[parent] = {};

            querySnapshot.forEach((doc) => {
              updatedMetadata[parent][doc.id] = { id: doc.id, ...doc.data() };
            });

            return updatedMetadata;
          });
          setLoadingMetadata(false);
        },
        (error) => {
          console.error(`Error fetching ${parent} records:`, error);
          setLoadingMetadata(false);
        }
      );

      // Store individual unsubscribe functions
      unsubscribeList.push(unsubscribe);
    });

    // Listen to the global document
    const globalDocRef = doc(db, "metadata", "global");
    const globalUnsubscribe = onSnapshot(
      globalDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setMetadata((prevMetadata) => ({
            ...prevMetadata,
            global: { id: docSnap.id, ...docSnap.data() },
          }));
          setLoadingMetadata(false);
        }
      },
      (error) => {
        console.error("Error fetching global metadata:", error);
        setLoadingMetadata(false);
      }
    );

    // Store global unsubscribe function
    unsubscribeList.push(globalUnsubscribe);

    // Store all unsubscribe functions in a ref
    unsubscribeMetadataRef.current = () => {
      unsubscribeList.forEach((unsub) => unsub());
    };
  };

  // Function to stop the real-time listener for metadata
  const stopMetadataListener = () => {
    if (unsubscribeMetadataRef.current) {
      unsubscribeMetadataRef.current();
      unsubscribeMetadataRef.current = null;
    }
  };

  // Function to start the real-time listener for responses
  const startResponsesListener = () => {
    setLoadingResponses(true);
    unsubscribeResponsesRef.current = onSnapshot(
        collection(db, "response"),
        (querySnapshot) => {
            const responseData = querySnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
            setResponses(responseData);
            setLoadingResponses(false);
        },
        (error) => {
            console.error("❌ Error fetching responses:", error);
            setLoadingResponses(false);
        }
    );
  };

  // Function to stop the real-time listener for responses
  const stopResponsesListener = () => {
    if (unsubscribeResponsesRef.current) {
        unsubscribeResponsesRef.current();
        unsubscribeResponsesRef.current = null;
    }
  };

  // Function to Reset Daily Count
  const resetDailyCount = useCallback(async () => {
    try {
        const today = new Date();
        const formattedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
        const todayMidnight = Timestamp.fromDate(new Date(today.setHours(0, 0, 0, 0)));

        const dailyRecordRef = doc(db, "metadata", "daily", "records", formattedDate);
        const snapshot = await getDoc(dailyRecordRef);

        if (snapshot.exists()) {
            const data = snapshot.data();
            // Check if the last reset was NOT today
            if (data.date?.toDate().getTime() !== todayMidnight.toDate().getTime()) {
                await setDoc(dailyRecordRef, {
                    reports: 0,
                    responses: 0,
                    routes: 0,
                    stations: 0,
                    users: 0,
                    credits: 0,
                    date: todayMidnight,
                });
                console.log(`✅ Daily count reset for ${formattedDate}.`);
            } else {
                console.log(`ℹ️ Daily count is already up to date.`);
            }
        } else {
            // No record for today exists — create it
            await setDoc(dailyRecordRef, {
                reports: 0,
                responses: 0,
                routes: 0,
                stations: 0,
                users: 0,
                credits: 0,
                date: todayMidnight,
            });
            console.log(`✅ New daily record created for ${formattedDate}.`);
        }
    } catch (error) {
        console.error("❌ Error resetting daily count:", error);
    }
  }, []);

  // Helper Function to Get ISO Week Number (Local Time)
  const getISOWeekNumber = (date) => {
    const tempDate = new Date(date.getTime());
    
    // Set to nearest Thursday (ISO standard)
    tempDate.setDate(tempDate.getDate() + (4 - (tempDate.getDay() || 7)));
    
    // First Thursday of the year
    const firstThursday = new Date(tempDate.getFullYear(), 0, 4);
    firstThursday.setDate(firstThursday.getDate() + (4 - (firstThursday.getDay() || 7)));
    
    // Calculate difference in days and divide by 7 for the week number
    const diff = (tempDate - firstThursday) / 86400000; // Milliseconds in a day
    return Math.ceil(diff / 7) + 1;
  };

  // Function to Reset Weekly Count
  const resetWeeklyCount = useCallback(async () => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Local midnight

        // ✅ Get Day of the Week (0 = Sunday)
        const dayOfWeek = today.getDay();

        // ✅ Only reset if it's Monday (1 = Monday)
        if (dayOfWeek !== 1) {
            console.log("⏩ Not Monday — no reset needed.");
            return;
        }

        // ✅ Get Monday of Current Week
        const monday = new Date(today);
        const offset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Monday = 1
        monday.setDate(today.getDate() + offset);
        monday.setHours(0, 0, 0, 0);

        // ✅ Get ISO Week Number
        const weekNumber = getISOWeekNumber(monday);
        const formattedWeek = `${monday.getFullYear()}-W${String(weekNumber).padStart(2, "0")}`;

        // ✅ Prepare Timestamp for Reset
        const weekMidnight = Timestamp.fromDate(monday);

        // ✅ Fetch Weekly Record from Firestore
        const weeklyRecordRef = doc(db, "metadata", "weekly", "records", formattedWeek);
        const snapshot = await getDoc(weeklyRecordRef);

        if (snapshot.exists()) {
            const data = snapshot.data();
            const lastReset = data.date?.toDate().getTime();
            const currentReset = weekMidnight.toDate().getTime();

            if (lastReset !== currentReset) {
                await setDoc(weeklyRecordRef, {
                    reports: 0,
                    responses: 0,
                    routes: 0,
                    stations: 0,
                    users: 0,
                    credits: 0,
                    date: weekMidnight,
                });
                console.log(`✅ Weekly count reset for ${formattedWeek}.`);
            } else {
                console.log(`ℹ️ Weekly count is already up to date (${formattedWeek}).`);
            }
        } else {
            // If no record exists, create it
            await setDoc(weeklyRecordRef, {
                reports: 0,
                responses: 0,
                routes: 0,
                stations: 0,
                users: 0,
                credits: 0,
                date: weekMidnight,
            });
            console.log(`✅ New weekly record created for ${formattedWeek}.`);
        }
    } catch (error) {
        console.error("❌ Error resetting weekly count:", error);
    }
  }, []);

  // Function to Reset Monthly Count
  const resetMonthlyCount = useCallback(async () => {
    try {
        // Get today's date and format as YYYY-MM
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Set to midnight
        const formattedMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
        const monthMidnight = Timestamp.fromDate(today);

        // Reference to monthly record document
        const monthlyRecordRef = doc(db, "metadata", "monthly", "records", formattedMonth);
        const snapshot = await getDoc(monthlyRecordRef);

        if (snapshot.exists()) {
            const data = snapshot.data();
            // Check if the last reset was NOT this month
            if (data.date?.toDate().getTime() !== monthMidnight.toDate().getTime()) {
                await setDoc(monthlyRecordRef, {
                    reports: 0,
                    responses: 0,
                    routes: 0,
                    stations: 0,
                    users: 0,
                    credits: 0,
                    date: monthMidnight,
                });
                console.log(`✅ Monthly count reset for ${formattedMonth}.`);
            } else {
                console.log(`ℹ️ Monthly count is already up to date.`);
            }
        } else {
            // No record for this month exists — create it
            await setDoc(monthlyRecordRef, {
                reports: 0,
                responses: 0,
                routes: 0,
                stations: 0,
                users: 0,
                credits: 0,
                date: monthMidnight,
            });
            console.log(`✅ New monthly record created for ${formattedMonth}.`);
        }
    } catch (error) {
        console.error("❌ Error resetting monthly count:", error);
    }
  }, []);

  // Function to Reset Quarterly Count
  const resetQuarterlyCount = useCallback(async () => {
    try {
        // Get today's date
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Set to midnight

        // Determine current quarter (Q1, Q2, Q3, Q4)
        const month = today.getMonth(); // 0 = January
        const quarter = Math.floor(month / 3) + 1; // Q1-Q4
        const year = today.getFullYear();

        // Format as YYYY-Q#
        const formattedQuarter = `${year}-Q${quarter}`;
        const quarterMidnight = Timestamp.fromDate(today);

        // Reference to quarterly record document
        const quarterlyRecordRef = doc(db, "metadata", "quarterly", "records", formattedQuarter);
        const snapshot = await getDoc(quarterlyRecordRef);

        if (snapshot.exists()) {
            const data = snapshot.data();
            // Check if the last reset was NOT this quarter
            if (data.date?.toDate().getTime() !== quarterMidnight.toDate().getTime()) {
                await setDoc(quarterlyRecordRef, {
                    reports: 0,
                    responses: 0,
                    routes: 0,
                    stations: 0,
                    users: 0,
                    credits: 0,
                    date: quarterMidnight,
                });
                console.log(`✅ Quarterly count reset for ${formattedQuarter}.`);
            } else {
                console.log(`ℹ️ Quarterly count is already up to date.`);
            }
        } else {
            // No record for this quarter exists — create it
            await setDoc(quarterlyRecordRef, {
                reports: 0,
                responses: 0,
                routes: 0,
                stations: 0,
                users: 0,
                credits: 0,
                date: quarterMidnight,
            });
            console.log(`✅ New quarterly record created for ${formattedQuarter}.`);
        }
    } catch (error) {
        console.error("❌ Error resetting quarterly count:", error);
    }
  }, []);

  // Function to Reset Yearly Count
  const resetYearlyCount = useCallback(async () => {
    try {
        // Get the current year
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Set to midnight

        const currentYear = today.getFullYear(); // e.g., 2025
        const yearMidnight = Timestamp.fromDate(today);

        // Reference to yearly record document
        const yearlyRecordRef = doc(db, "metadata", "yearly", "records", `${currentYear}`);
        const snapshot = await getDoc(yearlyRecordRef);

        if (snapshot.exists()) {
            const data = snapshot.data();
            // Check if the last reset was NOT this year
            if (data.date?.toDate().getTime() !== yearMidnight.toDate().getTime()) {
                await setDoc(yearlyRecordRef, {
                    reports: 0,
                    responses: 0,
                    routes: 0,
                    stations: 0,
                    users: 0,
                    credits: 0,
                    date: yearMidnight,
                });
                console.log(`✅ Yearly count reset for ${currentYear}.`);
            } else {
                console.log(`ℹ️ Yearly count is already up to date.`);
            }
        } else {
            // No record for this year exists — create it
            await setDoc(yearlyRecordRef, {
                reports: 0,
                responses: 0,
                routes: 0,
                stations: 0,
                users: 0,
                credits: 0,
                date: yearMidnight,
            });
            console.log(`✅ New yearly record created for ${currentYear}.`);
        }
    } catch (error) {
        console.error("❌ Error resetting yearly count:", error);
    }
  }, []);

  // Function to Update Weekly Count
  const updateWeeklyCount = useCallback(async () => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Local midnight

        // ✅ Get Monday of Current Week (Local Time)
        const day = today.getDay();
        const monday = new Date(today);
        const offset = day === 0 ? -6 : 1 - day;
        monday.setDate(today.getDate() + offset);
        monday.setHours(0, 0, 0, 0);

        // ✅ Get Sunday of the Week
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        sunday.setHours(23, 59, 59, 999);

        // ✅ Get Correct ISO Week Number
        const weekNumber = getISOWeekNumber(monday);
        const formattedWeek = `${monday.getUTCFullYear()}-W${String(weekNumber).padStart(2, "0")}`;
        console.log(`📅 Correct Week: ${formattedWeek}`);

        console.log("🔥 Querying Firestore from:", monday.toISOString(), "to", sunday.toISOString());

        // ✅ Firestore Query
        const dailyRecordsRef = collection(db, "metadata", "daily", "records");
        const q = query(
            dailyRecordsRef,
            where("date", ">=", Timestamp.fromDate(monday)),
            where("date", "<=", Timestamp.fromDate(sunday))
        );

        const querySnapshot = await getDocs(q);

        let totalReports = 0;
        let totalResponses = 0;
        let totalRoutes = 0;
        let totalStations = 0;
        let totalUsers = 0;
        let totalCredits = 0;

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            console.log(`✔ Including record: ${doc.id}, Firestore Date:`, doc.data().date.toDate().toISOString());
            totalReports += data.reports || 0;
            totalResponses += data.responses || 0;
            totalRoutes += data.routes || 0;
            totalStations += data.stations || 0;
            totalUsers += data.users || 0;
            totalCredits += data.credits || 0;
        });

        // ✅ Store the weekly count
        const weeklyRecordRef = doc(db, "metadata", "weekly", "records", formattedWeek);
        await setDoc(weeklyRecordRef, {
            reports: totalReports,
            responses: totalResponses,
            routes: totalRoutes,
            stations: totalStations,
            users: totalUsers,
            credits: totalCredits,
            date: Timestamp.fromDate(today),
        }, { merge: true });

        console.log(`✅ Weekly count updated for ${formattedWeek}.`);
    } catch (error) {
        console.error("❌ Error updating weekly count:", error);
    }
  }, []);

  // Function to Update Monthly Count
  const updateMonthlyCount = useCallback(async () => {
    try {
        const today = new Date();

        // Get previous month (YYYY-MM)
        today.setMonth(today.getMonth() - 1);
        const targetMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;

        // Get first and last day of the previous month
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

        // Convert to Firestore timestamps
        const startTimestamp = Timestamp.fromDate(startOfMonth);
        const endTimestamp = Timestamp.fromDate(endOfMonth);

        // Query Firestore for all daily records in the month
        const dailyRecordsRef = collection(db, "metadata", "daily", "records");
        const q = query(
            dailyRecordsRef,
            where("date", ">=", startTimestamp),
            where("date", "<=", endTimestamp)
        );
        const querySnapshot = await getDocs(q);

        let totalReports = 0;
        let totalResponses = 0;
        let totalRoutes = 0;
        let totalStations = 0;
        let totalUsers = 0;
        let totalCredits = 0;

        // Sum up all data
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            totalReports += data.reports || 0;
            totalResponses += data.responses || 0;
            totalRoutes += data.routes || 0;
            totalStations += data.stations || 0;
            totalUsers += data.users || 0;
            totalCredits += data.credits || 0;
        });

        // Save aggregated monthly data
        const monthlyRecordRef = doc(db, "metadata", "monthly", "records", targetMonth);
        await setDoc(monthlyRecordRef, {
            reports: totalReports,
            responses: totalResponses,
            routes: totalRoutes,
            stations: totalStations,
            users: totalUsers,
            credits: totalCredits,
            date: Timestamp.fromDate(new Date()), // Store the update timestamp
        }, { merge: true });

        console.log(`✅ Monthly count updated for ${targetMonth}.`);
    } catch (error) {
        console.error("❌ Error updating monthly count:", error);
    }
  }, []);

  // Function to Update Periodically Monthly Count
  const updatePreMonthlyCount = useCallback(async (periodType) => {
    try {
      const today = new Date();
      const currentYear = today.getFullYear();
      const currentMonth = today.getMonth(); // 0-11
      
      // Format target month as YYYY-MM (current month)
      const targetMonth = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`;
      
      // Determine the start and end days based on period type
      let startDay, endDay, periodKey;
      
      if (periodType === "period1") {
        startDay = 1;
        endDay = 10;
        periodKey = "p1_processed";
      } else if (periodType === "period2") {
        startDay = 11;
        endDay = 20;
        periodKey = "p2_processed";
      } else if (periodType === "period3") {
        startDay = 21;
        endDay = new Date(currentYear, currentMonth + 1, 0).getDate(); // Last day of month
        periodKey = "p3_processed";
      } else {
        // Default: count for the entire month
        startDay = 1;
        endDay = new Date(currentYear, currentMonth + 1, 0).getDate(); // Last day of month
        periodKey = "full_processed";
      }
      
      // Create date range for the specified period
      const startDate = new Date(currentYear, currentMonth, startDay);
      const endDate = new Date(currentYear, currentMonth, endDay);
      endDate.setHours(23, 59, 59, 999); // End of day
      
      // Convert to Firestore timestamps
      const startTimestamp = Timestamp.fromDate(startDate);
      const endTimestamp = Timestamp.fromDate(endDate);
      
      // Query Firestore for all daily records in the specified period
      const dailyRecordsRef = collection(db, "metadata", "daily", "records");
      const q = query(
        dailyRecordsRef,
        where("date", ">=", startTimestamp),
        where("date", "<=", endTimestamp)
      );
      const querySnapshot = await getDocs(q);
      
      // Calculate totals for the current period
      let periodReports = 0;
      let periodResponses = 0;
      let periodRoutes = 0;
      let periodStations = 0;
      let periodUsers = 0;
      let periodCredits = 0;
      
      // Sum up all data for this period
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        periodReports += data.reports || 0;
        periodResponses += data.responses || 0;
        periodRoutes += data.routes || 0;
        periodStations += data.stations || 0;
        periodUsers += data.users || 0;
        periodCredits += data.credits || 0;
      });
      
      // Get the existing monthly document if it exists
      const monthlyRecordRef = doc(db, "metadata", "monthly", "records", targetMonth);
      const monthlyDoc = await getDoc(monthlyRecordRef);
      
      // Initialize with this period's data
      let finalReports = periodReports;
      let finalResponses = periodResponses;
      let finalRoutes = periodRoutes;
      let finalStations = periodStations;
      let finalUsers = periodUsers;
      let finalCredits = periodCredits;
      
      if (monthlyDoc.exists()) {
        const existingData = monthlyDoc.data();
        
        // If this period was already processed, we need to be careful not to double-count
        if (existingData[periodKey] === true) {
          console.log(`ℹ️ Period ${periodType} already processed for ${targetMonth}. Skipping.`);
          return true;
        }
        
        // Add current period data to existing values
        finalReports += existingData.reports || 0;
        finalResponses += existingData.responses || 0;
        finalRoutes += existingData.routes || 0;
        finalStations += existingData.stations || 0;
        finalUsers += existingData.users || 0;
        finalCredits += existingData.credits || 0;
      }
      
      // Save aggregated data using the same structure as original, plus the processed flag
      await setDoc(monthlyRecordRef, {
        reports: finalReports,
        responses: finalResponses,
        routes: finalRoutes,
        stations: finalStations,
        users: finalUsers,
        credits: finalCredits,
        date: Timestamp.fromDate(new Date()),
        [periodKey]: true // Mark this period as processed
      }, { merge: true });
      
      console.log(`✅ Pre-Monthly count updated for ${targetMonth} (days ${startDay}-${endDay}). Added ${periodReports} reports.`);
      return true;
    } catch (error) {
      console.error("❌ Error updating pre-monthly count:", error);
      return false;
    }
  }, []);

  // Function to Update Quarterly Count
  const updateQuarterlyCount = useCallback(async () => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Set to midnight

        // Get Current Year and Quarter
        const year = today.getFullYear();
        const month = today.getMonth(); // 0 = Jan
        const quarter = Math.floor(month / 3) + 1; // Q1-Q4

        // Quarter Start and End Months
        const startMonth = (quarter - 1) * 3; // Jan=0, Apr=3, Jul=6, Oct=9
        const endMonth = startMonth + 2;

        // Date Range for the Quarter
        const startDate = new Date(year, startMonth, 1);
        const endDate = new Date(year, endMonth + 1, 0); // Last day of end month

        // Format for Quarterly Document ID
        const formattedQuarter = `${year}-Q${quarter}`;

        // Firestore Timestamps
        const startTimestamp = Timestamp.fromDate(startDate);
        const endTimestamp = Timestamp.fromDate(endDate);

        // Reference to monthly records collection
        const monthlyRecordsRef = collection(db, "metadata", "monthly", "records");
        const q = query(
            monthlyRecordsRef,
            where("date", ">=", startTimestamp),
            where("date", "<=", endTimestamp)
        );

        const querySnapshot = await getDocs(q);

        let totalReports = 0;
        let totalResponses = 0;
        let totalRoutes = 0;
        let totalStations = 0;
        let totalUsers = 0;
        let totalCredits = 0;

        // Sum all monthly counts for the current quarter
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            totalReports += data.reports || 0;
            totalResponses += data.responses || 0;
            totalRoutes += data.routes || 0;
            totalStations += data.stations || 0;
            totalUsers += data.users || 0;
            totalCredits += data.credits || 0;
        });

        // Reference to quarterly record document
        const quarterlyRecordRef = doc(db, "metadata", "quarterly", "records", formattedQuarter);
        await setDoc(quarterlyRecordRef, {
            reports: totalReports,
            responses: totalResponses,
            routes: totalRoutes,
            stations: totalStations,
            users: totalUsers,
            credits: totalCredits,
            date: Timestamp.fromDate(today),
        }, { merge: true });

        console.log(`✅ Quarterly count updated for ${formattedQuarter}.`);
    } catch (error) {
        console.error("❌ Error updating quarterly count:", error);
    }
  }, []);

  // Update Global Count
  const updateGlobalCount = useCallback(async () => {
    const globalCountRef = doc(db, "metadata", "global");
    const snapshot = await getDoc(globalCountRef);

    if (snapshot.exists()) {
        const globalData = snapshot.data();

        // Use Firestore count aggregation for efficiency
        const [reportsSnap, responsesSnap, routesSnap, stationsSnap, usersSnap] = await Promise.all([
            getCountFromServer(collection(db, "reports")),
            getCountFromServer(collection(db, "response")),
            getCountFromServer(collection(db, "routes")),
            getCountFromServer(collection(db, "stations")),
            getCountFromServer(collection(db, "users")),
        ]);

        const correctCounts = {
            reports: reportsSnap.data().count,
            responses: responsesSnap.data().count,
            routes: routesSnap.data().count,
            stations: stationsSnap.data().count,
            users: usersSnap.data().count,
        };

        // Get today's date in YYYY-MM-DD format
        const today = new Date();
        const formattedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

        // Reference to today's daily record document
        const dailyRecordRef = doc(db, "metadata", "daily", "records", formattedDate);
        const dailySnap = await getDoc(dailyRecordRef);
        const dailyCredits = dailySnap.exists() ? dailySnap.data().credits || 0 : 0;

        // Track if an update is needed
        let updated = false;

        // Compare and update counts if needed
        for (const key in correctCounts) {
            if (globalData[key] !== correctCounts[key]) {
                globalData[key] = correctCounts[key];
                updated = true;
            }
        }

        // Handle credit difference
        const lastCreditTotal = globalData.last_credit_total || 0;
        const creditDifference = dailyCredits - lastCreditTotal;

        if (creditDifference > 0) {
            globalData.credits += creditDifference;
            globalData.last_credit_total = dailyCredits; // Update to latest total
            globalData.credits_update = Timestamp.now(); // Store the last update timestamp
            updated = true;
        }

        if (updated) {
            globalData.update = Timestamp.now();
            await updateDoc(globalCountRef, globalData);
            console.log(`✅ Global count has been updated. Credits added: ${creditDifference}`);
        } else {
            console.log("ℹ️ Global count is already accurate.");
        }
    } else {
        console.warn("⚠️ global document does not exist.");
    }
  }, []);

  // Listen for authentication state changes
  useEffect(() => {
    unsubscribeAuthRef.current = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("auth_uid", "==", user.uid));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          setAuthUser(querySnapshot.docs[0].data());
        } else {
          setAuthUser(null);
        }
      } else {
        setAuthUser(null);
      }
    });

    return () => {
      if (unsubscribeAuthRef.current) {
        unsubscribeAuthRef.current();
        unsubscribeAuthRef.current = null;
      }
    };
  }, []);

  // Memoize values to optimize performance
  const memoizedAuthUser = useMemo(() => authUser, [authUser]);
  const memoizedUsers = useMemo(() => users, [users]);
  const memoizedStations = useMemo(() => stations, [stations]);
  const memoizedReports = useMemo(() => reports, [reports]);
  const memoizedResponse = useMemo(() => responses, [responses])
  const memoizedRecords = useMemo(() => ({
    daily: metadata?.daily || {},
    weekly: metadata?.weekly || {},
    monthly: metadata?.monthly || {},
    quarterly: metadata?.quarterly || {},
    yearly: metadata?.yearly || {},
    global: metadata?.global || {}
  }), [metadata]);  

  return (
    <DataContext.Provider
      value={{
        authUser: memoizedAuthUser,
        users: memoizedUsers,
        stations: memoizedStations,
        reports: memoizedReports,
        records: memoizedRecords,
        responds: memoizedResponse,
        setAuthUser,
        loadingUsers,
        loadingStations,
        loadingReports,
        loadingMetadata,
        loadingResponses,
        startUsersListener,
        stopUsersListener,
        startStationsListener,
        stopStationsListener,
        startReportsListener,
        stopReportsListener,
        startMetadataListener,
        stopMetadataListener,
        startResponsesListener,
        stopResponsesListener,
        resetDailyCount,
        resetWeeklyCount,
        resetMonthlyCount,
        resetQuarterlyCount,
        resetYearlyCount,
        updateWeeklyCount,
        updateMonthlyCount,
        updatePreMonthlyCount,
        updateQuarterlyCount,
        updateGlobalCount,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};