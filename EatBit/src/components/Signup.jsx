import React, { useState, useEffect } from 'react';
import { User, Mail, Lock, Eye, EyeOff, Loader, UserPlus } from 'lucide-react';
import { createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, setDoc } from "firebase/firestore";
import { useNavigate } from 'react-router-dom';

const Signup = () => {
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailValid, setEmailValid] = useState(false);
  const [passwordValid, setPasswordValid] = useState(false);
  const [nameValid, setNameValid] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const navigate = useNavigate();

  // Form validation
  useEffect(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    setEmailValid(emailRegex.test(formData.email));
  }, [formData.email]);

  useEffect(() => {
    setPasswordValid(formData.password.length >= 6);
  }, [formData.password]);

  useEffect(() => {
    setNameValid(formData.name.trim().length >= 2);
  }, [formData.name]);

  // Handle input changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(""); // Clear error when user types
  };

  // Handle email/password signup
  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.name || !formData.email || !formData.password) {
      setError("All fields are required.");
      return;
    }

    if (!nameValid) {
      setError("Name must be at least 2 characters.");
      return;
    }

    if (!emailValid) {
      setError("Please enter a valid email address.");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      // Create user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      // ✨ Store user in Firestore with customer type
      await setDoc(doc(db, "users", user.uid), {
        name: formData.name,
        email: formData.email,
        userType: 'customer', // ✨ Added user type
        signedUp: true,
        provider: 'email',
        createdAt: new Date().toISOString(),
        // Initialize empty profile fields
        gender: "",
        mobile: "",
        rollNo: "",
        hostelNo: "",
        address: "",
        profileComplete: false
      });

      console.log("Customer user created successfully with userType: 'customer'");
      navigate("/login"); // Redirect to login after successful signup
    } catch (error) {
      if (error.code === "auth/email-already-in-use") {
        setError("This email is already in use. Please log in.");
      } else if (error.code === "auth/invalid-email") {
        setError("Invalid email address. Please check again.");
      } else if (error.code === "auth/weak-password") {
        setError("Password should be at least 6 characters.");
      } else {
        setError(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle Google signup
  const handleGoogleSignup = async () => {
    setError("");
    setGoogleLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // ✨ Store user in Firestore with customer type
      await setDoc(doc(db, "users", user.uid), {
        name: user.displayName || "Google User",
        email: user.email,
        userType: 'customer', // ✨ Added user type
        signedUp: true,
        provider: 'google',
        createdAt: new Date().toISOString(),
        // Initialize empty profile fields
        gender: "",
        mobile: "",
        rollNo: "",
        hostelNo: "",
        address: "",
        profileComplete: false
      });

      console.log("Customer user signed up successfully with Google and userType: 'customer'");
      navigate("/home"); // Redirect after successful signup
    } catch (error) {
      if (error.code === "auth/account-exists-with-different-credential") {
        setError("An account with this email already exists. Please sign in.");
      } else if (error.code === "auth/popup-closed-by-user") {
        setError("Sign-up cancelled. Please try again.");
      } else {
        setError("Google sign-up failed. Please try again.");
      }
      console.error("Google signup error:", error);
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Main Signup Card */}
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-white/20">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full mb-4 shadow-lg">
              <UserPlus className="text-white text-2xl" />
            </div>
            <h1 className="text-3xl font-bold text-black mb-2">Create Account</h1>
            <p className="text-gray-600">Join us and start your food ordering journey today!</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6 text-sm">
              {error}
            </div>
          )}

          {/* Google Signup Button */}
          <div className="mb-6">
            <button
              onClick={handleGoogleSignup}
              disabled={googleLoading}
              className="w-full flex items-center justify-center gap-3 py-4 px-6 border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {googleLoading ? (
                <>
                  <Loader className="animate-spin w-5 h-5 text-gray-500" />
                  <span className="text-gray-600 font-medium">Signing up with Google...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#EA4335" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span className="text-gray-700 font-medium">Continue with Google</span>
                </>
              )}
            </button>
          </div>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-4 text-gray-500 font-medium">Or create account with email</span>
            </div>
          </div>

          {/* Signup Form */}
          <div className="space-y-6">
            {/* Full Name Input */}
            <div className="relative">
              <label className="block text-sm font-medium text-black mb-2">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input 
                  type="text" 
                  name="name"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full pl-12 pr-4 py-4 border rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 text-black placeholder-gray-400 ${
                    formData.name && nameValid 
                      ? 'border-green-300 focus:ring-green-500 bg-green-50' 
                      : formData.name && !nameValid 
                      ? 'border-red-300 focus:ring-red-500 bg-red-50'
                      : 'border-gray-200 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                />
                {formData.name && nameValid && (
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-green-500">✓</div>
                )}
              </div>
              {formData.name && !nameValid && (
                <p className="text-red-500 text-xs mt-1">Name must be at least 2 characters</p>
              )}
            </div>

            {/* Email Input */}
            <div className="relative">
              <label className="block text-sm font-medium text-black mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input 
                  type="email" 
                  name="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full pl-12 pr-4 py-4 border rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 text-black placeholder-gray-400 ${
                    formData.email && emailValid 
                      ? 'border-green-300 focus:ring-green-500 bg-green-50' 
                      : formData.email && !emailValid 
                      ? 'border-red-300 focus:ring-red-500 bg-red-50'
                      : 'border-gray-200 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                />
                {formData.email && emailValid && (
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-green-500">✓</div>
                )}
              </div>
              {formData.email && !emailValid && (
                <p className="text-red-500 text-xs mt-1">Please enter a valid email address</p>
              )}
            </div>

            {/* Password Input */}
            <div className="relative">
              <label className="block text-sm font-medium text-black mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input 
                  type={passwordVisible ? "text" : "password"}
                  name="password"
                  placeholder="Create a strong password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full pl-12 pr-12 py-4 border rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 text-black placeholder-gray-400 ${
                    formData.password && passwordValid 
                      ? 'border-green-300 focus:ring-green-500 bg-green-50' 
                      : formData.password && !passwordValid 
                      ? 'border-red-300 focus:ring-red-500 bg-red-50'
                      : 'border-gray-200 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setPasswordVisible(!passwordVisible)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {passwordVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {formData.password && !passwordValid && (
                <p className="text-red-500 text-xs mt-1">Password must be at least 6 characters</p>
              )}
              {passwordValid && (
                <p className="text-green-500 text-xs mt-1">Strong password ✓</p>
              )}
            </div>

            {/* Signup Button */}
            <button 
              onClick={handleSignup}
              disabled={loading || !nameValid || !emailValid || !passwordValid}
              className={`w-full py-4 rounded-xl font-semibold text-white transition-all duration-200 ${
                loading || !nameValid || !emailValid || !passwordValid
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl'
              }`}
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <Loader className="animate-spin w-4 h-4" />
                  <span>Creating account...</span>
                </div>
              ) : (
                "Create Account"
              )}
            </button>
          </div>

          {/* Login Link */}
          <div className="text-center mt-8">
            <p className="text-black">
              Already have an account?{" "}
              <a 
                href="/login" 
                className="text-blue-500 hover:text-blue-600 font-semibold transition-colors"
              >
                Sign in now
              </a>
            </p>
          </div>
        </div>

        {/* Success Features Preview */}
        <div className="mt-6 text-center">
          <div className="flex justify-center space-x-8 text-sm text-gray-500">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span>Secure</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <span>Fast Setup</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
              <span>24/7 Support</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;