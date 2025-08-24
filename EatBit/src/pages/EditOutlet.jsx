import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { db } from "../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import {
    FaArrowLeft,
    FaSave,
    FaUtensils,
    FaMapMarkerAlt,
    FaDollarSign,
    FaClock,
    FaPhone,
    FaGlobe,
    FaImage,
    FaPlus,
    FaTrash
} from "react-icons/fa";

const EditOutlet = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState("");

    const [formData, setFormData] = useState({
        name: "",
        cuisine: "",
        category: "restaurant",
        address: "",
        phone: "",
        email: "",
        website: "",
        image: "",
        priceForTwo: "",
        rating: 0,
        deliveryTime: "",
        isOpen: true,
        openingHours: {
            monday: { open: "09:00", close: "22:00", isOpen: true },
            tuesday: { open: "09:00", close: "22:00", isOpen: true },
            wednesday: { open: "09:00", close: "22:00", isOpen: true },
            thursday: { open: "09:00", close: "22:00", isOpen: true },
            friday: { open: "09:00", close: "22:00", isOpen: true },
            saturday: { open: "09:00", close: "22:00", isOpen: true },
            sunday: { open: "09:00", close: "22:00", isOpen: true }
        },
        menuItems: [],
        description: ""
    });

    const categories = ["restaurant", "cafe", "fast-food", "bakery", "bar"];
    const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

    useEffect(() => {
        checkAdminAuth();
        if (id) {
            fetchOutletData();
        }
    }, [id]);

    const checkAdminAuth = () => {
        const adminAuth = localStorage.getItem('adminAuth');
        if (!adminAuth) {
            navigate('/admin-login');
        }
    };

    const fetchOutletData = async () => {
        try {
            setIsLoading(true);
            const docRef = doc(db, "outlets", id);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                setFormData({
                    name: data.name || "",
                    cuisine: data.cuisine || "",
                    category: data.category || "restaurant",
                    address: data.address || "",
                    phone: data.phone || "",
                    email: data.email || "",
                    website: data.website || "",
                    image: data.image || "",
                    priceForTwo: data.priceForTwo || "",
                    rating: data.rating || 0,
                    deliveryTime: data.deliveryTime || "",
                    isOpen: data.isOpen !== undefined ? data.isOpen : true,
                    openingHours: data.openingHours || {
                        monday: { open: "09:00", close: "22:00", isOpen: true },
                        tuesday: { open: "09:00", close: "22:00", isOpen: true },
                        wednesday: { open: "09:00", close: "22:00", isOpen: true },
                        thursday: { open: "09:00", close: "22:00", isOpen: true },
                        friday: { open: "09:00", close: "22:00", isOpen: true },
                        saturday: { open: "09:00", close: "22:00", isOpen: true },
                        sunday: { open: "09:00", close: "22:00", isOpen: true }
                    },
                    menuItems: data.menuItems || [],
                    description: data.description || ""
                });
            } else {
                setMessage("Outlet not found");
                setTimeout(() => navigate('/admin-dashboard'), 2000);
            }
        } catch (error) {
            console.error("Error fetching outlet:", error);
            setMessage("Error loading outlet data");
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleTimeChange = (day, timeType, value) => {
        setFormData(prev => ({
            ...prev,
            openingHours: {
                ...prev.openingHours,
                [day]: {
                    ...prev.openingHours[day],
                    [timeType]: value
                }
            }
        }));
    };

    const handleDayToggle = (day) => {
        setFormData(prev => ({
            ...prev,
            openingHours: {
                ...prev.openingHours,
                [day]: {
                    ...prev.openingHours[day],
                    open: prev.openingHours[day]?.open || "09:00",
                    close: prev.openingHours[day]?.close || "22:00",
                    isOpen: !prev.openingHours[day]?.isOpen
                }
            }
        }));
    };

    const addMenuItem = () => {
        setFormData(prev => ({
            ...prev,
            menuItems: [...prev.menuItems, { name: "", price: "", description: "", category: "" }]
        }));
    };

    const removeMenuItem = (index) => {
        setFormData(prev => ({
            ...prev,
            menuItems: prev.menuItems.filter((_, i) => i !== index)
        }));
    };

    const handleMenuItemChange = (index, field, value) => {
        setFormData(prev => ({
            ...prev,
            menuItems: prev.menuItems.map((item, i) =>
                i === index ? { ...item, [field]: value } : item
            )
        }));
    };

    const validateForm = () => {
        if (!formData.name.trim()) {
            setMessage("Restaurant name is required");
            return false;
        }
        if (!formData.cuisine.trim()) {
            setMessage("Cuisine type is required");
            return false;
        }
        if (!formData.address.trim()) {
            setMessage("Address is required");
            return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        try {
            setIsSaving(true);
            setMessage("");

            const updateData = {
                ...formData,
                updatedAt: new Date().toISOString(),
                rating: parseFloat(formData.rating) || 0
            };

            const docRef = doc(db, "outlets", id);
            await updateDoc(docRef, updateData);

            setMessage("Outlet updated successfully! Redirecting...");
            setTimeout(() => {
                navigate('/admin-dashboard');
            }, 2000);

        } catch (error) {
            console.error("Error updating outlet:", error);
            setMessage("Error updating outlet. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading outlet data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-lg border-b border-gray-200">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between py-4">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate('/admin-dashboard')}
                                className="bg-gray-100 hover:bg-gray-200 p-2 rounded-lg transition duration-200"
                            >
                                <FaArrowLeft className="text-gray-600" />
                            </button>
                            <div className="flex items-center gap-3">
                                <div className="bg-red-100 p-2 rounded-lg">
                                    <FaUtensils className="text-red-500 text-xl" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-800">Edit Outlet</h1>
                                    <p className="text-sm text-gray-600">Update outlet information</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Basic Information */}
                    <div className="bg-white rounded-2xl shadow-lg p-6">
                        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                            <FaUtensils className="text-red-500" />
                            Basic Information
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Restaurant Name *
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition duration-200 text-gray-900 bg-white"
                                    placeholder="Enter restaurant name"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Cuisine Type *
                                </label>
                                <input
                                    type="text"
                                    name="cuisine"
                                    value={formData.cuisine}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition duration-200 text-gray-900 bg-white"
                                    placeholder="e.g., Italian, Chinese, Indian"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Category
                                </label>
                                <select
                                    name="category"
                                    value={formData.category}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition duration-200 text-gray-900 bg-white"
                                >
                                    {categories.map(category => (
                                        <option key={category} value={category}>
                                            {category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' ')}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Price for Two
                                </label>
                                <div className="relative">
                                    <FaDollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        name="priceForTwo"
                                        value={formData.priceForTwo}
                                        onChange={handleInputChange}
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition duration-200 text-gray-900 bg-white"
                                        placeholder="e.g., ₹500 for two"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Rating (0-5)
                                </label>
                                <input
                                    type="number"
                                    name="rating"
                                    value={formData.rating}
                                    onChange={handleInputChange}
                                    min="0"
                                    max="5"
                                    step="0.1"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition duration-200 text-gray-900 bg-white"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Delivery Time
                                </label>
                                <div className="relative">
                                    <FaClock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        name="deliveryTime"
                                        value={formData.deliveryTime}
                                        onChange={handleInputChange}
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition duration-200 text-gray-900 bg-white"
                                        placeholder="e.g., 30-45 mins"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="mt-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Description
                            </label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                rows="3"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition duration-200 text-gray-900 bg-white"
                                placeholder="Brief description of the restaurant..."
                            />
                        </div>
                    </div>

                    {/* Contact Information */}
                    <div className="bg-white rounded-2xl shadow-lg p-6">
                        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                            <FaMapMarkerAlt className="text-red-500" />
                            Contact Information
                        </h2>

                        <div className="grid grid-cols-1 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Address *
                                </label>
                                <textarea
                                    name="address"
                                    value={formData.address}
                                    onChange={handleInputChange}
                                    rows="2"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition duration-200 text-gray-900 bg-white"
                                    placeholder="Enter full address"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Phone Number
                                    </label>
                                    <div className="relative">
                                        <FaPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleInputChange}
                                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition duration-200 text-gray-900 bg-white"
                                            placeholder="e.g., +91 9876543210"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition duration-200 text-gray-900 bg-white"
                                        placeholder="restaurant@example.com"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Website
                                    </label>
                                    <div className="relative">
                                        <FaGlobe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="url"
                                            name="website"
                                            value={formData.website}
                                            onChange={handleInputChange}
                                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition duration-200 text-gray-900 bg-white"
                                            placeholder="https://example.com"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Image URL
                                    </label>
                                    <div className="relative">
                                        <FaImage className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="url"
                                            name="image"
                                            value={formData.image}
                                            onChange={handleInputChange}
                                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition duration-200 text-gray-900 bg-white"
                                            placeholder="https://example.com/image.jpg"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Operating Status */}
                    <div className="bg-white rounded-2xl shadow-lg p-6">
                        <h2 className="text-xl font-bold text-gray-800 mb-6">Operating Status</h2>

                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                id="isOpen"
                                name="isOpen"
                                checked={formData.isOpen}
                                onChange={handleInputChange}
                                className="w-5 h-5 text-red-600 bg-gray-100 border-gray-300 rounded focus:ring-red-500"
                            />
                            <label htmlFor="isOpen" className="text-sm font-medium text-gray-700">
                                Restaurant is currently open for orders
                            </label>
                        </div>
                    </div>

                    {/* Opening Hours */}
                    <div className="bg-white rounded-2xl shadow-lg p-6">
                        <h2 className="text-xl font-bold text-gray-800 mb-6">Opening Hours</h2>

                        <div className="space-y-4">
                            {days.map(day => {
                                // Add safety check here
                                const dayData = formData.openingHours[day] || { open: "09:00", close: "22:00", isOpen: true };

                                return (
                                    <div key={day} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                                        <div className="flex items-center gap-3 w-28">
                                            <input
                                                type="checkbox"
                                                id={day}
                                                checked={dayData.isOpen}
                                                onChange={() => handleDayToggle(day)}
                                                className="w-4 h-4 text-red-600 bg-gray-100 border-gray-300 rounded focus:ring-red-500"
                                            />
                                            <label htmlFor={day} className="text-sm font-medium text-gray-700 capitalize">
                                                {day}
                                            </label>
                                        </div>

                                        {dayData.isOpen ? (
                                            <div className="flex items-center gap-2 flex-1">
                                                <input
                                                    type="time"
                                                    value={dayData.open}
                                                    onChange={(e) => handleTimeChange(day, 'open', e.target.value)}
                                                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-900 bg-white"
                                                />
                                                <span className="text-gray-500">to</span>
                                                <input
                                                    type="time"
                                                    value={dayData.close}
                                                    onChange={(e) => handleTimeChange(day, 'close', e.target.value)}
                                                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-900 bg-white"
                                                />
                                            </div>
                                        ) : (
                                            <span className="text-gray-500 text-sm flex-1">Closed</span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Menu Items */}
                    <div className="bg-white rounded-2xl shadow-lg p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-800">Menu Items</h2>
                            <button
                                type="button"
                                onClick={addMenuItem}
                                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition duration-200"
                            >
                                <FaPlus /> Add Item
                            </button>
                        </div>

                        <div className="space-y-4">
                            {formData.menuItems.map((item, index) => (
                                <div key={index} className="border border-gray-200 rounded-lg p-4">
                                    <div className="flex justify-between items-start mb-4">
                                        <h3 className="font-medium text-gray-800">Item #{index + 1}</h3>
                                        <button
                                            type="button"
                                            onClick={() => removeMenuItem(index)}
                                            className="text-red-500 hover:text-red-600 transition duration-200"
                                        >
                                            <FaTrash />
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Item Name
                                            </label>
                                            <input
                                                type="text"
                                                value={item.name}
                                                onChange={(e) => handleMenuItemChange(index, 'name', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-900 bg-white"
                                                placeholder="e.g., Margherita Pizza"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Price
                                            </label>
                                            <input
                                                type="text"
                                                value={item.price}
                                                onChange={(e) => handleMenuItemChange(index, 'price', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-900 bg-white"
                                                placeholder="e.g., ₹299"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Category
                                            </label>
                                            <input
                                                type="text"
                                                value={item.category}
                                                onChange={(e) => handleMenuItemChange(index, 'category', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-900 bg-white"
                                                placeholder="e.g., Main Course"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Description
                                            </label>
                                            <input
                                                type="text"
                                                value={item.description}
                                                onChange={(e) => handleMenuItemChange(index, 'description', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-900 bg-white"
                                                placeholder="Brief description"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {formData.menuItems.length === 0 && (
                                <div className="text-center py-8 text-gray-500">
                                    No menu items added yet. Click "Add Item" to get started.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Message Display */}
                    {message && (
                        <div className={`p-4 rounded-lg text-sm font-medium ${message.includes('Error') || message.includes('required')
                            ? 'bg-red-100 text-red-700 border border-red-300'
                            : 'bg-green-100 text-green-700 border border-green-300'
                            }`}>
                            {message}
                        </div>
                    )}

                    {/* Submit Button */}
                    <div className="flex gap-4">
                        <button
                            type="button"
                            onClick={() => navigate('/admin-dashboard')}
                            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 px-6 rounded-xl font-semibold transition duration-200"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className={`flex-1 py-3 px-6 rounded-xl font-semibold text-white transition duration-200 flex items-center justify-center gap-2 ${isSaving
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-red-500 hover:bg-red-600 hover:shadow-lg transform hover:scale-105'
                                }`}
                        >
                            <FaSave />
                            {isSaving ? 'Updating...' : 'Update Outlet'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditOutlet;