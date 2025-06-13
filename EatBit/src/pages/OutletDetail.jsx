import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { FaStar, FaRegClock, FaPhoneAlt } from "react-icons/fa";
import { useCart } from "../Context/CartContext";  // ✅ Import Cart Context

const OutletDetail = ({ user }) => {
  const { outletName } = useParams();
  const navigate = useNavigate();

  const [restaurant, setRestaurant] = useState(null);
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [fade, setFade] = useState(true);

  // ✅ Use Cart Context for Firebase cart integration
  const { cart, setCart, loading: cartLoading, setShopName } = useCart();  // Destructure setShopName

  // ✅ Fetch restaurant details from Firestore
  useEffect(() => {
    const fetchRestaurant = async () => {
      try {
        const docRef = doc(db, "outlets", outletName.toLowerCase());
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setRestaurant(data);
          setMenu(data.menu || []);
        } else {
          console.log("❌ No such restaurant found!");
        }
      } catch (error) {
        console.error("🔥 Error fetching restaurant:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurant();
  }, [outletName]);

  // ✅ Store shop name in the Cart Context when the outlet page loads
  useEffect(() => {
    if (outletName && cart.shopName !== outletName) {
      setShopName(outletName);  // Update the shop name in Cart Context only if it differs from the current one
    }
  }, [outletName, setShopName, cart.shopName]);

  // ✅ Add item to cart (Firebase)
  const addToCart = (item) => {
    setCart((prevCart) => {
      const newCart = { ...prevCart };
      if (newCart.items[item.name]) {
        newCart.items[item.name].quantity += 1;
      } else {
        newCart.items[item.name] = { ...item, quantity: 1 };
      }
      return newCart;
    });
  };

  // ✅ Remove item from cart (Firebase)
  const removeFromCart = (item) => {
    setCart((prevCart) => {
      const newCart = { ...prevCart };
      if (newCart.items[item.name]?.quantity > 1) {
        newCart.items[item.name].quantity -= 1;
      } else {
        delete newCart.items[item.name];
      }
      return newCart;
    });
  };

  const handleTabClick = (index) => {
    setFade(false);
    setTimeout(() => {
      setActiveTab(index);
      setFade(true);
    }, 150);
  };

  const goToCart = () => {
    navigate("/cart");
  };

  if (loading || cartLoading) return <p className="loading">⏳ Loading menu...</p>;
  if (!restaurant) return <p className="error">❌ No restaurant found!</p>;

  return (
    <>
      <div className="outlet-container" style={{ marginTop: "100px" }}>
        <div className="restaurant-header">
          <h1>{restaurant.name}</h1>
          <p><FaPhoneAlt /> {restaurant.contact}</p>
          <p><FaRegClock /> {restaurant.timing}</p>
          <div className="rating">
            <FaStar color="gold" /> {restaurant.rating} ({restaurant.reviews} Reviews)
          </div>
        </div>

        <div className="content">
          <div className="order-section">
            <h2 className="order-title">📌 Order Online</h2>

            <div className="tabs">
              {menu.map((category, index) => (
                <button
                  key={index}
                  className={`tab ${activeTab === index ? "active" : ""}`}
                  onClick={() => handleTabClick(index)}
                >
                  {category.category}
                </button>
              ))}
            </div>

            <div className={`menu-list ${fade ? "fade-in" : ""}`}>
              {menu[activeTab]?.items.map((item, itemIndex) => (
                <div key={itemIndex} className="menu-card">
                  <div className="menu-info">
                    <div className="menu-header">
                      <span className="bestseller">⭐ Bestseller</span>
                      <h3>{item.name}</h3>
                      <p className="price">₹{item.price}</p>
                      <div className="rating-container">
                        <FaStar color="green" />
                        <span>{item.rating} ({item.reviews})</span>
                      </div>
                      <p className="description">{item.description}</p>
                    </div>
                  </div>

                  <div className="menu-image">
                    <img
                      src={item.image || "https://via.placeholder.com/150"}
                      alt={item.name}
                    />

                    {cart.items[item.name] ? (
                      <div className="quantity-control">
                        <button onClick={() => removeFromCart(item)}>-</button>
                        <span>{cart.items[item.name].quantity}</span>
                        <button onClick={() => addToCart(item)}>+</button>
                      </div>
                    ) : (
                      <button
                        className="add-btn"
                        onClick={() => addToCart(item)}
                      >
                        ADD
                      </button>
                    )}

                    <p className="customizable">Customisable</p>
                  </div>
                </div>
              ))}
            </div>

            {/* 🛒 Go to Cart Button */}
            <div className="cart-btn-container">
              <button className="cart-btn" onClick={goToCart}>
                Go to Cart ({Object.keys(cart.items).length} items)
              </button>
            </div>
          </div>
        </div>

        {/* ✅ Updated CSS */}
        <style>{`
          /* ✅ Overall Layout */
          .outlet-container {
            font-family: Arial, sans-serif;
            background-color: #f9f9f9;
            min-height: 100vh;
            padding-bottom: 50px;
          }

          .restaurant-header {
            background: #fff;
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
            padding: 30px 20px;
            text-align: center;
            border-bottom: 2px solid #ddd;
            margin-top: 1800px;
          }

          .content {
            margin-top: 40px;
            padding: 20px;
          }

          .order-section {
            margin-top: 20px;
          }

          .order-title {
            text-align: center;
            font-size: 22px;
            margin-bottom: 15px;
            color: #ff5722;
          }

          .tabs {
            display: flex;
            justify-content: center;
            margin-bottom: 20px;
            border-bottom: 2px solid #ddd;
          }

          .tab {
            padding: 12px 25px;
            cursor: pointer;
            font-size: 16px;
            background: none;
            border: none;
            color: #555;
            transition: color 0.3s, border-bottom 0.3s;
          }

          .tab:hover {
            color: #ff5722;
          }

          .tab.active {
            color: #ff5722;
            border-bottom: 3px solid #ff5722;
            font-weight: bold;
          }

          .menu-list {
            display: flex;
            flex-direction: column;
            gap: 30px;
            opacity: 0;
            transition: opacity 0.3s ease-in-out;
          }

          .menu-list.fade-in {
            opacity: 1;
          }

          .menu-card {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px;
            background: #fff;
            border: 1px solid #ddd;
            border-radius: 10px;
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
            transition: transform 0.3s;
          }

          .menu-card:hover {
            transform: translateY(-5px);
          }

          .menu-image {
            position: relative;
            display: flex;
            flex-direction: column;
            align-items: center;
          }

          .menu-image img {
            width: 150px;
            height: 150px;
            border-radius: 8px;
            object-fit: cover;
          }

          .add-btn, .quantity-control button {
            background: #4caf50;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            padding: 8px 20px;
            margin: 5px;
          }

          .quantity-control {
            display: flex;
            align-items: center;
            gap: 10px;
          }

          .quantity-control span {
            font-size: 18px;
          }
        `}</style>
      </div>
    </>
  );
};

export default OutletDetail;
