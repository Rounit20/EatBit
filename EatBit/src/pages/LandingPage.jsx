import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/LandingPage.css";


const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="landing-container">
      <h1>Welcome to EatBit</h1>
      <p>Your favorite food delivery app, bringing delicious meals to your doorstep.</p>
      <div className="buttons">
        <button onClick={() => navigate("/login")}>Login</button>
        <button onClick={() => navigate("/signup")}>Sign Up</button>
      </div>
    </div>
  );
};

export default LandingPage;
