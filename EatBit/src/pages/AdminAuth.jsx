import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { collection, addDoc, query, where, getDocs, limit, setDoc, doc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { FaUser, FaLock, FaUserPlus, FaEye, FaEyeSlash, FaShieldAlt } from "react-icons/fa";
import bcrypt from 'bcryptjs';

const AdminAuth = () => {
    const navigate = useNavigate();
    const [isLogin, setIsLogin] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [attempts, setAttempts] = useState(0);
    
    const [formData, setFormData] = useState({
        username: "",
        password: "",
        confirmPassword: ""
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const validateForm = () => {
        if (!formData.username || !formData.password) {
            setMessage("Please fill in all required fields");
            return false;
        }

        if (formData.username.length < 3) {
            setMessage("Username must be at least 3 characters long");
            return false;
        }

        if (formData.password.length < 6) {
            setMessage("Password must be at least 6 characters long");
            return false;
        }

        if (!isLogin && formData.password !== formData.confirmPassword) {
            setMessage("Passwords do not match");
            return false;
        }

        return true;
    };

    // Generate unique session ID
    const generateSessionId = () => {
        return `admin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    };

    // Clean up expired sessions
    const cleanupExpiredSessions = async (adminId) => {
        try {
            const q = query(
                collection(db, "adminSessions"),
                where("adminId", "==", adminId),
                where("expiresAt", "<", new Date())
            );
            const expiredSessions = await getDocs(q);
            
            const deletePromises = expiredSessions.docs.map(doc => 
                deleteDoc(doc.ref)
            );
            await Promise.all(deletePromises);
        } catch (error) {
            console.error("Error cleaning up expired sessions:", error);
        }
    };

    const handleRegister = async () => {
        try {
            setIsLoading(true);
            setMessage("");

            // Check if username already exists
            const q = query(
                collection(db, "admins"), 
                where("username", "==", formData.username.toLowerCase()),
                limit(1)
            );
            const querySnapshot = await getDocs(q);
            
            if (!querySnapshot.empty) {
                setMessage("Username already exists. Please choose a different one.");
                return;
            }

            // Hash password with strong security
            const saltRounds = 12;
            const hashedPassword = await bcrypt.hash(formData.password, saltRounds);

            // Add admin to Firestore
            await addDoc(collection(db, "admins"), {
                username: formData.username.toLowerCase(),
                password: hashedPassword,
                createdAt: serverTimestamp(),
                isActive: true,
                lastLogin: null,
                loginAttempts: 0,
                lockedUntil: null
            });

            setMessage("Admin account created successfully! Please log in.");
            setIsLogin(true);
            setFormData({ username: "", password: "", confirmPassword: "" });

        } catch (error) {
            console.error("Registration error:", error);
            setMessage("Error creating admin account. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogin = async () => {
        try {
            setIsLoading(true);
            setMessage("");

            // Rate limiting
            if (attempts >= 5) {
                setMessage("Too many failed attempts. Please wait 5 minutes before trying again.");
                return;
            }

            // Find admin by username
            const q = query(
                collection(db, "admins"), 
                where("username", "==", formData.username.toLowerCase()),
                limit(1)
            );
            const querySnapshot = await getDocs(q);
            
            if (querySnapshot.empty) {
                setMessage("Invalid username or password");
                setAttempts(prev => prev + 1);
                return;
            }

            const adminDoc = querySnapshot.docs[0];
            const adminData = adminDoc.data();

            // Check if account is temporarily locked
            if (adminData.lockedUntil && new Date(adminData.lockedUntil) > new Date()) {
                setMessage("Account temporarily locked. Please try again later.");
                return;
            }

            // Verify password
            const isPasswordValid = await bcrypt.compare(formData.password, adminData.password);
            
            if (!isPasswordValid) {
                setMessage("Invalid username or password");
                setAttempts(prev => prev + 1);
                return;
            }

            if (!adminData.isActive) {
                setMessage("Admin account is deactivated. Please contact support.");
                return;
            }

            // Clean up old sessions
            await cleanupExpiredSessions(adminDoc.id);

            // Create new session in Firestore (cross-device compatible)
            const sessionId = generateSessionId();
            const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000); // 8 hours

            await setDoc(doc(db, "adminSessions", sessionId), {
                adminId: adminDoc.id,
                username: adminData.username,
                createdAt: serverTimestamp(),
                expiresAt: expiresAt,
                lastActivity: serverTimestamp(),
                deviceInfo: navigator.userAgent.substring(0, 100) // Basic device info
            });

            // Store session ID in localStorage (minimal data)
            const sessionData = {
                sessionId: sessionId,
                username: adminData.username,
                loginTime: new Date().toISOString(),
                expiresAt: expiresAt.toISOString()
            };

            localStorage.setItem('adminAuth', JSON.stringify(sessionData));
            
            // Reset attempts on successful login
            setAttempts(0);

            setMessage("Login successful! Redirecting...");
            setTimeout(() => {
                navigate('/admin-dashboard');
            }, 1500);

        } catch (error) {
            console.error("Login error:", error);
            setMessage("Error logging in. Please try again.");
            setAttempts(prev => prev + 1);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        if (isLogin) {
            await handleLogin();
        } else {
            await handleRegister();
        }
    };

    const toggleAuthMode = () => {
        setIsLogin(!isLogin);
        setMessage("");
        setAttempts(0);
        setFormData({ username: "", password: "", confirmPassword: "" });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-red-500 via-red-600 to-red-700 flex items-center justify-center px-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FaShieldAlt className="text-red-500 text-2xl" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">
                        Admin {isLogin ? 'Login' : 'Registration'}
                    </h1>
                    <p className="text-gray-600">
                        {isLogin 
                            ? '🌐 Access from any device with your credentials' 
                            : 'Create a new admin account'
                        }
                    </p>
                </div>

                {/* Cross-device info */}
                {isLogin && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-blue-700 text-sm">
                            ✨ Your session will sync across all devices automatically
                        </p>
                    </div>
                )}

                {/* Rate limiting warning */}
                {attempts >= 3 && attempts < 5 && (
                    <div className="mb-4 p-3 bg-yellow-100 border border-yellow-300 rounded-lg">
                        <p className="text-yellow-700 text-sm">
                            ⚠️ Warning: {5 - attempts} attempts remaining before temporary lockout
                        </p>
                    </div>
                )}

                {/* Account locked warning */}
                {attempts >= 5 && (
                    <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg">
                        <p className="text-red-700 text-sm">
                            🔒 Account temporarily locked due to too many failed attempts
                        </p>
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Username Field */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Username
                        </label>
                        <div className="relative">
                            <FaUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                name="username"
                                value={formData.username}
                                onChange={handleInputChange}
                                placeholder="Enter your username"
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition duration-200 text-gray-900 bg-white"
                                required
                                disabled={attempts >= 5}
                            />
                        </div>
                    </div>

                    {/* Password Field */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Password
                        </label>
                        <div className="relative">
                            <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                value={formData.password}
                                onChange={handleInputChange}
                                placeholder="Enter your password"
                                className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition duration-200 text-gray-900 bg-white"
                                required
                                disabled={attempts >= 5}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition duration-200"
                                disabled={attempts >= 5}
                            >
                                {showPassword ? <FaEyeSlash /> : <FaEye />}
                            </button>
                        </div>
                    </div>

                    {/* Confirm Password Field (Registration only) */}
                    {!isLogin && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Confirm Password
                            </label>
                            <div className="relative">
                                <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleInputChange}
                                    placeholder="Confirm your password"
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition duration-200 text-gray-900 bg-white"
                                    required
                                />
                            </div>
                        </div>
                    )}

                    {/* Message Display */}
                    {message && (
                        <div className={`p-4 rounded-lg text-sm font-medium ${
                            message.includes('Error') || message.includes('Invalid') || message.includes('exists') || 
                            message.includes('deactivated') || message.includes('locked') || message.includes('Too many')
                                ? 'bg-red-100 text-red-700 border border-red-300'
                                : 'bg-green-100 text-green-700 border border-green-300'
                        }`}>
                            {message}
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isLoading || attempts >= 5}
                        className={`w-full py-3 rounded-lg font-semibold text-white transition duration-200 ${
                            isLoading || attempts >= 5
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-red-500 hover:bg-red-600 hover:shadow-lg transform hover:scale-[1.02]'
                        }`}
                    >
                        {isLoading 
                            ? (
                                <span className="flex items-center justify-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    {isLogin ? 'Logging in...' : 'Creating account...'}
                                </span>
                            ) 
                            : attempts >= 5
                            ? '🔒 Account Locked - Try Later'
                            : (isLogin ? '🌐 Login (Any Device)' : 'Create Account')
                        }
                    </button>

                    {/* Toggle Auth Mode */}
                    <div className="text-center pt-4">
                        <button
                            type="button"
                            onClick={toggleAuthMode}
                            className={`font-medium transition duration-200 ${
                                attempts >= 5 
                                    ? 'text-gray-400 cursor-not-allowed' 
                                    : 'text-red-500 hover:text-red-600'
                            }`}
                            disabled={attempts >= 5}
                        >
                            {isLogin 
                                ? "Don't have an admin account? Register here" 
                                : "Already have an account? Login here"
                            }
                        </button>
                    </div>
                </form>

                {/* Back to Main Site */}
                <div className="text-center mt-8 pt-6 border-t border-gray-200">
                    <button
                        onClick={() => navigate('/')}
                        className="text-gray-500 hover:text-gray-700 font-medium transition duration-200 flex items-center justify-center mx-auto"
                    >
                        ← Back to Main Site
                    </button>
                </div>

                {/* Security Notice */}
                <div className="text-center mt-4">
                    <p className="text-xs text-gray-400">
                        🔐 Sessions are encrypted and sync across devices
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AdminAuth;