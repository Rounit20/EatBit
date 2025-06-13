import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { useNavigate } from "react-router-dom";
import "../styles/UserData.css";
import { FaUserCircle } from "react-icons/fa"; // ✅ Default user icon

const UserData = () => {
  const [user, loading] = useAuthState(auth);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    gender: "",
    mobile: "",
    email: "",
    rollNo: "",
    hostelNo: "",
    address: "",
  });

  useEffect(() => {
    if (!user && !loading) {
      navigate("/login");
      return;
    }
    if (user) fetchUserData(user.uid);
  }, [user, loading, navigate]);

  const fetchUserData = async (userId) => {
    try {
      const docRef = doc(db, "users", userId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setFormData(docSnap.data());
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;

    try {
      await setDoc(doc(db, "users", user.uid), formData, { merge: true });
      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Error saving data:", error);
    }
  };

  if (loading) return <p className="loading-text">Loading...</p>;

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="profile-pic-container">
          <FaUserCircle className="default-profile-icon" /> {/* ✅ Default User Icon */}
        </div>
        <div className="profile-info">
          <h2>{formData.name || "Your Name"}</h2>
          <p>{user?.email || "yourname@gmail.com"}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="profile-form">
        <label>Name:</label>
        <input type="text" name="name" value={formData.name} onChange={handleChange} required />

        <label>Gender:</label>
        <input type="text" name="gender" value={formData.gender} onChange={handleChange} required />

        <label>Mobile No.:</label>
        <input type="text" name="mobile" value={formData.mobile} onChange={handleChange} required />

        <label>Email:</label>
        <input type="email" name="email" value={user?.email || ""} readOnly />

        <label>Roll No.:</label>
        <input type="text" name="rollNo" value={formData.rollNo} onChange={handleChange} required />

        <label>Hostel No.:</label>
        <input type="text" name="hostelNo" value={formData.hostelNo} onChange={handleChange} required />

        <label>Address:</label>
        <textarea name="address" value={formData.address} onChange={handleChange} required></textarea>

        <button type="submit" className="save-btn">Save</button>
      </form>
    </div>
  );
};

export default UserData;
