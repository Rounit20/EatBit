import React from "react";

const Footer = () => {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Main Content Wrapper to Push Footer Down */}
      <div style={{ flexGrow: 1 }}></div>

      {/* Footer Section */}
      <footer
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          width: "100%",
          backgroundColor: "rgba(0, 0, 0, 0.4)",
          backdropFilter: "blur(10px) saturate(150%)",
          borderTop: "2px solid rgba(255, 255, 255, 0.3)",
          boxShadow: "0 -2px 6px rgba(0, 0, 0, 0.1)",
          color: "white",
          padding: "2rem 2.5rem",
          boxSizing: "border-box",
        }}
      >
        {/* Gradient Overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: "linear-gradient(to bottom, rgba(0, 0, 0, 1), rgba(0, 0, 0, 1))",
            zIndex: 20,
          }}
        ></div>

        <div
          style={{
            position: "relative",
            zIndex: 30,
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "flex-start",
            alignItems: "flex-start",
            textAlign: "left",
            height: "100%",
          }}
        >
          {/* Logo and Description */}
          <aside style={{ flexShrink: 0, width: "100%", paddingLeft: "2rem" }}>
            <h1 style={{ fontSize: "1rem", fontWeight: "600" }}>
              <span style={{ fontSize: "2.5rem", fontWeight: "800", fontFamily: "Orbitron, sans-serif" }}>Rookus</span>
              <br />
              <div style={{ paddingTop: "0.5rem", color: "#b3b3b3" }}>Where AI meets Fashion</div>
            </h1>

            {/* Subscribe Section */}
            <div style={{ marginTop: "1.5rem" }}>
              <span style={{ fontSize: "1.5rem", fontWeight: "600", color: "white" }}>Subscribe</span>
              <p style={{ color: "#b3b3b3", fontSize: "0.875rem" }}>Join our newsletter for updates</p>
              <form style={{ marginTop: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <input
                  type="email"
                  placeholder="Enter your email"
                  style={{
                    padding: "0.5rem 1rem",
                    borderRadius: "0.375rem",
                    backgroundColor: "white",
                    color: "black",
                    fontSize: "0.875rem",
                    outline: "none",
                    border: "none",
                  }}
                />
                <button
                  style={{
                    padding: "0.5rem 1rem",
                    backgroundColor: "#2563eb",
                    color: "white",
                    borderRadius: "0.375rem",
                    cursor: "pointer",
                    border: "none",
                  }}
                >
                  Subscribe
                </button>
              </form>
            </div>
          </aside>
        </div>

        {/* Footer Bottom */}
        <div
          style={{
            position: "relative",
            zIndex: 30,
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-start",
            alignItems: "flex-start",
            marginTop: "0.5rem",
            textAlign: "left",
            paddingLeft: "2rem",
          }}
        >
          <p style={{ fontSize: "0.875rem", fontWeight: "300", marginTop: "0.5rem", color: "#b3b3b3" }}>
            Copyright © {new Date().getFullYear()} Rookus. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Footer;
