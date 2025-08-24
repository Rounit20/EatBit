import React, { useState, useEffect } from "react";
import { FaUserCircle, FaUser, FaVenusMars, FaPhone, FaEnvelope, FaIdCard, FaBuilding, FaMapMarkerAlt, FaSave, FaEdit, FaCheck, FaShoppingCart, FaArrowLeft, FaExclamationTriangle } from "react-icons/fa";
import { auth, db } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { useNavigate, useLocation } from "react-router-dom";

const UserData = () => {
  const [user, loading] = useAuthState(auth);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Check if user came from checkout
  const fromCheckout = location.state?.fromCheckout || false;
  
  const [formData, setFormData] = useState({
    name: "",
    gender: "",
    mobile: "",
    email: "",
    rollNo: "",
    hostelNo: "",
    address: "",
  });
  
  const [isEditing, setIsEditing] = useState(fromCheckout); // Auto-enable editing if from checkout
  const [saveLoading, setSaveLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [validationErrors, setValidationErrors] = useState({});

  // Required fields for validation
  const requiredFields = [
    { key: 'name', label: 'Full Name' },
    { key: 'gender', label: 'Gender' },
    { key: 'mobile', label: 'Mobile Number' },
    { key: 'rollNo', label: 'Roll Number' },
    { key: 'hostelNo', label: 'Hostel Number' },
    { key: 'address', label: 'Address' }
  ];

  useEffect(() => {
    if (!user && !loading) {
      navigate("/login");
      return;
    }
    if (user) fetchUserData(user.uid);
  }, [user, loading, navigate]);

  const fetchUserData = async (userId) => {
    try {
      const docRef = doc(db, "users", userId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setFormData(docSnap.data());
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const validateForm = () => {
    const errors = {};
    
    // Check required fields
    requiredFields.forEach(field => {
      const value = formData[field.key];
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        errors[field.key] = `${field.label} is required`;
      }
    });

    // Validate mobile number format (Indian mobile numbers)
    if (formData.mobile && !/^(\+91|91)?[6-9]\d{9}$/.test(formData.mobile.replace(/\s+/g, ''))) {
      errors.mobile = 'Please enter a valid Indian mobile number';
    }

    // Validate roll number format (you can customize this)
    if (formData.rollNo && formData.rollNo.length < 3) {
      errors.rollNo = 'Roll number should be at least 3 characters long';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const checkProfileCompleteness = () => {
    return requiredFields.every(field => {
      const value = formData[field.key];
      return value && (typeof value !== 'string' || value.trim() !== '');
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Clear validation error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors({ ...validationErrors, [name]: '' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;

    // Validate form before submitting
    if (!validateForm()) {
      return;
    }

    setSaveLoading(true);
    setSuccessMessage("");

    try {
      await setDoc(doc(db, "users", user.uid), formData, { merge: true });
      
      setSuccessMessage("Profile updated successfully!");
      setIsEditing(false);
      
      // If user came from checkout and profile is now complete, offer to go back
      if (fromCheckout && checkProfileCompleteness()) {
        setTimeout(() => {
          const goToCheckout = window.confirm(
            "Profile updated successfully! Would you like to go back to checkout to complete your order?"
          );
          if (goToCheckout) {
            navigate("/cart"); // Navigate to cart, they can proceed to checkout from there
          }
        }, 1000);
      } else {
        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(""), 3000);
      }
    } catch (error) {
      console.error("Error saving data:", error);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleBackToCheckout = () => {
    navigate("/cart");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg font-medium">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Checkout Alert Banner */}
        {fromCheckout && (
          <div className="bg-orange-100 border border-orange-300 rounded-2xl p-6 mb-8">
            <div className="flex items-start gap-4">
              <FaExclamationTriangle className="text-orange-500 text-2xl mt-1 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-orange-800 mb-2">
                  Complete Your Profile to Place Order
                </h3>
                <p className="text-orange-700 mb-4">
                  We need some additional information to process your order and ensure successful delivery.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleBackToCheckout}
                    className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition duration-200"
                  >
                    <FaArrowLeft />
                    Back to Cart
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Header Section */}
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl border border-white/20 p-8 mb-8">
          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Profile Picture */}
            <div className="relative">
              <div className="w-32 h-32 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                <FaUserCircle className="text-white text-8xl" />
              </div>
              <div className={`absolute bottom-2 right-2 w-6 h-6 rounded-full border-4 border-white ${
                checkProfileCompleteness() ? 'bg-green-500' : 'bg-orange-400'
              }`}></div>
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                {formData.name || "Complete Your Profile"}
              </h1>
              <p className="text-gray-600 mb-1">{user?.email}</p>
              <p className="text-sm text-gray-500">
                {formData.rollNo ? `Roll No: ${formData.rollNo}` : "Student Profile"}
              </p>
              
              {/* Profile Status */}
              <div className="mt-2">
                {checkProfileCompleteness() ? (
                  <span className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                    <FaCheck className="text-green-600" />
                    Profile Complete
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2 bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium">
                    <FaExclamationTriangle className="text-orange-600" />
                    Profile Incomplete
                  </span>
                )}
              </div>
              
              {/* Success Message */}
              {successMessage && (
                <div className="mt-4 inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium">
                  <FaCheck className="text-green-600" />
                  {successMessage}
                </div>
              )}
            </div>

            {/* Edit Button */}
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                isEditing 
                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
                  : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 shadow-lg hover:shadow-xl transform hover:scale-105'
              }`}
            >
              <FaEdit />
              {isEditing ? 'Cancel' : 'Edit Profile'}
            </button>
          </div>
        </div>

        {/* Form Section */}
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl border border-white/20 p-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Personal Information</h2>
            <p className="text-gray-600">Manage your account details and preferences</p>
            {fromCheckout && (
              <p className="text-orange-600 text-sm mt-1 font-medium">
                * All fields are required for placing orders
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Personal Details */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-700 border-b border-gray-200 pb-2">
                  Basic Details
                </h3>

                {/* Name Field */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <FaUser className="text-blue-500" />
                    Full Name {fromCheckout && <span className="text-red-500">*</span>}
                  </label>
                  <input 
                    type="text" 
                    name="name" 
                    value={formData.name} 
                    onChange={handleChange}
                    disabled={!isEditing}
                    className={`w-full px-4 py-3 border rounded-xl transition-all duration-200 focus:outline-none ${
                      validationErrors.name
                        ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                        : isEditing 
                        ? 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white text-gray-900 placeholder-gray-400' 
                        : 'border-gray-200 bg-gray-50 text-gray-600'
                    }`}
                    placeholder="Enter your full name"
                    required 
                  />
                  {validationErrors.name && (
                    <p className="text-red-500 text-sm">{validationErrors.name}</p>
                  )}
                </div>

                {/* Gender Field */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <FaVenusMars className="text-purple-500" />
                    Gender {fromCheckout && <span className="text-red-500">*</span>}
                  </label>
                  {isEditing ? (
                    <select 
                      name="gender" 
                      value={formData.gender} 
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border rounded-xl focus:outline-none bg-white text-gray-900 ${
                        validationErrors.gender
                          ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                          : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                      }`}
                      required
                    >
                      <option value="" className="text-gray-400">Select Gender</option>
                      <option value="Male" className="text-gray-900">Male</option>
                      <option value="Female" className="text-gray-900">Female</option>
                      <option value="Other" className="text-gray-900">Other</option>
                    </select>
                  ) : (
                    <input 
                      type="text" 
                      value={formData.gender || "Not specified"} 
                      disabled
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-600"
                    />
                  )}
                  {validationErrors.gender && (
                    <p className="text-red-500 text-sm">{validationErrors.gender}</p>
                  )}
                </div>

                {/* Mobile Field */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <FaPhone className="text-green-500" />
                    Mobile Number {fromCheckout && <span className="text-red-500">*</span>}
                  </label>
                  <input 
                    type="tel" 
                    name="mobile" 
                    value={formData.mobile} 
                    onChange={handleChange}
                    disabled={!isEditing}
                    className={`w-full px-4 py-3 border rounded-xl transition-all duration-200 focus:outline-none ${
                      validationErrors.mobile
                        ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                        : isEditing 
                        ? 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white text-gray-900 placeholder-gray-400' 
                        : 'border-gray-200 bg-gray-50 text-gray-600'
                    }`}
                    placeholder="+91 XXXXX XXXXX"
                    required 
                  />
                  {validationErrors.mobile && (
                    <p className="text-red-500 text-sm">{validationErrors.mobile}</p>
                  )}
                </div>

                {/* Email Field */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <FaEnvelope className="text-red-500" />
                    Email Address
                  </label>
                  <input 
                    type="email" 
                    name="email" 
                    value={user?.email || ""} 
                    disabled
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-600"
                  />
                  <p className="text-xs text-gray-500">Email cannot be changed</p>
                </div>
              </div>

              {/* Academic & Contact Details */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-700 border-b border-gray-200 pb-2">
                  Academic Details
                </h3>

                {/* Roll Number Field */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <FaIdCard className="text-indigo-500" />
                    Roll Number {fromCheckout && <span className="text-red-500">*</span>}
                  </label>
                  <input 
                    type="text" 
                    name="rollNo" 
                    value={formData.rollNo} 
                    onChange={handleChange}
                    disabled={!isEditing}
                    className={`w-full px-4 py-3 border rounded-xl transition-all duration-200 focus:outline-none ${
                      validationErrors.rollNo
                        ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                        : isEditing 
                        ? 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white text-gray-900 placeholder-gray-400' 
                        : 'border-gray-200 bg-gray-50 text-gray-600'
                    }`}
                    placeholder="Enter your roll number"
                    required 
                  />
                  {validationErrors.rollNo && (
                    <p className="text-red-500 text-sm">{validationErrors.rollNo}</p>
                  )}
                </div>

                {/* Hostel Number Field */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <FaBuilding className="text-orange-500" />
                    Hostel Number {fromCheckout && <span className="text-red-500">*</span>}
                  </label>
                  <input 
                    type="text" 
                    name="hostelNo" 
                    value={formData.hostelNo} 
                    onChange={handleChange}
                    disabled={!isEditing}
                    className={`w-full px-4 py-3 border rounded-xl transition-all duration-200 focus:outline-none ${
                      validationErrors.hostelNo
                        ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                        : isEditing 
                        ? 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white text-gray-900 placeholder-gray-400' 
                        : 'border-gray-200 bg-gray-50 text-gray-600'
                    }`}
                    placeholder="Enter your hostel number"
                    required 
                  />
                  {validationErrors.hostelNo && (
                    <p className="text-red-500 text-sm">{validationErrors.hostelNo}</p>
                  )}
                </div>

                {/* Address Field */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <FaMapMarkerAlt className="text-red-500" />
                    Address {fromCheckout && <span className="text-red-500">*</span>}
                  </label>
                  <textarea 
                    name="address" 
                    value={formData.address} 
                    onChange={handleChange}
                    disabled={!isEditing}
                    rows={4}
                    className={`w-full px-4 py-3 border rounded-xl transition-all duration-200 resize-none focus:outline-none ${
                      validationErrors.address
                        ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                        : isEditing 
                        ? 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white text-gray-900 placeholder-gray-400' 
                        : 'border-gray-200 bg-gray-50 text-gray-600'
                    }`}
                    placeholder="Enter your complete address"
                    required
                  />
                  {validationErrors.address && (
                    <p className="text-red-500 text-sm">{validationErrors.address}</p>
                  )}
                </div>

                {/* Save Button */}
                {isEditing && (
                  <button 
                    type="submit"
                    disabled={saveLoading}
                    className={`w-full py-4 rounded-xl font-semibold text-white transition-all duration-200 ${
                      saveLoading
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl'
                    }`}
                  >
                    {saveLoading ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                        <span>Saving...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center space-x-2">
                        <FaSave />
                        <span>{fromCheckout ? 'Save & Continue to Order' : 'Save Changes'}</span>
                      </div>
                    )}
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>

        {/* Quick Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 p-6 text-center">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 ${
              formData.name ? 'bg-green-100' : 'bg-orange-100'
            }`}>
              <FaUser className={`text-xl ${formData.name ? 'text-green-600' : 'text-orange-600'}`} />
            </div>
            <h3 className="font-semibold text-gray-800 mb-1">Profile</h3>
            <p className="text-sm text-gray-600">
              {checkProfileCompleteness() ? 'Complete' : 'Incomplete'}
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 p-6 text-center">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 ${
              formData.rollNo ? 'bg-green-100' : 'bg-orange-100'
            }`}>
              <FaIdCard className={`text-xl ${formData.rollNo ? 'text-green-600' : 'text-orange-600'}`} />
            </div>
            <h3 className="font-semibold text-gray-800 mb-1">Academic</h3>
            <p className="text-sm text-gray-600">
              {formData.rollNo ? 'Verified' : 'Pending'}
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 p-6 text-center">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 ${
              formData.hostelNo ? 'bg-green-100' : 'bg-orange-100'
            }`}>
              <FaBuilding className={`text-xl ${formData.hostelNo ? 'text-green-600' : 'text-orange-600'}`} />
            </div>
            <h3 className="font-semibold text-gray-800 mb-1">Hostel</h3>
            <p className="text-sm text-gray-600">
              {formData.hostelNo ? `Block ${formData.hostelNo}` : 'Not Set'}
            </p>
          </div>
        </div>

        {/* Help Section */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-6 mt-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-1">Need Help?</h3>
              <p className="text-blue-100 text-sm">Contact support for any profile-related issues</p>
            </div>
            <button className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-105">
              Contact Support
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserData;