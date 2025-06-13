import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuthState } from "react-firebase-hooks/auth";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "../firebase";
import Navbar from "../components/Navbar";
import { useCart } from "../context/CartContext";

const Checkout = () => {
  const { shopName: shopNameFromURL } = useParams();
  const [user] = useAuthState(auth);
  const [userData, setUserData] = useState(null);
  const navigate = useNavigate();
  const { cart, clearCart } = useCart();

  const orderId = "ORD" + Date.now().toString(36).toUpperCase();
  const finalShopName = cart.shopName || shopNameFromURL;

  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        try {
          const userRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(userRef);
          if (docSnap.exists()) {
            setUserData(docSnap.data());
          }
        } catch (error) {
          console.error("🔥 Error fetching user data:", error);
        }
      }
    };
    fetchUserData();
  }, [user]);

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

  const handlePlaceOrder = async () => {
    if (!user) {
      alert("Please log in to place your order.");
      return;
    }

    if (!finalShopName) {
      alert("Shop name is missing. Please try again later.");
      return;
    }

    if (validCartItems.length === 0) {
      alert("Your cart is empty. Please add items to place an order.");
      return;
    }

    const orderData = {
      orderId,
      userId: user.uid,
      shopName: finalShopName,
      items: validCartItems.map(([name, item]) => ({
        name,
        price: item.price,
        quantity: item.quantity,
      })),
      subtotal,
      tax,
      grandTotal,
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
      status: "New Order",
    };

    try {
      const shopDocRef = doc(db, "orders", finalShopName);
      await setDoc(shopDocRef, { createdAt: serverTimestamp() }, { merge: true });

      const orderRef = doc(db, "orders", finalShopName, "orderList", orderId);
      await setDoc(orderRef, orderData);

      alert("🎉 Order placed successfully!");
      clearCart();

      navigate("/home");
    } catch (error) {
      console.error("🔥 Error placing order:", error.message || error);
      alert(`Something went wrong. ${error.message || error}`);
    }
  };

  return (
    <>
      <Navbar user={user} />
      <div className="checkout-container">
        <h1>🧾 Checkout</h1>

        <div className="checkout-grid">
          <div className="card">
            <h2>🧺 Order Summary</h2>
            <p><strong>Shop:</strong> {finalShopName || "N/A"}</p>
            <p><strong>Order ID:</strong> {orderId}</p>

            {validCartItems.map(([name, item], idx) => {
              const price = typeof item.price === "number" ? item.price : 0;
              const quantity = typeof item.quantity === "number" ? item.quantity : 1;
              return (
                <div key={idx} className="order-item">
                  <span>{name} x {quantity}</span>
                  <span>₹{(price * quantity).toFixed(2)}</span>
                </div>
              );
            })}
            <hr />
            <p><strong>Subtotal:</strong> ₹{subtotal.toFixed(2)}</p>
            <p><strong>Sales Tax (10%):</strong> ₹{tax.toFixed(2)}</p>
            <h3>Total: ₹{grandTotal.toFixed(2)}</h3>
          </div>

          <div className="card">
            <h2>👤 Verify Your Details</h2>
            {userData ? (
              <div className="details">
                <p><strong>Name:</strong> {userData.name}</p>
                <p><strong>Gender:</strong> {userData.gender}</p>
                <p><strong>Mobile No.:</strong> {userData.mobile}</p>
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>Roll No.:</strong> {userData.rollNo}</p>
                <p><strong>Hostel No.:</strong> {userData.hostelNo}</p>
                <p><strong>Address:</strong> {userData.address}</p>
              </div>
            ) : (
              <p>Loading user data...</p>
            )}
          </div>
        </div>

        <button className="place-order-btn" onClick={handlePlaceOrder}>
          ✅ Place Order
        </button>
      </div>

      <style>{`
        .checkout-container {
          max-width: 1000px;
          margin: 40px auto;
          padding: 20px;
          font-family: sans-serif;
        }

        h1 {
          text-align: center;
          margin-bottom: 30px;
        }

        .checkout-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }

        .card {
          background: #fff;
          border: 1px solid #ddd;
          border-radius: 10px;
          padding: 20px;
          box-shadow: 0 0 8px rgba(0,0,0,0.05);
        }

        .order-item {
          display: flex;
          justify-content: space-between;
          margin: 8px 0;
        }

        .details p {
          margin: 6px 0;
        }

        .place-order-btn {
          width: 100%;
          padding: 15px;
          font-size: 18px;
          background-color: #4CAF50;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.3s;
        }

        .place-order-btn:hover {
          background-color: #45a049;
        }
      `}</style>
    </>
  );
};

export default Checkout;
