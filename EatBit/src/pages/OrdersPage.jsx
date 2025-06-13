import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import {
  collection,
  updateDoc,
  doc,
  query,
  orderBy,
  onSnapshot,
  where,
} from "firebase/firestore";
import { useParams } from "react-router-dom";
import { getAuth } from "firebase/auth";
import "./OrderModal.css"; // NEW CSS

const statusColors = {
  "New Order": "bg-yellow-100 text-yellow-800",
  "Accepted by Restaurant": "bg-emerald-100 text-emerald-800",
  "Prepared": "bg-orange-100 text-orange-800",
  "Rejected by Store": "bg-red-100 text-red-800",
  "Delivered": "bg-green-100 text-green-800",
};

const OrdersPage = () => {
  const { shopName } = useParams();
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const userId = getAuth().currentUser?.uid; // Get the currently authenticated user's UID

  useEffect(() => {
    if (!shopName || !userId) return;

    const q = query(
      collection(db, "orders", shopName, "orderList"),
      orderBy("timestamp", "desc"),
      where("userId", "==", userId) // Ensure that the logged-in user can only access their own orders
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setOrders(data);
    });

    return () => unsubscribe();
  }, [shopName, userId]);

  const updateStatus = async (orderId, newStatus) => {
    const ref = doc(db, "orders", shopName, "orderList", orderId);
    await updateDoc(ref, { status: newStatus });

    setOrders((prevOrders) =>
      prevOrders.map((order) =>
        order.id === orderId ? { ...order, status: newStatus } : order
      )
    );
    setSelectedOrder(null);
  };

  if (!shopName) {
    return (
      <div className="p-6 text-center text-red-600 font-semibold">
        ⚠️ No shop name provided in the URL. Cannot fetch orders.
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Orders</h1>

      <div className="overflow-x-auto bg-white shadow-lg rounded-xl">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100 text-gray-700 text-left">
            <tr>
              <th className="p-4">Order ID</th>
              <th className="p-4">Store</th>
              <th className="p-4">Method</th>
              <th className="p-4">Time Slot</th>
              <th className="p-4">Created</th>
              <th className="p-4">Last Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {orders.map((order) => (
              <tr
                key={order.id}
                className="hover:bg-gray-50 transition cursor-pointer"
                onClick={() => setSelectedOrder(order)}
              >
                <td className="p-4 font-mono text-green-600">{order.orderId}</td>
                <td className="p-4">{shopName}</td>
                <td className="p-4">{order.deliveryMode || "Delivery"}</td>
                <td className="p-4">Immediately</td>
                <td className="p-4 whitespace-nowrap">
                  {order.timestamp
                    ? `Date: ${new Date(order.timestamp.seconds * 1000).toLocaleDateString()} 
                       Time: ${new Date(order.timestamp.seconds * 1000).toLocaleTimeString()}`
                    : "N/A"}
                </td>
                <td className="p-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      statusColors[order.status] || "bg-gray-200 text-gray-800"
                    }`}
                  >
                    {order.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedOrder && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 className="text-xl font-bold mb-2 text-gray-800">
              Order ID: <span className="text-black">{selectedOrder.orderId}</span>
            </h2>
            <p className="mb-3 text-sm text-gray-600">
              <strong>Status:</strong>{" "}
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  statusColors[selectedOrder.status] || "bg-gray-200 text-gray-800"
                }`}
              >
                {selectedOrder.status}
              </span>
            </p>

            <div className="border-t pt-4 mt-2">
              <h3 className="font-semibold text-lg mb-2 text-gray-800">User Details</h3>
              <div className="space-y-1 text-gray-700 text-sm">
                <p><strong>Name:</strong> {selectedOrder.userData?.name}</p>
                <p><strong>Email:</strong> {selectedOrder.userData?.email}</p>
                <p><strong>Mobile:</strong> {selectedOrder.userData?.mobile}</p>
                <p><strong>Roll No:</strong> {selectedOrder.userData?.rollNo}</p>
                <p><strong>Hostel No:</strong> {selectedOrder.userData?.hostelNo}</p>
                <p><strong>Address:</strong> {selectedOrder.userData?.address}</p>
              </div>
            </div>

            <div className="border-t pt-4 mt-4">
              <h3 className="font-semibold text-lg mb-2 text-gray-800">Ordered Items</h3>
              <ul className="list-disc pl-6 space-y-1 text-gray-700 text-sm">
                {selectedOrder.items?.map((item, idx) => (
                  <li key={idx}>
                    {item.name} × {item.quantity} — ₹{item.price}
                  </li>
                ))}
              </ul>
            </div>

            <div className="border-t pt-4 mt-4 text-right space-y-1 text-sm text-gray-800">
              <p><strong>Subtotal:</strong> ₹{selectedOrder.subtotal}</p>
              <p><strong>Tax:</strong> ₹{selectedOrder.tax}</p>
              <p className="text-lg font-bold">
                <strong>Grand Total:</strong> ₹{selectedOrder.grandTotal}
              </p>
            </div>

            <div className="mt-4">
              <label className="block mb-1 font-medium text-sm text-gray-700">
                Update Status:
              </label>
              <select
                value={selectedOrder.status}
                onChange={(e) => updateStatus(selectedOrder.id, e.target.value)}
                className="border border-gray-300 px-3 py-2 rounded-md w-full text-sm"
              >
                <option>New Order</option>
                <option>Accepted by Restaurant</option>
                <option>Prepared</option>
                <option>Delivered</option>
                <option>Rejected by Store</option>
              </select>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-blue-600 hover:underline text-sm font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersPage;
