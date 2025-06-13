import React, { useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { useNavigate } from "react-router-dom"; // 🔹 Import useNavigate
import { auth } from "../firebase";
import { FaUtensils, FaMotorcycle } from "react-icons/fa";
import Navbar from "../components/Navbar";

const Outlets = () => {
    const [user, loading, error] = useAuthState(auth);
    const [activeTab, setActiveTab] = useState("Dining Out");
    const [fade, setFade] = useState(false);
    const navigate = useNavigate(); // 🔹 Hook for navigation

    if (loading) return <p>Loading...</p>;
    if (error) return <p>Error: {error.message}</p>;

    const handleTabChange = (tab) => {
        setFade(true);
        setTimeout(() => {
            setActiveTab(tab);
            setFade(false);
        }, 200);
    };

    // 🔹 Each outlet now has a name-based navigation
    const diningOutlets = [
        { name: "Delhi 65 Multicuisine", cuisine: "North Indian, Chinese", price: "₹400 for one", img: "/outlet1.jpg" },
        { name: "Down South Cafe", cuisine: "Burger, Sandwich", price: "₹200 for one", img: "/outlet2.jpg" },
        { name: "The Best", cuisine: "North Indian, Chinese", price: "₹400 for one", img: "/outlet3.jpg" },
    ];

    const deliveryOutlets = [
        { name: "Pizza Express", cuisine: "Pizza, Italian", price: "₹300 for one", img: "/delivery1.jpg" },
        { name: "Burger House", cuisine: "Burgers, Fast Food", price: "₹250 for one", img: "/delivery2.jpg" },
        { name: "Chinese Wok", cuisine: "Chinese, Asian", price: "₹400 for one", img: "/delivery3.jpg" },
    ];

    const outlets = activeTab === "Dining Out" ? diningOutlets : deliveryOutlets;

    return (
        <div className="app-container" style={{ backgroundColor: "white", paddingTop: "90px", minHeight: "100vh" }}>
            {/* Navbar */}
            <Navbar user={user} />

            {/* Tab Selection */}
            <div className="tabs" style={{ display: "flex", justifyContent: "center", gap: "50px", margin: "40px 0 20px", borderBottom: "2px solid #eee" }}>
                <div
                    className={`tab ${activeTab === "Dining Out" ? "active" : ""}`}
                    onClick={() => handleTabChange("Dining Out")}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "12px 24px",
                        cursor: "pointer",
                        fontSize: "18px",
                        color: activeTab === "Dining Out" ? "red" : "gray",
                        fontWeight: activeTab === "Dining Out" ? "bold" : "normal",
                        borderBottom: activeTab === "Dining Out" ? "4px solid red" : "none",
                        transition: "color 0.4s ease-in-out, border-bottom 0.4s ease-in-out, transform 0.3s ease-in-out",
                        transform: activeTab === "Dining Out" ? "scale(1.05)" : "scale(1)",
                    }}
                >
                    <FaUtensils size={22} /> Dining Out
                </div>
                <div
                    className={`tab ${activeTab === "Delivery" ? "active" : ""}`}
                    onClick={() => handleTabChange("Delivery")}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "12px 24px",
                        cursor: "pointer",
                        fontSize: "18px",
                        color: activeTab === "Delivery" ? "red" : "gray",
                        fontWeight: activeTab === "Delivery" ? "bold" : "normal",
                        borderBottom: activeTab === "Delivery" ? "4px solid red" : "none",
                        transition: "color 0.4s ease-in-out, border-bottom 0.4s ease-in-out, transform 0.3s ease-in-out",
                        transform: activeTab === "Delivery" ? "scale(1.05)" : "scale(1)",
                    }}
                >
                    <FaMotorcycle size={22} /> Delivery
                </div>
            </div>

            {/* Outlets Grid */}
            <div style={{ flexGrow: 1, padding: "20px", textAlign: "center" }}>
                <h1 style={{ fontSize: "40px", fontWeight: "900", textAlign: "left", marginBottom: "20px" }}>{activeTab}</h1>

                <div
                    className={`outlets-grid ${fade ? "fade-out" : "fade-in"}`}
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(3, 1fr)",
                        gap: "20px",
                        justifyItems: "center",
                        transition: "opacity 0.3s ease-in-out",
                        opacity: fade ? 0 : 1,
                    }}
                >
                    {outlets.map((outlet) => (
                        <div
                            key={outlet.name}
                            className="outlet-card"
                            style={{
                                background: "white",
                                width: "300px",
                                borderRadius: "10px",
                                overflow: "hidden",
                                boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
                                transition: "transform 0.3s ease, box-shadow 0.3s ease",
                                cursor: "pointer",
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
                            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                            onClick={() => navigate(`/outlets/${outlet.name.toLowerCase().replace(/\s+/g, "-")}`)} // 🔹 Navigate using outlet name
                        >
                            <img src={outlet.img} alt={outlet.name} style={{ width: "100%", height: "180px", objectFit: "cover" }} />
                            <div style={{ padding: "10px" }}>
                                <h2>{outlet.name}</h2>
                                <p>{outlet.cuisine}</p>
                                <p>{outlet.price}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Outlets;
