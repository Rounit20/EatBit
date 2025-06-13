import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// ✅ Convert ES Module __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Load service account credentials
const serviceAccountPath = path.join(__dirname, "serviceAccountKey.json");

if (!fs.existsSync(serviceAccountPath)) {
  console.error("❌ Error: serviceAccountKey.json file not found!");
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));

// ✅ Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

// ✅ Load menu data
const menuFilePath = path.join(__dirname, "menu.json");

if (!fs.existsSync(menuFilePath)) {
  console.error("❌ Error: menu.json file not found!");
  process.exit(1);
}

const menuData = JSON.parse(fs.readFileSync(menuFilePath, "utf8"));

// ✅ Extract outlet ID dynamically from JSON name field
const outletId = menuData.name.toLowerCase().replace(/\s+/g, "-"); // Example: "Down South Restaurant" → "down-south"

async function uploadData() {
  try {
    const docRef = db.collection("outlets").doc(outletId);

    console.log(`🚀 Uploading menu data for outlet: ${outletId}...`);

    // ✅ Upload data to Firestore
    await docRef.set(menuData);

    console.log("✅ Data successfully uploaded to Firestore!");
  } catch (error) {
    console.error("❌ Error uploading data:", error);
  } finally {
    process.exit(0); // ✅ Exit script after execution
  }
}

// Run the function
uploadData();
