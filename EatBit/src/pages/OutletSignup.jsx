import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import {
  FaStore,
  FaUser,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaUserPlus,
  FaExclamationTriangle,
  FaSpinner,
  FaPhone,
  FaMapMarkerAlt,
  FaEnvelope,
  FaCheckCircle,
  FaClock,
  FaUtensils,
  FaGoogle
} from "react-icons/fa";

const OutletSignup = () => {
  const [formData, setFormData] = useState({
    outletName: "",
    ownerName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    address: "",
    description: "",
    cuisine: "",
    category: "restaurant"
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [tempGoogleData, setTempGoogleData] = useState(null);
  const [applicationId, setApplicationId] = useState("");
  const navigate = useNavigate();
  const [user, authLoading] = useAuthState(auth);

  const categories = ["restaurant", "cafe", "fast-food", "bakery", "bar"];

  // Redirect if already logged in
  useEffect(() => {
    if (user && !authLoading && emailVerified) {
      // Check if user has outlet data in localStorage
      const currentOutlet = JSON.parse(localStorage.getItem('currentOutlet') || '{}');
      if (currentOutlet.outletId) {
        navigate("/outlet-dashboard");
      }
    }
  }, [user, authLoading, navigate, emailVerified]);

  // Check for existing temp Google data on component mount
  useEffect(() => {
    const tempData = localStorage.getItem('tempGoogleUser');
    if (tempData) {
      const parsedData = JSON.parse(tempData);
      setTempGoogleData(parsedData);
      setFormData(prev => ({
        ...prev,
        email: parsedData.email,
        ownerName: parsedData.name || ""
      }));
      setEmailVerified(true);
    }
  }, []);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError("");

    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');
      
      // Add custom parameters to avoid CORS issues
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      if (user.email) {
        // Store the Google user info
        const googleData = {
          uid: user.uid,
          email: user.email,
          name: user.displayName || ""
        };
        
        setTempGoogleData(googleData);
        setFormData(prev => ({
          ...prev,
          email: user.email,
          ownerName: user.displayName || ""
        }));
        setEmailVerified(true);
        
        // Store the Google user data temporarily
        localStorage.setItem('tempGoogleUser', JSON.stringify(googleData));
        
        // Sign out immediately to avoid conflicts
        await auth.signOut();
        
      } else {
        await auth.signOut();
        setError("Unable to get email from Google account. Please try again.");
      }
    } catch (error) {
      console.error("Google sign-in error:", error);
      let errorMessage = "Failed to sign in with Google. Please try again.";
      
      switch (error.code) {
        case 'auth/popup-closed-by-user':
          errorMessage = "Sign-in was cancelled. Please try again.";
          break;
        case 'auth/popup-blocked':
          errorMessage = "Popup was blocked. Please enable popups and try again.";
          break;
        case 'auth/network-request-failed':
          errorMessage = "Network error. Please check your internet connection.";
          break;
        case 'auth/cancelled-popup-request':
          errorMessage = "Sign-in was cancelled. Please try again.";
          break;
        default:
          errorMessage = error.message || "An unexpected error occurred during Google sign-in.";
      }
      
      setError(errorMessage);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Prevent email changes after Google verification
    if (name === 'email' && emailVerified) {
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) setError("");
  };

  const validateForm = () => {
    // Check if email is verified through Google
    if (!emailVerified) {
      setError("Please verify your email through Google Sign-In first");
      return false;
    }

    // Required fields validation
    const requiredFields = {
      outletName: "Outlet name",
      ownerName: "Owner name",
      email: "Email",
      password: "Password",
      confirmPassword: "Confirm password",
      phone: "Phone number",
      address: "Address",
      cuisine: "Cuisine type"
    };

    for (const [field, label] of Object.entries(requiredFields)) {
      if (!formData[field].trim()) {
        setError(`${label} is required`);
        return false;
      }
    }

    // Email validation (should already be valid from Google)
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setError("Please enter a valid email address");
      return false;
    }

    // Password validation
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      return false;
    }

    // Password confirmation
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return false;
    }

    // Phone validation
    if (!/^[0-9]{10}$/.test(formData.phone.replace(/\D/g, ''))) {
      setError("Please enter a valid 10-digit phone number");
      return false;
    }

    return true;
  };

  const generateApplicationId = () => {
    return `APP_${Date.now()}_${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!validateForm()) return;

    setLoading(true);

    try {
      console.log("=== OUTLET SIGNUP PROCESS STARTED ===");
      console.log("1. Form validation passed");

      // Since we already verified the email with Google, we don't need to create a new account
      // Instead, we'll just use the Google authentication data we stored
      if (!tempGoogleData) {
        setError("Google authentication data not found. Please verify your email again.");
        return;
      }

      // Use the Google user ID for the application
      const newApplicationId = generateApplicationId();
      console.log("2. Generated application ID:", newApplicationId);

      // Create pending outlet application using Google user data
      const pendingOutletData = {
        applicationId: newApplicationId,
        name: formData.outletName,
        ownerName: formData.ownerName,
        ownerEmail: formData.email,
        phone: formData.phone,
        address: formData.address,
        description: formData.description,
        cuisine: formData.cuisine,
        category: formData.category,
        userId: tempGoogleData.uid, // Use Google UID
        password: formData.password, // Store password for later account creation after approval
        status: "pending", // pending, approved, rejected
        applicationDate: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        emailVerifiedViaGoogle: true, // Track that email was verified via Google
        googleUserId: tempGoogleData.uid, // Store original Google UID for reference
        // Will be added after approval
        outletId: null,
        isActive: false,
        rating: 0,
        totalOrders: 0,
        isOpen: false
      };

      console.log("3. Creating pending outlet application...");

      // Save pending application to Firestore
      const pendingRef = doc(db, "pendingOutlets", newApplicationId);
      await setDoc(pendingRef, pendingOutletData);
      console.log("✓ Saved to pendingOutlets collection");

      // Also save to user's profile for tracking (using Google UID)
      const userRef = doc(db, "outletApplications", tempGoogleData.uid);
      await setDoc(userRef, {
        ...pendingOutletData,
        applicationId: newApplicationId
      });
      console.log("✓ Saved to outletApplications collection");

      // Store application info in localStorage for user reference
      const applicationInfo = {
        applicationId: newApplicationId,
        outletName: formData.outletName,
        status: "pending",
        ownerEmail: formData.email,
        submittedAt: new Date().toISOString()
      };
      
      localStorage.setItem('outletApplication', JSON.stringify(applicationInfo));
      console.log("✓ Application info stored in localStorage");

      // Clean up temp Google data
      localStorage.removeItem('tempGoogleUser');
      console.log("✓ Cleaned up temporary Google data");

      // Set application ID for success display
      setApplicationId(newApplicationId);
      setSuccess(true);
      console.log("=== OUTLET SIGNUP SUCCESS ===");

    } catch (error) {
      console.error("=== OUTLET SIGNUP ERROR ===", error);
      
      let errorMessage = "Failed to submit application. Please try again.";
      
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = "An account with this email already exists. Please use the login page.";
          break;
        case 'auth/invalid-email':
          errorMessage = "Invalid email address format.";
          break;
        case 'auth/weak-password':
          errorMessage = "Password is too weak. Please choose a stronger password.";
          break;
        case 'auth/network-request-failed':
          errorMessage = "Network error. Please check your internet connection.";
          break;
        case 'permission-denied':
          errorMessage = "Permission denied. Please check your internet connection and try again.";
          break;
        default:
          errorMessage = error.message || "An unexpected error occurred.";
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Function to reset email verification (in case user wants to use different email)
  const resetEmailVerification = () => {
    setEmailVerified(false);
    setTempGoogleData(null);
    setFormData(prev => ({
      ...prev,
      email: "",
      ownerName: ""
    }));
    localStorage.removeItem('tempGoogleUser');
  };

  // Show loading spinner while checking auth state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-lg">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
          <p className="text-gray-600 mt-4 text-center">Loading...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-white p-8 rounded-2xl shadow-lg text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-yellow-500 p-4 rounded-full">
                <FaClock className="h-12 w-12 text-white" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Application Submitted Successfully!
            </h2>
            <p className="text-gray-600 mb-4">
              Your outlet registration application has been submitted and is now pending admin approval.
            </p>
            
            {/* Application Details */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-blue-800 mb-2">Application Details</h3>
              <div className="text-sm text-blue-700 space-y-1">
                <p><strong>Application ID:</strong> <span className="font-mono">{applicationId}</span></p>
                <p><strong>Outlet Name:</strong> {formData.outletName}</p>
                <p><strong>Owner:</strong> {formData.ownerName}</p>
                <p><strong>Email:</strong> {formData.email}</p>
                <p><strong>Status:</strong> <span className="bg-yellow-100 px-2 py-1 rounded text-yellow-800">Pending</span></p>
              </div>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 text-yellow-800 mb-2">
                <FaExclamationTriangle className="text-sm" />
                <span className="font-medium text-sm">What happens next?</span>
              </div>
              <ul className="text-left text-yellow-700 text-sm space-y-1">
                <li>• Admin will review your application within 24-48 hours</li>
                <li>• You'll receive an email notification with approval status</li>
                <li>• If approved, you'll get your unique <strong>Outlet ID</strong></li>
                <li>• Use the Outlet ID with your email and password to login</li>
                <li>• Keep your password safe - you'll need it to login after approval</li>
              </ul>
            </div>

            {/* Important Note */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 text-red-800 mb-2">
                <FaLock className="text-sm" />
                <span className="font-medium text-sm">Important - Save This Information</span>
              </div>
              <div className="text-red-700 text-sm">
                <p><strong>Your Login Credentials (After Approval):</strong></p>
                <p>• <strong>Email:</strong> {formData.email}</p>
                <p>• <strong>Password:</strong> The password you just entered</p>
                <p>• <strong>Outlet ID:</strong> Will be provided after approval</p>
              </div>
            </div>

            <div className="flex gap-3">
              <Link
                to="/outlet-login"
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-lg font-medium transition duration-200"
              >
                Go to Login
              </Link>
              <Link
                to="/home"
                className="flex-1 bg-green-500 hover:bg-green-600 text-white px-4 py-3 rounded-lg font-medium transition duration-200"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-2xl w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center">
            <div className="bg-green-500 p-4 rounded-full">
              <FaStore className="h-12 w-12 text-white" />
            </div>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Apply for Outlet Registration
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Submit your application to join our platform
          </p>
        </div>

        {/* Google Email Verification Section */}
        {!emailVerified && (
          <div className="bg-white p-8 rounded-2xl shadow-lg">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="bg-blue-500 p-3 rounded-full">
                  <FaGoogle className="h-8 w-8 text-white" />
                </div>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Verify Your Email First
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                To ensure email authenticity, please sign in with Google to verify your email address.
                This email will be used for your outlet account.
              </p>
              
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={googleLoading}
                className={`w-full flex justify-center items-center gap-3 py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium transition duration-200 ${
                  googleLoading
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                }`}
              >
                {googleLoading ? (
                  <FaSpinner className="animate-spin h-5 w-5" />
                ) : (
                  <FaGoogle className="h-5 w-5 text-red-500" />
                )}
                {googleLoading ? 'Signing in...' : 'Sign in with Google'}
              </button>
            </div>
          </div>
        )}

        {/* Signup Form */}
        {emailVerified && (
          <form className="mt-8 space-y-6 bg-white p-8 rounded-2xl shadow-lg" onSubmit={handleSubmit}>
            {/* Email Verified Success Message */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
              <FaCheckCircle className="text-green-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-green-800 text-sm font-medium">Email Verified</p>
                <p className="text-green-700 text-sm">Your email has been verified through Google. You can now complete your registration.</p>
              </div>
              <button
                type="button"
                onClick={resetEmailVerification}
                className="text-green-600 hover:text-green-800 text-sm underline"
              >
                Change Email
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <FaExclamationTriangle className="text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-red-800 text-sm font-medium">Error</p>
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Outlet Name */}
              <div>
                <label htmlFor="outletName" className="block text-sm font-medium text-gray-700 mb-2">
                  Outlet Name *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaStore className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="outletName"
                    name="outletName"
                    type="text"
                    required
                    value={formData.outletName}
                    onChange={handleInputChange}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition duration-200"
                    placeholder="e.g., Tasty Bites"
                  />
                </div>
              </div>

              {/* Owner Name */}
              <div>
                <label htmlFor="ownerName" className="block text-sm font-medium text-gray-700 mb-2">
                  Owner Name *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaUser className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="ownerName"
                    name="ownerName"
                    type="text"
                    required
                    value={formData.ownerName}
                    onChange={handleInputChange}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition duration-200"
                    placeholder="Enter your full name"
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaPhone className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition duration-200"
                    placeholder="10-digit phone number"
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  id="category"
                  name="category"
                  required
                  value={formData.category}
                  onChange={handleInputChange}
                  className="block w-full px-3 py-3 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition duration-200"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' ')}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Email - Read Only */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address * (Verified via Google)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaEnvelope className="h-5 w-5 text-gray-400" />
                </div>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <FaCheckCircle className="h-5 w-5 text-green-500" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed focus:outline-none"
                  placeholder="Verified email from Google"
                  readOnly
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">This email was verified through Google and cannot be changed.</p>
            </div>

            {/* Cuisine */}
            <div>
              <label htmlFor="cuisine" className="block text-sm font-medium text-gray-700 mb-2">
                Cuisine Type *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaUtensils className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="cuisine"
                  name="cuisine"
                  type="text"
                  required
                  value={formData.cuisine}
                  onChange={handleInputChange}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition duration-200"
                  placeholder="e.g., Indian, Chinese, Italian, etc."
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaLock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition duration-200"
                    placeholder="Minimum 6 characters"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <FaEyeSlash className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <FaEye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaLock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition duration-200"
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <FaEyeSlash className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <FaEye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Address */}
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                Address *
              </label>
              <div className="relative">
                <div className="absolute top-3 left-0 pl-3 flex items-start pointer-events-none">
                  <FaMapMarkerAlt className="h-5 w-5 text-gray-400 mt-0.5" />
                </div>
                <textarea
                  id="address"
                  name="address"
                  required
                  rows={3}
                  value={formData.address}
                  onChange={handleInputChange}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition duration-200 resize-none"
                  placeholder="Enter your outlet's complete address"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description (Optional)
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                value={formData.description}
                onChange={handleInputChange}
                className="block w-full px-3 py-3 border border-gray-300 rounded-lg placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition duration-200 resize-none"
                placeholder="Describe your outlet, specialties, unique features, etc."
              />
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={loading}
                className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white transition duration-200 ${
                  loading 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500'
                }`}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <FaSpinner className="animate-spin h-5 w-5" />
                    Submitting Application...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <FaUserPlus className="h-5 w-5" />
                    Submit Application
                  </div>
                )}
              </button>
            </div>

            {/* Login Link */}
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Already have an approved outlet account?{" "}
                <Link
                  to="/outlet-login"
                  className="font-medium text-green-600 hover:text-green-500 transition duration-200"
                >
                  Sign in here
                </Link>
              </p>
            </div>

            {/* Back to Home */}
            <div className="text-center">
              <Link
                to="/home"
                className="text-sm text-gray-500 hover:text-gray-700 transition duration-200"
              >
                ← Back to Home
              </Link>
            </div>

            {/* Terms Notice */}
            <div className="text-center">
              <p className="text-xs text-gray-500">
                By submitting this application, you agree to our terms of service and privacy policy.
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default OutletSignup;