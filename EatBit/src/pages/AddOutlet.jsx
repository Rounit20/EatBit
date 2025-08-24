import React, { useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { FaPlus, FaTrash, FaUtensils, FaMapMarkerAlt, FaClock, FaPhone, FaImage, FaStar } from "react-icons/fa";
import Navbar from "../components/Navbar";

const AddOutlet = () => {
    const [user, loading, error] = useAuthState(auth);
    const navigate = useNavigate();
    
    // Basic outlet information
    const [outletData, setOutletData] = useState({
        name: "",
        cuisine: "",
        description: "",
        address: "",
        phone: "",
        email: "",
        openingHours: "",
        priceForTwo: "",
        image: "",
        rating: 0,
        category: "restaurant" // restaurant, cafe, fast-food, etc.
    });

    // Menu items
    const [menuItems, setMenuItems] = useState([
        { name: "", description: "", price: "", category: "starter", isVeg: true, image: "" }
    ]);

    // Categories for menu items
    const menuCategories = ["starter", "main-course", "dessert", "beverages", "snacks"];
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitMessage, setSubmitMessage] = useState("");

    if (loading) return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
    if (error) return <div className="flex justify-center items-center min-h-screen text-red-500">Error: {error.message}</div>;
    if (!user) {
        navigate("/login");
        return null;
    }

    const handleOutletChange = (e) => {
        const { name, value } = e.target;
        setOutletData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleMenuItemChange = (index, field, value) => {
        const updatedMenuItems = [...menuItems];
        updatedMenuItems[index][field] = value;
        setMenuItems(updatedMenuItems);
    };

    const addMenuItem = () => {
        setMenuItems([...menuItems, { 
            name: "", 
            description: "", 
            price: "", 
            category: "starter", 
            isVeg: true, 
            image: "" 
        }]);
    };

    const removeMenuItem = (index) => {
        if (menuItems.length > 1) {
            setMenuItems(menuItems.filter((_, i) => i !== index));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        try {
            // Validate required fields
            if (!outletData.name || !outletData.cuisine || !outletData.address) {
                setSubmitMessage("Please fill in all required fields (Name, Cuisine, Address)");
                setIsSubmitting(false);
                return;
            }

            // Filter out empty menu items
            const validMenuItems = menuItems.filter(item => 
                item.name.trim() && item.price.trim()
            );

            const outletToSave = {
                ...outletData,
                priceForTwo: outletData.priceForTwo ? `₹${outletData.priceForTwo} for two` : "",
                rating: parseFloat(outletData.rating) || 0,
                menuItems: validMenuItems,
                createdBy: user.uid,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            };

            // Add to Firestore
            const docRef = await addDoc(collection(db, "outlets"), outletToSave);
            
            setSubmitMessage("Outlet added successfully!");
            setTimeout(() => {
                navigate("/outlets");
            }, 2000);
            
        } catch (error) {
            console.error("Error adding outlet:", error);
            setSubmitMessage("Error adding outlet. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-gray-50 min-h-screen pt-20">
            <Navbar user={user} />
            
            <div className="max-w-6xl mx-auto p-6">
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    <div className="border-b border-gray-200 pb-6 mb-8">
                        <h1 className="text-4xl font-bold text-gray-800 flex items-center gap-3">
                            <FaUtensils className="text-red-500" />
                            Add New Outlet
                        </h1>
                        <p className="text-gray-600 mt-2">Fill in the details to add a new restaurant outlet</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Basic Information Section */}
                        <div className="bg-gray-50 rounded-xl p-6">
                            <h2 className="text-2xl font-semibold text-gray-700 mb-6 flex items-center gap-2">
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
                                        value={outletData.name}
                                        onChange={handleOutletChange}
                                        required
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition duration-200 text-gray-900 bg-white"
                                        placeholder="Enter restaurant name"
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Cuisine Type *
                                    </label>
                                    <input
                                        type="text"
                                        name="cuisine"
                                        value={outletData.cuisine}
                                        onChange={handleOutletChange}
                                        placeholder="e.g., North Indian, Chinese, Italian"
                                        required
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition duration-200 text-gray-900 bg-white"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Category
                                    </label>
                                    <select
                                        name="category"
                                        value={outletData.category}
                                        onChange={handleOutletChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition duration-200 text-gray-900 bg-white"
                                    >
                                        <option value="restaurant">Restaurant</option>
                                        <option value="cafe">Cafe</option>
                                        <option value="fast-food">Fast Food</option>
                                        <option value="bakery">Bakery</option>
                                        <option value="bar">Bar</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Price for Two
                                    </label>
                                    <input
                                        type="number"
                                        name="priceForTwo"
                                        value={outletData.priceForTwo}
                                        onChange={handleOutletChange}
                                        placeholder="400"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition duration-200 text-gray-900 bg-white"
                                    />
                                </div>
                            </div>

                            <div className="mt-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Description
                                </label>
                                <textarea
                                    name="description"
                                    value={outletData.description}
                                    onChange={handleOutletChange}
                                    rows="3"
                                    placeholder="Brief description about the outlet..."
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition duration-200 resize-none text-gray-900 bg-white"
                                />
                            </div>
                        </div>

                        {/* Contact Information Section */}
                        <div className="bg-blue-50 rounded-xl p-6">
                            <h2 className="text-2xl font-semibold text-gray-700 mb-6 flex items-center gap-2">
                                <FaPhone className="text-blue-500" />
                                Contact Information
                            </h2>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <FaMapMarkerAlt className="inline mr-1 text-red-500" />
                                        Address *
                                    </label>
                                    <textarea
                                        name="address"
                                        value={outletData.address}
                                        onChange={handleOutletChange}
                                        required
                                        rows="2"
                                        placeholder="Complete address with landmarks"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition duration-200 resize-none text-gray-900 bg-white"
                                    />
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Phone Number
                                        </label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={outletData.phone}
                                            onChange={handleOutletChange}
                                            placeholder="+91 9876543210"
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition duration-200 text-gray-900 bg-white"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Email
                                        </label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={outletData.email}
                                            onChange={handleOutletChange}
                                            placeholder="outlet@example.com"
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition duration-200 text-gray-900 bg-white"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <FaClock className="inline mr-1 text-green-500" />
                                        Opening Hours
                                    </label>
                                    <input
                                        type="text"
                                        name="openingHours"
                                        value={outletData.openingHours}
                                        onChange={handleOutletChange}
                                        placeholder="10:00 AM - 11:00 PM"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition duration-200 text-gray-900 bg-white"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <FaImage className="inline mr-1 text-purple-500" />
                                        Restaurant Image URL
                                    </label>
                                    <input
                                        type="url"
                                        name="image"
                                        value={outletData.image}
                                        onChange={handleOutletChange}
                                        placeholder="https://example.com/image.jpg"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition duration-200 text-gray-900 bg-white"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Menu Items Section */}
                        <div className="bg-green-50 rounded-xl p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-semibold text-gray-700 flex items-center gap-2">
                                    <FaUtensils className="text-green-500" />
                                    Menu Items
                                </h2>
                                <button
                                    type="button"
                                    onClick={addMenuItem}
                                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition duration-200"
                                >
                                    <FaPlus /> Add Item
                                </button>
                            </div>

                            <div className="space-y-4">
                                {menuItems.map((item, index) => (
                                    <div key={index} className="bg-white p-4 rounded-lg border border-gray-200">
                                        <div className="flex justify-between items-start mb-4">
                                            <h3 className="font-semibold text-gray-700">Menu Item {index + 1}</h3>
                                            {menuItems.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeMenuItem(index)}
                                                    className="text-red-500 hover:text-red-700 transition duration-200"
                                                >
                                                    <FaTrash />
                                                </button>
                                            )}
                                        </div>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Item Name
                                                </label>
                                                <input
                                                    type="text"
                                                    value={item.name}
                                                    onChange={(e) => handleMenuItemChange(index, 'name', e.target.value)}
                                                    placeholder="Dish name"
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 transition duration-200 text-gray-900 bg-white"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Price (₹)
                                                </label>
                                                <input
                                                    type="number"
                                                    value={item.price}
                                                    onChange={(e) => handleMenuItemChange(index, 'price', e.target.value)}
                                                    placeholder="120"
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 transition duration-200 text-gray-900 bg-white"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Category
                                                </label>
                                                <select
                                                    value={item.category}
                                                    onChange={(e) => handleMenuItemChange(index, 'category', e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 transition duration-200 text-gray-900 bg-white"
                                                >
                                                    {menuCategories.map(category => (
                                                        <option key={category} value={category}>
                                                            {category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' ')}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Type
                                                </label>
                                                <select
                                                    value={item.isVeg}
                                                    onChange={(e) => handleMenuItemChange(index, 'isVeg', e.target.value === 'true')}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 transition duration-200 text-gray-900 bg-white"
                                                >
                                                    <option value={true}>Vegetarian</option>
                                                    <option value={false}>Non-Vegetarian</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="mt-4">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Description
                                            </label>
                                            <textarea
                                                value={item.description}
                                                onChange={(e) => handleMenuItemChange(index, 'description', e.target.value)}
                                                placeholder="Brief description of the dish..."
                                                rows="2"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 transition duration-200 resize-none text-gray-900 bg-white"
                                            />
                                        </div>

                                        <div className="mt-4">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Item Image URL
                                            </label>
                                            <input
                                                type="url"
                                                value={item.image}
                                                onChange={(e) => handleMenuItemChange(index, 'image', e.target.value)}
                                                placeholder="https://example.com/dish-image.jpg"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 transition duration-200 text-gray-900 bg-white"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Submit Section */}
                        <div className="flex flex-col items-center space-y-4">
                            {submitMessage && (
                                <div className={`p-4 rounded-lg text-center font-medium ${
                                    submitMessage.includes('Error') 
                                        ? 'bg-red-100 text-red-700 border border-red-300' 
                                        : 'bg-green-100 text-green-700 border border-green-300'
                                }`}>
                                    {submitMessage}
                                </div>
                            )}
                            
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className={`px-8 py-4 rounded-xl text-white font-semibold text-lg transition duration-200 ${
                                    isSubmitting 
                                        ? 'bg-gray-400 cursor-not-allowed' 
                                        : 'bg-red-500 hover:bg-red-600 hover:shadow-lg transform hover:scale-105'
                                }`}
                            >
                                {isSubmitting ? 'Adding Outlet...' : 'Add Outlet'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AddOutlet;