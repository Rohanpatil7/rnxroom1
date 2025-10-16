// ---- Imports ----
const express = require("express");
const path = require("path");
const fetch = require("node-fetch");
const cors = require("cors");
const bodyParser = require("body-parser");
const crypto = require("crypto");
const axios = require("axios");
const qs = require("qs");

require('dotenv').config();

// ---- App Initialization ----
const app = express();
app.use(cors());
app.use(express.json());

// ---- Serve React Build Files ----
app.use(express.static(path.join(__dirname, "dist")));


// =============================
// 🔑 Replace with your live credentials
// =============================
const KEY = process.env.EASEBUZZ_MERCHANT_KEY;    // <-- Your Easebuzz Production Key
const SALT = process.env.EASEBUZZ_SALT;   // <-- Your Easebuzz Production Salt


// =============================
// 🌐 Production API endpoint
// Use https://testpay.easebuzz.in/payment/initiateLink for TEST mode
// =============================
const EASEBUZZ_API = "https://pay.easebuzz.in/payment/initiateLink";

// =============================
// Initiate Payment Route
// =============================
app.post("/initiate-payment", async (req, res) => {
  try {
    const { txnid, amount, firstname, email, phone, productinfo } = req.body;

    if (!txnid || !amount || !firstname || !email || !phone || !productinfo) {
      return res.status(400).json({ status: 0, msg: "Missing required parameters" });
    }

    // Step 1️⃣ Format amount with 2 decimals
    const formattedAmount = parseFloat(amount).toFixed(2);

    // Step 2️⃣ Build hash string EXACTLY per Easebuzz documentation
    const hashString = `${KEY}|${txnid}|${formattedAmount}|${productinfo}|${firstname}|${email}|||||||||||${SALT}`;
    const hash = crypto.createHash("sha512").update(hashString).digest("hex");

    // Step 3️⃣ Prepare payload for Easebuzz API
    const payload = {
      key: KEY,
      txnid,
      amount: formattedAmount,
      productinfo,
      firstname,
      email,
      phone,
      // ⚠️ These URLs must be valid HTTPS (not localhost)
      surl: `${process.env.FRONTEND_URL}/paymentsuccess`, // Success redirect URL
      furl: `${process.env.FRONTEND_URL}/paymentfailure`, // Failure redirect URL
      hash,
    };

    // =============================
    // 🪵 Log debug data for Easebuzz support
    // =============================
    console.log("\n=== EASEBUZZ DEBUG PAYLOAD ===");
    console.log("POST URL:", EASEBUZZ_API);
    console.log("Payload being sent:", payload);
    console.log("Hash String:", hashString);
    console.log("Generated Hash:", hash);
    console.log("==============================\n");

    // Step 4️⃣ Send request to Easebuzz API
    const response = await axios.post(EASEBUZZ_API, qs.stringify(payload), {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    console.log("Easebuzz API Response:", response.data);

    // Step 5️⃣ Return access_key to frontend
    if (response.data && response.data.status === 1 && response.data.data) {
      res.json({
        status: 1,
        data: response.data.data, // this is the access_key
      });
    } else {
      console.error("Easebuzz returned invalid response:", response.data);
      res.status(400).json({
        status: 0,
        msg: "Easebuzz returned invalid response",
        response: response.data,
      });
    }
  } catch (err) {
    console.error("Easebuzz API call failed:", err.message);
    res.status(500).json({
      status: 0,
      msg: "Server error while calling Easebuzz API",
      error: err.message,
    });
  }
});


// ---- React Router Fallback ----
app.get(/.*/, (req, res) => {
  res.sendFile(path.resolve(__dirname, "dist", "index.html"));
});

// ---- Start Server ----
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Backend Server running on http://localhost:${PORT}`);
});
