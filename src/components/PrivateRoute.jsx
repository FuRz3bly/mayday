import { Navigate, Outlet } from "react-router-dom";
import { auth } from "../config/firebaseConfig";
import { useEffect, useState } from "react";

const PrivateRoute = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) return <div>Loading...</div>; // Prevent flashing content while checking auth

  return user ? <Outlet /> : <Navigate to="/login" />;
};

export default PrivateRoute;