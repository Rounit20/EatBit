import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthState } from "react-firebase-hooks/auth";
import { collection, query, orderBy, onSnapshot, getDocs } from "firebase/firestore";
import { auth, db } from "../firebase";
import { MdSignalWifiOff } from 'react-icons/md';
import Navbar from "../components/Navbar";
import {
  FaReceipt,
  FaStore,
  FaCalendarAlt,
  FaRupeeSign,
  FaShoppingCart,
  FaUser,
  FaPhone,
  FaMapMarkerAlt,
  FaClock,
  FaLeaf,
  FaDrumstickBite,
  FaEye,
  FaArrowLeft,
  FaInbox,
  FaTimes,
  FaEnvelope,
  FaIdCard,
  FaHome,
  FaPercentage,
  FaSync,
  FaWifi,
  FaCheckCircle,
  FaTimesCircle,
  FaSpinner,
  FaExclamationTriangle,
} from "react-icons/fa";

const MyOrders = () => {
  const [user, loading, authError] = useAuthState(auth);
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [error, setError] = useState(null);
  const [isConnected, setIsConnected] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [statusFilter, setStatusFilter] = useState('all');
  const [debugInfo, setDebugInfo] = useState({});
  const navigate = useNavigate();

  // ENHANCED useEffect with better error handling and debugging
  useEffect(() => {
    if (loading) {
      console.log("🔄 Auth loading...");
      return;
    }

    if (authError) {
      console.error("❌ Auth error:", authError);
      setError(`Authentication error: ${authError.message}`);
      setIsLoading(false);
      return;
    }

    if (!user) {
      console.log("👤 No user authenticated");
      setIsLoading(false);
      return;
    }

    console.log("🔍 Setting up orders listener for user:", {
      uid: user.uid,
      email: user.email,
      isAnonymous: user.isAnonymous
    });

    setIsLoading(true);
    setError(null);
    
    // Update debug info
    setDebugInfo({
      userId: user.uid,
      userEmail: user.email,
      isAnonymous: user.isAnonymous,
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    });

    const userOrdersRef = collection(db, "userOrders", user.uid, "orders");
    const q = query(userOrdersRef, orderBy("timestamp", "desc"));
    
    // Add a direct fetch as fallback for debugging
    const fetchOrdersDirectly = async () => {
      try {
        console.log("📋 Attempting direct fetch of orders...");
        const snapshot = await getDocs(q);
        console.log("📋 Direct fetch result:", {
          size: snapshot.size,
          empty: snapshot.empty,
          metadata: snapshot.metadata
        });
        
        if (snapshot.empty) {
          console.log("📋 No orders found in direct fetch");
          // Also try to fetch from the main orders collection as backup
          console.log("🔄 Trying backup fetch from orders collection...");
          
          // This is a debugging approach - check if orders exist in the main collection
          const allOrdersCollections = [];
          
          // You might want to add logic here to check other possible locations
          console.log("📋 Direct fetch completed with empty results");
        }
        
        snapshot.forEach((doc) => {
          console.log("📋 Found order document:", doc.id, doc.data());
        });
        
      } catch (directError) {
        console.error("❌ Direct fetch error:", directError);
        console.error("Error details:", {
          code: directError.code,
          message: directError.message,
          stack: directError.stack
        });
      }
    };

    // Perform direct fetch immediately for debugging
    fetchOrdersDirectly();
    
    // Real-time listener for orders
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        console.log("📱 User Orders updated - snapshot:", {
          size: snapshot.size,
          empty: snapshot.empty,
          fromCache: snapshot.metadata.fromCache,
          hasPendingWrites: snapshot.metadata.hasPendingWrites
        });
        
        const ordersList = [];
        
        snapshot.forEach((doc) => {
          const data = doc.data();
          console.log("📱 Processing order:", doc.id, {
            orderId: data.orderId,
            shopName: data.shopName,
            status: data.status,
            timestamp: data.timestamp,
            grandTotal: data.grandTotal
          });
          
          ordersList.push({
            id: doc.id,
            ...data,
            isRealTimeUpdate: !snapshot.metadata.fromCache
          });
        });

        console.log("📱 Final orders list:", ordersList.length, "orders");
        
        setOrders(ordersList);
        setIsLoading(false);
        setIsConnected(true);
        setLastUpdated(new Date());
        setError(null);
        
        // Enhanced debug info
        setDebugInfo(prev => ({
          ...prev,
          ordersCount: ordersList.length,
          lastSnapshot: {
            size: snapshot.size,
            fromCache: snapshot.metadata.fromCache,
            hasPendingWrites: snapshot.metadata.hasPendingWrites
          },
          lastUpdate: new Date().toISOString()
        }));
        
        // Show notification for real-time updates
        if (!snapshot.metadata.fromCache && ordersList.length > 0) {
          const recentUpdate = ordersList.find(order => 
            order.updatedAt && 
            Date.now() - order.updatedAt.toDate().getTime() < 10000
          );
          
          if (recentUpdate) {
            console.log("📱 Real-time order update detected:", recentUpdate.orderId, recentUpdate.status);
            showOrderUpdateNotification(recentUpdate);
          }
        }
      },
      (error) => {
        console.error("❌ Error in user orders listener:", error);
        console.error("❌ Error details:", {
          code: error.code,
          message: error.message,
          stack: error.stack
        });
        
        let errorMessage = "Failed to load orders. ";
        
        switch (error.code) {
          case 'permission-denied':
            errorMessage += "Permission denied. Please check your login status.";
            console.error("🔒 Permission denied details:", {
              userId: user?.uid,
              userEmail: user?.email,
              path: `userOrders/${user?.uid}/orders`
            });
            break;
          case 'unavailable':
            errorMessage += "Service temporarily unavailable. Please check your connection.";
            break;
          case 'unauthenticated':
            errorMessage += "Authentication required. Please log in again.";
            break;
          default:
            errorMessage += error.message || "Unknown error occurred.";
        }
        
        setError(errorMessage);
        setIsLoading(false);
        setIsConnected(error.code !== 'unavailable');
        
        // Update debug info with error
        setDebugInfo(prev => ({
          ...prev,
          lastError: {
            code: error.code,
            message: error.message,
            timestamp: new Date().toISOString()
          }
        }));
        
        // Don't clear orders on temporary errors
        if (error.code !== 'unavailable' && error.code !== 'permission-denied') {
          setOrders([]);
        }
      }
    );

    // Cleanup listener on unmount
    return () => {
      console.log("🧹 Cleaning up user orders listener");
      unsubscribe();
    };
  }, [user, loading, authError]);

  // Handle network status changes
  useEffect(() => {
    const handleOnline = () => {
      setIsConnected(true);
      console.log("🌐 Connection restored");
    };

    const handleOffline = () => {
      setIsConnected(false);
      console.log("🌐 Connection lost");
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Show notification when order status is updated
  const showOrderUpdateNotification = (order) => {
    const notification = document.createElement('div');
    notification.className = 'fixed top-20 right-4 bg-blue-500 text-white p-4 rounded-lg shadow-lg z-50 transform transition-all duration-300 max-w-sm';
    notification.innerHTML = `
      <div class="flex items-start gap-3">
        <div class="flex-shrink-0 mt-1">
          ${getStatusIcon(order.status)}
        </div>
        <div>
          <div class="font-semibold">Order Updated!</div>
          <div class="text-sm opacity-90">Order #${order.orderId?.slice(-6)} is now "${order.status}"</div>
        </div>
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
    }, 4000);
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
      console.warn("⚠️ Error formatting date:", error);
      return "N/A";
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'new order':
        return 'bg-yellow-500 text-white';
      case 'accepted':
        return 'bg-blue-500 text-white';
      case 'preparing':
        return 'bg-orange-500 text-white';
      case 'ready':
        return 'bg-green-500 text-white';
      case 'delivered':
        return 'bg-gray-500 text-white';
      case 'cancelled':
        return 'bg-red-500 text-white';
      default:
        return 'bg-gray-400 text-white';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'new order':
        return '🆕';
      case 'accepted':
        return '✅';
      case 'preparing':
        return '👨‍🍳';
      case 'ready':
        return '🔔';
      case 'delivered':
        return '🚚';
      case 'cancelled':
        return '❌';
      default:
        return '📋';
    }
  };

  const getStatusDescription = (status) => {
    switch (status?.toLowerCase()) {
      case 'new order':
        return 'Waiting for restaurant confirmation';
      case 'accepted':
        return 'Restaurant confirmed your order';
      case 'preparing':
        return 'Your food is being prepared';
      case 'ready':
        return 'Ready for delivery/pickup';
      case 'delivered':
        return 'Order completed successfully';
      case 'cancelled':
        return 'Order was cancelled';
      default:
        return 'Order status unknown';
    }
  };

  const handleOrderDetails = (order) => {
    setSelectedOrder(order);
  };

  const closeOrderDetails = () => {
    setSelectedOrder(null);
  };

  const retryConnection = () => {
    console.log("🔄 Retrying connection...");
    window.location.reload();
  };

  const getFilteredOrders = () => {
    if (statusFilter === 'all') return orders;
    return orders.filter(order => order.status?.toLowerCase() === statusFilter);
  };

  const getOrderStats = () => {
    const total = orders.length;
    const delivered = orders.filter(o => o.status?.toLowerCase() === 'delivered').length;
    const active = orders.filter(o => !['delivered', 'cancelled'].includes(o.status?.toLowerCase())).length;
    const totalSpent = orders.reduce((sum, order) => sum + (order.grandTotal || 0), 0);
    
    return { total, delivered, active, totalSpent };
  };

  // Loading state
  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20">
        <Navbar user={user} />
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="text-gray-600">
                {loading ? "Authenticating..." : "Loading your orders..."}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Authentication required
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20">
        <Navbar user={user} />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <FaUser className="mx-auto text-5xl text-gray-300 mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Login Required</h2>
            <p className="text-gray-600 mb-6">Please log in to view your orders.</p>
            <button
              onClick={() => navigate('/login')}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition duration-200"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Error state with debug info
  if (error && orders.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20">
        <Navbar user={user} />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="text-center mb-6">
              <div className="text-red-500 text-4xl mb-4">⚠️</div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">{error}</h2>
              <button
                onClick={retryConnection}
                className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition duration-200 flex items-center gap-2 mx-auto"
              >
                <FaSync />
                Try Again
              </button>
            </div>
            
            {/* Debug Information */}
            <div className="bg-gray-50 rounded-lg p-4 text-left">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <FaExclamationTriangle className="text-orange-500" />
                Debug Information
              </h3>
              <div className="text-sm text-gray-600 space-y-1 font-mono">
                <p><strong>User ID:</strong> {debugInfo.userId || 'N/A'}</p>
                <p><strong>User Email:</strong> {debugInfo.userEmail || 'N/A'}</p>
                <p><strong>Environment:</strong> {debugInfo.environment || 'N/A'}</p>
                <p><strong>Collection Path:</strong> userOrders/{debugInfo.userId}/orders</p>
                <p><strong>Last Error:</strong> {debugInfo.lastError?.code} - {debugInfo.lastError?.message}</p>
                <p><strong>Timestamp:</strong> {debugInfo.timestamp}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const stats = getOrderStats();

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <Navbar user={user} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header with Debug Info */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate('/home')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 font-medium transition duration-200 bg-white px-4 py-2 rounded-lg shadow-sm hover:shadow-md"
            >
              <FaArrowLeft className="text-sm" /> Back to Home
            </button>
            
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                {isConnected ? (
                  <><FaWifi className="text-green-500" /> <span className="text-green-600">Online</span></>
                ) : (
                  <><MdSignalWifiOff className="text-red-500" /> <span className="text-red-600">Offline</span></>
                )}
              </div>
              <span className="text-gray-500">Updated: {lastUpdated.toLocaleTimeString()}</span>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-3">
              <FaReceipt className="text-blue-500" />
              My Orders
            </h1>
            <p className="text-gray-600 mb-4">Track all your food orders in real-time</p>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                <div className="text-sm text-blue-800">Total Orders</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-600">{stats.delivered}</div>
                <div className="text-sm text-green-800">Delivered</div>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-orange-600">{stats.active}</div>
                <div className="text-sm text-orange-800">Active Orders</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-purple-600 flex items-center justify-center gap-1">
                  <FaRupeeSign className="text-lg" />
                  {stats.totalSpent.toFixed(0)}
                </div>
                <div className="text-sm text-purple-800">Total Spent</div>
              </div>
            </div>
            
            {/* Debug Panel - Show only in development or when there are issues */}
            {(process.env.NODE_ENV === 'development' || error || orders.length === 0) && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <details className="text-sm">
                  <summary className="cursor-pointer font-medium text-yellow-800 mb-2">
                    Debug Information (Click to expand)
                  </summary>
                  <div className="text-yellow-700 font-mono space-y-1">
                    <p><strong>User:</strong> {debugInfo.userId?.slice(0, 8)}... ({debugInfo.userEmail})</p>
                    <p><strong>Orders Path:</strong> userOrders/{debugInfo.userId}/orders</p>
                    <p><strong>Orders Found:</strong> {debugInfo.ordersCount || 0}</p>
                    <p><strong>Last Snapshot:</strong> {debugInfo.lastSnapshot ? 
                      `${debugInfo.lastSnapshot.size} docs, fromCache: ${debugInfo.lastSnapshot.fromCache}` : 
                      'None'
                    }</p>
                    <p><strong>Environment:</strong> {debugInfo.environment}</p>
                    <p><strong>Last Update:</strong> {debugInfo.lastUpdate}</p>
                    {debugInfo.lastError && (
                      <p><strong>Last Error:</strong> {debugInfo.lastError.code} - {debugInfo.lastError.message}</p>
                    )}
                  </div>
                </details>
              </div>
            )}
          </div>
        </div>

        {/* Connection Warning */}
        {!isConnected && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <MdSignalWifiOff className="text-yellow-600" />
              <div>
                <h3 className="font-medium text-yellow-800">Connection Issue</h3>
                <p className="text-yellow-700 text-sm">Viewing cached data. Updates may be delayed.</p>
              </div>
              <button
                onClick={retryConnection}
                className="ml-auto px-3 py-1 bg-yellow-200 hover:bg-yellow-300 text-yellow-800 rounded text-sm transition duration-200"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="mb-6 bg-white rounded-xl shadow-lg p-4">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                statusFilter === 'all'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Orders ({orders.length})
            </button>
            <button
              onClick={() => setStatusFilter('new order')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                statusFilter === 'new order'
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              New ({orders.filter(o => o.status?.toLowerCase() === 'new order').length})
            </button>
            <button
              onClick={() => setStatusFilter('accepted')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                statusFilter === 'accepted'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Accepted ({orders.filter(o => o.status?.toLowerCase() === 'accepted').length})
            </button>
            <button
              onClick={() => setStatusFilter('preparing')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                statusFilter === 'preparing'
                  ? 'bg-orange-100 text-orange-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Preparing ({orders.filter(o => o.status?.toLowerCase() === 'preparing').length})
            </button>
            <button
              onClick={() => setStatusFilter('delivered')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                statusFilter === 'delivered'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Delivered ({orders.filter(o => o.status?.toLowerCase() === 'delivered').length})
            </button>
          </div>
        </div>

        {/* Orders List */}
        {getFilteredOrders().length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <FaInbox className="mx-auto text-5xl text-gray-300 mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              {statusFilter === 'all' ? 'No Orders Found' : `No ${statusFilter} Orders`}
            </h2>
            <p className="text-gray-600 mb-6">
              {statusFilter === 'all' 
                ? "You haven't placed any orders yet. Start ordering from your favorite restaurants!"
                : `You don't have any ${statusFilter} orders at the moment.`
              }
            </p>
            {statusFilter === 'all' && (
              <button
                onClick={() => navigate('/outlets')}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition duration-200 inline-flex items-center gap-2"
              >
                <FaStore />
                Browse Restaurants
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {getFilteredOrders().map((order) => (
              <div key={order.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100 relative group">
                {/* Real-time Update Indicator */}
                {order.isRealTimeUpdate && (
                  <div className="absolute top-3 right-3 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                )}
                
                {/* Order Header */}
                <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <FaStore className="text-blue-500 text-sm" />
                        <h3 className="font-bold text-lg text-gray-800 truncate">{order.shopName}</h3>
                      </div>
                      <p className="text-gray-500 text-sm font-mono">#{order.orderId?.slice(-8)}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)} shadow-sm`}>
                      {order.status || 'New Order'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-gray-500 text-sm">
                      <FaClock className="text-xs" />
                      <span>{formatDate(order.timestamp)}</span>
                    </div>
                    <div className="flex items-center gap-1 font-bold text-gray-800">
                      <FaRupeeSign className="text-sm" />
                      <span>{order.grandTotal?.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Order Content */}
                <div className="p-4">
                  {/* Status Description */}
                  <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700 flex items-center gap-2">
                      <span className="text-base">{getStatusIcon(order.status)}</span>
                      {getStatusDescription(order.status)}
                    </p>
                  </div>

                  {/* Items Preview */}
                  <div className="mb-3">
                    <div className="flex items-center gap-2 mb-2">
                      <FaShoppingCart className="text-orange-500 text-sm" />
                      <p className="text-sm font-semibold text-gray-700">
                        {order.items?.length} {order.items?.length === 1 ? 'item' : 'items'}
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      {order.items?.slice(0, 2).map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded">
                          <div className="flex items-center gap-2 flex-1">
                            {item.isVeg ? (
                              <FaLeaf className="text-green-500 text-xs flex-shrink-0" />
                            ) : (
                              <FaDrumstickBite className="text-red-500 text-xs flex-shrink-0" />
                            )}
                            <span className="text-gray-700 font-medium truncate">{item.name}</span>
                            <span className="text-gray-500 bg-gray-200 px-2 py-1 rounded-full text-xs flex-shrink-0">
                              ×{item.quantity}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-gray-800 font-semibold ml-2">
                            <FaRupeeSign className="text-xs" />
                            <span>{(item.price * item.quantity).toFixed(0)}</span>
                          </div>
                        </div>
                      ))}
                      {order.items?.length > 2 && (
                        <div className="text-xs text-gray-500 text-center py-1 bg-gray-50 rounded">
                          +{order.items.length - 2} more items
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={() => handleOrderDetails(order)}
                    className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg font-semibold transition duration-200 flex items-center justify-center gap-2 text-sm group-hover:bg-blue-50 group-hover:text-blue-700"
                  >
                    <FaEye />
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Order Details Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-t-2xl">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">Order Details</h2>
                    <p className="text-blue-100 font-mono">#{selectedOrder.orderId}</p>
                    <div className="mt-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(selectedOrder.status)} border-2 border-white`}>
                        <span className="mr-1">{getStatusIcon(selectedOrder.status)}</span>
                        {selectedOrder.status || 'New Order'}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={closeOrderDetails}
                    className="text-white hover:text-blue-200 transition duration-200 p-2 hover:bg-blue-600 rounded-lg"
                  >
                    <FaTimes className="text-xl" />
                  </button>
                </div>
              </div>

              <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Order Information */}
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <FaReceipt className="text-blue-500" />
                    Order Information
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <FaStore className="text-blue-500" />
                        <span className="font-semibold text-gray-700">Restaurant</span>
                      </div>
                      <p className="text-gray-800 font-medium">{selectedOrder.shopName}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <FaClock className="text-green-500" />
                          <span className="font-semibold text-gray-700">Order Time</span>
                        </div>
                        <p className="text-gray-800 text-sm">{formatDate(selectedOrder.timestamp)}</p>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg">{getStatusIcon(selectedOrder.status)}</span>
                          <span className="font-semibold text-gray-700">Status</span>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(selectedOrder.status)}`}>
                          {selectedOrder.status || 'New Order'}
                        </span>
                      </div>
                    </div>

                    {/* Status Timeline/Description */}
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h4 className="font-semibold text-blue-800 mb-2">Status Information</h4>
                      <p className="text-blue-700 text-sm">{getStatusDescription(selectedOrder.status)}</p>
                    </div>

                    {/* Items List */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <FaShoppingCart className="text-orange-500" />
                        Items Ordered ({selectedOrder.items?.length})
                      </h4>
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {selectedOrder.items?.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                            <div className="flex items-center gap-3">
                              {item.image && (
                                <img 
                                  src={item.image} 
                                  alt={item.name}
                                  className="w-12 h-12 rounded-lg object-cover border"
                                  onError={(e) => { e.target.style.display = 'none'; }}
                                />
                              )}
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  {item.isVeg ? (
                                    <FaLeaf className="text-green-500 text-sm" />
                                  ) : (
                                    <FaDrumstickBite className="text-red-500 text-sm" />
                                  )}
                                  <span className="font-semibold text-gray-800">{item.name}</span>
                                </div>
                                <span className="text-sm text-gray-600">Quantity: {item.quantity}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="flex items-center gap-1">
                                <FaRupeeSign className="text-sm text-gray-800" />
                                <span className="font-bold text-gray-800">{(item.price * item.quantity).toFixed(2)}</span>
                              </div>
                              <div className="text-sm text-gray-500">
                                ₹{item.price.toFixed(2)} each
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Order Total */}
                    <div className="bg-green-50 rounded-lg p-4 border-2 border-green-200">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Subtotal</span>
                          <div className="flex items-center gap-1">
                            <FaRupeeSign className="text-sm text-gray-800" />
                            <span className="font-semibold text-gray-800">{selectedOrder.subtotal?.toFixed(2)}</span>
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 flex items-center gap-1">
                            <FaPercentage className="text-xs" />
                            Tax (10%)
                          </span>
                          <div className="flex items-center gap-1">
                            <FaRupeeSign className="text-sm text-gray-800" />
                            <span className="font-semibold text-gray-800">{selectedOrder.tax?.toFixed(2)}</span>
                          </div>
                        </div>
                        
                        <hr className="border-green-300" />
                        
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-bold text-gray-800">Grand Total</span>
                          <div className="flex items-center gap-1">
                            <FaRupeeSign className="text-lg text-green-600" />
                            <span className="text-2xl font-bold text-green-600">{selectedOrder.grandTotal?.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Customer Details */}
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <FaUser className="text-green-500" />
                    Customer Details
                  </h3>
                  
                  {selectedOrder.userData && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 gap-4">
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <FaUser className="text-blue-500 text-sm" />
                            <span className="font-semibold text-gray-700">Name</span>
                          </div>
                          <p className="text-gray-800 font-medium">{selectedOrder.userData.name}</p>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <FaPhone className="text-green-500 text-sm" />
                            <span className="font-semibold text-gray-700">Mobile</span>
                          </div>
                          <p className="text-gray-800 font-medium">{selectedOrder.userData.mobile}</p>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <FaEnvelope className="text-red-500 text-sm" />
                            <span className="font-semibold text-gray-700">Email</span>
                          </div>
                          <p className="text-gray-800 font-medium">{selectedOrder.userData.email}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-gray-50 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <FaIdCard className="text-orange-500 text-sm" />
                              <span className="font-semibold text-gray-700">Roll No.</span>
                            </div>
                            <p className="text-gray-800 font-medium">{selectedOrder.userData.rollNo}</p>
                          </div>
                          
                          <div className="bg-gray-50 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <FaHome className="text-indigo-500 text-sm" />
                              <span className="font-semibold text-gray-700">Hostel</span>
                            </div>
                            <p className="text-gray-800 font-medium">{selectedOrder.userData.hostelNo}</p>
                          </div>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <FaMapMarkerAlt className="text-red-500 text-sm" />
                            <span className="font-semibold text-gray-700">Address</span>
                          </div>
                          <p className="text-gray-800 font-medium">{selectedOrder.userData.address}</p>
                        </div>

                        {/* Update Information */}
                        {selectedOrder.updatedAt && (
                          <div className="bg-blue-50 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <FaSync className="text-blue-500 text-sm" />
                              <span className="font-semibold text-blue-700">Last Updated</span>
                            </div>
                            <p className="text-blue-800 font-medium text-sm">{formatDate(selectedOrder.updatedAt)}</p>
                            {selectedOrder.updatedBy && (
                              <p className="text-blue-600 text-xs mt-1">Updated by: {selectedOrder.updatedBy}</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="border-t p-6 bg-gray-50 rounded-b-2xl">
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={closeOrderDetails}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 rounded-lg font-semibold transition duration-200"
                  >
                    Close
                  </button>
                  {selectedOrder.status?.toLowerCase() === 'delivered' && (
                    <button
                      onClick={() => {
                        closeOrderDetails();
                        navigate(`/outlet/${selectedOrder.shopName}`);
                      }}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-semibold transition duration-200 flex items-center justify-center gap-2"
                    >
                      <FaShoppingCart />
                      Reorder
                    </button>
                  )}
                  {!['delivered', 'cancelled'].includes(selectedOrder.status?.toLowerCase()) && (
                    <button
                      onClick={() => {
                        // Add order tracking functionality
                        closeOrderDetails();
                      }}
                      className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg font-semibold transition duration-200 flex items-center justify-center gap-2"
                    >
                      <FaClock />
                      Track Order
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyOrders;