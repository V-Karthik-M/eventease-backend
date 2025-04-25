import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();
const router = express.Router();

// ✅ Helper: Send Reset Email
const sendResetEmail = async (email, token) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Reset Your Password",
      html: `<p>Click <a href="http://localhost:5173/resetpassword/${token}">here</a> to reset your password.</p>`,
    };

    await transporter.sendMail(mailOptions);
    console.log("📧 Reset email sent to:", email);
  } catch (error) {
    console.error("❌ Email error:", error);
    throw new Error("Failed to send reset email");
  }
};

// ✅ Register
router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || name.length < 3)
    return res.status(400).json({ message: "Name must be at least 3 characters long." });

  if (!email.includes("@") || !email.includes("."))
    return res.status(400).json({ message: "Invalid email format." });

  if (!password || password.length < 8 || !/[A-Z]/.test(password))
    return res.status(400).json({
      message: "Password must be at least 8 characters long and contain one uppercase letter.",
    });

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "Email is already in use." });

    const user = new User({ name, email, password });
    await user.save();

    console.log("✅ Registered:", user.email);
    res.status(201).json({ message: "Registration successful!", user });
  } catch (error) {
    console.error("❌ Registration error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});

// ✅ Login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  console.log("🔐 Login attempt:", email);

  if (!email || !password)
    return res.status(400).json({ message: "Email and password are required." });

  try {
    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ message: "Invalid credentials." });

    const isPasswordValid = await user.matchPassword(password);
    if (!isPasswordValid)
      return res.status(400).json({ message: "Invalid credentials." });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "60d",
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Lax",
      maxAge: 1000 * 60 * 60 * 24 * 60, // 60 days
    });

    res.json({
      message: "Login successful!",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        image: user.image || null,
      },
    });
  } catch (error) {
    console.error("❌ Login error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});

// ✅ Logout
router.post("/logout", (req, res) => {
  res.clearCookie("token");
  res.json({ message: "Logged out successfully!" });
});

// ✅ Forgot Password
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ message: "No account with that email found." });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "15m",
    });

    await sendResetEmail(email, token);
    res.json({ message: "Password reset link sent!" });
  } catch (error) {
    console.error("❌ Forgot Password error:", error);
    res.status(500).json({ message: "Failed to send reset email." });
  }
});

// ✅ Reset Password
router.post("/reset-password/:token", async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user)
      return res.status(400).json({ message: "Invalid token or user not found." });

    if (!password || password.length < 8 || !/[A-Z]/.test(password))
      return res.status(400).json({
        message: "Password must be at least 8 characters with one uppercase letter.",
      });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    await user.save();

    res.json({ message: "✅ Password reset successful!" });
  } catch (error) {
    console.error("❌ Reset Password Error:", error);
    res.status(400).json({ message: "Invalid or expired token." });
  }
});

export default router;
