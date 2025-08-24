import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { FaUserCircle, FaShoppingCart, FaBars, FaUser, FaClipboardList, FaSignOutAlt } from "react-icons/fa";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";

const Navbar = ({ user }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isPopupVisible, setPopupVisible] = useState(false);
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);

  const togglePopup = () => setPopupVisible((prev) => !prev);

  useEffect(() => {
    const handleClickOutside = (event) => {
      // Don't close popup if clicking on buttons inside it
      if (isPopupVisible && !event.target.closest(".user-profile") && !event.target.closest(".popup")) {
        setPopupVisible(false);
      }
      if (isMobileMenuOpen && !event.target.closest(".mobile-menu") && !event.target.closest(".mobile-nav")) {
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isPopupVisible, isMobileMenuOpen]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error.message);
    }
  };

  const isActivePage = (path) => location.pathname === path;

  return (
    <>
      {/* Navigation Bar */}
      <nav className="fixed top-0 left-0 w-full h-[75px] bg-white/95 backdrop-blur-md px-8 flex items-center justify-between z-[1000] shadow-lg border-b border-white/20">
        {/* Logo */}
        <div className="flex items-center">
          <Link to="/home" className="flex items-center no-underline">
            <img
              src="/eatbit-logo-dark.png"
              alt="EatBit Logo"
              className="h-10"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'block';
              }}
            />
            <div className="hidden text-2xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
              EatBit
            </div>
          </Link>
        </div>

        {/* Desktop Navigation Links */}
        <div className="hidden lg:flex items-center gap-1">
          <Link 
            to="/home" 
            className={`px-6 py-3 rounded-full font-semibold text-gray-800 transition-all duration-300 ease-out hover:bg-gradient-to-r hover:from-orange-500 hover:to-red-500 hover:text-white hover:-translate-y-1 hover:scale-105 hover:shadow-lg hover:shadow-orange-500/40 ${
              isActivePage("/home") 
                ? "bg-gradient-to-r from-orange-500 to-red-500 text-white -translate-y-0.5 shadow-lg shadow-orange-500/30" 
                : ""
            }`}
          >
            Home
          </Link>
          <Link 
            to="/menu" 
            className={`px-6 py-3 rounded-full font-semibold text-gray-800 transition-all duration-300 ease-out hover:bg-gradient-to-r hover:from-orange-500 hover:to-red-500 hover:text-white hover:-translate-y-1 hover:scale-105 hover:shadow-lg hover:shadow-orange-500/40 ${
              isActivePage("/menu") 
                ? "bg-gradient-to-r from-orange-500 to-red-500 text-white -translate-y-0.5 shadow-lg shadow-orange-500/30" 
                : ""
            }`}
          >
            Browse Menu
          </Link>
          <Link 
            to="/offers" 
            className={`px-6 py-3 rounded-full font-semibold text-gray-800 transition-all duration-300 ease-out hover:bg-gradient-to-r hover:from-orange-500 hover:to-red-500 hover:text-white hover:-translate-y-1 hover:scale-105 hover:shadow-lg hover:shadow-orange-500/40 ${
              isActivePage("/offers") 
                ? "bg-gradient-to-r from-orange-500 to-red-500 text-white -translate-y-0.5 shadow-lg shadow-orange-500/30" 
                : ""
            }`}
          >
            Special Offers
          </Link>
          <Link 
            to="/outlets" 
            className={`px-6 py-3 rounded-full font-semibold text-gray-800 transition-all duration-300 ease-out hover:bg-gradient-to-r hover:from-orange-500 hover:to-red-500 hover:text-white hover:-translate-y-1 hover:scale-105 hover:shadow-lg hover:shadow-orange-500/40 ${
              isActivePage("/outlets") 
                ? "bg-gradient-to-r from-orange-500 to-red-500 text-white -translate-y-0.5 shadow-lg shadow-orange-500/30" 
                : ""
            }`}
          >
            Outlets
          </Link>
          <Link 
            to="/track-order" 
            className={`px-6 py-3 rounded-full font-semibold text-gray-800 transition-all duration-300 ease-out hover:bg-gradient-to-r hover:from-orange-500 hover:to-red-500 hover:text-white hover:-translate-y-1 hover:scale-105 hover:shadow-lg hover:shadow-orange-500/40 ${
              isActivePage("/track-order") 
                ? "bg-gradient-to-r from-orange-500 to-red-500 text-white -translate-y-0.5 shadow-lg shadow-orange-500/30" 
                : ""
            }`}
          >
            Track Order
          </Link>
        </div>

        {/* User Profile & Cart */}
        {user && (
          <div className="flex items-center relative mr-5">
            {/* Cart Icon with Badge */}
            <div className="relative mr-5">
              <FaShoppingCart
                size={28}
                className="text-gray-600 cursor-pointer transition-all duration-300 hover:text-orange-500 hover:scale-110 drop-shadow-sm"
                onClick={() => navigate("/cart")}
              />
              {/* Cart Badge */}
              <div className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shadow-lg shadow-red-500/40 animate-pulse">
                3
              </div>
            </div>

            {/* Mobile Menu Button */}
            <FaBars
              size={24}
              className="text-gray-600 cursor-pointer hidden lg:hidden block transition-all duration-300 hover:text-orange-500"
              onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}
            />

            {/* User Icon */}
            <FaUserCircle
              size={40}
              className="text-gray-600 cursor-pointer mr-2 transition-all duration-300 hover:text-orange-500 hover:scale-110 drop-shadow-sm"
              onClick={togglePopup}
            />

            {/* Professional User Dropdown */}
            <div
              className={`popup absolute top-16 right-0 bg-white rounded-lg shadow-xl z-[1001] min-w-[280px] border border-gray-200 overflow-hidden transition-all duration-300 ease-out ${
                isPopupVisible 
                  ? "opacity-100 translate-y-0 scale-100 pointer-events-auto" 
                  : "opacity-0 -translate-y-4 scale-95 pointer-events-none"
              }`}
            >
              {/* Simple Header */}
              <div className="p-4 border-b border-gray-100 bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    <FaUserCircle size={24} className="text-gray-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h6 className="text-sm font-semibold text-gray-800 truncate m-0">
                      {user.displayName || "User"}
                    </h6>
                    <p className="text-xs text-gray-500 truncate mt-0.5 m-0">
                      {user.email}
                    </p>
                  </div>
                </div>
              </div>

              {/* Menu Items */}
              <div className="py-2">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log("Profile button clicked"); // Debug log
                    setPopupVisible(false);
                    navigate("/user");
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors duration-200 flex items-center gap-3 text-gray-700 border-none bg-transparent cursor-pointer"
                >
                  <FaUser className="text-gray-500" size={16} />
                  <div>
                    <div className="text-sm font-medium">My Profile</div>
                    <div className="text-xs text-gray-500">Manage account settings</div>
                  </div>
                </button>

                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log("MyOrders button clicked"); // Debug log
                    setPopupVisible(false);
                    navigate("/my-orders");
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors duration-200 flex items-center gap-3 text-gray-700 border-none bg-transparent cursor-pointer"
                >
                  <FaClipboardList className="text-gray-500" size={16} />
                  <div>
                    <div className="text-sm font-medium">My Orders</div>
                    <div className="text-xs text-gray-500">Track your orders</div>
                  </div>
                </button>

                <hr className="border-0 border-t border-gray-200 my-2" />

                <button 
                  onClick={async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log("Logout button clicked"); // Debug log
                    setPopupVisible(false);
                    await handleLogout();
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors duration-200 flex items-center gap-3 text-red-600 border-none bg-transparent cursor-pointer"
                >
                  <FaSignOutAlt className="text-red-500" size={16} />
                  <div>
                    <div className="text-sm font-medium">Sign Out</div>
                    <div className="text-xs text-gray-500">Sign out of account</div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Spacer to prevent content overlap */}
      <div className="h-[75px] w-full"></div>

      {/* Mobile Menu */}
      <div 
        className={`fixed top-[75px] left-0 right-0 bg-white shadow-xl z-[999] p-5 border-b border-gray-200 backdrop-blur-md transition-all duration-300 lg:hidden ${
          isMobileMenuOpen 
            ? "opacity-100 translate-y-0 pointer-events-auto" 
            : "opacity-0 -translate-y-full pointer-events-none"
        }`}>
        <div className="flex flex-col gap-3">
          <Link 
            to="/home" 
            className={`block px-5 py-4 rounded-2xl font-semibold text-gray-800 transition-all duration-300 bg-gray-50 border border-gray-200 hover:bg-gradient-to-r hover:from-orange-500 hover:to-red-500 hover:text-white hover:translate-x-2 hover:scale-105 hover:shadow-lg hover:shadow-orange-500/30 hover:border-transparent ${
              isActivePage("/home") 
                ? "bg-gradient-to-r from-orange-500 to-red-500 text-white border-transparent shadow-lg shadow-orange-500/30" 
                : ""
            }`}
            onClick={() => setMobileMenuOpen(false)}
          >
            Home
          </Link>
          <Link 
            to="/menu" 
            className={`block px-5 py-4 rounded-2xl font-semibold text-gray-800 transition-all duration-300 bg-gray-50 border border-gray-200 hover:bg-gradient-to-r hover:from-orange-500 hover:to-red-500 hover:text-white hover:translate-x-2 hover:scale-105 hover:shadow-lg hover:shadow-orange-500/30 hover:border-transparent ${
              isActivePage("/menu") 
                ? "bg-gradient-to-r from-orange-500 to-red-500 text-white border-transparent shadow-lg shadow-orange-500/30" 
                : ""
            }`}
            onClick={() => setMobileMenuOpen(false)}
          >
            Browse Menu
          </Link>
          <Link 
            to="/offers" 
            className={`block px-5 py-4 rounded-2xl font-semibold text-gray-800 transition-all duration-300 bg-gray-50 border border-gray-200 hover:bg-gradient-to-r hover:from-orange-500 hover:to-red-500 hover:text-white hover:translate-x-2 hover:scale-105 hover:shadow-lg hover:shadow-orange-500/30 hover:border-transparent ${
              isActivePage("/offers") 
                ? "bg-gradient-to-r from-orange-500 to-red-500 text-white border-transparent shadow-lg shadow-orange-500/30" 
                : ""
            }`}
            onClick={() => setMobileMenuOpen(false)}
          >
            Special Offers
          </Link>
          <Link 
            to="/outlets" 
            className={`block px-5 py-4 rounded-2xl font-semibold text-gray-800 transition-all duration-300 bg-gray-50 border border-gray-200 hover:bg-gradient-to-r hover:from-orange-500 hover:to-red-500 hover:text-white hover:translate-x-2 hover:scale-105 hover:shadow-lg hover:shadow-orange-500/30 hover:border-transparent ${
              isActivePage("/outlets") 
                ? "bg-gradient-to-r from-orange-500 to-red-500 text-white border-transparent shadow-lg shadow-orange-500/30" 
                : ""
            }`}
            onClick={() => setMobileMenuOpen(false)}
          >
            Outlets
          </Link>
          <Link 
            to="/track-order" 
            className={`block px-5 py-4 rounded-2xl font-semibold text-gray-800 transition-all duration-300 bg-gray-50 border border-gray-200 hover:bg-gradient-to-r hover:from-orange-500 hover:to-red-500 hover:text-white hover:translate-x-2 hover:scale-105 hover:shadow-lg hover:shadow-orange-500/30 hover:border-transparent ${
              isActivePage("/track-order") 
                ? "bg-gradient-to-r from-orange-500 to-red-500 text-white border-transparent shadow-lg shadow-orange-500/30" 
                : ""
            }`}
            onClick={() => setMobileMenuOpen(false)}
          >
            Track Order
          </Link>
        </div>

        {/* Mobile User Profile & Cart */}
        {user && (
          <div className="user-profile flex items-center relative mr-15 mt-4 pt-4 border-t border-gray-200">
            {/* Cart Icon with Badge */}
            <div className="relative mr-5">
              <FaShoppingCart
                size={28}
                className="text-gray-600 cursor-pointer transition-all duration-300 hover:text-orange-500 hover:scale-110 drop-shadow-sm"
                onClick={() => navigate("/cart")}
              />
              {/* Cart Badge */}
              <div className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shadow-lg shadow-red-500/40 animate-pulse">
                3
              </div>
            </div>

            {/* User Icon */}
            <FaUserCircle
              size={40}
              className="text-gray-600 cursor-pointer mr-5 transition-all duration-300 hover:text-orange-500 hover:scale-110 drop-shadow-sm"
              onClick={togglePopup}
            />

            {/* Mobile Professional User Dropdown */}
            <div
              className={`popup absolute top-16 right-0 bg-white rounded-lg shadow-xl z-[1001] min-w-[280px] border border-gray-200 overflow-hidden transition-all duration-300 ease-out ${
                isPopupVisible 
                  ? "opacity-100 translate-y-0 scale-100 pointer-events-auto" 
                  : "opacity-0 -translate-y-4 scale-95 pointer-events-none"
              }`}
            >
              {/* Simple Header */}
              <div className="p-4 border-b border-gray-100 bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    <FaUserCircle size={24} className="text-gray-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h6 className="text-sm font-semibold text-gray-800 truncate m-0">
                      {user.displayName || "User"}
                    </h6>
                    <p className="text-xs text-gray-500 truncate mt-0.5 m-0">
                      {user.email}
                    </p>
                  </div>
                </div>
              </div>

              {/* Menu Items */}
              <div className="py-2">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log("Mobile Profile button clicked"); // Debug log
                    setPopupVisible(false);
                    navigate("/user");
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors duration-200 flex items-center gap-3 text-gray-700 border-none bg-transparent cursor-pointer"
                >
                  <FaUser className="text-gray-500" size={16} />
                  <div>
                    <div className="text-sm font-medium">My Profile</div>
                    <div className="text-xs text-gray-500">Manage account settings</div>
                  </div>
                </button>

                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log("Mobile Orders button clicked"); // Debug log
                    setPopupVisible(false);
                    navigate("/my-orders");
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors duration-200 flex items-center gap-3 text-gray-700 border-none bg-transparent cursor-pointer"
                >
                  <FaClipboardList className="text-gray-500" size={16} />
                  <div>
                    <div className="text-sm font-medium">My Orders</div>
                    <div className="text-xs text-gray-500">Track your orders</div>
                  </div>
                </button>

                <hr className="border-0 border-t border-gray-200 my-2" />

                <button 
                  onClick={async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log("Mobile Logout button clicked"); // Debug log
                    setPopupVisible(false);
                    await handleLogout();
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors duration-200 flex items-center gap-3 text-red-600 border-none bg-transparent cursor-pointer"
                >
                  <FaSignOutAlt className="text-red-500" size={16} />
                  <div>
                    <div className="text-sm font-medium">Sign Out</div>
                    <div className="text-xs text-gray-500">Sign out of account</div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Content Spacer */}
      <div className="h-[75px] w-full"></div>
    </>
  );
};

export default Navbar;