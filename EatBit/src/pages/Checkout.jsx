import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuthState } from "react-firebase-hooks/auth";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  onSnapshot,
  writeBatch
} from "firebase/firestore";
import { auth, db } from "../firebase";
import Navbar from "../components/Navbar";
import { useCart } from "../context/CartContext";
import {
  FaShoppingCart,
  FaUser,
  FaStore,
  FaRupeeSign,
  FaReceipt,
  FaCheck,
  FaArrowLeft,
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
  FaIdCard,
  FaHome,
  FaPercentage,
  FaLeaf,
  FaDrumstickBite,
  FaExclamationTriangle,
  FaEdit,
  FaUserEdit,
  FaToggleOff,
  FaToggleOn
} from "react-icons/fa";

const Checkout = () => {
  const { shopName: shopNameFromURL } = useParams();
  const [user, loading, error] = useAuthState(auth);
  const [userData, setUserData] = useState(null);
  const [outletData, setOutletData] = useState(null);
  const [isPlacing, setIsPlacing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [profileIncomplete, setProfileIncomplete] = useState(false);
  const [missingFields, setMissingFields] = useState([]);
  const navigate = useNavigate();
  const { cart, clearCart } = useCart();

  // Generate unique order ID
  const orderId = "ORD" + Date.now().toString(36).toUpperCase();
  const finalShopName = cart.shopName || shopNameFromURL;

  // Required fields for placing an order
  const requiredFields = [
    { key: 'name', label: 'Full Name' },
    { key: 'gender', label: 'Gender' },
    { key: 'mobile', label: 'Mobile Number' },
    { key: 'rollNo', label: 'Roll Number' },
    { key: 'hostelNo', label: 'Hostel Number' },
    { key: 'address', label: 'Address' }
  ];

  // Check if profile is complete
  const checkProfileCompleteness = (userData) => {
    if (!userData) {
      setProfileIncomplete(true);
      setMissingFields(requiredFields.map(field => field.label));
      return false;
    }

    const missing = requiredFields.filter(field => {
      const value = userData[field.key];
      return !value || (typeof value === 'string' && value.trim() === '');
    });

    if (missing.length > 0) {
      setProfileIncomplete(true);
      setMissingFields(missing.map(field => field.label));
      return false;
    }

    setProfileIncomplete(false);
    setMissingFields([]);
    return true;
  };
  // In your order creation function
const createOrder = async (orderData) => {
  const batch = writeBatch(db);
  const orderId = doc(collection(db, 'temp')).id; // Generate unique ID
  
  // 1. Create in outlet's collection
  const outletOrderRef = doc(db, "orders", orderData.shopName, "orderList", orderId);
  batch.set(outletOrderRef, {
    ...orderData,
    id: orderId,
    timestamp: serverTimestamp()
  });
  
  // 2. Create in user's collection (CRITICAL)
  const userOrderRef = doc(db, "userOrders", orderData.userId, "orders", orderId);
  batch.set(userOrderRef, {
    ...orderData,
    id: orderId,
    timestamp: serverTimestamp()
  });
  
  await batch.commit();
  console.log("✅ Order created in both collections");
};

  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        try {
          const userRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(userRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setUserData(data);
            checkProfileCompleteness(data);
          } else {
            console.log("No user data found");
            setProfileIncomplete(true);
            setMissingFields(requiredFields.map(field => field.label));
          }
        } catch (error) {
          console.error("🔥 Error fetching user data:", error);
          setErrorMessage("Failed to load user data. Please try refreshing the page.");
        }
      }
    };
    fetchUserData();
  }, [user]);

  // Real-time outlet status listener
  useEffect(() => {
    if (!finalShopName) return;

    console.log("Setting up outlet listener for:", finalShopName);
    
    const outletRef = doc(db, "outlets", finalShopName);
    const unsubscribe = onSnapshot(outletRef, 
      (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          console.log("Outlet status updated:", data);
          setOutletData(data);
        } else {
          console.log("Outlet not found");
          setOutletData(null);
        }
      },
      (error) => {
        console.error("Error listening to outlet:", error);
        setErrorMessage("Failed to check outlet status. Please try again.");
      }
    );

    return () => {
      console.log("Cleaning up outlet listener");
      unsubscribe();
    };
  }, [finalShopName]);

  const validCartItems = Object.entries(cart.items || {}).filter(
    ([, item]) =>
      typeof item === "object" &&
      item !== null &&
      "price" in item &&
      "quantity" in item
  );

  const subtotal = validCartItems.reduce((acc, [, item]) => {
    const price = typeof item.price === "number" ? item.price : 0;
    const quantity = typeof item.quantity === "number" ? item.quantity : 1;
    return acc + price * quantity;
  }, 0);

  const tax = subtotal * 0.1;
  const grandTotal = subtotal + tax;

  const handleCompleteProfile = () => {
    navigate("/user", { state: { fromCheckout: true } });
  };

  // FIXED AND ENHANCED ORDER PLACEMENT FUNCTION
  const handlePlaceOrder = async () => {
    setErrorMessage("");

    // Validation checks
    if (!user) {
      setErrorMessage("Please log in to place your order.");
      return;
    }

    if (outletData && outletData.isOpen === false) {
      setErrorMessage(`${finalShopName} is currently closed. Please try again later.`);
      return;
    }

    if (profileIncomplete) {
      setErrorMessage(`Please complete your profile first. Missing: ${missingFields.join(', ')}`);
      return;
    }

    if (!finalShopName) {
      setErrorMessage("Shop name is missing. Please try again later.");
      return;
    }

    if (validCartItems.length === 0) {
      setErrorMessage("Your cart is empty. Please add items to place an order.");
      return;
    }

    setIsPlacing(true);

    // Create comprehensive order data
    const orderData = {
      orderId,
      userId: user.uid,
      shopName: finalShopName,
      outletId: finalShopName, // This is critical for outlet dashboard
      items: validCartItems.map(([name, item]) => ({
        name,
        price: Number(item.price),
        quantity: Number(item.quantity),
        isVeg: Boolean(item.isVeg),
        image: item.image || ""
      })),
      subtotal: Number(subtotal.toFixed(2)),
      tax: Number(tax.toFixed(2)),
      grandTotal: Number(grandTotal.toFixed(2)),
      userData: {
        name: userData?.name || "N/A",
        gender: userData?.gender || "N/A",
        mobile: userData?.mobile || "N/A",
        email: user?.email || "N/A",
        rollNo: userData?.rollNo || "N/A",
        hostelNo: userData?.hostelNo || "N/A",
        address: userData?.address || "N/A",
      },
      timestamp: serverTimestamp(),
      status: "New Order", // This exact string is important for filtering
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    try {
      console.log("🚀 Starting order placement process...");
      console.log("Order Data:", orderData);
      console.log("User:", user.uid, user.email);
      console.log("Shop:", finalShopName);

      // Use writeBatch for atomic operations
      const batch = writeBatch(db);

      // CRITICAL: Create the order in the EXACT path that dashboard expects
      console.log("📝 Creating order document in outlet's orderList subcollection...");
      const orderRef = doc(db, "orders", finalShopName, "orderList", orderId);
      batch.set(orderRef, orderData);

      // Create user order copy for user's order history
      console.log("📝 Creating user order copy...");
      const userOrderRef = doc(db, "userOrders", user.uid, "orders", orderId);
      batch.set(userOrderRef, orderData);

      // Ensure outlet parent document exists (this is crucial for Firestore subcollections)
      console.log("📝 Creating/updating outlet metadata...");
      const outletMetaRef = doc(db, "orders", finalShopName);
      batch.set(outletMetaRef, {
        shopName: finalShopName,
        outletId: finalShopName,
        lastOrderAt: serverTimestamp(),
        lastOrderId: orderId,
        totalOrdersCount: 1 // This will be overwritten if document exists
      }, { merge: true });

      // Create/update user metadata
      console.log("📝 Creating/updating user metadata...");
      const userMetaRef = doc(db, "userOrders", user.uid);
      batch.set(userMetaRef, {
        userId: user.uid,
        userEmail: user.email,
        lastOrderAt: serverTimestamp(),
        lastOrderId: orderId,
        totalOrdersCount: 1 // This will be overwritten if document exists
      }, { merge: true });

      // Additional verification: Create outlet document if it doesn't exist
      if (outletData) {
        console.log("📝 Ensuring outlet document exists...");
        const outletDocRef = doc(db, "outlets", finalShopName);
        batch.set(outletDocRef, {
          name: outletData.name || finalShopName,
          outletId: finalShopName,
          isOpen: outletData.isOpen !== undefined ? outletData.isOpen : true,
          ownerEmail: outletData.ownerEmail || "",
          phone: outletData.phone || "",
          address: outletData.address || "",
          lastOrderAt: serverTimestamp()
        }, { merge: true });
      }

      // Commit all operations atomically
      console.log("📝 Committing batch operations...");
      await batch.commit();

      console.log("🎉 Order placed successfully:", orderId);
      console.log("✅ Order path: orders/" + finalShopName + "/orderList/" + orderId);
      
      // Success notification
      alert("🎉 Order placed successfully! Order ID: " + orderId);
      
      // Clear cart and navigate
      clearCart();
      navigate("/my-orders");
      
    } catch (error) {
      console.error("🔥 Error placing order:", error);
      console.error("Error code:", error.code);
      console.error("Error message:", error.message);
      
      // Enhanced error handling
      let errorMsg = "Failed to place order. ";
      
      switch (error.code) {
        case 'permission-denied':
          errorMsg += "Access denied. Please check your login status and try again.";
          console.error("Permission denied details:", {
            user: user?.uid,
            email: user?.email,
            shopName: finalShopName
          });
          break;
        case 'unavailable':
          errorMsg += "Service temporarily unavailable. Please check your connection and try again.";
          break;
        case 'deadline-exceeded':
          errorMsg += "Request timed out. Please try again.";
          break;
        case 'resource-exhausted':
          errorMsg += "Too many requests. Please wait a moment and try again.";
          break;
        case 'invalid-argument':
          errorMsg += "Invalid data provided. Please refresh and try again.";
          break;
        case 'not-found':
          errorMsg += "Service not found. Please contact support.";
          break;
        case 'already-exists':
          errorMsg += "Order already exists. Please check your orders.";
          break;
        default:
          if (error.message && error.message.includes('CORS')) {
            errorMsg += "Network error. Please disable ad blockers and try again.";
          } else if (error.message && error.message.includes('fetch')) {
            errorMsg += "Network error. Please check your internet connection.";
          } else {
            errorMsg += error.message || "Unknown error occurred. Please try again.";
          }
      }
      
      setErrorMessage(errorMsg);
    } finally {
      setIsPlacing(false);
    }
  };

  const handleBackToCart = () => {
    navigate("/cart");
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20">
        <Navbar user={user} />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  // Auth error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20">
        <Navbar user={user} />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <FaExclamationTriangle className="mx-auto text-6xl text-red-300 mb-6" />
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Authentication Error</h2>
            <p className="text-gray-600 mb-8">There was an error with authentication. Please try logging in again.</p>
            <button
              onClick={() => navigate('/login')}
              className="bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-lg font-semibold transition duration-200"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20">
        <Navbar user={user} />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <FaUser className="mx-auto text-6xl text-gray-300 mb-6" />
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Login Required</h2>
            <p className="text-gray-600 mb-8">Please log in to proceed with checkout.</p>
            <button
              onClick={() => navigate('/login')}
              className="bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-lg font-semibold transition duration-200"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (validCartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20">
        <Navbar user={user} />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <FaShoppingCart className="mx-auto text-6xl text-gray-300 mb-6" />
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Cart is Empty</h2>
            <p className="text-gray-600 mb-8">Add items to your cart before proceeding to checkout.</p>
            <button
              onClick={() => navigate('/outlets')}
              className="bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-lg font-semibold transition duration-200"
            >
              Browse Restaurants
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Profile incomplete state
  if (profileIncomplete) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20">
        <Navbar user={user} />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <FaUserEdit className="mx-auto text-6xl text-orange-400 mb-6" />
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Complete Your Profile</h2>
            <p className="text-gray-600 mb-6">
              Please complete your profile before placing an order. This information is required for order delivery.
            </p>
            
            {/* Missing Fields List */}
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 mb-8 text-left max-w-md mx-auto">
              <h3 className="font-semibold text-orange-800 mb-3 flex items-center gap-2">
                <FaExclamationTriangle className="text-orange-600" />
                Missing Information:
              </h3>
              <ul className="space-y-2">
                {missingFields.map((field, index) => (
                  <li key={index} className="flex items-center gap-2 text-orange-700">
                    <span className="w-2 h-2 bg-orange-400 rounded-full"></span>
                    {field}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleCompleteProfile}
                className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold transition duration-200 flex items-center gap-2 justify-center"
              >
                <FaEdit />
                Complete Profile
              </button>
              <button
                onClick={() => navigate('/home')}
                className="bg-gray-500 hover:bg-gray-600 text-white px-8 py-3 rounded-lg font-semibold transition duration-200"
              >
                Back to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <Navbar user={user} />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={handleBackToCart}
            className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-800 font-semibold transition duration-200"
          >
            <FaArrowLeft /> Back to Cart
          </button>
          
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-3">
              <FaReceipt className="text-blue-500" />
              Checkout
            </h1>
            <p className="text-gray-600">Review your order and confirm details</p>
          </div>
        </div>

        {/* Real-time Outlet Status Banner */}
        {outletData && (
          <div className={`mb-6 p-4 rounded-lg border-2 ${
            outletData.isOpen 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <div className="flex items-center gap-3">
              <FaStore />
              <span className="font-semibold">{finalShopName}</span>
              {outletData.isOpen ? (
                <span className="flex items-center gap-2">
                  <FaToggleOn className="text-green-500" />
                  Open - Ready to take orders
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <FaToggleOff className="text-red-500" />
                  Closed - Please try again later
                </span>
              )}
            </div>
          </div>
        )}

        {/* Error Message */}
        {errorMessage && (
          <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <FaExclamationTriangle className="text-red-500" />
            <span>{errorMessage}</span>
            <button 
              onClick={() => setErrorMessage("")}
              className="ml-auto text-red-500 hover:text-red-700 font-bold text-lg"
            >
              ×
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Summary */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <FaShoppingCart className="text-red-500" />
              Order Summary
            </h2>
            
            {/* Shop Info */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 mb-2">
                <FaStore className="text-blue-500" />
                <span className="font-semibold text-gray-800">Restaurant</span>
              </div>
              <p className="text-gray-700 font-medium">{finalShopName || "N/A"}</p>
              <p className="text-sm text-gray-600">Order ID: <span className="font-mono font-semibold">{orderId}</span></p>
            </div>

            {/* Items */}
            <div className="space-y-3 mb-6">
              {validCartItems.map(([name, item], idx) => {
                const price = typeof item.price === "number" ? item.price : 0;
                const quantity = typeof item.quantity === "number" ? item.quantity : 1;
                const itemTotal = price * quantity;
                
                return (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      {item.image && (
                        <img 
                          src={item.image} 
                          alt={name}
                          className="w-12 h-12 rounded-lg object-cover"
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
                          <span className="font-semibold text-gray-800">{name}</span>
                        </div>
                        <span className="text-sm text-gray-600">Quantity: {quantity}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1">
                        <FaRupeeSign className="text-sm text-gray-800" />
                        <span className="font-bold text-gray-800">{itemTotal.toFixed(2)}</span>
                      </div>
                      <div className="text-sm text-gray-500">
                        ₹{price.toFixed(2)} each
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Totals */}
            <div className="border-t pt-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Subtotal</span>
                <div className="flex items-center gap-1">
                  <FaRupeeSign className="text-sm text-gray-800" />
                  <span className="font-semibold text-gray-800">{subtotal.toFixed(2)}</span>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600 flex items-center gap-1">
                  <FaPercentage className="text-xs" />
                  Tax (10%)
                </span>
                <div className="flex items-center gap-1">
                  <FaRupeeSign className="text-sm text-gray-800" />
                  <span className="font-semibold text-gray-800">{tax.toFixed(2)}</span>
                </div>
              </div>
              
              <hr className="border-gray-300" />
              
              <div className="flex justify-between items-center">
                <span className="text-xl font-bold text-gray-800">Grand Total</span>
                <div className="flex items-center gap-1">
                  <FaRupeeSign className="text-xl text-green-600" />
                  <span className="text-2xl font-bold text-green-600">{grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* User Details */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <FaUser className="text-green-500" />
                Delivery Details
              </h2>
              <button
                onClick={handleCompleteProfile}
                className="text-blue-500 hover:text-blue-700 font-medium text-sm flex items-center gap-1"
              >
                <FaEdit className="text-xs" />
                Edit Profile
              </button>
            </div>
            
            {userData ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <FaUser className="text-blue-500 text-sm" />
                      <span className="font-semibold text-gray-700">Name</span>
                    </div>
                    <p className="text-gray-800 font-medium">{userData.name}</p>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <FaUser className="text-purple-500 text-sm" />
                      <span className="font-semibold text-gray-700">Gender</span>
                    </div>
                    <p className="text-gray-800 font-medium">{userData.gender}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <FaPhone className="text-green-500 text-sm" />
                      <span className="font-semibold text-gray-700">Mobile</span>
                    </div>
                    <p className="text-gray-800 font-medium">{userData.mobile}</p>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <FaEnvelope className="text-red-500 text-sm" />
                      <span className="font-semibold text-gray-700">Email</span>
                    </div>
                    <p className="text-gray-800 font-medium">{user.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <FaIdCard className="text-orange-500 text-sm" />
                      <span className="font-semibold text-gray-700">Roll No.</span>
                    </div>
                    <p className="text-gray-800 font-medium">{userData.rollNo}</p>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <FaHome className="text-indigo-500 text-sm" />
                      <span className="font-semibold text-gray-700">Hostel No.</span>
                    </div>
                    <p className="text-gray-800 font-medium">{userData.hostelNo}</p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <FaMapMarkerAlt className="text-red-500 text-sm" />
                    <span className="font-semibold text-gray-700">Address</span>
                  </div>
                  <p className="text-gray-800 font-medium">{userData.address}</p>
                </div>

                {/* Place Order Button */}
                <div className="pt-4">
                  <button
                    onClick={handlePlaceOrder}
                    disabled={isPlacing || profileIncomplete || (outletData && !outletData.isOpen)}
                    className={`w-full py-4 rounded-lg font-bold text-lg transition duration-200 flex items-center justify-center gap-2 shadow-lg ${
                      isPlacing || profileIncomplete || (outletData && !outletData.isOpen)
                        ? 'bg-gray-400 cursor-not-allowed text-white' 
                        : 'bg-green-500 hover:bg-green-600 text-white'
                    }`}
                  >
                    {isPlacing ? (
                      <>
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                        Placing Order...
                      </>
                    ) : outletData && !outletData.isOpen ? (
                      <>
                        <FaToggleOff />
                        Restaurant Closed
                      </>
                    ) : (
                      <>
                        <FaCheck />
                        Place Order - ₹{grandTotal.toFixed(2)}
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading user data...</p>
              </div>
            )}
          </div>
        </div>

        {/* Debug Information - Remove in production */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-medium text-blue-800 mb-4">Debug Information (Development Only)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-700">
              <div>
                <p><strong>Order ID:</strong> {orderId}</p>
                <p><strong>Shop Name:</strong> {finalShopName}</p>
                <p><strong>User ID:</strong> {user?.uid}</p>
                <p><strong>User Email:</strong> {user?.email}</p>
              </div>
              <div>
                <p><strong>Order Path:</strong> orders/{finalShopName}/orderList/{orderId}</p>
                <p><strong>Cart Items:</strong> {validCartItems.length}</p>
                <p><strong>Grand Total:</strong> ₹{grandTotal.toFixed(2)}</p>
                <p><strong>Profile Complete:</strong> {profileIncomplete ? 'No' : 'Yes'}</p>
              </div>
            </div>
            {outletData && (
              <div className="mt-4 pt-4 border-t border-blue-200">
                <p className="text-blue-800"><strong>Outlet Status:</strong> {outletData.isOpen ? 'Open' : 'Closed'}</p>
                <p className="text-blue-800"><strong>Outlet Data:</strong> {JSON.stringify(outletData, null, 2).slice(0, 200)}...</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Checkout;