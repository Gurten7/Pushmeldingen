const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const admin = require("firebase-admin");

// Service-account ophalen uit secret (base64 → JSON)
const serviceAccount = JSON.parse(Buffer.from(process.env.FIREBASE_CONFIG_JSON, "base64").toString());

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.post("/send", async (req, res) => {
  const { title, body, tokens } = req.body;
  if (!title || !body || !tokens || !Array.isArray(tokens)) {
    return res.status(400).send("Verwacht: title, body, tokens[]");
  }

  const message = {
    notification: { title, body },
    tokens: tokens,
  };

  try {
    const response = await admin.messaging().sendMulticast(message);
    console.log("Meldingen verzonden:", response.successCount);
    res.status(200).send({ success: true, response });
  } catch (error) {
    console.error("Fout bij verzenden:", error);
    res.status(500).send({ success: false, error });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Pushserver actief op poort " + PORT);
});
