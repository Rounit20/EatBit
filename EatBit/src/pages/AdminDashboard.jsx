import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { getDoc } from "firebase/firestore";
import {
    collection,
    getDocs,
    deleteDoc,
    doc,
    query,
    orderBy,
    setDoc,
    serverTimestamp,
    updateDoc
} from "firebase/firestore";
import {
    FaPlus,
    FaEdit,
    FaTrash,
    FaEye,
    FaSignOutAlt,
    FaUtensils,
    FaStar,
    FaMapMarkerAlt,
    FaSearch,
    FaFilter,
    FaUser,
    FaClock,
    FaCheck,
    FaTimes,
    FaPhone,
    FaEnvelope,
    FaStore,
    FaExclamationTriangle,
    FaCheckCircle,
    FaTimesCircle,
    FaSpinner,
    FaKey,
    FaInfoCircle
} from "react-icons/fa";

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [outlets, setOutlets] = useState([]);
    const [pendingApplications, setPendingApplications] = useState([]);
    const [filteredOutlets, setFilteredOutlets] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [adminInfo, setAdminInfo] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [outletToDelete, setOutletToDelete] = useState(null);
    const [activeTab, setActiveTab] = useState("outlets");
    const [processingApplication, setProcessingApplication] = useState(null);
    const [error, setError] = useState("");
    const [showApplicationDetails, setShowApplicationDetails] = useState({});

    const categories = ["all", "restaurant", "cafe", "fast-food", "bakery", "bar"];

    useEffect(() => {
        checkAdminAuth();
        fetchData();
    }, []);

    useEffect(() => {
        filterOutlets();
    }, [outlets, searchTerm, selectedCategory]);

    const checkAdminAuth = async () => {
        const adminAuth = localStorage.getItem('adminAuth');
        if (!adminAuth) {
            navigate('/admin-login');
            return;
        }

        try {
            const sessionData = JSON.parse(adminAuth);

            // Check if local session is expired
            if (sessionData.expiresAt && new Date(sessionData.expiresAt) < new Date()) {
                console.log("Local session expired");
                localStorage.removeItem('adminAuth');
                navigate('/admin-login');
                return;
            }

            // Validate session with Firestore (cross-device check)
            if (sessionData.sessionId) {
                try {
                    console.log("Validating session with Firestore...");
                    const sessionDoc = await getDoc(doc(db, "adminSessions", sessionData.sessionId));

                    if (!sessionDoc.exists()) {
                        console.log("Session not found in database");
                        localStorage.removeItem('adminAuth');
                        navigate('/admin-login');
                        return;
                    }

                    const serverSessionData = sessionDoc.data();

                    // Check if server session is expired
                    if (serverSessionData.expiresAt && serverSessionData.expiresAt.toDate() < new Date()) {
                        console.log("Server session expired");
                        // Clean up expired session
                        await deleteDoc(doc(db, "adminSessions", sessionData.sessionId));
                        localStorage.removeItem('adminAuth');
                        navigate('/admin-login');
                        return;
                    }

                    // Update last activity
                    await updateDoc(doc(db, "adminSessions", sessionData.sessionId), {
                        lastActivity: serverTimestamp()
                    });

                    // Set admin info from server data
                    setAdminInfo({
                        username: serverSessionData.username,
                        sessionId: sessionData.sessionId,
                        loginTime: sessionData.loginTime,
                        expiresAt: sessionData.expiresAt
                    });

                    console.log("Session validated successfully");
                } catch (sessionError) {
                    console.error("Session validation error:", sessionError);
                    // If session validation fails, still try to use local data as fallback
                    setAdminInfo(sessionData);
                }
            } else {
                // Fallback to local session data (backward compatibility)
                setAdminInfo(sessionData);
            }

        } catch (error) {
            console.error("Invalid admin session:", error);
            localStorage.removeItem('adminAuth');
            navigate('/admin-login');
        }
    };

    const fetchData = async () => {
        try {
            setIsLoading(true);
            setError("");

            console.log("Fetching data...");
            await Promise.all([fetchOutlets(), fetchPendingApplications()]);
        } catch (error) {
            console.error("Error fetching data:", error);
            setError("Error loading data: " + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchOutlets = async () => {
        try {
            console.log("Fetching outlets...");
            const q = query(collection(db, "outlets"), orderBy("createdAt", "desc"));
            const querySnapshot = await getDocs(q);
            const outletsData = [];

            querySnapshot.forEach((doc) => {
                outletsData.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            console.log("Fetched outlets:", outletsData.length);
            setOutlets(outletsData);
        } catch (error) {
            console.error("Error fetching outlets:", error);
            throw error;
        }
    };

    const fetchPendingApplications = async () => {
        try {
            console.log("Fetching pending applications...");

            // Try fetching from pendingOutlets collection
            const pendingQuery = query(
                collection(db, "pendingOutlets"),
                orderBy("applicationDate", "desc")
            );

            const querySnapshot = await getDocs(pendingQuery);
            const pendingData = [];

            querySnapshot.forEach((doc) => {
                console.log("Pending application found:", doc.id, doc.data());
                pendingData.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            console.log("Total pending applications found:", pendingData.length);
            setPendingApplications(pendingData);

            // If no pending applications found, also try checking outletApplications
            if (pendingData.length === 0) {
                console.log("No pending applications found, checking outletApplications...");

                try {
                    const applicationsQuery = query(collection(db, "outletApplications"));
                    const appSnapshot = await getDocs(applicationsQuery);

                    appSnapshot.forEach((doc) => {
                        const appData = doc.data();
                        console.log("Application status:", appData.status, doc.data());

                        if (appData.status === "pending") {
                            pendingData.push({
                                id: doc.id,
                                userId: doc.id,
                                ...appData
                            });
                        }
                    });

                    console.log("Total applications after checking outletApplications:", pendingData.length);
                    setPendingApplications(pendingData);
                } catch (appError) {
                    console.error("Error fetching from outletApplications:", appError);
                }
            }

        } catch (error) {
            console.error("Error fetching pending applications:", error);
            // Don't throw here, just log the error
            setError(prev => prev + " Failed to load pending applications.");
        }
    };

    const generateOutletId = () => {
        return `OUT_${Date.now()}_${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    };

    const toggleApplicationDetails = (applicationId) => {
        setShowApplicationDetails(prev => ({
            ...prev,
            [applicationId]: !prev[applicationId]
        }));
    };

    const approveApplication = async (application) => {
        const confirmApproval = window.confirm(
            `Are you sure you want to approve the application for "${application.name}"?\n\n` +
            `This will:\n` +
            `• Generate a unique Outlet ID\n` +
            `• Create an active outlet listing\n` +
            `• Allow the owner to login with their credentials\n\n` +
            `Owner: ${application.ownerName}\n` +
            `Email: ${application.ownerEmail}\n` +
            `Phone: ${application.phone}`
        );

        if (!confirmApproval) return;

        setProcessingApplication(application.id);
        try {
            const outletId = generateOutletId();

            console.log("=== APPROVING APPLICATION ===");
            console.log("Application ID:", application.id);
            console.log("Generated Outlet ID:", outletId);

            // Create approved outlet with all necessary data
            const outletData = {
                // Basic outlet info
                outletId: outletId,
                name: application.name,
                ownerName: application.ownerName,
                ownerEmail: application.ownerEmail,
                phone: application.phone,
                address: application.address,
                description: application.description || "",
                cuisine: application.cuisine,
                category: application.category,
                
                // User and application tracking
                userId: application.userId,
                applicationId: application.applicationId,
                
                // Status and timestamps
                status: "approved",
                isActive: true,
                isOpen: true,
                
                // Ratings and metrics
                rating: 0,
                totalOrders: 0,
                totalReviews: 0,
                
                // Timestamps
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                approvedAt: serverTimestamp(),
                approvedBy: adminInfo?.username || "Admin",
                
                // Additional outlet data
                image: "",
                priceForTwo: "₹300 for two",
                menuItems: [],
                
                // Business hours (default)
                businessHours: {
                    monday: { open: "09:00", close: "22:00", isOpen: true },
                    tuesday: { open: "09:00", close: "22:00", isOpen: true },
                    wednesday: { open: "09:00", close: "22:00", isOpen: true },
                    thursday: { open: "09:00", close: "22:00", isOpen: true },
                    friday: { open: "09:00", close: "22:00", isOpen: true },
                    saturday: { open: "09:00", close: "22:00", isOpen: true },
                    sunday: { open: "09:00", close: "22:00", isOpen: true }
                }
            };

            console.log("Creating outlet with data:", outletData);

            // Add to outlets collection
            await setDoc(doc(db, "outlets", outletId), outletData);
            console.log("✓ Outlet created in outlets collection");

            // Update the application status if it exists in outletApplications
            if (application.userId) {
                try {
                    const updateData = {
                        status: "approved",
                        outletId: outletId,
                        approvedAt: serverTimestamp(),
                        approvedBy: adminInfo?.username || "Admin"
                    };
                    
                    await updateDoc(doc(db, "outletApplications", application.userId), updateData);
                    console.log("✓ Updated outletApplications record");
                } catch (updateError) {
                    console.log("Could not update outletApplications (may not exist):", updateError);
                }
            }

            // Remove from pending applications
            await deleteDoc(doc(db, "pendingOutlets", application.id));
            console.log("✓ Removed from pendingOutlets collection");

            // Refresh data
            await fetchData();
            console.log("✓ Data refreshed");

            // Show success message with outlet details
            alert(`✅ Application Approved Successfully!\n\n` +
                  `Outlet Details:\n` +
                  `• Outlet ID: ${outletId}\n` +
                  `• Outlet Name: ${application.name}\n` +
                  `• Owner: ${application.ownerName}\n` +
                  `• Email: ${application.ownerEmail}\n\n` +
                  `Login Instructions for ${application.ownerName}:\n` +
                  `1. Go to Outlet Login page\n` +
                  `2. Enter Outlet ID: ${outletId}\n` +
                  `3. Enter Email: ${application.ownerEmail}\n` +
                  `4. Enter the password they used during registration\n\n` +
                  `Please inform the outlet owner about their approval and provide the Outlet ID.`);

        } catch (error) {
            console.error("Error approving application:", error);
            alert("❌ Error approving application: " + error.message);
        } finally {
            setProcessingApplication(null);
        }
    };

    const rejectApplication = async (application) => {
        const confirmRejection = window.confirm(
            `Are you sure you want to reject the application for "${application.name}"?\n\n` +
            `This will:\n` +
            `• Remove the application from pending list\n` +
            `• Mark the application as rejected\n` +
            `• The applicant will need to reapply if they want to join\n\n` +
            `Owner: ${application.ownerName}\n` +
            `Email: ${application.ownerEmail}`
        );

        if (!confirmRejection) return;

        setProcessingApplication(application.id);
        try {
            console.log("=== REJECTING APPLICATION ===");
            console.log("Application ID:", application.id);

            // Update the application status if it exists in outletApplications
            if (application.userId) {
                try {
                    const updateData = {
                        status: "rejected",
                        rejectedAt: serverTimestamp(),
                        rejectedBy: adminInfo?.username || "Admin",
                        rejectionReason: "Application rejected by admin"
                    };
                    
                    await updateDoc(doc(db, "outletApplications", application.userId), updateData);
                    console.log("✓ Updated outletApplications record");
                } catch (updateError) {
                    console.log("Could not update outletApplications (may not exist):", updateError);
                }
            }

            // Remove from pending applications
            await deleteDoc(doc(db, "pendingOutlets", application.id));
            console.log("✓ Removed from pendingOutlets collection");

            // Refresh data
            await fetchData();
            console.log("✓ Data refreshed");

            alert(`❌ Application rejected successfully.\n\nRejected: ${application.name} by ${application.ownerName}`);

        } catch (error) {
            console.error("Error rejecting application:", error);
            alert("❌ Error rejecting application: " + error.message);
        } finally {
            setProcessingApplication(null);
        }
    };

    const filterOutlets = () => {
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

        setFilteredOutlets(filtered);
    };

    const handleLogout = async () => {
        try {
            const adminAuth = localStorage.getItem('adminAuth');
            if (adminAuth) {
                const sessionData = JSON.parse(adminAuth);
                if (sessionData.sessionId) {
                    // Clean up server session
                    await deleteDoc(doc(db, "adminSessions", sessionData.sessionId));
                }
            }
        } catch (error) {
            console.error("Error cleaning up session:", error);
        }

        localStorage.removeItem('adminAuth');
        navigate('/admin-login');
    };

    const handleDeleteOutlet = async () => {
        if (!outletToDelete) return;

        try {
            await deleteDoc(doc(db, "outlets", outletToDelete.id));
            setOutlets(outlets.filter(outlet => outlet.id !== outletToDelete.id));
            setShowDeleteModal(false);
            setOutletToDelete(null);
            alert("Outlet deleted successfully.");
        } catch (error) {
            console.error("Error deleting outlet:", error);
            alert("Error deleting outlet: " + error.message);
        }
    };

    const confirmDelete = (outlet) => {
        setOutletToDelete(outlet);
        setShowDeleteModal(true);
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return "N/A";
        try {
            const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
            return date.toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            return "N/A";
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Admin Header */}
            <div className="bg-white shadow-lg border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                        <div className="flex items-center gap-3">
                            <div className="bg-red-100 p-2 rounded-lg">
                                <FaUtensils className="text-red-500 text-xl" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
                                <p className="text-sm text-gray-600">Manage restaurant outlets & applications</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 text-gray-600">
                                <FaUser className="text-sm" />
                                <span className="font-medium">{adminInfo?.username}</span>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition duration-200"
                            >
                                <FaSignOutAlt /> Logout
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Error Message */}
                {error && (
                    <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
                        <div className="flex items-center gap-2">
                            <FaExclamationTriangle />
                            <span>{error}</span>
                        </div>
                    </div>
                )}

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Outlets</p>
                                <p className="text-2xl font-bold text-gray-900">{outlets.length}</p>
                            </div>
                            <FaUtensils className="text-blue-500 text-2xl" />
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Pending Applications</p>
                                <p className="text-2xl font-bold text-gray-900">{pendingApplications.length}</p>
                            </div>
                            <FaClock className="text-orange-500 text-2xl" />
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Categories</p>
                                <p className="text-2xl font-bold text-gray-900">{categories.length - 1}</p>
                            </div>
                            <FaFilter className="text-purple-500 text-2xl" />
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Menu Items</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {outlets.reduce((total, outlet) => total + (outlet.menuItems?.length || 0), 0)}
                                </p>
                            </div>
                            <FaUtensils className="text-green-500 text-2xl" />
                        </div>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="bg-white rounded-2xl shadow-lg mb-8">
                    <div className="flex border-b border-gray-200">
                        <button
                            onClick={() => setActiveTab("outlets")}
                            className={`flex-1 py-4 px-6 text-center font-semibold transition duration-200 ${activeTab === "outlets"
                                    ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                                    : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                                }`}
                        >
                            <div className="flex items-center justify-center gap-2">
                                <FaStore />
                                Active Outlets ({outlets.length})
                            </div>
                        </button>

                        <button
                            onClick={() => setActiveTab("pending")}
                            className={`flex-1 py-4 px-6 text-center font-semibold transition duration-200 ${activeTab === "pending"
                                    ? "text-orange-600 border-b-2 border-orange-600 bg-orange-50"
                                    : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                                }`}
                        >
                            <div className="flex items-center justify-center gap-2">
                                <FaClock />
                                Pending Applications ({pendingApplications.length})
                                {pendingApplications.length > 0 && (
                                    <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full">
                                        New
                                    </span>
                                )}
                            </div>
                        </button>
                    </div>
                </div>

                {/* Active Outlets Tab */}
                {activeTab === "outlets" && (
                    <>
                        {/* Controls */}
                        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
                            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                                {/* Search and Filter */}
                                <div className="flex flex-col md:flex-row gap-4 flex-1">
                                    <div className="relative flex-1">
                                        <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder="Search outlets..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition duration-200 text-gray-900 bg-white"
                                        />
                                    </div>

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

                                {/* Add New Button */}
                                <button
                                    onClick={() => navigate('/add-outlet')}
                                    className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl flex items-center gap-2 font-semibold transition duration-200 hover:shadow-lg transform hover:scale-105"
                                >
                                    <FaPlus /> Add New Outlet
                                </button>
                            </div>
                        </div>

                        {/* Results */}
                        <div className="mb-6">
                            <p className="text-gray-600">
                                Showing {filteredOutlets.length} of {outlets.length} outlets
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
                                        : "Start by adding your first outlet or approve pending applications"}
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredOutlets.map((outlet) => (
                                    <div key={outlet.id} className="bg-white rounded-2xl shadow-lg overflow-hidden">
                                        {/* Outlet Image */}
                                        <div className="relative h-48">
                                            <img
                                                src={outlet.image || "/api/placeholder/300/200"}
                                                alt={outlet.name}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    e.target.src = "/api/placeholder/300/200";
                                                }}
                                            />
                                            <div className="absolute top-3 left-3">
                                                <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-semibold capitalize">
                                                    {outlet.category || 'Restaurant'}
                                                </span>
                                            </div>
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
                                                <div className="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded mb-2">
                                                    ID: {outlet.outletId}
                                                </div>
                                            </div>

                                            {outlet.priceForTwo && (
                                                <div className="mb-3">
                                                    <p className="text-green-600 font-semibold text-sm">
                                                        {outlet.priceForTwo}
                                                    </p>
                                                </div>
                                            )}

                                            <div className="flex items-start gap-2 mb-4">
                                                <FaMapMarkerAlt className="text-red-500 mt-0.5 flex-shrink-0" size={12} />
                                                <p className="text-gray-600 text-sm line-clamp-2">
                                                    {outlet.address}
                                                </p>
                                            </div>

                                            {/* Admin Actions */}
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => navigate(`/outlets/${outlet.id}`)}
                                                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-3 rounded-lg text-sm font-medium transition duration-200 flex items-center justify-center gap-1"
                                                >
                                                    <FaEye /> View
                                                </button>
                                                <button
                                                    onClick={() => navigate(`/edit-outlet/${outlet.id}`)}
                                                    className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 px-3 rounded-lg text-sm font-medium transition duration-200 flex items-center justify-center gap-1"
                                                >
                                                    <FaEdit /> Edit
                                                </button>
                                                <button
                                                    onClick={() => confirmDelete(outlet)}
                                                    className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 px-3 rounded-lg text-sm font-medium transition duration-200 flex items-center justify-center gap-1"
                                                >
                                                    <FaTrash /> Delete
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {/* Pending Applications Tab */}
                {activeTab === "pending" && (
                    <div className="space-y-6">
                        {pendingApplications.length === 0 ? (
                            <div className="bg-white rounded-2xl shadow-lg p-16 text-center">
                                <FaClock className="mx-auto text-6xl text-gray-300 mb-4" />
                                <h2 className="text-2xl font-semibold text-gray-700 mb-2">No pending applications</h2>
                                <p className="text-gray-500 mb-4">All applications have been processed.</p>
                                <button
                                    onClick={() => fetchData()}
                                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium"
                                >
                                    Refresh Data
                                </button>
                            </div>
                        ) : (
                            pendingApplications.map((application) => (
                                <div key={application.id} className="bg-white rounded-2xl shadow-lg overflow-hidden">
                                    <div className="p-6">
                                        {/* Application Header */}
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex-1">
                                                <h3 className="text-xl font-bold text-gray-800 mb-1">
                                                    {application.name}
                                                </h3>
                                                <p className="text-gray-600 text-sm mb-2">
                                                    Application ID: <span className="font-mono font-semibold">{application.applicationId}</span>
                                                </p>
                                                <div className="flex items-center gap-2">
                                                    <FaClock className="text-orange-500 text-sm" />
                                                    <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-semibold">
                                                        Pending Review
                                                    </span>
                                                    <span className="text-gray-500 text-sm">
                                                        Applied: {formatDate(application.applicationDate)}
                                                    </span>
                                                </div>
                                            </div>
                                            
                                            <button
                                                onClick={() => toggleApplicationDetails(application.id)}
                                                className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-2 rounded-lg text-sm transition duration-200"
                                            >
                                                {showApplicationDetails[application.id] ? 'Hide Details' : 'Show Details'}
                                            </button>
                                        </div>

                                        {/* Quick Info */}
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                            <div className="bg-gray-50 rounded-lg p-3">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <FaUser className="text-blue-500 text-sm" />
                                                    <span className="font-medium text-gray-700 text-sm">Owner</span>
                                                </div>
                                                <p className="text-gray-800 font-semibold">{application.ownerName}</p>
                                            </div>

                                            <div className="bg-gray-50 rounded-lg p-3">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <FaUtensils className="text-purple-500 text-sm" />
                                                    <span className="font-medium text-gray-700 text-sm">Cuisine</span>
                                                </div>
                                                <p className="text-gray-800 font-semibold">{application.cuisine}</p>
                                            </div>

                                            <div className="bg-gray-50 rounded-lg p-3">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <FaStore className="text-green-500 text-sm" />
                                                    <span className="font-medium text-gray-700 text-sm">Category</span>
                                                </div>
                                                <p className="text-gray-800 font-semibold capitalize">
                                                    {application.category?.replace('-', ' ')}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Detailed Information - Collapsible */}
                                        {showApplicationDetails[application.id] && (
                                            <div className="border-t border-gray-200 pt-4 mb-4">
                                                <h4 className="font-semibold text-gray-700 mb-3">Detailed Information</h4>
                                                
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                                    <div className="bg-blue-50 rounded-lg p-4">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <FaEnvelope className="text-red-500 text-sm" />
                                                            <span className="font-semibold text-gray-700">Contact Email</span>
                                                        </div>
                                                        <p className="text-gray-800">{application.ownerEmail}</p>
                                                    </div>

                                                    <div className="bg-blue-50 rounded-lg p-4">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <FaPhone className="text-green-500 text-sm" />
                                                            <span className="font-semibold text-gray-700">Phone Number</span>
                                                        </div>
                                                        <p className="text-gray-800">{application.phone}</p>
                                                    </div>
                                                </div>

                                                <div className="bg-blue-50 rounded-lg p-4 mb-4">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <FaMapMarkerAlt className="text-red-500 text-sm" />
                                                        <span className="font-semibold text-gray-700">Full Address</span>
                                                    </div>
                                                    <p className="text-gray-800">{application.address}</p>
                                                </div>

                                                {application.description && (
                                                    <div className="bg-blue-50 rounded-lg p-4 mb-4">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <FaInfoCircle className="text-indigo-500 text-sm" />
                                                            <span className="font-semibold text-gray-700">Description</span>
                                                        </div>
                                                        <p className="text-gray-800">{application.description}</p>
                                                    </div>
                                                )}

                                                {application.password && (
                                                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <FaKey className="text-yellow-600 text-sm" />
                                                            <span className="font-semibold text-yellow-800">Registration Password</span>
                                                        </div>
                                                        <p className="text-yellow-700 text-sm font-mono bg-yellow-100 px-2 py-1 rounded">
                                                            Password stored securely for login after approval
                                                        </p>
                                                    </div>
                                                )}

                                                <div className="bg-gray-50 rounded-lg p-4">
                                                    <h5 className="font-semibold text-gray-700 mb-3">Technical Information</h5>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                                        <div>
                                                            <span className="text-gray-600">User ID:</span>
                                                            <span className="font-mono text-gray-800 ml-2">{application.userId}</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-gray-600">Google Verified:</span>
                                                            <span className="ml-2">
                                                                {application.emailVerifiedViaGoogle ? 
                                                                    <span className="text-green-600 font-semibold">✓ Yes</span> : 
                                                                    <span className="text-red-600">✗ No</span>
                                                                }
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Action Buttons */}
                                        <div className="flex flex-col sm:flex-row gap-3">
                                            <button
                                                onClick={() => approveApplication(application)}
                                                disabled={processingApplication === application.id}
                                                className={`flex-1 py-3 px-6 rounded-lg font-semibold transition duration-200 flex items-center justify-center gap-2 ${
                                                    processingApplication === application.id
                                                        ? "bg-gray-400 cursor-not-allowed text-white"
                                                        : "bg-green-500 hover:bg-green-600 text-white hover:shadow-lg transform hover:scale-[1.02]"
                                                }`}
                                            >
                                                {processingApplication === application.id ? (
                                                    <>
                                                        <FaSpinner className="animate-spin" />
                                                        Approving...
                                                    </>
                                                ) : (
                                                    <>
                                                        <FaCheckCircle />
                                                        Approve Application
                                                    </>
                                                )}
                                            </button>

                                            <button
                                                onClick={() => rejectApplication(application)}
                                                disabled={processingApplication === application.id}
                                                className={`flex-1 py-3 px-6 rounded-lg font-semibold transition duration-200 flex items-center justify-center gap-2 ${
                                                    processingApplication === application.id
                                                        ? "bg-gray-400 cursor-not-allowed text-white"
                                                        : "bg-red-500 hover:bg-red-600 text-white hover:shadow-lg transform hover:scale-[1.02]"
                                                }`}
                                            >
                                                {processingApplication === application.id ? (
                                                    <>
                                                        <FaSpinner className="animate-spin" />
                                                        Rejecting...
                                                    </>
                                                ) : (
                                                    <>
                                                        <FaTimesCircle />
                                                        Reject Application
                                                    </>
                                                )}
                                            </button>
                                        </div>

                                        {/* Important Note */}
                                        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                                            <div className="flex items-start gap-2">
                                                <FaInfoCircle className="text-blue-500 mt-0.5 flex-shrink-0" />
                                                <div className="text-blue-700 text-sm">
                                                    <p className="font-medium mb-1">What happens when you approve:</p>
                                                    <ul className="list-disc list-inside space-y-1 text-xs">
                                                        <li>A unique Outlet ID will be generated</li>
                                                        <li>The outlet will be added to the active outlets list</li>
                                                        <li>Owner can login with: Email + Password + Outlet ID</li>
                                                        <li>Please inform {application.ownerName} about the approval</li>
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="bg-red-100 p-2 rounded-full">
                                <FaExclamationTriangle className="text-red-500 text-xl" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-800">Confirm Delete</h3>
                        </div>
                        <p className="text-gray-600 mb-6">
                            Are you sure you want to delete "<strong>{outletToDelete?.name}</strong>"? This action cannot be undone and will remove all associated data.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 px-4 rounded-lg font-medium transition duration-200"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteOutlet}
                                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 px-4 rounded-lg font-medium transition duration-200"
                            >
                                Delete Outlet
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;