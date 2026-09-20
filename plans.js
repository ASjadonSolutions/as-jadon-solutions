// Server-side source of truth for plan pricing.
// The amount actually charged is ALWAYS computed here, never trusted from the client,
// so a tampered request from the browser can't change what gets billed.

const GST_RATE = 0.18;

const PLANS = {
  Starter: { name: 'Starter', usdDisplay: 36, inrBase: 2999 },
  Pro: { name: 'Pro', usdDisplay: 72, inrBase: 5999 },
  'Pro Max': { name: 'Pro Max', usdDisplay: 120, inrBase: 9999 },
};

function getPlanPricing(planId) {
  const plan = PLANS[planId];
  if (!plan) return null;

  const gstAmount = Math.round(plan.inrBase * GST_RATE * 100) / 100; // e.g. 539.82
  const totalInr = Math.round((plan.inrBase + gstAmount) * 100) / 100; // e.g. 3538.82
  const amountInPaise = Math.round(totalInr * 100); // smallest currency unit for Razorpay

  return {
    ...plan,
    gstRate: GST_RATE,
    gstAmount,
    totalInr,
    amountInPaise,
  };
}

module.exports = { PLANS, getPlanPricing, GST_RATE };
