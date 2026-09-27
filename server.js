const express = require("express");
const cors = require("cors");

const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

const serviceAccount = require("./serviceAccountKey.json");

// Initialize Firebase
initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

// Initialize Express
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve frontend files from public folder
app.use(express.static("public"));

// Search API
app.get("/api/search", async (req, res) => {
  try {

    const query = (req.query.q || "").toLowerCase().trim();

    const type = (req.query.type || "ALL").toUpperCase();

    // Get all content from Firestore
    const snapshot = await db.collection("content").get();

    let results = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Search
    if (query) {

      results = results.filter(item => {

        const text = JSON.stringify(item).toLowerCase();

        return text.includes(query);

      });

    }

    // Filter by content type
    if (type !== "ALL") {

      results = results.filter(item =>
        item.contentType?.toUpperCase() === type
      );

    }

    // Send results
    res.json({
      total: results.length,
      results
    });

  } catch (error) {

    console.error("Search error:", error);

    res.status(500).json({
      error: "Search failed"
    });

  }
});

// Start server
app.listen(3000, () => {

  console.log(
    "Search API running on http://localhost:3000"
  );

});