import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import BorrowRequest from "../models/BorrowRequest.js";
import { protect, admin } from "../middleware/auth.js";

const router = express.Router();

// Generate JWT
const generateToken = (id) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role: role || "student",
    });

    if (user) {
      res.status(201).json({
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check for user email
    const user = await User.findOne({ email }).select("+password");

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// @desc    Update current user's email
// @route   PUT /api/auth/me/email
// @access  Private
router.put("/me/email", protect, async (req, res) => {
  try {
    const { email, currentPassword } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Please provide a new email" });
    }

    if (!currentPassword) {
      return res
        .status(400)
        .json({ message: "Please confirm your password to change the email" });
    }

    const user = await User.findById(req.user._id).select("+password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: "Password is incorrect" });
    }

    const emailExists = await User.findOne({ email, _id: { $ne: user._id } });
    if (emailExists) {
      return res.status(400).json({ message: "This email is already in use" });
    }

    user.email = email;
    await user.save();

    res.json({
      message: "Email updated successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// @desc    Update current user's name
// @route   PUT /api/auth/me/name
// @access  Private
router.put("/me/name", protect, async (req, res) => {
  try {
    const { name, currentPassword } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Please provide a new name" });
    }

    if (!currentPassword) {
      return res
        .status(400)
        .json({ message: "Please confirm your password to change the name" });
    }

    const user = await User.findById(req.user._id).select("+password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: "Password is incorrect" });
    }

    user.name = name;
    await user.save();

    res.json({
      message: "Name updated successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// @desc    Update current user's password
// @route   PUT /api/auth/me/password
// @access  Private
router.put("/me/password", protect, async (req, res) => {
  try {
    const { currentPassword, password, confirmPassword } = req.body;

    if (!password || !confirmPassword) {
      return res
        .status(400)
        .json({ message: "Please provide your new password and confirmation" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }

    const user = await User.findById(req.user._id).select("+password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    user.password = password;
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
router.get("/me", protect, async (req, res) => {
  res.json(req.user);
});

// @desc    Get all users
// @route   GET /api/auth/users
// @access  Private/Admin
router.get("/users", protect, admin, async (req, res) => {
  try {
    const users = await User.find({}).select("-password");

    // Aggregate borrowing stats for each user
    const usersWithStats = await Promise.all(
      users.map(async (u) => {
        if (u.role === "admin") {
          return {
            ...u.toObject(),
            activeBorrowsCount: 0,
            overdueBorrowsCount: 0,
            pendingRequestsCount: 0,
          };
        }

        const activeBorrowsCount = await BorrowRequest.countDocuments({
          user: u._id,
          status: "approved",
          returnDate: null,
        });

        const overdueBorrowsCount = await BorrowRequest.countDocuments({
          user: u._id,
          status: "overdue",
        });

        const pendingRequestsCount = await BorrowRequest.countDocuments({
          user: u._id,
          status: "pending",
        });

        return {
          ...u.toObject(),
          activeBorrowsCount,
          overdueBorrowsCount,
          pendingRequestsCount,
        };
      }),
    );

    res.json(usersWithStats);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// @desc    Update user status
// @route   PUT /api/auth/users/:id/status
// @access  Private/Admin
router.put("/users/:id/status", protect, admin, async (req, res) => {
  try {
    const { status, blockReason } = req.body;
    const user = await User.findById(req.params.id);

    if (user) {
      user.status = status;
      user.blockReason = blockReason || null;
      const updatedUser = await user.save();
      res.json({
        _id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        status: updatedUser.status,
        blockReason: updatedUser.blockReason,
      });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// @desc    Delete user
// @route   DELETE /api/auth/users/:id
// @access  Private/Admin
router.delete("/users/:id", protect, admin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (user) {
      await User.deleteOne({ _id: user._id });
      res.json({ message: "User removed" });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
