import React, { useState } from "react";
import "./Login.css";
import { FaEnvelope, FaLock } from "react-icons/fa";
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
  const navigate = useNavigate();

  // Handle email/password login
  const handleLogin = async (e) => {
    e.preventDefault();
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
    }
  };

  // Handle Google Sign-In (Link with Email/Password if needed)
  const handleGoogleSignIn = async () => {
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
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="icon-container">
          <img src="https://cdn-icons-png.flaticon.com/512/786/786408.png" alt="Login Icon" width="50" />
        </div>
        <h2>Sign in with email</h2>
        <p>Sign in to order delicious meals anytime, anywhere!</p>

        {error && <p className="error-message">{error}</p>}

        {/* Email Input */}
        <div className="input-group">
          <i><FaEnvelope /></i> 
          <input 
            type="email" 
            placeholder="Email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        {/* Password Input */}
        <div className="input-group">
          <i><FaLock /></i>
          <input 
            type={showPassword ? "text" : "password"} 
            placeholder="Password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <span className="eye-icon" onClick={() => setShowPassword(!showPassword)}>
            {showPassword ? "🙈" : "👁️"}
          </span>
        </div>

        {/* Forgot Password */}
        <div className="forgot-password">
          <a href="#">Forgot password?</a>
        </div>

        {/* Login Button */}
        <button className="login-btn" onClick={handleLogin}>Get Started</button>

        {/* OR Text */}
        <div className="or-text">Or sign in with</div>

        {/* Social Login Buttons */}
        <div className="social-login">
          <button onClick={handleGoogleSignIn}><AiFillGoogleCircle size={28} color="#EA4335" /></button>
          <button><AiFillFacebook size={28} color="#1877F2" /></button>
          <button><AiFillApple size={28} color="black" /></button>
        </div>
      </div>
    </div>
  );
};

export default Login;
