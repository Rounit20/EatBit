import React, { useState, useEffect } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { FaPlus, FaStar, FaMapMarkerAlt, FaClock, FaUtensils, FaSearch, FaFilter } from "react-icons/fa";
import Navbar from "../components/Navbar";

const Outlets = () => {
    const [user, loading, error] = useAuthState(auth);
    const [outlets, setOutlets] = useState([]);
    const [filteredOutlets, setFilteredOutlets] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [sortBy, setSortBy] = useState("name");
    const navigate = useNavigate();

    useEffect(() => {
        if (!loading) {
            fetchOutlets();
        }
    }, [loading]);

    useEffect(() => {
        filterAndSortOutlets();
    }, [outlets, searchTerm, selectedCategory, sortBy]);

    const fetchOutlets = async () => {
        try {
            setIsLoading(true);
            const q = query(collection(db, "outlets"), orderBy("createdAt", "desc"));
            const querySnapshot = await getDocs(q);
            const outletsData = [];
            
            querySnapshot.forEach((doc) => {
                outletsData.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            setOutlets(outletsData);
        } catch (error) {
            console.error("Error fetching outlets:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const filterAndSortOutlets = () => {
        let filtered = outlets;

        // Filter by search term
        if (searchTerm) {
            filtered = filtered.filter(outlet =>
                outlet.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                outlet.cuisine?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                outlet.address?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Filter by category
        if (selectedCategory !== "all") {
            filtered = filtered.filter(outlet => outlet.category === selectedCategory);
        }

        // Sort outlets
        filtered.sort((a, b) => {
            switch (sortBy) {
                case "name":
                    return (a.name || "").localeCompare(b.name || "");
                case "rating":
                    return (b.rating || 0) - (a.rating || 0);
                case "price":
                    const priceA = parseInt(a.priceForTwo?.replace(/[^\d]/g, '') || 0);
                    const priceB = parseInt(b.priceForTwo?.replace(/[^\d]/g, '') || 0);
                    return priceA - priceB;
                default:
                    return 0;
            }
        });

        setFilteredOutlets(filtered);
    };

    const handleOutletClick = (outlet) => {
        // Add validation before navigation
        if (!outlet || !outlet.id) {
            console.error("Invalid outlet data:", outlet);
            return;
        }
        
        console.log("Navigating to outlet:", outlet.id); // Debug log
        
        try {
            navigate(`/outlets/${outlet.id}`);
        } catch (navigationError) {
            console.error("Navigation error:", navigationError);
            // Fallback: you could show an alert or toast here
            alert("Unable to view outlet details. Please try again.");
        }
    };

    const categories = ["all", "restaurant", "cafe", "fast-food", "bakery", "bar"];

    if (loading) {
        return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
    }
    
    if (error) {
        return <div className="flex justify-center items-center min-h-screen text-red-500">Error: {error.message}</div>;
    }

    if (isLoading) {
        return (
            <div className="bg-gray-50 min-h-screen pt-20">
                <Navbar user={user} />
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
                    <span className="ml-3 text-gray-600">Loading outlets...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 min-h-screen pt-20">
            <Navbar user={user} />
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header Section */}
                <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h1 className="text-4xl font-bold text-gray-800 mb-2">Restaurant Outlets</h1>
                            <p className="text-gray-600">Discover amazing restaurants and cafes</p>
                        </div>
                        

                    </div>
                </div>

                {/* Search and Filter Section */}
                <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
                    <div className="flex flex-col lg:flex-row gap-4">
                        {/* Search Bar */}
                        <div className="flex-1 relative">
                            <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search restaurants, cuisines, or locations..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition duration-200 text-gray-900 bg-white"
                            />
                        </div>

                        {/* Category Filter */}
                        <div className="flex items-center gap-2">
                            <FaFilter className="text-gray-400" />
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition duration-200 text-gray-900 bg-white"
                            >
                                {categories.map(category => (
                                    <option key={category} value={category}>
                                        {category === "all" ? "All Categories" : 
                                         category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' ')}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Sort Options */}
                        <div>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition duration-200 text-gray-900 bg-white"
                            >
                                <option value="name">Sort by Name</option>
                                <option value="rating">Sort by Rating</option>
                                <option value="price">Sort by Price</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Results Count */}
                <div className="mb-6">
                    <p className="text-gray-600">
                        {filteredOutlets.length === 0 
                            ? "No outlets found" 
                            : `Showing ${filteredOutlets.length} ${filteredOutlets.length === 1 ? 'outlet' : 'outlets'}`
                        }
                        {searchTerm && ` for "${searchTerm}"`}
                    </p>
                </div>

                {/* Outlets Grid */}
                {filteredOutlets.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-lg p-16 text-center">
                        <FaUtensils className="mx-auto text-6xl text-gray-300 mb-4" />
                        <h2 className="text-2xl font-semibold text-gray-700 mb-2">No outlets found</h2>
                        <p className="text-gray-500 mb-6">
                            {searchTerm || selectedCategory !== "all" 
                                ? "Try adjusting your search or filter criteria" 
                                : "Be the first to add an outlet!"}
                        </p>

                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredOutlets.map((outlet) => (
                            <div
                                key={outlet.id}
                                className="bg-white rounded-2xl shadow-lg overflow-hidden cursor-pointer transform transition duration-300 hover:scale-105 hover:shadow-xl"
                            >
                                {/* Outlet Image */}
                                <div className="relative h-48 overflow-hidden">
                                    <img
                                        src={outlet.image || "/api/placeholder/300/200"}
                                        alt={outlet.name}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            e.target.src = "/api/placeholder/300/200";
                                        }}
                                    />
                                    
                                    {/* Category Badge */}
                                    <div className="absolute top-3 left-3">
                                        <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-semibold capitalize">
                                            {outlet.category || 'Restaurant'}
                                        </span>
                                    </div>

                                    {/* Rating Badge */}
                                    {outlet.rating > 0 && (
                                        <div className="absolute top-3 right-3 bg-white bg-opacity-90 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1">
                                            <FaStar className="text-yellow-500 text-xs" />
                                            <span className="text-xs font-semibold text-gray-700">
                                                {outlet.rating.toFixed(1)}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Outlet Details */}
                                <div className="p-5">
                                    <div className="mb-3">
                                        <h3 className="font-bold text-lg text-gray-800 mb-1 line-clamp-1">
                                            {outlet.name}
                                        </h3>
                                        <p className="text-gray-600 text-sm mb-2 line-clamp-1">
                                            {outlet.cuisine}
                                        </p>
                                    </div>

                                    {/* Price */}
                                    {outlet.priceForTwo && (
                                        <div className="mb-3">
                                            <p className="text-green-600 font-semibold text-sm">
                                                {outlet.priceForTwo}
                                            </p>
                                        </div>
                                    )}

                                    {/* Address */}
                                    <div className="flex items-start gap-2 mb-3">
                                        <FaMapMarkerAlt className="text-red-500 mt-0.5 flex-shrink-0" size={12} />
                                        <p className="text-gray-600 text-sm line-clamp-2">
                                            {outlet.address}
                                        </p>
                                    </div>

                                    {/* Opening Hours */}
                                    {outlet.openingHours && (
                                        <div className="flex items-center gap-2 mb-3">
                                            <FaClock className="text-green-500 flex-shrink-0" size={12} />
                                            <p className="text-gray-600 text-sm line-clamp-1">
    {typeof outlet.openingHours === 'string' 
        ? outlet.openingHours 
        : outlet.openingHours && typeof outlet.openingHours === 'object'
            ? Object.entries(outlet.openingHours)
                .map(([day, hours]) => `${day.charAt(0).toUpperCase() + day.slice(1)}: ${hours}`)
                .slice(0, 1)
                .join('')
            : 'Hours not available'}
</p>
                                        </div>
                                    )}

                                    {/* Menu Items Count */}
                                    {outlet.menuItems && outlet.menuItems.length > 0 && (
                                        <div className="flex items-center gap-2 mb-4">
                                            <FaUtensils className="text-orange-500 flex-shrink-0" size={12} />
                                            <p className="text-gray-600 text-sm">
                                                {outlet.menuItems.length} menu items
                                            </p>
                                        </div>
                                    )}

                                    {/* Description */}
                                    {outlet.description && (
                                        <p className="text-gray-500 text-sm line-clamp-2 mb-4">
                                            {outlet.description}
                                        </p>
                                    )}

                                    {/* Action Button - Fixed the onClick handler */}
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation(); // Prevent event bubbling
                                            handleOutletClick(outlet);
                                        }}
                                        className="w-full bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg font-semibold text-sm transition duration-200 transform hover:scale-105"
                                    >
                                        View Details
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Load More Button (for future pagination) */}
                {filteredOutlets.length > 0 && filteredOutlets.length >= 12 && (
                    <div className="text-center mt-12">
                        <button className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-8 py-3 rounded-xl font-semibold transition duration-200">
                            Load More Outlets
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Outlets;