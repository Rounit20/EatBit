import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../firebase";
import { useCart } from "../context/CartContext";
import {
  FaShoppingCart,
  FaTrash,
  FaPlus,
  FaMinus,
  FaLeaf,
  FaDrumstickBite,
  FaRupeeSign,
  FaArrowLeft,
  FaMapMarkerAlt,
  FaStore,
  FaReceipt,
  FaPercentage
} from "react-icons/fa";

const Cart = () => {
  const navigate = useNavigate();
  const [user] = useAuthState(auth);
  const { cart, setCart, loading } = useCart();
  const [total, setTotal] = useState(0);
  const [salesTax, setSalesTax] = useState(0);
  const [subtotal, setSubtotal] = useState(0);

  // Extract valid items
  const validCartItems = Object.entries(cart.items || {}).filter(
    ([_, item]) =>
      typeof item === "object" &&
      item !== null &&
      typeof item.price === "number" &&
      typeof item.quantity === "number"
  );

  // Calculate total and tax
  useEffect(() => {
    if (loading) return;

    let calculatedSubtotal = 0;
    validCartItems.forEach(([_, item]) => {
      calculatedSubtotal += item.price * item.quantity;
    });

    const tax = calculatedSubtotal * 0.1;
    setSubtotal(calculatedSubtotal);
    setSalesTax(tax);
    setTotal(calculatedSubtotal + tax);
  }, [cart, loading, validCartItems]);

  // Change quantity of items
  const handleQuantityChange = (itemName, change) => {
    const updatedItems = { ...cart.items };

    if (updatedItems[itemName]) {
      updatedItems[itemName].quantity += change;
      if (updatedItems[itemName].quantity <= 0) {
        delete updatedItems[itemName];
      }
    }

    setCart({
      ...cart,
      items: updatedItems,
    });
  };

  // Remove item completely
  const handleRemoveItem = (itemName) => {
    const updatedItems = { ...cart.items };
    delete updatedItems[itemName];
    
    setCart({
      ...cart,
      items: updatedItems,
    });
  };

  // Clear entire cart
  const handleClearCart = () => {
    if (window.confirm("Are you sure you want to clear your entire cart?")) {
      setCart({
        items: {},
        shopName: "",
        shopId: "",
        shopAddress: ""
      });
    }
  };

  // Handle checkout
  const handleCheckout = () => {
    if (!validCartItems.length) {
      alert("Your cart is empty, add items to proceed!");
      return;
    }

    const shopName = cart.shopName || "DefaultShop";
    navigate(`/checkout/${shopName}`);
  };

  // Continue shopping
  const handleContinueShopping = () => {
    if (cart.shopId) {
      navigate(`/outlets/${cart.shopId}`);
    } else {
      navigate('/outlets');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20">
        <Navbar user={user} />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
            <span className="ml-3 text-gray-600 text-lg">Loading your cart...</span>
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
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Your cart is empty</h2>
            <p className="text-gray-600 mb-8">Looks like you haven't added any items to your cart yet.</p>
            <button
              onClick={() => navigate('/outlets')}
              className="bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-lg font-semibold transition duration-200 inline-flex items-center gap-2"
            >
              <FaStore />
              Browse Restaurants
            </button>
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
            onClick={handleContinueShopping}
            className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-800 font-semibold transition duration-200"
          >
            <FaArrowLeft /> Continue Shopping
          </button>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                <FaShoppingCart className="text-red-500" />
                Your Cart ({validCartItems.length} {validCartItems.length === 1 ? 'item' : 'items'})
              </h1>
              {cart.shopName && (
                <div className="mt-2 flex items-center gap-2 text-gray-600">
                  <FaStore className="text-sm" />
                  <span>From <strong>{cart.shopName}</strong></span>
                  {cart.shopAddress && (
                    <>
                      <FaMapMarkerAlt className="text-sm ml-2" />
                      <span className="text-sm">{cart.shopAddress}</span>
                    </>
                  )}
                </div>
              )}
            </div>
            
            <button
              onClick={handleClearCart}
              className="text-red-600 hover:text-red-800 font-semibold transition duration-200 flex items-center gap-2"
            >
              <FaTrash />
              Clear Cart
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              {/* Desktop Header */}
              <div className="hidden md:grid grid-cols-12 gap-4 p-6 bg-gray-50 border-b font-semibold text-gray-700">
                <div className="col-span-6">Item</div>
                <div className="col-span-2 text-center">Price</div>
                <div className="col-span-2 text-center">Quantity</div>
                <div className="col-span-2 text-right">Total</div>
              </div>

              {/* Cart Items */}
              <div className="divide-y divide-gray-200">
                {validCartItems.map(([itemName, item], index) => {
                  const { price, quantity, image, description, isVeg } = item;
                  const itemTotal = price * quantity;

                  return (
                    <div key={index} className="p-6 hover:bg-gray-50 transition duration-200">
                      {/* Mobile Layout */}
                      <div className="md:hidden">
                        <div className="flex items-start gap-4">
                          <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                            <img
                              src={image || "https://via.placeholder.com/100"}
                              alt={itemName}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.src = "https://via.placeholder.com/100";
                              }}
                            />
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              {isVeg ? (
                                <FaLeaf className="text-green-500 text-sm" />
                              ) : (
                                <FaDrumstickBite className="text-red-500 text-sm" />
                              )}
                              <h3 className="font-semibold text-gray-800">{itemName}</h3>
                            </div>
                            
                            {description && (
                              <p className="text-gray-600 text-sm mb-2 line-clamp-2">{description}</p>
                            )}
                            
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1">
                                <FaRupeeSign className="text-green-600 text-sm" />
                                <span className="font-semibold text-green-600">{price.toFixed(2)}</span>
                              </div>
                              
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                                  <button
                                    onClick={() => handleQuantityChange(itemName, -1)}
                                    className="p-2 rounded-md hover:bg-gray-200 transition duration-200"
                                  >
                                    <FaMinus className="text-gray-600 text-xs" />
                                  </button>
                                  <span className="px-3 py-1 font-semibold min-w-[2rem] text-center text-black">
                                    {quantity}
                                  </span>
                                  <button
                                    onClick={() => handleQuantityChange(itemName, 1)}
                                    className="p-2 rounded-md hover:bg-gray-200 transition duration-200"
                                  >
                                    <FaPlus className="text-gray-600 text-xs" />
                                  </button>
                                </div>
                                
                                <button
                                  onClick={() => handleRemoveItem(itemName)}
                                  className="p-2 text-red-500 hover:text-red-700 transition duration-200"
                                >
                                  <FaTrash />
                                </button>
                              </div>
                            </div>
                            
                            <div className="mt-2 text-right">
                              <span className="text-lg font-bold text-gray-800 flex items-center justify-end gap-1">
                                <FaRupeeSign className="text-sm" />
                                {itemTotal.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Desktop Layout */}
                      <div className="hidden md:grid grid-cols-12 gap-4 items-center">
                        <div className="col-span-6 flex items-center gap-4">
                          <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                            <img
                              src={image || "https://via.placeholder.com/100"}
                              alt={itemName}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.src = "https://via.placeholder.com/100";
                              }}
                            />
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              {isVeg ? (
                                <FaLeaf className="text-green-500 text-sm" />
                              ) : (
                                <FaDrumstickBite className="text-red-500 text-sm" />
                              )}
                              <h3 className="font-semibold text-gray-800">{itemName}</h3>
                            </div>
                            {description && (
                              <p className="text-gray-600 text-sm line-clamp-2">{description}</p>
                            )}
                          </div>
                        </div>
                        
                        <div className="col-span-2 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <FaRupeeSign className="text-green-600 text-sm" />
                            <span className="font-semibold text-green-600">{price.toFixed(2)}</span>
                          </div>
                        </div>
                        
                        <div className="col-span-2 flex justify-center">
                          <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                            <button
                              onClick={() => handleQuantityChange(itemName, -1)}
                              className="p-2 rounded-md hover:bg-gray-200 transition duration-200"
                            >
                              <FaMinus className="text-gray-600 text-xs" />
                            </button>
                            <span className="px-3 py-1 font-semibold min-w-[2rem] text-center text-black">
                              {quantity}
                            </span>
                            <button
                              onClick={() => handleQuantityChange(itemName, 1)}
                              className="p-2 rounded-md hover:bg-gray-200 transition duration-200"
                            >
                              <FaPlus className="text-gray-600 text-xs" />
                            </button>
                          </div>
                        </div>
                        
                        <div className="col-span-2 flex items-center justify-end gap-3">
                          <div className="flex items-center gap-1">
                            <FaRupeeSign className="text-sm" />
                            <span className="font-bold text-gray-800">{itemTotal.toFixed(2)}</span>
                          </div>
                          <button
                            onClick={() => handleRemoveItem(itemName)}
                            className="p-2 text-red-500 hover:text-red-700 transition duration-200"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-24">
              <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <FaReceipt className="text-blue-500" />
                Order Summary
              </h2>
              
              <div className="space-y-4 mb-6">
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
                    <span className="font-semibold text-gray-800">{salesTax.toFixed(2)}</span>
                  </div>
                </div>
                
                <hr className="border-gray-200" />
                
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-gray-800">Grand Total</span>
                  <div className="flex items-center gap-1">
                    <FaRupeeSign className="text-lg text-gray-800" />
                    <span className="text-xl font-bold text-gray-800">{total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              
              <button
                onClick={handleCheckout}
                className="w-full bg-green-500 hover:bg-green-600 text-white py-4 rounded-lg font-bold text-lg transition duration-200 flex items-center justify-center gap-2 shadow-lg"
              >
                <FaShoppingCart />
                Proceed to Checkout
              </button>
              
              <button
                onClick={handleContinueShopping}
                className="w-full mt-3 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold transition duration-200 flex items-center justify-center gap-2"
              >
                <FaStore />
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;