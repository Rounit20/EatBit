import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MdSignalWifiOff } from 'react-icons/md';
import { useAuthState } from "react-firebase-hooks/auth";
// Add these to your existing imports
import {
    collection,
    doc,
    getDoc,
    onSnapshot,
    updateDoc,
    orderBy,
    query,
    serverTimestamp,
    writeBatch,
    limit,
    getDocs
} from "firebase/firestore";
import { signOut } from "firebase/auth";
import { auth, db } from "../firebase";
import {
    FaStore,
    FaSignOutAlt,
    FaClipboardList,
    FaRupeeSign,
    FaClock,
    FaUser,
    FaPhone,
    FaMapMarkerAlt,
    FaIdCard,
    FaHome,
    FaCheck,
    FaTimes,
    FaEye,
    FaSpinner,
    FaExclamationTriangle,
    FaBell,
    FaLeaf,
    FaDrumstickBite,
    FaCalendarAlt,
    FaChartLine,
    FaToggleOn,
    FaToggleOff,
    FaEdit,
    FaEnvelope,
    FaReceipt,
    FaSync,
    FaWifi,

} from "react-icons/fa";

const OutletDashboard = () => {
    const [user, loading, error] = useAuthState(auth);
    const [outletData, setOutletData] = useState(null);
    const [orders, setOrders] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [loadingOrders, setLoadingOrders] = useState(true);
    const [loadingOutlet, setLoadingOutlet] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");
    const [activeTab, setActiveTab] = useState("orders");
    const [orderFilter, setOrderFilter] = useState("all");
    const [updatingOrder, setUpdatingOrder] = useState(null);
    const [isConnected, setIsConnected] = useState(true);
    const [lastUpdated, setLastUpdated] = useState(new Date());
    const navigate = useNavigate();

    // Get outlet info from localStorage or redirect to login
    const currentOutlet = JSON.parse(localStorage.getItem('currentOutlet') || '{}');

    useEffect(() => {
        if (!loading && !user) {
            console.log("No user authenticated, redirecting to login");
            navigate("/outlet-login");
            return;
        }

        if (!currentOutlet.outletId) {
            console.log("No outlet ID found, redirecting to login");
            navigate("/outlet-login");
            return;
        }

        if (user) {
            console.log("User authenticated:", user.email);
            console.log("Current outlet:", currentOutlet);

            // Fetch outlet data first, then setup orders listener
            fetchOutletData().then(() => {
                // Set up real-time orders listener after outlet data is loaded
                const unsubscribeOrders = setupOrdersListener();

                // Add debug function call (remove in production)
                if (process.env.NODE_ENV === 'development') {
                    setTimeout(() => debugFirestoreAccess(), 1000);
                }

                return () => {
                    if (unsubscribeOrders) {
                        console.log("Cleaning up orders listener");
                        unsubscribeOrders();
                    }
                };
            });
        }
    }, [user, loading, navigate]);

    // Handle network status changes
    useEffect(() => {
        const handleOnline = () => {
            setIsConnected(true);
            console.log("Connection restored");
        };

        const handleOffline = () => {
            setIsConnected(false);
            console.log("Connection lost");
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // ENHANCED OUTLET DATA FETCH WITH BETTER AUTH
    const fetchOutletData = async () => {
        try {
            console.log("Fetching outlet data for:", currentOutlet.outletId);
            setLoadingOutlet(true);
            setErrorMessage(""); // Clear any previous errors

            // Verify authentication first
            await verifyAuthentication();

            const outletRef = doc(db, "outlets", currentOutlet.outletId);
            const outletSnap = await getDoc(outletRef);

            if (outletSnap.exists()) {
                const data = outletSnap.data();
                console.log("Outlet data fetched:", data);

                // Enhanced authentication check
                const userEmail = user?.email;
                const ownerEmail = data.ownerEmail;
                const storedEmail = currentOutlet.ownerEmail;

                console.log("Auth check - User email:", userEmail);
                console.log("Auth check - Owner email:", ownerEmail);
                console.log("Auth check - Stored email:", storedEmail);

                // Verify user owns this outlet
                if (ownerEmail && userEmail && ownerEmail !== userEmail) {
                    console.error("Email mismatch - User not authorized for this outlet");
                    setErrorMessage("You are not authorized to access this outlet.");
                    await handleSignOut();
                    return;
                }

                // Additional check with stored outlet info
                if (storedEmail && userEmail && storedEmail !== userEmail) {
                    console.error("Stored email mismatch - clearing stored data");
                    localStorage.removeItem('currentOutlet');
                    setErrorMessage("Session expired. Please login again.");
                    await handleSignOut();
                    return;
                }

                setOutletData(data);
                console.log("Outlet data set successfully");
            } else {
                console.error("Outlet document not found");
                setErrorMessage("Outlet not found.");
                localStorage.removeItem('currentOutlet');
                navigate("/outlet-login");
            }
        } catch (error) {
            console.error("Error fetching outlet data:", error);
            setErrorMessage(`Failed to load outlet data: ${error.message}`);

            // If it's a permission error, likely auth issue
            if (error.code === 'permission-denied' || error.code === 'unauthenticated') {
                setErrorMessage("You don't have permission to access this outlet. Please login again.");
                await handleSignOut();
            }
        } finally {
            setLoadingOutlet(false);
        }
    };

    // ENHANCED AUTHENTICATION CHECK FUNCTION
    const verifyAuthentication = async () => {
        try {
            if (!user) {
                throw new Error("No user authenticated");
            }

            // Force refresh the ID token to ensure we have latest permissions
            const token = await user.getIdToken(true);
            console.log("🔐 Authentication verified, token refreshed");

            return token;
        } catch (error) {
            console.error("🔥 Authentication verification failed:", error);
            throw error;
        }
    };

    // FIXED ORDERS LISTENER - Use outlet name instead of outlet ID
    const setupOrdersListener = () => {
        try {
            console.log("🔧 Setting up FIXED orders listener");
            console.log("🔧 Current outlet:", currentOutlet);
            console.log("🔧 Outlet data:", outletData);

            setLoadingOrders(true);
            setErrorMessage("");

            // FIX: Use outlet name instead of outlet ID
            const outletIdentifier = outletData?.name || currentOutlet.outletName || currentOutlet.name;

            if (!outletIdentifier) {
                console.error("🔥 No outlet name found for orders path");
                setErrorMessage("Outlet name not found. Cannot load orders.");
                setLoadingOrders(false);
                return null;
            }

            const ordersPath = `orders/${outletIdentifier}/orderList`;
            console.log("🔧 CORRECTED Orders path:", ordersPath);
            console.log("🔧 Using outlet identifier:", outletIdentifier);

            // Create the query with outlet name
            const ordersRef = collection(db, "orders", outletIdentifier, "orderList");
            const q = query(ordersRef, orderBy("timestamp", "desc"));

            console.log("🔧 Orders query created with outlet name");

            const unsubscribe = onSnapshot(q,
                (snapshot) => {
                    console.log("📦 Orders snapshot received:", {
                        size: snapshot.size,
                        empty: snapshot.empty,
                        hasPendingWrites: snapshot.metadata.hasPendingWrites,
                        fromCache: snapshot.metadata.fromCache,
                        path: ordersPath,
                        outletIdentifier: outletIdentifier
                    });

                    if (!snapshot.empty) {
                        snapshot.docs.forEach((doc, index) => {
                            const data = doc.data();
                            console.log(`📦 Document ${index + 1}:`, {
                                id: doc.id,
                                orderId: data.orderId,
                                status: data.status,
                                timestamp: data.timestamp,
                                userId: data.userId,
                                shopName: data.shopName
                            });
                        });
                    } else {
                        console.log("📦 No documents found - but this might be normal for new outlets");
                    }

                    const ordersData = [];
                    let newOrderCount = 0;

                    snapshot.forEach((doc) => {
                        const data = doc.data();
                        ordersData.push({
                            id: doc.id,
                            ...data
                        });

                        if (data.status?.toLowerCase() === 'new order') {
                            newOrderCount++;
                        }
                    });

                    console.log("📦 Final orders processed:", {
                        total: ordersData.length,
                        newOrders: newOrderCount,
                        latestOrder: ordersData[0]?.orderId || 'none'
                    });

                    setOrders(ordersData);
                    setLoadingOrders(false);
                    setIsConnected(true);
                    setLastUpdated(new Date());

                    if (!snapshot.metadata.fromCache && newOrderCount > 0) {
                        console.log("🔔 New orders detected:", newOrderCount);
                    }
                },
                (error) => {
                    console.error("🔥 Error listening to orders:", error);
                    console.error("🔥 Error details:", {
                        code: error.code,
                        message: error.message,
                        path: ordersPath,
                        outletIdentifier: outletIdentifier,
                        userEmail: user?.email
                    });

                    let errorMsg = "";

                    switch (error.code) {
                        case 'permission-denied':
                            errorMsg = `Permission denied for orders path: ${ordersPath}. Check authentication.`;
                            break;
                        case 'not-found':
                            errorMsg = `Orders collection not found at: ${ordersPath}. This outlet may not have any orders yet.`;
                            setOrders([]); // Set empty orders instead of showing error
                            setLoadingOrders(false);
                            return; // Don't show error for missing collection
                        case 'unavailable':
                            errorMsg = "Firestore service is temporarily unavailable. Please check your internet connection.";
                            setIsConnected(false);
                            break;
                        default:
                            errorMsg = `Failed to load orders from ${ordersPath}: ${error.message}`;
                    }

                    setErrorMessage(errorMsg);
                    setLoadingOrders(false);
                }
            );

            console.log("✅ Orders listener set up successfully with outlet name");
            return unsubscribe;
        } catch (error) {
            console.error("🔥 Error setting up orders listener:", error);
            setErrorMessage(`Failed to setup orders listener: ${error.message}`);
            setLoadingOrders(false);
            return null;
        }
    };

    // UPDATED DEBUG FUNCTION
    const debugFirestoreAccess = async () => {
        try {
            console.log("🔍 DEBUG: Enhanced Firestore access testing");

            // Check authentication
            console.log("🔍 Current user:", {
                uid: user?.uid,
                email: user?.email,
                emailVerified: user?.emailVerified
            });

            // Verify token is fresh
            try {
                const token = await user?.getIdToken(true);
                console.log("✅ Fresh auth token obtained");
            } catch (tokenError) {
                console.error("❌ Failed to get fresh token:", tokenError);
            }

            console.log("🔍 Current outlet:", currentOutlet);
            console.log("🔍 Outlet data:", outletData);

            // Get the outlet identifier
            const outletIdentifier = outletData?.name || currentOutlet.outletName || currentOutlet.name;
            console.log("🔍 Using outlet identifier:", outletIdentifier);

            if (!outletIdentifier) {
                console.error("❌ No outlet identifier found!");
                return;
            }

            // Test outlet document access
            const outletRef = doc(db, "outlets", currentOutlet.outletId);
            console.log("🔍 Testing outlet document access...");
            try {
                const outletSnap = await getDoc(outletRef);
                if (outletSnap.exists()) {
                    const outletDataFromDB = outletSnap.data();
                    console.log("✅ Outlet document accessible:", {
                        name: outletDataFromDB.name,
                        ownerEmail: outletDataFromDB.ownerEmail,
                        ownerId: outletDataFromDB.ownerId,
                        isOpen: outletDataFromDB.isOpen
                    });
                }
            } catch (outletError) {
                console.error("❌ Outlet access failed:", outletError);
            }

            // Test orders collection access
            const ordersRef = collection(db, "orders", outletIdentifier, "orderList");
            console.log("🔍 Testing orders collection access with path:", `orders/${outletIdentifier}/orderList`);

            try {
                const testQuery = query(ordersRef, orderBy("timestamp", "desc"), limit(3));
                const testSnapshot = await getDocs(testQuery);

                console.log("✅ Orders collection test result:", {
                    path: `orders/${outletIdentifier}/orderList`,
                    size: testSnapshot.size,
                    empty: testSnapshot.empty
                });

                if (!testSnapshot.empty) {
                    testSnapshot.forEach((doc, index) => {
                        console.log(`✅ Sample order ${index + 1} found:`, {
                            id: doc.id,
                            orderId: doc.data().orderId,
                            status: doc.data().status,
                            timestamp: doc.data().timestamp,
                            shopName: doc.data().shopName
                        });
                    });
                }
            } catch (ordersError) {
                console.error("❌ Orders access failed:", ordersError);

                // Test individual order access
                if (orders.length > 0) {
                    try {
                        const testOrderRef = doc(db, "orders", outletIdentifier, "orderList", orders[0].id);
                        const testOrderSnap = await getDoc(testOrderRef);

                        if (testOrderSnap.exists()) {
                            console.log("✅ Individual order access works");

                            // Test update permission
                            try {
                                await updateDoc(testOrderRef, {
                                    testField: serverTimestamp()
                                });
                                console.log("✅ Order update permission works");

                                // Clean up test field
                                await updateDoc(testOrderRef, {
                                    testField: null
                                });
                            } catch (updateError) {
                                console.error("❌ Order update permission failed:", updateError);
                            }
                        }
                    } catch (individualError) {
                        console.error("❌ Individual order access failed:", individualError);
                    }
                }
            }

        } catch (error) {
            console.error("🔥 DEBUG: Firestore access test failed:", error);
        }
    };

    const handleSignOut = async () => {
        try {
            console.log("Signing out and clearing stored data");
            localStorage.removeItem('currentOutlet');
            await signOut(auth);
            navigate("/outlet-login");
        } catch (error) {
            console.error("Error signing out:", error);
            // Even if signOut fails, clear local data and redirect
            localStorage.removeItem('currentOutlet');
            navigate("/outlet-login");
        }
    };

    // CRITICAL FIX: UPDATED ORDER STATUS UPDATE FUNCTION WITH DUAL UPDATE
    const updateOrderStatus = async (orderId, newStatus) => {
  try {
    setUpdatingOrder(orderId);
    setErrorMessage("");

    console.log(`🔄 Updating order ${orderId} to status: ${newStatus}`);

    // Use outlet name for orders path
    const outletIdentifier = outletData?.name || currentOutlet.outletName || currentOutlet.name;

    if (!outletIdentifier) {
      throw new Error("Outlet name not found for updating order");
    }

    // Find the order to get userId
    const orderData = orders.find(order => order.id === orderId);
    if (!orderData) {
      throw new Error(`Order ${orderId} not found in local state`);
    }

    console.log(`🔄 Order data:`, {
      orderId: orderData.orderId,
      userId: orderData.userId,
      currentStatus: orderData.status
    });

    // Create batch for atomic updates
    const batch = writeBatch(db);

    // 1. Update in outlet's order collection
    const outletOrderRef = doc(db, "orders", outletIdentifier, "orderList", orderId);
    batch.update(outletOrderRef, {
      status: newStatus,
      updatedAt: serverTimestamp(),
      updatedBy: user?.email || user?.uid || 'system'
    });

    // 2. Update in user's order collection (CRITICAL for My Orders page)
    if (orderData.userId) {
      const userOrderRef = doc(db, "userOrders", orderData.userId, "orders", orderId);
      batch.update(userOrderRef, {
        status: newStatus,
        updatedAt: serverTimestamp(),
        updatedBy: user?.email || user?.uid || 'system'
      });
      console.log("📝 Added user order update to batch");
    } else {
      console.warn("⚠️ No userId found in order data - user won't see real-time updates");
    }

    // Commit the batch
    await batch.commit();
    console.log("✅ Order status updated successfully in both collections");
    
    showStatusUpdateNotification(orderId, newStatus);

  } catch (error) {
    console.error("🔥 Error updating order status:", error);
    
    let errorMsg = "";
    switch (error.code) {
      case 'permission-denied':
        errorMsg = "Permission denied. Please refresh and try again.";
        break;
      case 'not-found':
        errorMsg = "Order not found. It may have been deleted.";
        break;
      case 'unavailable':
        errorMsg = "Service temporarily unavailable. Check your connection.";
        setIsConnected(false);
        break;
      default:
        errorMsg = `Failed to update order: ${error.message}`;
    }
    
    setErrorMessage(errorMsg);
    
    // Auto-retry once for permission errors
    if (error.code === 'permission-denied') {
      console.log("🔄 Auto-retrying after permission error...");
      setTimeout(() => {
        updateOrderStatus(orderId, newStatus);
      }, 2000);
    }
  } finally {
    setUpdatingOrder(null);
  }
};

    const showStatusUpdateNotification = (orderId, newStatus) => {
        // Create a temporary notification
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-green-500 text-white p-4 rounded-lg shadow-lg z-50 transform transition-all duration-300';
        notification.innerHTML = `
      <div class="flex items-center gap-2">
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
        </svg>
        <span>Order #${orderId.slice(-6)} updated to "${newStatus}"</span>
      </div>
    `;

        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 3000);
    };

    const toggleOutletStatus = async () => {
        try {
            setErrorMessage(""); // Clear any previous errors

            const outletRef = doc(db, "outlets", currentOutlet.outletId);
            const newStatus = !outletData.isOpen;

            console.log(`🔄 Toggling outlet status to: ${newStatus}`);

            await updateDoc(outletRef, {
                isOpen: newStatus,
                updatedAt: serverTimestamp()
            });

            setOutletData(prev => ({
                ...prev,
                isOpen: newStatus
            }));

            console.log("✅ Outlet status updated successfully");

            // Show notification
            const statusText = newStatus ? 'Opened' : 'Closed';
            const notification = document.createElement('div');
            notification.className = `fixed top-4 right-4 ${newStatus ? 'bg-green-500' : 'bg-red-500'} text-white p-4 rounded-lg shadow-lg z-50 transform transition-all duration-300`;
            notification.innerHTML = `
        <div class="flex items-center gap-2">
          <span>Outlet ${statusText} successfully</span>
        </div>
      `;

            document.body.appendChild(notification);
            setTimeout(() => {
                notification.style.transform = 'translateX(100%)';
                setTimeout(() => {
                    if (document.body.contains(notification)) {
                        document.body.removeChild(notification);
                    }
                }, 300);
            }, 3000);

        } catch (error) {
            console.error("🔥 Error updating outlet status:", error);

            if (error.code === 'permission-denied') {
                setErrorMessage("You don't have permission to update outlet status.");
            } else {
                setErrorMessage(`Failed to update outlet status: ${error.message}`);
            }
        }
    };

    // Retry function for failed operations
    const retryOperation = () => {
        console.log("🔄 Retrying operations...");
        setErrorMessage("");
        setLoadingOrders(true);
        setLoadingOutlet(true);

        // Re-fetch data
        fetchOutletData().then(() => {
            setupOrdersListener();
        });
    };

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'new order':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'accepted':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'preparing':
                return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'ready':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'delivered':
                return 'bg-gray-100 text-gray-800 border-gray-200';
            case 'cancelled':
                return 'bg-red-100 text-red-800 border-red-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getFilteredOrders = () => {
        if (orderFilter === 'all') return orders;
        return orders.filter(order => order.status?.toLowerCase() === orderFilter);
    };

    const calculateStats = () => {
        const totalOrders = orders.length;
        const newOrders = orders.filter(order => order.status?.toLowerCase() === 'new order').length;
        const totalRevenue = orders.reduce((sum, order) => sum + (order.grandTotal || 0), 0);
        const todayOrders = orders.filter(order => {
            if (!order.timestamp) return false;
            try {
                const orderDate = order.timestamp.toDate();
                const today = new Date();
                return orderDate.toDateString() === today.toDateString();
            } catch (error) {
                console.warn("Error parsing timestamp:", error);
                return false;
            }
        }).length;

        return { totalOrders, newOrders, totalRevenue, todayOrders };
    };

    const formatTimestamp = (timestamp) => {
        if (!timestamp) return "N/A";
        try {
            return timestamp.toDate().toLocaleString();
        } catch (error) {
            console.warn("Error formatting timestamp:", error);
            return "N/A";
        }
    };

    // Loading state
    if (loading || loadingOutlet) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="bg-white p-8 rounded-2xl shadow-lg">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-gray-600 text-center">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    // Error state with retry option
    if (error || (errorMessage && !isConnected)) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
                <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full text-center">
                    <FaExclamationTriangle className="mx-auto text-6xl text-red-300 mb-6" />
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Connection Issue</h2>
                    <p className="text-gray-600 mb-8">{errorMessage || error?.message || "An error occurred"}</p>
                    <div className="flex gap-4 justify-center">
                        <button
                            onClick={retryOperation}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition duration-200"
                        >
                            Try Again
                        </button>
                        <button
                            onClick={() => navigate('/outlet-login')}
                            className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold transition duration-200"
                        >
                            Back to Login
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const stats = calculateStats();

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-500 p-2 rounded-lg">
                                <FaStore className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">
                                    {outletData?.name || 'Outlet Dashboard'}
                                </h1>
                                <p className="text-sm text-gray-600">ID: {currentOutlet.outletId}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            {/* Connection Status */}
                            <div className="flex items-center gap-2">
                                {isConnected ? (
                                    <><FaWifi className="text-green-500 text-sm" /> <span className="text-sm text-green-600 hidden sm:inline">Online</span></>
                                ) : (
                                    <><MdSignalWifiOff className="text-red-500 text-sm" /> <span className="text-sm text-red-600 hidden sm:inline">Offline</span></>
                                )}
                            </div>

                            {/* Last Updated */}
                            <div className="text-xs text-gray-500 hidden md:block">
                                Updated: {lastUpdated.toLocaleTimeString()}
                            </div>

                            {/* Outlet Status Toggle */}
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-600">
                                    {outletData?.isOpen ? 'Open' : 'Closed'}
                                </span>
                                <button
                                    onClick={toggleOutletStatus}
                                    className={`transition-colors duration-200 ${outletData?.isOpen ? 'text-green-500' : 'text-gray-400'
                                        }`}
                                    disabled={!isConnected}
                                >
                                    {outletData?.isOpen ? (
                                        <FaToggleOn className="h-6 w-6" />
                                    ) : (
                                        <FaToggleOff className="h-6 w-6" />
                                    )}
                                </button>
                            </div>

                            {/* Sign Out Button */}
                            <button
                                onClick={handleSignOut}
                                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-lg transition duration-200"
                            >
                                <FaSignOutAlt />
                                <span className="hidden sm:inline">Sign Out</span>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Connection Warning */}
                {!isConnected && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                        <div className="flex items-center gap-3">
                            <MdSignalWifiOff className="text-yellow-600" />
                            <div>
                                <h3 className="font-medium text-yellow-800">Connection Issue</h3>
                                <p className="text-yellow-700 text-sm">
                                    You're viewing cached data. Real-time updates may be delayed.
                                </p>
                            </div>
                            <button
                                onClick={retryOperation}
                                className="ml-auto px-3 py-1 bg-yellow-200 hover:bg-yellow-300 text-yellow-800 rounded text-sm transition duration-200 flex items-center gap-1"
                            >
                                <FaSync className="text-xs" />
                                Retry
                            </button>
                        </div>
                    </div>
                )}

                {/* Error Banner */}
                {errorMessage && isConnected && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <FaExclamationTriangle className="text-red-500 mr-2" />
                                <span className="text-red-700">{errorMessage}</span>
                            </div>
                            <button
                                onClick={() => setErrorMessage("")}
                                className="text-red-500 hover:text-red-700"
                            >
                                <FaTimes />
                            </button>
                        </div>
                    </div>
                )}

                {/* Debug Info - Remove in production */}
                {process.env.NODE_ENV === 'development' && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-sm">
                        <div className="font-medium text-blue-800 mb-2">Debug Info (Development Only):</div>
                        <div className="text-blue-700 space-y-1">
                            <div>Outlet ID: {currentOutlet.outletId}</div>
                            <div>Outlet Name: {outletData?.name}</div>
                            <div>Orders Collection Path: orders/{outletData?.name || 'NAME_NOT_LOADED'}/orderList</div>
                            <div>Orders Count: {orders.length}</div>
                            <div>Loading Orders: {loadingOrders.toString()}</div>
                            <div>Connection: {isConnected ? 'Online' : 'Offline'}</div>
                            <div>Last Updated: {lastUpdated.toISOString()}</div>
                        </div>
                    </div>
                )}

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-xl shadow-lg">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                                <p className="text-3xl font-bold text-gray-900">{stats.totalOrders}</p>
                            </div>
                            <div className="bg-blue-100 p-3 rounded-full">
                                <FaClipboardList className="h-6 w-6 text-blue-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-lg relative">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">New Orders</p>
                                <p className="text-3xl font-bold text-yellow-600">{stats.newOrders}</p>
                            </div>
                            <div className="bg-yellow-100 p-3 rounded-full">
                                <FaBell className="h-6 w-6 text-yellow-600" />
                            </div>
                        </div>
                        {stats.newOrders > 0 && (
                            <div className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                                <span className="text-white text-xs font-bold">{stats.newOrders}</span>
                            </div>
                        )}
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-lg">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Today's Orders</p>
                                <p className="text-3xl font-bold text-green-600">{stats.todayOrders}</p>
                            </div>
                            <div className="bg-green-100 p-3 rounded-full">
                                <FaCalendarAlt className="h-6 w-6 text-green-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-lg">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                                <p className="text-3xl font-bold text-purple-600 flex items-center gap-1">
                                    <FaRupeeSign className="text-2xl" />
                                    {stats.totalRevenue.toFixed(2)}
                                </p>
                            </div>
                            <div className="bg-purple-100 p-3 rounded-full">
                                <FaChartLine className="h-6 w-6 text-purple-600" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-xl shadow-lg">
                    <div className="border-b border-gray-200">
                        <nav className="flex space-x-8 px-6">
                            <button
                                onClick={() => setActiveTab('orders')}
                                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${activeTab === 'orders'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                Orders
                                {stats.newOrders > 0 && (
                                    <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                                        {stats.newOrders}
                                    </span>
                                )}
                            </button>
                            <button
                                onClick={() => setActiveTab('profile')}
                                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${activeTab === 'profile'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                Outlet Profile
                            </button>
                        </nav>
                    </div>

                    <div className="p-6">
                        {activeTab === 'orders' && (
                            <div>
                                {/* Order Filters */}
                                <div className="mb-6">
                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            onClick={() => setOrderFilter('all')}
                                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${orderFilter === 'all'
                                                    ? 'bg-blue-100 text-blue-700'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                }`}
                                        >
                                            All Orders ({orders.length})
                                        </button>
                                        <button
                                            onClick={() => setOrderFilter('new order')}
                                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 relative ${orderFilter === 'new order'
                                                    ? 'bg-yellow-100 text-yellow-700'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                }`}
                                        >
                                            New ({orders.filter(o => o.status?.toLowerCase() === 'new order').length})
                                            {orders.filter(o => o.status?.toLowerCase() === 'new order').length > 0 && (
                                                <div className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
                                            )}
                                        </button>
                                        <button
                                            onClick={() => setOrderFilter('accepted')}
                                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${orderFilter === 'accepted'
                                                    ? 'bg-blue-100 text-blue-700'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                }`}
                                        >
                                            Accepted ({orders.filter(o => o.status?.toLowerCase() === 'accepted').length})
                                        </button>
                                        <button
                                            onClick={() => setOrderFilter('preparing')}
                                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${orderFilter === 'preparing'
                                                    ? 'bg-orange-100 text-orange-700'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                }`}
                                        >
                                            Preparing ({orders.filter(o => o.status?.toLowerCase() === 'preparing').length})
                                        </button>
                                    </div>
                                </div>

                                {/* Orders List */}
                                {loadingOrders ? (
                                    <div className="text-center py-12">
                                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                                        <p className="text-gray-600">Loading orders...</p>
                                    </div>
                                ) : getFilteredOrders().length === 0 ? (
                                    <div className="text-center py-12">
                                        <FaClipboardList className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                                        <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
                                        <p className="text-gray-600 mb-4">
                                            {orderFilter === 'all'
                                                ? 'No orders have been placed yet.'
                                                : `No ${orderFilter} orders found.`
                                            }
                                        </p>
                                        {errorMessage && (
                                            <button
                                                onClick={retryOperation}
                                                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition duration-200"
                                            >
                                                Retry Loading
                                            </button>
                                        )}
                                        <div className="mt-6 p-4 bg-gray-50 rounded-lg max-w-md mx-auto">
                                            <p className="text-sm text-gray-600 mb-2">
                                                <strong>Expected orders path:</strong>
                                            </p>
                                            <code className="text-xs bg-white px-2 py-1 rounded border">
                                                orders/{outletData?.name || 'OUTLET_NAME'}/orderList
                                            </code>
                                            <p className="text-xs text-gray-500 mt-2">
                                                Make sure orders are being placed with the correct outlet name
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {getFilteredOrders().map((order) => (
                                            <div key={order.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow duration-200 relative">
                                                {/* Real-time update indicator */}
                                                {order.updatedAt && Date.now() - (order.updatedAt?.toDate?.()?.getTime() || 0) < 30000 && (
                                                    <div className="absolute top-2 right-2 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                                                )}

                                                <div className="flex justify-between items-start mb-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="bg-blue-100 p-2 rounded-lg">
                                                            <FaReceipt className="h-4 w-4 text-blue-600" />
                                                        </div>
                                                        <div>
                                                            <h3 className="font-semibold text-gray-900">Order #{order.orderId}</h3>
                                                            <p className="text-sm text-gray-600">
                                                                <FaClock className="inline mr-1" />
                                                                {formatTimestamp(order.timestamp)}
                                                            </p>
                                                            {order.updatedAt && (
                                                                <p className="text-xs text-gray-500">
                                                                    Updated: {formatTimestamp(order.updatedAt)}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="text-right">
                                                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                                                            {order.status}
                                                        </span>
                                                        <p className="text-lg font-bold text-gray-900 mt-1 flex items-center gap-1">
                                                            <FaRupeeSign className="text-sm" />
                                                            {order.grandTotal?.toFixed(2) || '0.00'}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Customer Details */}
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 bg-gray-50 p-4 rounded-lg">
                                                    <div>
                                                        <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                                                            <FaUser className="text-blue-500" />
                                                            Customer Details
                                                        </h4>
                                                        <div className="space-y-1 text-sm text-gray-600">
                                                            <p><strong>Name:</strong> {order.userData?.name || 'N/A'}</p>
                                                            <p><strong>Phone:</strong> {order.userData?.mobile || 'N/A'}</p>
                                                            <p><strong>Roll No:</strong> {order.userData?.rollNo || 'N/A'}</p>
                                                            <p><strong>Hostel:</strong> {order.userData?.hostelNo || 'N/A'}</p>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                                                            <FaMapMarkerAlt className="text-red-500" />
                                                            Delivery Address
                                                        </h4>
                                                        <p className="text-sm text-gray-600">
                                                            {order.userData?.address || 'N/A'}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Order Items */}
                                                <div className="mb-4">
                                                    <h4 className="font-medium text-gray-900 mb-3">Order Items</h4>
                                                    <div className="space-y-2">
                                                        {order.items?.map((item, idx) => (
                                                            <div key={idx} className="flex items-center justify-between bg-white p-3 rounded border">
                                                                <div className="flex items-center gap-3">
                                                                    {item.image && (
                                                                        <img
                                                                            src={item.image}
                                                                            alt={item.name}
                                                                            className="w-12 h-12 rounded object-cover"
                                                                            onError={(e) => { e.target.style.display = 'none'; }}
                                                                        />
                                                                    )}
                                                                    <div>
                                                                        <div className="flex items-center gap-2">
                                                                            {item.isVeg ? (
                                                                                <FaLeaf className="text-green-500 text-sm" />
                                                                            ) : (
                                                                                <FaDrumstickBite className="text-red-500 text-sm" />
                                                                            )}
                                                                            <span className="font-medium text-gray-900">{item.name}</span>
                                                                        </div>
                                                                        <span className="text-sm text-gray-600">Qty: {item.quantity}</span>
                                                                    </div>
                                                                </div>
                                                                <div className="text-right">
                                                                    <div className="flex items-center gap-1 font-semibold text-gray-900">
                                                                        <FaRupeeSign className="text-sm" />
                                                                        {(item.price * item.quantity).toFixed(2)}
                                                                    </div>
                                                                    <div className="text-sm text-gray-500">
                                                                        ₹{item.price} each
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )) || []}
                                                    </div>
                                                </div>

                                                {/* Order Actions */}
                                                <div className="flex flex-wrap gap-2 justify-end">
                                                    {order.status?.toLowerCase() === 'new order' && (
                                                        <>
                                                            <button
                                                                onClick={() => updateOrderStatus(order.id, 'Accepted')}
                                                                disabled={updatingOrder === order.id || !isConnected}
                                                                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition duration-200 disabled:opacity-50 flex items-center gap-2"
                                                            >
                                                                {updatingOrder === order.id ? (
                                                                    <FaSpinner className="animate-spin" />
                                                                ) : (
                                                                    <FaCheck />
                                                                )}
                                                                Accept
                                                            </button>
                                                            <button
                                                                onClick={() => updateOrderStatus(order.id, 'Cancelled')}
                                                                disabled={updatingOrder === order.id || !isConnected}
                                                                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition duration-200 disabled:opacity-50 flex items-center gap-2"
                                                            >
                                                                {updatingOrder === order.id ? (
                                                                    <FaSpinner className="animate-spin" />
                                                                ) : (
                                                                    <FaTimes />
                                                                )}
                                                                Reject
                                                            </button>
                                                        </>
                                                    )}

                                                    {order.status?.toLowerCase() === 'accepted' && (
                                                        <button
                                                            onClick={() => updateOrderStatus(order.id, 'Preparing')}
                                                            disabled={updatingOrder === order.id || !isConnected}
                                                            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition duration-200 disabled:opacity-50 flex items-center gap-2"
                                                        >
                                                            {updatingOrder === order.id ? (
                                                                <FaSpinner className="animate-spin" />
                                                            ) : (
                                                                <FaClock />
                                                            )}
                                                            Start Preparing
                                                        </button>
                                                    )}

                                                    {order.status?.toLowerCase() === 'preparing' && (
                                                        <button
                                                            onClick={() => updateOrderStatus(order.id, 'Ready')}
                                                            disabled={updatingOrder === order.id || !isConnected}
                                                            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition duration-200 disabled:opacity-50 flex items-center gap-2"
                                                        >
                                                            {updatingOrder === order.id ? (
                                                                <FaSpinner className="animate-spin" />
                                                            ) : (
                                                                <FaCheck />
                                                            )}
                                                            Mark Ready
                                                        </button>
                                                    )}

                                                    {order.status?.toLowerCase() === 'ready' && (
                                                        <button
                                                            onClick={() => updateOrderStatus(order.id, 'Delivered')}
                                                            disabled={updatingOrder === order.id || !isConnected}
                                                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition duration-200 disabled:opacity-50 flex items-center gap-2"
                                                        >
                                                            {updatingOrder === order.id ? (
                                                                <FaSpinner className="animate-spin" />
                                                            ) : (
                                                                <FaCheck />
                                                            )}
                                                            Mark Delivered
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'profile' && outletData && (
                            <div>
                                <div className="flex justify-between items-start mb-6">
                                    <h3 className="text-lg font-semibold text-gray-900">Outlet Information</h3>
                                    <button
                                        onClick={() => {/* Add edit functionality later */ }}
                                        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition duration-200 flex items-center gap-2"
                                        disabled={!isConnected}
                                    >
                                        <FaEdit />
                                        Edit Profile
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-gray-50 rounded-lg p-6">
                                        <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                                            <FaStore className="text-blue-500" />
                                            Basic Information
                                        </h4>
                                        <div className="space-y-3">
                                            <div>
                                                <label className="text-sm font-medium text-gray-700">Outlet Name</label>
                                                <p className="text-gray-900">{outletData.name}</p>
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-gray-700">Outlet ID</label>
                                                <p className="text-gray-900 font-mono">{outletData.outletId}</p>
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-gray-700">Status</label>
                                                <p className={`inline-flex items-center gap-2 ${outletData.isOpen ? 'text-green-600' : 'text-red-600'}`}>
                                                    {outletData.isOpen ? 'Open' : 'Closed'}
                                                    {outletData.isOpen ? (
                                                        <FaToggleOn className="text-green-500" />
                                                    ) : (
                                                        <FaToggleOff className="text-gray-400" />
                                                    )}
                                                </p>
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-gray-700">Description</label>
                                                <p className="text-gray-900">{outletData.description || 'No description provided'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 rounded-lg p-6">
                                        <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                                            <FaUser className="text-green-500" />
                                            Owner Information
                                        </h4>
                                        <div className="space-y-3">
                                            <div>
                                                <label className="text-sm font-medium text-gray-700">Owner Name</label>
                                                <p className="text-gray-900">{outletData.ownerName}</p>
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-gray-700">Email</label>
                                                <p className="text-gray-900 flex items-center gap-2">
                                                    <FaEnvelope className="text-gray-400" />
                                                    {outletData.ownerEmail}
                                                </p>
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-gray-700">Phone</label>
                                                <p className="text-gray-900 flex items-center gap-2">
                                                    <FaPhone className="text-gray-400" />
                                                    {outletData.phone}
                                                </p>
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-gray-700">Address</label>
                                                <p className="text-gray-900 flex items-start gap-2">
                                                    <FaMapMarkerAlt className="text-gray-400 mt-1 flex-shrink-0" />
                                                    {outletData.address}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 bg-gray-50 rounded-lg p-6">
                                    <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                                        <FaChartLine className="text-purple-500" />
                                        Statistics
                                    </h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div className="text-center">
                                            <p className="text-2xl font-bold text-blue-600">{stats.totalOrders}</p>
                                            <p className="text-sm text-gray-600">Total Orders</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-2xl font-bold text-green-600 flex items-center justify-center gap-1">
                                                <FaRupeeSign className="text-lg" />
                                                {stats.totalRevenue.toFixed(2)}
                                            </p>
                                            <p className="text-sm text-gray-600">Total Revenue</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-2xl font-bold text-purple-600">
                                                {outletData.rating || 0}/5
                                            </p>
                                            <p className="text-sm text-gray-600">Rating</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OutletDashboard;