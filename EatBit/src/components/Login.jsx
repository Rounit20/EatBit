import React, { useState, useEffect } from "react";
import { FaEnvelope, FaLock, FaEye, FaEyeSlash, FaGoogle, FaFacebook, FaApple, FaSpinner } from "react-icons/fa";
import { AiFillGoogleCircle, AiFillFacebook, AiFillApple } from "react-icons/ai";
import { 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  fetchSignInMethodsForEmail, 
  EmailAuthProvider, 
  linkWithCredential 
} from "firebase/auth";
import { auth, googleProvider, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore"; 
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailValid, setEmailValid] = useState(false);
  const [passwordValid, setPasswordValid] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();

  // Email validation
  useEffect(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    setEmailValid(emailRegex.test(email));
  }, [email]);

  // Password validation
  useEffect(() => {
    setPasswordValid(password.length >= 6);
  }, [password]);

  // Handle email/password login
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!emailValid || !passwordValid) {
      setError("Please enter valid email and password");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/home"); // Redirect after successful login
    } catch (error) {
      console.error("Login Error:", error.code, error.message);

      if (error.code === "auth/wrong-password" || error.code === "auth/user-not-found") {
        // Check if the user signed up with Google before
        const signInMethods = await fetchSignInMethodsForEmail(auth, email);

        if (signInMethods.includes("google.com")) {
          setError("You signed up with Google. Try logging in with Google instead.");
        } else {
          setError("Invalid credentials. Please check your email or password.");
        }
      } else {
        setError("Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle Google Sign-In (Link with Email/Password if needed)
  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError("");

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Check if user exists in Firestore
      const userDoc = await getDoc(doc(db, "users", user.uid));

      if (userDoc.exists()) {
        navigate("/home");
      } else {
        setError("Google Sign-In is restricted. Please sign up first.");
        await auth.signOut();
      }
    } catch (error) {
      console.error("Google Sign-In Error:", error.code, error.message);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle other social logins (placeholder for now)
  const handleSocialLogin = async (provider) => {
    if (provider === 'Google') {
      return handleGoogleSignIn();
    }
    
    setError(`${provider} login not implemented yet`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Main Login Card */}
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-white/20">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-orange-500 to-red-500 rounded-full mb-4 shadow-lg">
              <FaEnvelope className="text-white text-2xl" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome Back</h1>
            <p className="text-gray-600">Sign in to order delicious meals anytime, anywhere!</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6 text-sm animate-pulse">
              {error}
            </div>
          )}

          {/* Login Form */}
          <div className="space-y-6">
            {/* Email Input */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <div className="relative">
                <FaEnvelope className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input 
                  type="email" 
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full pl-12 pr-4 py-4 border rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 ${
                    email && emailValid 
                      ? 'border-green-300 focus:ring-green-500 bg-green-50' 
                      : email && !emailValid 
                      ? 'border-red-300 focus:ring-red-500 bg-red-50'
                      : 'border-gray-200 focus:ring-orange-500 focus:border-orange-500'
                  }`}
                  required
                />
                {email && emailValid && (
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-green-500">✓</div>
                )}
              </div>
            </div>

            {/* Password Input */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <div className="relative">
                <FaLock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full pl-12 pr-12 py-4 border rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 ${
                    password && passwordValid 
                      ? 'border-green-300 focus:ring-green-500 bg-green-50' 
                      : password && !passwordValid 
                      ? 'border-red-300 focus:ring-red-500 bg-red-50'
                      : 'border-gray-200 focus:ring-orange-500 focus:border-orange-500'
                  }`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {password && !passwordValid && (
                <p className="text-red-500 text-xs mt-1">Password must be at least 6 characters</p>
              )}
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                />
                <span className="text-sm text-gray-600">Remember me</span>
              </label>
              <a 
                href="#" 
                className="text-sm text-orange-500 hover:text-orange-600 font-medium transition-colors"
              >
                Forgot password?
              </a>
            </div>

            {/* Login Button */}
            <button 
              type="submit"
              disabled={loading || !emailValid || !passwordValid}
              className={`w-full py-4 rounded-xl font-semibold text-white transition-all duration-200 ${
                loading || !emailValid || !passwordValid
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl'
              }`}
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <FaSpinner className="animate-spin" />
                  <span>Signing in...</span>
                </div>
              ) : (
                "Get Started"
              )}
            </button>
          </div>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-4 text-gray-500 font-medium">Or continue with</span>
            </div>
          </div>

          {/* Social Login Buttons */}
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="flex items-center justify-center py-3 px-4 border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <AiFillGoogleCircle className="text-red-500 text-xl" />
            </button>
            <button
              onClick={() => handleSocialLogin('Facebook')}
              disabled={loading}
              className="flex items-center justify-center py-3 px-4 border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FaFacebook className="text-blue-600 text-xl" />
            </button>
            <button
              onClick={() => handleSocialLogin('Apple')}
              disabled={loading}
              className="flex items-center justify-center py-3 px-4 border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FaApple className="text-black text-xl" />
            </button>
          </div>

          {/* Sign Up Link */}
          <div className="text-center mt-8">
            <p className="text-gray-600">
              Don't have an account?{" "}
              <a 
                href="/signup" 
                className="text-orange-500 hover:text-orange-600 font-semibold transition-colors"
              >
                Sign up now
              </a>
            </p>
          </div>
        </div>

        {/* Features Preview */}
        
      </div>
    </div>
  );
};

export default Login;