const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const admin = require("firebase-admin");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Firebase config (base64-decoded from secret)
const serviceAccount = JSON.parse(
  Buffer.from(process.env.FIREBASE_CONFIG_JSON, "base64").toString("utf-8")
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Statuspagina
app.get("/", (req, res) => {
  res.send("🎯 Pushserver actief – gebruik POST /send om een melding te versturen.");
});

// Pushmelding versturen
app.post("/send", async (req, res) => {
  const { title, body, tokens } = req.body;

  if (!title || !body || !tokens || !Array.isArray(tokens)) {
    return res.status(400).json({
      error: "Verzoek moet title, body en tokens (array) bevatten."
    });
  }

  const message = {
    notification: { title, body },
    tokens: tokens
  };

  try {
    const response = await admin.messaging().sendMulticast(message);
    res.json({ success: true, response });
  } catch (error) {
    console.error("❌ Fout bij verzenden pushmelding:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Pushserver actief op poort ${PORT}`);
});
