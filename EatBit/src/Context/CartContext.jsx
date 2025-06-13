import React, { createContext, useContext, useEffect, useState } from "react";
import { db, auth } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { debounce } from "lodash";  // 🆕 Import debounce

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [user] = useAuthState(auth);
  const [cart, setCart] = useState({ items: {}, shopName: null });
  const [loading, setLoading] = useState(true);

  // ✅ Fetch cart from Firestore when user logs in
  useEffect(() => {
    const fetchCart = async () => {
      if (user) {
        setLoading(true);
        try {
          const cartRef = doc(db, "carts", user.uid);
          const cartSnap = await getDoc(cartRef);

          if (cartSnap.exists()) {
            const data = cartSnap.data();
            setCart({
              items: data.items || {},
              shopName: data.shopName || null,
            });
          } else {
            setCart({ items: {}, shopName: null });
          }
        } catch (error) {
          console.error("🔥 Error loading cart:", error);
        } finally {
          setLoading(false);
        }
      } else {
        setCart({ items: {}, shopName: null });
        setLoading(false);
      }
    };

    fetchCart();
  }, [user]);

  // ✅ Debounced saveCart to Firestore (avoids spamming writes)
  const debouncedSaveCart = debounce(async (user, cart) => {
    try {
      const cartRef = doc(db, "carts", user.uid);
      await setDoc(cartRef, cart, { merge: true });
      console.log("✅ Cart saved to Firestore");
    } catch (error) {
      console.error("🔥 Error saving cart:", error);
    }
  }, 1000); // Save 1s after last change

  useEffect(() => {
    if (user && !loading) {
      debouncedSaveCart(user, cart);
    }
  }, [cart, user, loading]);

  // ✅ Clear cart completely
  const clearCart = async () => {
    setCart({ items: {}, shopName: null });
    if (user) {
      const cartRef = doc(db, "carts", user.uid);
      await setDoc(cartRef, { items: {}, shopName: null }, { merge: true });
    }
  };

  // ✅ Add/update items in cart with shopName (no unnecessary updates)
  const updateCart = (item, shopNameParam) => {
    setCart(prevCart => {
      const isCartEmpty = Object.keys(prevCart.items).length === 0;

      return {
        items: {
          ...prevCart.items,
          [item.name]: {
            price: item.price,
            quantity: (prevCart.items[item.name]?.quantity || 0) + 1,
          },
        },
        shopName: isCartEmpty ? shopNameParam : prevCart.shopName,
      };
    });
  };

  // ✅ Set shop name separately
  const setShopName = (shopNameParam) => {
    setCart(prevCart => ({
      ...prevCart,
      shopName: shopNameParam,
    }));
  };

  return (
    <CartContext.Provider value={{ cart, setCart, clearCart, updateCart, setShopName, loading }}>
      {children}
    </CartContext.Provider>
  );
};
