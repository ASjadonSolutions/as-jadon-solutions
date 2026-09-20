-- Minimum required table for saving Razorpay payments.
-- Safe to run on your existing database: uses IF NOT EXISTS, does not touch
-- or delete any existing tables/data. If you already have a payments table
-- with equivalent columns, tell me its name/columns and this migration can
-- be skipped — the backend will insert into that one instead.

CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  plan_name VARCHAR(50) NOT NULL,
  base_amount_inr NUMERIC(10, 2) NOT NULL,
  gst_amount_inr NUMERIC(10, 2) NOT NULL,
  total_amount_inr NUMERIC(10, 2) NOT NULL,
  amount_paise INTEGER NOT NULL,
  razorpay_order_id VARCHAR(100) NOT NULL,
  razorpay_payment_id VARCHAR(100),
  razorpay_signature VARCHAR(255),
  status VARCHAR(20) NOT NULL DEFAULT 'created', -- created | paid | failed
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments (razorpay_order_id);
