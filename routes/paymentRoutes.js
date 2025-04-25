// routes/paymentRoutes.js

import express from "express";
import Stripe from "stripe";
import dotenv from "dotenv";

dotenv.config();
const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// ✅ Create Stripe Checkout Session
router.post("/create-checkout-session", async (req, res) => {
  const { eventId, eventName, price, quantity } = req.body;

  // 🔒 Input Validation
  if (!eventId || !eventName || price == null || quantity == null) {
    return res.status(400).json({ error: "Missing event details" });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: eventName,
            },
            unit_amount: Math.round(price * 100), // Convert to cents
          },
          quantity: Number(quantity),
        },
      ],
      success_url:
        process.env.SUCCESS_URL || "http://localhost:5173/useraccount?payment=success",
      cancel_url:
        process.env.CANCEL_URL || "http://localhost:5173/upcoming-events",
    });

    console.log("✅ Stripe session created:", session.id);
    res.status(200).json({
      message: "Stripe session created",
      id: session.id,
      url: session.url, // 🧭 Use this URL on the frontend to redirect to Stripe
    });
  } catch (error) {
    console.error("❌ Stripe Error:", error.message);
    res.status(500).json({ error: "Payment initiation failed" });
  }
});

export default router;
