// backend/server.js

const express = require('express');
const axios = require('axios');
const { sha512 } = require('js-sha512');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const MERCHANT_KEY = process.env.EASEBUZZ_MERCHANT_KEY;
const SALT = process.env.EASEBUZZ_SALT;
const EASEBUZZ_URL = process.env.EASEBUZZ_ENV === 'prod' 
  ? "https://pay.easebuzz.in/payment/initiateLink" 
  : "https://testpay.easebuzz.in/payment/initiateLink";

app.post('/initiate-payment', async (req, res) => {
    try {
        const { amount, firstname, email, phone, productinfo } = req.body;
        const txnid = `TXN_${Date.now()}`;

        // --- THIS IS THE CORRECTED LINE ---
        // The hash sequence must include all parameters in the correct order,
        // even if they are empty.
        const hashstring = `${MERCHANT_KEY}|${txnid}|${amount}|${productinfo}|${firstname}|${email}|||||||||||${SALT}`;
        
        const hash = sha512(hashstring);

        const payload = new URLSearchParams({
            key: MERCHANT_KEY,
            txnid,
            amount: parseFloat(amount).toFixed(2),
            productinfo,
            firstname,
            email,
            phone,
            surl: `${process.env.FRONTEND_URL}/payment-success`,
            furl: `${process.env.FRONTEND_URL}/payment-failure`,
            hash,
        });

        const response = await axios.post(EASEBUZZ_URL, payload);

        if (response.data.status === 1) {
            res.json({ access_key: response.data.data });
        } else {
            res.status(400).json({ error: response.data.error_desc || "Payment initiation failed" });
        }

    } catch (error) {
        console.error("Error initiating payment:", error.response ? error.response.data : error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend server running on port ${PORT}`));