import React from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "./firebase";

import "./styles/index.css";

// Pages
import OrdersPage from "./pages/OrdersPage";
import Checkout from "./pages/Checkout";
import LandingPage from "./pages/LandingPage";
import Home from "./pages/Home";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import UserData from "./pages/UserData";
import Outlets from "./pages/Outlets";
import OutletDetails from "./pages/OutletDetails";
import Cart from "./pages/Cart";
import MyOrders from "./pages/MyOrders";

// Admin Pages
import AdminAuth from "./pages/AdminAuth";
import AdminDashboard from "./pages/AdminDashboard";
import ProtectedAddOutlet from "./pages/ProtectedAddOutlet";
import EditOutlet from "./pages/EditOutlet";

// Outlet Pages
import OutletSignup from "./pages/OutletSignup";
import OutletLogin from "./pages/OutletLogin";
import OutletDashboard from "./pages/OutletDashboard";

// Components
import PrivateRoute from "./components/PrivateRoute";
import Navbar from "./components/Navbar";
import { CartProvider } from "./context/CartContext";

function AppContent({ user }) {
  const location = useLocation();
  const hideNavbarPaths = [
    "/", 
    "/login", 
    "/signup", 
    "/admin-login", 
    "/admin-dashboard", 
    "/add-outlet",
    "/outlet-signup",
    "/outlet-login",
    "/outlet-dashboard"
  ];
  
  const shouldHideNavbar = hideNavbarPaths.includes(location.pathname) || 
                          location.pathname.startsWith("/edit-outlet/");

  return (
    <div className="app-container">
      {!shouldHideNavbar && <Navbar user={user} />}

      <div className={`main-content ${shouldHideNavbar ? "no-navbar" : "with-navbar"}`}>
        <Routes>
          {/* Public Routes - Accessible without login */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/outlets" element={<Outlets />} />
          <Route path="/outlets/:outletId" element={<OutletDetails />} />
          
          {/* Admin Routes */}
          <Route path="/admin-login" element={<AdminAuth />} />
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
          <Route path="/add-outlet" element={<ProtectedAddOutlet />} />
          <Route path="/edit-outlet/:id" element={<EditOutlet />} />

          {/* Outlet Owner Routes */}
          <Route path="/outlet-signup" element={<OutletSignup />} />
          <Route path="/outlet-login" element={<OutletLogin />} />
          <Route path="/outlet-dashboard" element={<OutletDashboard />} />

          {/* Protected User Routes - Require login */}
          <Route element={<PrivateRoute />}>
            <Route path="/home" element={<Home />} />
            <Route path="/user" element={<UserData />} />
            <Route path="/checkout/:shopName" element={<Checkout />} />
            <Route path="/orders/:shopName" element={<OrdersPage />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/my-orders" element={<MyOrders />} />
          </Route>
        </Routes>
      </div>
    </div>
  );
}

function App() {
  const [user, loading] = useAuthState(auth);

  if (loading) {
    return (
      <div className="loading-screen flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-red-500 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <CartProvider user={user}>
        <AppContent user={user} />
      </CartProvider>
    </Router>
  );
}

export default App;