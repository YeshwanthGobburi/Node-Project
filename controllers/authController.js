const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const moment = require("moment-timezone");
const User = require("../models/User");
const { sendMail } = require("../helpers/mailer");
const { toIST } = require("../helpers/timeZone");

const missingFields = [];
// Register
// Register with email
const register = async (req, res) => {
  try {
    const { username, password, email, role } = req.body;

    // Check for required fields
    if (!username) missingFields.push("username");
    if (!password) missingFields.push("password");
    if (!email) missingFields.push("email");
    if (!role) missingFields.push("role");

    if (missingFields.length > 0) {
      return res.status(400).json({
        error: `Missing required fields: ${missingFields.join(", ")}`,
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(409).json({ error: "User already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create and save new user
    const newUser = new User({
      username,
      password: hashedPassword,
      email, // Add email here
      role: role || "user",
    });

    await newUser.save();
    res.status(201).json({
      message: "User registered successfully",
      registeredAt: toIST(new Date()),
    });
  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({ error: "Something went wrong" });
  }
};

// Login
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // If account is deactivated
    if (!user.isActive) {
      // Generate OTP
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      user.otp = {
        code: otpCode,
        expiresAt: toIST(new Date(Date.now() + 10 * 60 * 1000)),
      };
      await user.save();

      // Send OTP via email
      await sendMail(
        user.email,
        "Account Reactivation OTP",
        `Your OTP is: ${otpCode}`
      );

      return res.status(403).json({
        error:
          "Account is deactivated. An OTP has been sent to your email to reactivate your account.",
      });
    }

    // Normal password match
    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // JWT generation
    const token = jwt.sign(
      { userId: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "15m" }
    );

    const refreshToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_REFRESH_KEY,
      { expiresIn: "7d" }
    );

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      sameSite: "strict",
    });

    res.status(201).json({
      token,
      message: "User login successful",
      loginAt: toIST(new Date()),
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ error: "Login failed" });
  }
};

//Refresh token
const refreshToken = (req, res) => {
  const token = req.cookies.refreshToken;
  if (!token) return res.status(401).json({ error: "Refresh token missing" });

  jwt.verify(token, process.env.REFRESH_TOKEN_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ error: "Invalid refresh token" });

    const accessToken = jwt.sign(
      { userId: decoded.userId },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "15m" }
    );

    res.json({
      accessToken,
      refreshedAt: toIST(new Date()),
    });
  });
};

// Update Profile after logging in-> using JWT token
// Update Profile
const updateProfile = async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findById(req.user.userId); // userId is set via JWT middleware

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (username) user.username = username;
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      user.password = hashedPassword;
    }

    await user.save();
    res.json({
      message: "Profile updated successfully",
      updatedAt: toIST(new Date()),
    });
  } catch (error) {
    console.error("Update Profile Error:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
};

//Forgot-password
//send-otp to verify later change password
const sendOtp = async (req, res) => {
  try {
    const { username, email } = req.body;

    if (!username) missingFields.push("username");
    if (!email) missingFields.push("email");

    if (missingFields.length > 0) {
      return res.status(400).json({
        error: `Missing required fields: ${missingFields.join(", ")}`,
      });
    }

    const user = username
      ? await User.findOne({ username })
      : await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Overwrite existing OTP
    user.otp = {
      code: otpCode,
      expiresAt: toIST(new Date(Date.now() + 10 * 60 * 1000)), // 10 minutes
    };

    await user.save();

    await sendMail(user.email, "Your OTP Code", `Your OTP is: ${otpCode}`);

    res.json({
      message: "OTP sent to your email address",
      otpExpiresAt: toIST(expiresAt),
    });
  } catch (error) {
    console.error("Send OTP Error:", error);
    res.status(500).json({ error: "Failed to send OTP" });
  }
};

// Reset password with OTP
const resetPassword = async (req, res) => {
  try {
    const { username, otp, newPassword } = req.body;

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!user.otp || user.otp.code !== otp) {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    if (user.otp.expiresAt < toIST(new Date())) {
      user.otp = undefined;
      await user.save();
      return res.status(400).json({ error: "OTP has expired" });
    }

    // Save the used OTP for audit/log
    user.lastUsedOtp = {
      code: user.otp.code,
      usedAt: toIST(new Date()),
    };

    user.password = await bcrypt.hash(newPassword, 10);

    // Clear the active OTP
    user.otp = undefined;
    await user.save();

    res.status(200).json({
      message: "Password reset successful",
      resetAt: toIST(new Date()),
    });
  } catch (error) {
    console.error("Reset Password Error:", error);
    res.status(500).json({ error: "Failed to reset password" });
  }
};

//Deactive (soft) account
const deactivateAccount = async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    if (!user.isActive) {
      return res.status(400).json({ error: "Account already deactivated" });
    }

    user.isActive = false;
    user.deactivatedAt = toIST(new Date()); // Track when deactivated
    await user.save();

    res.status(200).json({
      message:
        "Account deactivated. Reactivate within 30 days to avoid permanent deletion.",
    });
  } catch (error) {
    console.error("Deactivate Error:", error);
    res.status(500).json({ error: "Failed to deactivate account" });
  }
};

//OTP for reactivation
// Send OTP for account reactivation
const sendReactivationOtp = async (req, res) => {
  try {
    const { username } = req.body;

    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: "User not found" });

    if (user.isActive) {
      return res.status(400).json({ error: "Account is already active" });
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    user.otp = {
      code: otpCode,
      expiresAt: toIST(new Date(Date.now() + 10 * 60 * 1000)), // 10 mins
    };

    await user.save();
    await sendMail(
      user.email,
      "Reactivate your account",
      `Your OTP is: ${otpCode}`
    );

    res.status(200).json({ message: "OTP sent to your email" });
  } catch (error) {
    console.error("Send Reactivation OTP Error:", error);
    res.status(500).json({ error: "Failed to send OTP" });
  }
};

//Reactive account
const reactivateWithOtp = async (req, res) => {
  try {
    const { otp } = req.body;

    if (!otp) {
      return res.status(400).json({ error: "OTP is required" });
    }

    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: "User not found" });

    if (user.isActive) {
      return res.status(400).json({ error: "Account is already active" });
    }

    if (!user.otp || user.otp.code !== otp) {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    if (user.otp.expiresAt < toIST(new Date())) {
      user.otp = undefined;
      await user.save();
      return res.status(400).json({ error: "OTP has expired" });
    }

    user.isActive = true;
    user.deactivatedAt = null;
    user.otp = undefined;
    await user.save();

    res.status(200).json({
      message: "Account reactivated successfully. You can now log in.",
    });
  } catch (error) {
    console.error("Reactivate with OTP Error:", error);
    res.status(500).json({ error: "Failed to reactivate account" });
  }
};

module.exports = {
  register,
  login,
  updateProfile,
  sendOtp,
  resetPassword,
  refreshToken,
  deactivateAccount,
  sendReactivationOtp,
  reactivateWithOtp,
};
