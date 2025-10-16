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
// This serves your frontend's 'dist' folder from the '/booking' path
app.use("/booking", express.static(path.join(__dirname, "../dist")));


// =============================
// 🔑 Replace with your live credentials
// =============================
const KEY = process.env.EASEBUZZ_MERCHANT_KEY;    // <-- Your Easebuzz Production Key
const SALT = process.env.EASEBUZZ_SALT;   // <-- Your Easebuzz Production Salt


// =============================
// 🌐 Production API endpoint
// =============================
const EASEBUZZ_API = "https://pay.easebuzz.in/payment/initiateLink";

// =============================
// Initiate Payment Route
// =============================
// ✅ MODIFIED: The route is now prefixed with /booking
app.post("/booking/initiate-payment", async (req, res) => {
  try {
    const { txnid, amount, firstname, email, phone, productinfo } = req.body;

    if (!txnid || !amount || !firstname || !email || !phone || !productinfo) {
      return res.status(400).json({ status: 0, msg: "Missing required parameters" });
    }

    const formattedAmount = parseFloat(amount).toFixed(2);
    const hashString = `${KEY}|${txnid}|${formattedAmount}|${productinfo}|${firstname}|${email}|||||||||||${SALT}`;
    const hash = crypto.createHash("sha512").update(hashString).digest("hex");

    const payload = {
      key: KEY,
      txnid,
      amount: formattedAmount,
      productinfo,
      firstname,
      email,
      phone,
      // ⚠️ IMPORTANT: Update FRONTEND_URL in your .env for production
      surl: `${process.env.FRONTEND_URL}/paymentsuccess`, 
      furl: `${process.env.FRONTEND_URL}/paymentfailure`,
      hash,
    };
    
    console.log("Payload being sent to Easebuzz:", payload);

    const response = await axios.post(EASEBUZZ_API, qs.stringify(payload), {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    console.log("Easebuzz API Response:", response.data);

    if (response.data && response.data.status === 1 && response.data.data) {
      res.json({
        status: 1,
        data: response.data.data,
      });
    } else {
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
// This now correctly serves your app for any sub-route of /booking
app.get("/booking/*", (req, res) => {
  res.sendFile(path.resolve(__dirname, "../dist", "index.html"));
});

// Add a root redirect for convenience
app.get("/", (req, res) => {
    res.redirect('/booking');
});


// ---- Start Server ----
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Backend Server running on http://localhost:${PORT}`);
});