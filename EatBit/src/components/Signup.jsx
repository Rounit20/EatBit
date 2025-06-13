import React, { useState } from 'react';
import { FaUser, FaEnvelope, FaLock } from 'react-icons/fa';
import { AiFillGoogleCircle, AiFillFacebook, AiFillApple } from "react-icons/ai";
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../firebase"; // Import Firestore
import { doc, setDoc } from "firebase/firestore"; // Firestore functions
import './Login.css';

const Signup = () => {
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Handle input changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle signup
  const handleSignup = async (e) => {
    e.preventDefault();
    setError(""); // Clear previous errors

    if (!formData.name || !formData.email || !formData.password) {
      setError("All fields are required.");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    try {
      // Create user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      // Store user in Firestore
      await setDoc(doc(db, "users", user.uid), {
        name: formData.name,
        email: formData.email,
        signedUp: true, // Flag to indicate user has signed up
      });

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
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <img src="https://cdn-icons-png.flaticon.com/512/786/786408.png" alt="Sign Up Icon" width="50" />
        <h2>Sign up with email</h2>
        <p>Join us and start your journey today.</p>

        {error && <p className="error-message">{error}</p>}

        {/* Full Name Field */}
        <div className="input-group">
          <i><FaUser /></i>
          <input type="text" name="name" placeholder="Full Name" onChange={handleChange} required />
        </div>

        {/* Email Field */}
        <div className="input-group">
          <i><FaEnvelope /></i>
          <input type="email" name="email" placeholder="Email" onChange={handleChange} required />
        </div>

        {/* Password Field */}
        <div className="input-group">
          <i><FaLock /></i>
          <input
            type={passwordVisible ? "text" : "password"}
            name="password"
            placeholder="Password (Min 6 chars)"
            onChange={handleChange}
            required
          />
          <span className="eye-icon" onClick={() => setPasswordVisible(!passwordVisible)}>
            {passwordVisible ? "🙈" : "👁️"}
          </span>
        </div>

        {/* Signup Button */}
        <button className="login-btn" onClick={handleSignup}>Get Started</button>

        {/* Switch to Login */}
        <p className="forgot-password">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>

        {/* Or Section */}
        <p className="or-text">Or sign up with</p>

        {/* Social Login */}
        <div className="social-login">
          <button><AiFillGoogleCircle size={28} color="#EA4335" /></button>
          <button><AiFillFacebook size={28} color="#1877F2" /></button>
          <button><AiFillApple size={28} color="black" /></button>
        </div>
      </div>
    </div>
  );
};

export default Signup;
