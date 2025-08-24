import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { useCart } from "../context/CartContext";
import { 
    FaArrowLeft, 
    FaStar, 
    FaMapMarkerAlt, 
    FaClock, 
    FaPhone, 
    FaEnvelope, 
    FaUtensils,
    FaLeaf,
    FaDrumstickBite,
    FaRupeeSign,
    FaGlobe,
    FaTruck,
    FaShoppingCart,
    FaPlus,
    FaMinus
} from "react-icons/fa";
import Navbar from "../components/Navbar";

const OutletDetails = () => {
    const { outletId } = useParams();
    const navigate = useNavigate();
    const [user, loading, authError] = useAuthState(auth);
    const [outlet, setOutlet] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [quantities, setQuantities] = useState({});
    const [addedToCart, setAddedToCart] = useState({});
    
    // Get cart context
    const { cart, setCart } = useCart();

    useEffect(() => {
        fetchOutletDetails();
    }, [outletId]);

    const fetchOutletDetails = async () => {
        try {
            setIsLoading(true);
            const docRef = doc(db, "outlets", outletId);
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists()) {
                setOutlet({
                    id: docSnap.id,
                    ...docSnap.data()
                });
            } else {
                setError("Outlet not found");
            }
        } catch (error) {
            console.error("Error fetching outlet:", error);
            setError("Error loading outlet details");
        } finally {
            setIsLoading(false);
        }
    };

    // Handle quantity change for items
    const handleQuantityChange = (itemName, change) => {
        setQuantities(prev => {
            const currentQty = prev[itemName] || 1;
            const newQty = Math.max(1, currentQty + change);
            return {
                ...prev,
                [itemName]: newQty
            };
        });
    };

    // Add item to cart
    const addToCart = (item) => {
        const quantity = quantities[item.name] || 1;
        
        // Create updated cart items
        const updatedItems = { ...cart.items };
        
        if (updatedItems[item.name]) {
            // If item already exists, update quantity
            updatedItems[item.name].quantity += quantity;
        } else {
            // Add new item
            updatedItems[item.name] = {
                price: parseFloat(item.price),
                quantity: quantity,
                image: item.image || "/api/placeholder/100/100",
                description: item.description || "",
                category: item.category || "",
                isVeg: item.isVeg || false
            };
        }

        // Update cart with outlet info
        setCart({
            items: updatedItems,
            shopName: outlet.name,
            shopId: outlet.id,
            shopAddress: outlet.address
        });

        // Show feedback
        setAddedToCart(prev => ({ ...prev, [item.name]: true }));
        setTimeout(() => {
            setAddedToCart(prev => ({ ...prev, [item.name]: false }));
        }, 2000);

        // Reset quantity to 1
        setQuantities(prev => ({ ...prev, [item.name]: 1 }));
    };

    // Navigate to cart
    const goToCart = () => {
        navigate('/cart');
    };

    // Get cart items count
    const getCartItemsCount = () => {
        if (!cart.items) return 0;
        return Object.values(cart.items).reduce((total, item) => total + (item.quantity || 0), 0);
    };

    if (loading || isLoading) {
        return (
            <div className="bg-gray-50 min-h-screen pt-20">
                <Navbar user={user} />
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
                    <span className="ml-3 text-gray-600">Loading outlet details...</span>
                </div>
            </div>
        );
    }

    if (authError || error) {
        return (
            <div className="bg-gray-50 min-h-screen pt-20">
                <Navbar user={user} />
                <div className="max-w-4xl mx-auto px-4 py-8">
                    <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
                        <div className="text-red-500 text-6xl mb-4">⚠️</div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">
                            {error || authError?.message}
                        </h2>
                        <button
                            onClick={() => navigate('/outlets')}
                            className="mt-4 bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-semibold transition duration-200"
                        >
                            Back to Outlets
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!outlet) return null;

    // Get unique categories from menu items
    const menuCategories = outlet.menuItems 
        ? ["all", ...new Set(outlet.menuItems.map(item => item.category))]
        : ["all"];

    // Filter menu items by category
    const filteredMenuItems = selectedCategory === "all" 
        ? outlet.menuItems || []
        : outlet.menuItems?.filter(item => item.category === selectedCategory) || [];

    return (
        <div className="bg-gray-50 min-h-screen pt-20">
            <Navbar user={user} />
            
            {/* Floating Cart Button */}
            {getCartItemsCount() > 0 && (
                <div className="fixed bottom-6 right-6 z-50">
                    <button
                        onClick={goToCart}
                        className="bg-red-500 hover:bg-red-600 text-white rounded-full p-4 shadow-lg flex items-center gap-2 transition duration-200"
                    >
                        <FaShoppingCart className="text-xl" />
                        <span className="bg-white text-red-500 rounded-full px-2 py-1 text-sm font-bold">
                            {getCartItemsCount()}
                        </span>
                    </button>
                </div>
            )}
            
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Back Button */}
                <button
                    onClick={() => navigate('/outlets')}
                    className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-800 font-semibold transition duration-200"
                >
                    <FaArrowLeft /> Back to Outlets
                </button>

                {/* Outlet Hero Section */}
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
                    <div className="relative h-80 md:h-96">
                        <img
                            src={outlet.image || "/api/placeholder/800/400"}
                            alt={outlet.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                e.target.src = "/api/placeholder/800/400";
                            }}
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-40"></div>
                        
                        {/* Overlay Content */}
                        <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="bg-red-500 px-3 py-1 rounded-full text-sm font-semibold capitalize">
                                            {outlet.category || 'Restaurant'}
                                        </span>
                                        {outlet.rating > 0 && (
                                            <div className="bg-white bg-opacity-20 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-1">
                                                <FaStar className="text-yellow-400" />
                                                <span className="font-semibold">{outlet.rating.toFixed(1)}</span>
                                            </div>
                                        )}
                                        {outlet.isOpen !== undefined && (
                                            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                                outlet.isOpen 
                                                    ? 'bg-green-500 bg-opacity-90' 
                                                    : 'bg-red-500 bg-opacity-90'
                                            }`}>
                                                {outlet.isOpen ? 'Open Now' : 'Closed'}
                                            </span>
                                        )}
                                    </div>
                                    <h1 className="text-4xl md:text-5xl font-bold mb-2">{outlet.name}</h1>
                                    <p className="text-xl text-gray-200 mb-2">{outlet.cuisine}</p>
                                    {outlet.priceForTwo && (
                                        <p className="text-green-300 font-semibold text-lg">{outlet.priceForTwo}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Description */}
                        {outlet.description && (
                            <div className="bg-white rounded-2xl shadow-lg p-6">
                                <h2 className="text-2xl font-bold text-gray-800 mb-4">About {outlet.name}</h2>
                                <p className="text-gray-600 leading-relaxed">{outlet.description}</p>
                            </div>
                        )}

                        {/* Menu Section */}
                        {outlet.menuItems && outlet.menuItems.length > 0 && (
                            <div className="bg-white rounded-2xl shadow-lg p-6">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                                        <FaUtensils className="text-red-500" />
                                        Menu
                                    </h2>
                                    
                                    {/* Category Filter */}
                                    <div className="flex gap-2 flex-wrap">
                                        {menuCategories.map(category => (
                                            <button
                                                key={category}
                                                onClick={() => setSelectedCategory(category)}
                                                className={`px-4 py-2 rounded-full text-sm font-medium transition duration-200 ${
                                                    selectedCategory === category
                                                        ? 'bg-red-500 text-white'
                                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                }`}
                                            >
                                                {category === 'all' ? 'All Items' : 
                                                 category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' ')}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Menu Items Grid */}
                                <div className="space-y-4">
                                    {filteredMenuItems.map((item, index) => {
                                        const itemQuantity = quantities[item.name] || 1;
                                        const isAdded = addedToCart[item.name];
                                        
                                        return (
                                            <div key={index} className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition duration-200">
                                                <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            {item.isVeg ? (
                                                                <FaLeaf className="text-green-500" />
                                                            ) : (
                                                                <FaDrumstickBite className="text-red-500" />
                                                            )}
                                                            <h3 className="font-semibold text-gray-800 text-lg">{item.name}</h3>
                                                        </div>
                                                        
                                                        {item.description && (
                                                            <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                                                                {item.description}
                                                            </p>
                                                        )}
                                                        
                                                        <div className="flex items-center gap-2 mb-4">
                                                            <FaRupeeSign className="text-green-600 text-sm" />
                                                            <span className="font-bold text-green-600 text-lg">
                                                                {item.price}
                                                            </span>
                                                        </div>

                                                        {/* Quantity Selector and Add to Cart */}
                                                        <div className="flex items-center gap-4">
                                                            <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                                                                <button
                                                                    onClick={() => handleQuantityChange(item.name, -1)}
                                                                    disabled={itemQuantity <= 1}
                                                                    className="p-2 rounded-md hover:bg-gray-200 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                                                >
                                                                    <FaMinus className="text-gray-800" />
                                                                </button>
                                                                <span className="px-4 py-2 font-semibold min-w-[3rem] text-center text-gray-800">
                                                                    {itemQuantity}
                                                                </span>
                                                                <button
                                                                    onClick={() => handleQuantityChange(item.name, 1)}
                                                                    className="p-2 rounded-md hover:bg-gray-200 transition duration-200"
                                                                >
                                                                    <FaPlus className="text-gray-800" />
                                                                </button>
                                                            </div>

                                                            <button
                                                                onClick={() => addToCart(item)}
                                                                disabled={isAdded}
                                                                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition duration-200 ${
                                                                    isAdded
                                                                        ? 'bg-green-500 text-white cursor-not-allowed'
                                                                        : 'bg-red-500 hover:bg-red-600 text-white'
                                                                }`}
                                                            >
                                                                <FaShoppingCart />
                                                                {isAdded ? 'Added!' : 'Add to Cart'}
                                                            </button>
                                                        </div>
                                                    </div>
                                                    
                                                    {item.image && (
                                                        <div className="w-32 h-32 md:w-40 md:h-32 rounded-lg overflow-hidden flex-shrink-0">
                                                            <img
                                                                src={item.image}
                                                                alt={item.name}
                                                                className="w-full h-full object-cover"
                                                                onError={(e) => {
                                                                    e.target.style.display = 'none';
                                                                }}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {filteredMenuItems.length === 0 && (
                                    <div className="text-center py-8">
                                        <FaUtensils className="mx-auto text-4xl text-gray-300 mb-2" />
                                        <p className="text-gray-500">No menu items found for this category</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Cart Summary */}
                        {getCartItemsCount() > 0 && (
                            <div className="bg-red-50 border-2 border-red-200 rounded-2xl shadow-lg p-6">
                                <h3 className="text-xl font-bold text-red-800 mb-4 flex items-center gap-2">
                                    <FaShoppingCart className="text-red-500" />
                                    Your Cart
                                </h3>
                                
                                <div className="space-y-2 mb-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-700">Items in cart</span>
                                        <span className="font-semibold text-red-600">{getCartItemsCount()}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-700">From</span>
                                        <span className="font-semibold text-gray-800">{outlet.name}</span>
                                    </div>
                                </div>
                                
                                <button
                                    onClick={goToCart}
                                    className="w-full bg-red-500 hover:bg-red-600 text-white px-4 py-3 rounded-lg font-semibold transition duration-200 flex items-center justify-center gap-2"
                                >
                                    <FaShoppingCart />
                                    View Cart & Checkout
                                </button>
                            </div>
                        )}

                        {/* Contact Information */}
                        <div className="bg-white rounded-2xl shadow-lg p-6">
                            <h3 className="text-xl font-bold text-gray-800 mb-4">Contact Information</h3>
                            
                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <FaMapMarkerAlt className="text-red-500 mt-1 flex-shrink-0" />
                                    <div>
                                        <p className="font-medium text-gray-700">Address</p>
                                        <p className="text-gray-600 text-sm">{outlet.address}</p>
                                    </div>
                                </div>

                                {outlet.phone && (
                                    <div className="flex items-center gap-3">
                                        <FaPhone className="text-blue-500 flex-shrink-0" />
                                        <div>
                                            <p className="font-medium text-gray-700">Phone</p>
                                            <a href={`tel:${outlet.phone}`} className="text-blue-600 text-sm hover:underline">
                                                {outlet.phone}
                                            </a>
                                        </div>
                                    </div>
                                )}

                                {outlet.email && (
                                    <div className="flex items-center gap-3">
                                        <FaEnvelope className="text-green-500 flex-shrink-0" />
                                        <div>
                                            <p className="font-medium text-gray-700">Email</p>
                                            <a href={`mailto:${outlet.email}`} className="text-green-600 text-sm hover:underline">
                                                {outlet.email}
                                            </a>
                                        </div>
                                    </div>
                                )}

                                {outlet.website && (
                                    <div className="flex items-center gap-3">
                                        <FaGlobe className="text-purple-500 flex-shrink-0" />
                                        <div>
                                            <p className="font-medium text-gray-700">Website</p>
                                            <a 
                                                href={outlet.website} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="text-purple-600 text-sm hover:underline"
                                            >
                                                Visit Website
                                            </a>
                                        </div>
                                    </div>
                                )}

                                {outlet.deliveryTime && (
                                    <div className="flex items-center gap-3">
                                        <FaTruck className="text-orange-500 flex-shrink-0" />
                                        <div>
                                            <p className="font-medium text-gray-700">Delivery Time</p>
                                            <p className="text-gray-600 text-sm">{outlet.deliveryTime}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Opening Hours */}
                        {outlet.openingHours && (
                            <div className="bg-white rounded-2xl shadow-lg p-6">
                                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                                    <FaClock className="text-orange-500" />
                                    Opening Hours
                                </h3>
                                
                                <div className="space-y-2">
                                    {/* Check if openingHours is a string or object */}
                                    {typeof outlet.openingHours === 'string' ? (
                                        // Simple string format
                                        <div className="flex justify-between items-center py-2">
                                            <span className="text-gray-700 font-medium">Daily Hours</span>
                                            <span className="text-sm text-gray-600">{outlet.openingHours}</span>
                                        </div>
                                    ) : (
                                        // Object format with days
                                        Object.entries(outlet.openingHours).map(([day, hours]) => (
                                            <div key={day} className="flex justify-between items-center py-1">
                                                <span className="text-gray-700 capitalize font-medium">
                                                    {day}
                                                </span>
                                                <span className={`text-sm ${hours?.isOpen ? 'text-gray-600' : 'text-red-500'}`}>
                                                    {hours?.isOpen ? `${hours.open} - ${hours.close}` : 'Closed'}
                                                </span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Quick Stats */}
                        <div className="bg-white rounded-2xl shadow-lg p-6">
                            <h3 className="text-xl font-bold text-gray-800 mb-4">Quick Stats</h3>
                            
                            <div className="space-y-3">
                                {outlet.rating > 0 && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">Rating</span>
                                        <div className="flex items-center gap-1">
                                            <FaStar className="text-yellow-500" />
                                            <span className="font-semibold">{outlet.rating.toFixed(1)}</span>
                                        </div>
                                    </div>
                                )}
                                
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Category</span>
                                    <span className="font-semibold capitalize">{outlet.category || 'Restaurant'}</span>
                                </div>
                                
                                {outlet.deliveryTime && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">Delivery</span>
                                        <span className="font-semibold text-orange-600">{outlet.deliveryTime}</span>
                                    </div>
                                )}
                                
                                {outlet.menuItems && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">Menu Items</span>
                                        <span className="font-semibold">{outlet.menuItems.length}</span>
                                    </div>
                                )}
                                
                                {outlet.priceForTwo && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">Price for Two</span>
                                        <span className="font-semibold text-green-600">{outlet.priceForTwo}</span>
                                    </div>
                                )}
                                
                                {outlet.isOpen !== undefined && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">Status</span>
                                        <span className={`font-semibold ${outlet.isOpen ? 'text-green-600' : 'text-red-600'}`}>
                                            {outlet.isOpen ? 'Open' : 'Closed'}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OutletDetails;