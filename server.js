const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const admin = require("firebase-admin");

// Serverinstellingen
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Firebase configureren via base64 JSON
if (!process.env.FIREBASE_CONFIG_JSON) {
  console.error("❌ Omgevingsvariabele FIREBASE_CONFIG_JSON ontbreekt.");
  process.exit(1);
}

const serviceAccount = JSON.parse(
  Buffer.from(process.env.FIREBASE_CONFIG_JSON, "base64").toString("utf-8")
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Optionele API-key beveiliging
const API_KEY = process.env.API_KEY;
app.use("/send", (req, res, next) => {
  if (API_KEY && req.headers["x-api-key"] !== API_KEY) {
    return res.status(401).json({ error: "Ongeldige API key." });
  }
  next();
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
      error: "Verzoek moet 'title', 'body' en 'tokens' (array) bevatten."
    });
  }

  const message = {
    notification: { title, body },
    tokens: tokens
  };

  try {
    const response = await admin.messaging().sendMulticast(message);
    console.log(`📤 Pushmelding verzonden naar ${tokens.length} tokens (${response.successCount} successen, ${response.failureCount} mislukt)`);

    res.json({
      success: true,
      successCount: response.successCount,
      failureCount: response.failureCount,
      responses: response.responses
    });
  } catch (error) {
    console.error("❌ Fout bij verzenden pushmelding:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Server starten
app.listen(PORT, () => {
  console.log(`✅ Pushserver draait op poort ${PORT}`);
});
