import React from "react";
import { auth } from "../firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import Navbar from "../components/Navbar";


const Home = () => {
  const [user, loading, error] = useAuthState(auth);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  const faqs = [
    { question: "What is your return policy?", answer: "You can return any item within 30 days of purchase." },
    { question: "How do I track my order?", answer: "You can track your order through the 'My Orders' section." },
    { question: "Do you offer international shipping?", answer: "Yes, we ship to most countries worldwide." },
  ];

  return (
    <>
      {/* Navbar Component */}
      <Navbar user={user} />

      <div
        className="app-container"
        style={{
          backgroundColor: "white",
          paddingTop: "75px",
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
        }}
      >
        <div style={{ flexGrow: 1 }}>
          <h1
            style={{
              fontSize: "24px",
              fontWeight: "900",
              position: "absolute",
              margin: "20px 3%",
              top: "10%",
              left: "20px",
            }}
          >
            Existing Outlets
          </h1>

          <h1
            style={{
              fontSize: "24px",
              fontWeight: "900",
              position: "absolute",
              margin: "20px 3%",
              top: "50%",
              left: "20px",
            }}
          >
            Popular Categories
          </h1>

          {/* FAQ Section */}
          <div
            className="faqs"
            style={{
              position: "absolute",
              backgroundColor: "rgb(8, 2, 57)",
              padding: "25px",
              borderRadius: "10px",
              boxShadow: "0px 4px 6px rgba(0,0,0,0.1)",
              width: "60%",
              color: "white",
              top: "80%",
              left: "50%",
              transform: "translateX(-50%)",
              height: "200px",
            }}
          >
            <h2 style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "10px" }}>
              Frequently Asked Questions
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div style={{ fontWeight: "bold" }}>Questions</div>
              <div style={{ fontWeight: "bold" }}>Answers</div>
              {faqs.map((faq, index) => (
                <React.Fragment key={index}>
                  <div>{faq.question}</div>
                  <div>{faq.answer}</div>
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>

      
    </>
  );
};

export default Home;
