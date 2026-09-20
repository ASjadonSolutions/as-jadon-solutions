require('dotenv').config();
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const pool = require('./db');
const razorpay = require('./razorpayClient');
const { getPlanPricing } = require('./plans');

const app = express();
app.use(cors());
app.use(express.json());

// 1) Create a Razorpay order for the selected plan.
// Amount is computed server-side from plans.js — the client only sends the plan name.
app.post('/api/payment/create-order', async (req, res) => {
  try {
    const { planId } = req.body;
    const pricing = getPlanPricing(planId);
    if (!pricing) {
      return res.status(400).json({ error: 'Invalid plan selected' });
    }

    const order = await razorpay.orders.create({
      amount: pricing.amountInPaise, // smallest currency unit (paise)
      currency: 'INR',
      receipt: `plan_${planId}_${Date.now()}`,
      notes: { plan: planId },
    });

    await pool.query(
      `INSERT INTO payments
        (plan_name, base_amount_inr, gst_amount_inr, total_amount_inr, amount_paise, razorpay_order_id, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'created')`,
      [planId, pricing.inrBase, pricing.gstAmount, pricing.totalInr, pricing.amountInPaise, order.id]
    );

    res.json({
      orderId: order.id,
      amount: pricing.amountInPaise,
      currency: 'INR',
      keyId: process.env.RAZORPAY_KEY_ID, // public key only — safe to expose
      pricing: {
        base: pricing.inrBase,
        gst: pricing.gstAmount,
        total: pricing.totalInr,
      },
    });
  } catch (err) {
    console.error('create-order error:', err);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// 2) Verify payment signature after Razorpay checkout completes, then save result.
app.post('/api/payment/verify', async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    const isValid = expectedSignature === razorpay_signature;

    await pool.query(
      `UPDATE payments
       SET razorpay_payment_id = $1,
           razorpay_signature = $2,
           status = $3,
           updated_at = NOW()
       WHERE razorpay_order_id = $4`,
      [razorpay_payment_id, razorpay_signature, isValid ? 'paid' : 'failed', razorpay_order_id]
    );

    if (!isValid) {
      return res.status(400).json({ success: false, error: 'Signature verification failed' });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('verify error:', err);
    res.status(500).json({ success: false, error: 'Verification failed' });
  }
});

// 3) Mark an order failed/cancelled (called if the Razorpay popup is dismissed or errors out).
app.post('/api/payment/mark-failed', async (req, res) => {
  try {
    const { razorpay_order_id } = req.body;
    await pool.query(
      `UPDATE payments SET status = 'failed', updated_at = NOW() WHERE razorpay_order_id = $1`,
      [razorpay_order_id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('mark-failed error:', err);
    res.status(500).json({ success: false });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Payment server running on port ${PORT}`));
