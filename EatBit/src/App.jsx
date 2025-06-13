import React from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "./firebase";
import "./styles/App.css";

// Pages
import OrdersPage from "./pages/OrdersPage";
import Checkout from "./pages/Checkout";
import LandingPage from "./pages/LandingPage";
import Home from "./pages/Home";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import UserData from "./pages/UserData";
import Outlets from "./pages/Outlets";
import OutletDetail from "./pages/OutletDetail";
import Cart from "./pages/Cart";

// Components
import PrivateRoute from "./components/PrivateRoute";
import Navbar from "./components/Navbar";
import { CartProvider } from "./context/CartContext";

function AppContent({ user }) {
  const location = useLocation();
  const hideNavbarPaths = ["/", "/login", "/signup"];
  const shouldHideNavbar = hideNavbarPaths.includes(location.pathname);

  return (
    <div className="app-container">
      {!shouldHideNavbar && <Navbar user={user} />}
      
      <div className={`main-content ${shouldHideNavbar ? "no-navbar" : "with-navbar"}`}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          <Route element={<PrivateRoute />}>
            <Route path="/home" element={<Home />} />
            <Route path="/user" element={<UserData />} />
            <Route path="/checkout/:shopName" element={<Checkout />} />
            <Route path="/outlets" element={<Outlets />} />
            <Route path="/orders/:shopName" element={<OrdersPage />} /> {/* ✅ Updated route */}
            <Route path="/outlets/:outletName" element={<OutletDetail />} />
            <Route path="/cart" element={<Cart />} />
          </Route>
        </Routes>
      </div>
    </div>
  );
}

function App() {
  const [user, loading] = useAuthState(auth);

  if (loading) return <p>Loading...</p>;

  return (
    <CartProvider user={user}>
      <Router>
        <AppContent user={user} />
      </Router>
    </CartProvider>
  );
}

export default App;
