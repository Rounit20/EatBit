import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { doc, getDoc, setDoc, collection, getDocs, query, where } from "firebase/firestore";
import { auth, db } from "../firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import {
  FaStore,
  FaUser,
  FaLock,
  FaIdCard,
  FaEye,
  FaEyeSlash,
  FaSignInAlt,
  FaExclamationTriangle,
  FaSpinner,
  FaInfoCircle,
  FaGoogle
} from "react-icons/fa";

const OutletLogin = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    outletId: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState("");
  const navigate = useNavigate();
  const [user, authLoading] = useAuthState(auth);

  // Redirect if already logged in as outlet owner
  useEffect(() => {
    if (user && !authLoading) {
      const currentOutlet = JSON.parse(localStorage.getItem('currentOutlet') || '{}');
      if (currentOutlet.outletId) {
        navigate("/outlet-dashboard");
      }
    }
  }, [user, authLoading, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError("");
    if (debugInfo) setDebugInfo("");
  };

  const validateForm = () => {
    if (!formData.email.trim()) {
      setError("Email is required");
      return false;
    }
    if (!formData.password.trim()) {
      setError("Password is required");
      return false;
    }
    if (!formData.outletId.trim()) {
      setError("Outlet ID is required");
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setError("Please enter a valid email address");
      return false;
    }
    return true;
  };

  // Function to get stored password from applications
  const getStoredPassword = async (outletData) => {
    try {
      // First try with the userId from outlet data
      if (outletData.userId) {
        const appRef = doc(db, "outletApplications", outletData.userId);
        const appSnap = await getDoc(appRef);
        
        if (appSnap.exists() && appSnap.data().password) {
          return appSnap.data().password;
        }
      }

      // If not found, try to find by email in outletApplications
      const applicationsRef = collection(db, "outletApplications");
      const q = query(applicationsRef, where("ownerEmail", "==", formData.email));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const appDoc = querySnapshot.docs[0];
        const appData = appDoc.data();
        if (appData.password) {
          return appData.password;
        }
      }

      return null;
    } catch (error) {
      console.error("Error fetching stored password:", error);
      return null;
    }
  };

  // Debug function to check outlet data
  const checkOutletData = async () => {
    if (!formData.outletId.trim()) {
      setError("Please enter an Outlet ID first");
      return;
    }

    setLoading(true);
    try {
      const outletRef = doc(db, "outlets", formData.outletId);
      const outletSnap = await getDoc(outletRef);

      if (outletSnap.exists()) {
        const data = outletSnap.data();
        setDebugInfo(`Outlet found: ${data.name} - Owner: ${data.ownerEmail} - Status: ${data.status}`);
        setError("");

        // Auto-fill email if empty
        if (!formData.email && data.ownerEmail) {
          setFormData(prev => ({ ...prev, email: data.ownerEmail }));
        }
      } else {
        setError("Outlet ID not found in database");
        setDebugInfo("");
      }
    } catch (error) {
      setError("Error checking outlet: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Google Sign In for outlets registered via Google
  const handleGoogleSignIn = async () => {
    if (!formData.outletId.trim()) {
      setError("Please enter your Outlet ID first");
      return;
    }

    setGoogleLoading(true);
    setError("");

    try {
      console.log("=== GOOGLE OUTLET LOGIN STARTED ===");
      
      // Step 1: Verify outlet exists and is approved
      const outletRef = doc(db, "outlets", formData.outletId);
      const outletSnap = await getDoc(outletRef);

      if (!outletSnap.exists()) {
        setError("Outlet ID not found. Please check your Outlet ID or contact admin.");
        setGoogleLoading(false);
        return;
      }

      const outletData = outletSnap.data();
      console.log("1. Outlet data found:", outletData);

      if (outletData.status !== "approved") {
        setError(`Outlet status is "${outletData.status}". Only approved outlets can login.`);
        setGoogleLoading(false);
        return;
      }

      // Step 2: Attempt Google sign-in
      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Step 3: Verify email matches outlet owner email
      if (outletData.ownerEmail !== user.email) {
        await auth.signOut();
        setError(`Email mismatch. This outlet is registered to: ${outletData.ownerEmail}`);
        setGoogleLoading(false);
        return;
      }

      console.log("2. Google authentication successful");

      // Step 4: Create/Update outlet owner record
      const outletOwnerData = {
        email: user.email,
        outletId: formData.outletId,
        outletName: outletData.name,
        userType: 'outlet_owner',
        lastLogin: new Date().toISOString(),
        firebaseUID: user.uid,
        loginMethod: 'google',
        ownerDetails: {
          outletCategory: outletData.category || '',
          outletAddress: outletData.address || '',
          contactNumber: outletData.phone || '',
          ownerName: outletData.ownerName || '',
          cuisine: outletData.cuisine || ''
        }
      };

      await setDoc(doc(db, "outletOwners", user.uid), outletOwnerData, { merge: true });
      console.log("3. Outlet owner record created/updated");

      // Step 5: Store outlet info in localStorage
      const currentOutletInfo = {
        outletId: formData.outletId,
        outletName: outletData.name,
        ownerEmail: outletData.ownerEmail,
        userType: 'outlet_owner',
        firebaseUID: user.uid,
        loginTime: new Date().toISOString()
      };

      localStorage.setItem('currentOutlet', JSON.stringify(currentOutletInfo));
      console.log("4. Outlet info stored in localStorage");

      console.log("=== GOOGLE OUTLET LOGIN SUCCESS ===");
      setDebugInfo("Google login successful! Redirecting to dashboard...");

      setTimeout(() => {
        navigate("/outlet-dashboard");
      }, 1500);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setDebugInfo("");

    if (!validateForm()) return;

    setLoading(true);

    try {
      console.log("=== OUTLET LOGIN PROCESS STARTED ===");
      console.log("1. Form data:", { email: formData.email, outletId: formData.outletId });

      // Step 1: Check if outlet exists and get outlet data
      const outletRef = doc(db, "outlets", formData.outletId);
      const outletSnap = await getDoc(outletRef);

      if (!outletSnap.exists()) {
        setError("Outlet ID not found. Please check your Outlet ID or contact admin.");
        setLoading(false);
        return;
      }

      const outletData = outletSnap.data();
      console.log("2. Outlet data found:", outletData);

      // Step 2: Verify email matches outlet owner email
      if (outletData.ownerEmail !== formData.email) {
        setError(`Email mismatch. This outlet is registered to: ${outletData.ownerEmail}`);
        setLoading(false);
        return;
      }

      // Step 3: Check if outlet is approved
      if (outletData.status !== "approved") {
        setError(`Outlet status is "${outletData.status}". Only approved outlets can login.`);
        setLoading(false);
        return;
      }

      // Step 4: Try authentication with entered password only
      let user;
      let authSuccess = false;
      let authError = null;

      try {
        console.log("4. Attempting Firebase Auth with entered password...");
        const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
        user = userCredential.user;
        authSuccess = true;
        console.log("✓ Firebase Auth successful with entered password");
      } catch (signInError) {
        console.log("× Auth attempt failed:", signInError.code);
        authError = signInError;
      }

      // If authentication failed, provide helpful error message
      if (!authSuccess) {
        let errorMessage = "Authentication failed. ";
        if (authError) {
          switch (authError.code) {
            case 'auth/wrong-password':
              errorMessage += "Incorrect password. If you registered via Google, please use the 'Sign in with Google' button below.";
              break;
            case 'auth/user-not-found':
              errorMessage += "No account found with this email. If you registered via Google, please use the 'Sign in with Google' button below.";
              break;
            case 'auth/invalid-email':
              errorMessage += "Invalid email format.";
              break;
            case 'auth/too-many-requests':
              errorMessage += "Too many failed login attempts. Please try again later.";
              break;
            case 'auth/email-already-in-use':
              errorMessage += "Account exists but was created via Google. Please use the 'Sign in with Google' button below.";
              break;
            default:
              errorMessage += "Please check your credentials. If you registered via Google, use the 'Sign in with Google' button below.";
          }
        } else {
          errorMessage += "Please check your credentials or try Google Sign-In if you registered via Google.";
        }
        setError(errorMessage);
        setLoading(false);
        return;
      }

      console.log("5. Authentication successful, creating outlet owner record...");

      // Step 5: Create/Update outlet owner record in Firestore
      const outletOwnerData = {
        email: user.email,
        outletId: formData.outletId,
        outletName: outletData.name,
        userType: 'outlet_owner',
        lastLogin: new Date().toISOString(),
        firebaseUID: user.uid,
        loginMethod: 'password',
        ownerDetails: {
          outletCategory: outletData.category || '',
          outletAddress: outletData.address || '',
          contactNumber: outletData.phone || '',
          ownerName: outletData.ownerName || '',
          cuisine: outletData.cuisine || ''
        }
      };

      await setDoc(doc(db, "outletOwners", user.uid), outletOwnerData, { merge: true });
      console.log("✓ Outlet owner record created/updated");

      // Step 6: Store outlet info in localStorage
      const currentOutletInfo = {
        outletId: formData.outletId,
        outletName: outletData.name,
        ownerEmail: outletData.ownerEmail,
        userType: 'outlet_owner',
        firebaseUID: user.uid,
        loginTime: new Date().toISOString()
      };

      localStorage.setItem('currentOutlet', JSON.stringify(currentOutletInfo));
      console.log("✓ Outlet info stored in localStorage");

      console.log("=== OUTLET LOGIN SUCCESS ===");
      setDebugInfo(`Login successful! Redirecting to dashboard...`);

      // Small delay to show success message
      setTimeout(() => {
        navigate("/outlet-dashboard");
      }, 1500);

    } catch (error) {
      console.error("=== OUTLET LOGIN ERROR ===", error);
      setError("An unexpected error occurred: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Show loading spinner while checking auth state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-lg">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-gray-600 mt-4 text-center">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center">
            <div className="bg-blue-500 p-4 rounded-full">
              <FaStore className="h-12 w-12 text-white" />
            </div>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Outlet Login
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to manage your outlet orders
          </p>
        </div>

        {/* Login Form */}
        <form className="mt-8 space-y-6 bg-white p-8 rounded-2xl shadow-lg" onSubmit={handleSubmit}>
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

          {/* Debug Info */}
          {debugInfo && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
              <FaInfoCircle className="text-blue-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-blue-800 text-sm font-medium">Info</p>
                <p className="text-blue-700 text-sm">{debugInfo}</p>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {/* Outlet ID Input - First for better UX */}
            <div>
              <label htmlFor="outletId" className="block text-sm font-medium text-gray-700 mb-2">
                Outlet ID
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaIdCard className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="outletId"
                    name="outletId"
                    type="text"
                    required
                    value={formData.outletId}
                    onChange={handleInputChange}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                    placeholder="Enter your outlet ID"
                  />
                </div>
                <button
                  type="button"
                  onClick={checkOutletData}
                  disabled={loading}
                  className="bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 text-white px-4 py-3 rounded-lg text-sm font-medium transition duration-200"
                >
                  {loading ? <FaSpinner className="animate-spin" /> : "Check"}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">Click "Check" to auto-fill email</p>
            </div>

            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaUser className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
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
                  className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                  placeholder="Enter your password"
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
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={loading}
              className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white transition duration-200 ${
                loading 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
              }`}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <FaSpinner className="animate-spin h-5 w-5" />
                  Signing in...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <FaSignInAlt className="h-5 w-5" />
                  Sign In with Password
                </div>
              )}
            </button>
          </div>

          {/* OR Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or</span>
            </div>
          </div>

          {/* Google Sign In Button */}
          <div>
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
              className={`group relative w-full flex justify-center py-3 px-4 border border-gray-300 text-sm font-medium rounded-lg transition duration-200 ${
                googleLoading 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : 'bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
              }`}
            >
              {googleLoading ? (
                <div className="flex items-center gap-2">
                  <FaSpinner className="animate-spin h-5 w-5" />
                  Signing in with Google...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <FaGoogle className="h-5 w-5 text-red-500" />
                  Sign In with Google
                </div>
              )}
            </button>
          </div>

          {/* Instructions */}
          <div className="text-center bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <strong>How to login:</strong><br/>
              1. Enter your Outlet ID and click "Check" to auto-fill email<br/>
              2. Use <strong>password login</strong> if you set a password during registration<br/>
              3. Use <strong>Google login</strong> if you registered via Google<br/>
            </p>
          </div>

          {/* Sign Up Link */}
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Don't have an outlet account?{" "}
              <Link
                to="/outlet-signup"
                className="font-medium text-blue-600 hover:text-blue-500 transition duration-200"
              >
                Register your outlet
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
        </form>
      </div>
    </div>
  );
};

export default OutletLogin;