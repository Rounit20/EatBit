import { Navigate, Outlet } from "react-router-dom";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../firebase"; // Import Firebase auth

const PrivateRoute = () => {
  const [user, loading] = useAuthState(auth);

  if (loading) return <p>Loading...</p>; // Show loading while checking auth state

  return user ? <Outlet /> : <Navigate to="/login" replace />;
};

export default PrivateRoute;
