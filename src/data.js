import { createContext, useState, useEffect, useMemo, useRef } from "react";
import { collection, onSnapshot, query, where, getDocs } from "firebase/firestore";
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

  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingStations, setLoadingStations] = useState(false);
  const [loadingReports, setLoadingReports] = useState(false);

  const unsubscribeUsersRef = useRef(null);
  const unsubscribeStationsRef = useRef(null);
  const unsubscribeReportsRef = useRef(null);
  const unsubscribeAuthRef = useRef(null);

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

  return (
    <DataContext.Provider
      value={{
        authUser: memoizedAuthUser,
        users: memoizedUsers,
        stations: memoizedStations,
        reports: memoizedReports,
        setAuthUser,
        loadingUsers,
        loadingStations,
        loadingReports,
        startUsersListener,
        stopUsersListener,
        startStationsListener,
        stopStationsListener,
        startReportsListener,
        stopReportsListener,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};