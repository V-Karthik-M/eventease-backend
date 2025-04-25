import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// ✅ Helper to send reset password email
const sendResetEmail = async (email, token) => {
  const frontendURL = process.env.CLIENT_ORIGIN || "http://localhost:5173";
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
    html: `<p>Click <a href="${frontendURL}/resetpassword/${token}">here</a> to reset your password.</p>`,
  };

  await transporter.sendMail(mailOptions);
  console.log(`📧 Reset email sent to: ${email}`);
};

// ✅ Register User
export const registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || name.length < 3)
    return res.status(400).json({ message: "Name must be at least 3 characters." });

  if (!email.includes("@") || !email.includes("."))
    return res.status(400).json({ message: "Invalid email format." });

  if (!password || password.length < 8 || !/[A-Z]/.test(password))
    return res.status(400).json({
      message: "Password must be at least 8 characters and contain an uppercase letter.",
    });

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "Email is already registered." });

    const user = new User({ name, email, password });
    await user.save();

    console.log(`✅ User Registered: ${email}`);
    res.status(201).json({ message: "Registration successful!", user });
  } catch (error) {
    console.error("❌ Registration Error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

// ✅ Login User
export const loginUser = async (req, res) => {
  const { email, password } = req.body;
  console.log("🔐 Login attempt:", email);

  if (!email || !password)
    return res.status(400).json({ message: "Email and password are required." });

  try {
    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ message: "Invalid email or password." });

    const isMatch = await user.matchPassword(password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid email or password." });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "60d",
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Lax",
      maxAge: 1000 * 60 * 60 * 24 * 60, // 60 days
    });

    res.status(200).json({
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
    console.error("❌ Login Error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

// ✅ Logout User
export const logoutUser = (req, res) => {
  res.clearCookie("token");
  res.status(200).json({ message: "Logout successful!" });
};

// ✅ Forgot Password
export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ message: "No user found with that email." });

    const resetToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "15m",
    });

    await sendResetEmail(email, resetToken);
    res.status(200).json({ message: "Password reset link sent to your email!" });
  } catch (error) {
    console.error("❌ Forgot Password Error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

// ✅ Reset Password
export const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user)
      return res.status(400).json({ message: "Invalid token or user not found." });

    if (!password || password.length < 8 || !/[A-Z]/.test(password))
      return res.status(400).json({
        message: "Password must be at least 8 characters and contain an uppercase letter.",
      });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    await user.save();

    res.status(200).json({ message: "Password reset successful!" });
  } catch (error) {
    console.error("❌ Reset Password Error:", error);
    res.status(400).json({ message: "Invalid or expired reset token." });
  }
};
