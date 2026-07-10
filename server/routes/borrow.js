import express from "express";
import BorrowRequest from "../models/BorrowRequest.js";
import Book from "../models/Book.js";
import User from "../models/User.js";
import { protect, admin } from "../middleware/auth.js";

const router = express.Router();

const generateTicketNumber = () => {
  const stamp = Date.now().toString().slice(-6);
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `TKT-${stamp}-${suffix}`;
};

const syncOverdueRequests = async (userId = null) => {
  const now = new Date();
  const query = {
    status: "approved",
    returnDate: null,
    dueDate: { $lt: now },
  };

  if (userId) {
    query.user = userId;
  }

  const overdueRequests = await BorrowRequest.find(query);

  for (const request of overdueRequests) {
    request.status = "overdue";
    await request.save();
  }

  return overdueRequests;
};

// @desc    Create a borrow request
// @route   POST /api/borrow
// @access  Private
router.post("/", protect, async (req, res) => {
  try {
    const { bookId, dueDate } = req.body;

    await syncOverdueRequests(req.user._id);

    // Check if user is blocked
    if (req.user.status === "blocked") {
      return res.status(403).json({
        message: "Your account is blocked. Please contact administrator.",
      });
    }

    // Check if book exists and is available
    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    if (book.available <= 0) {
      return res
        .status(400)
        .json({ message: "Book is not available for borrowing" });
    }

    const unresolvedBorrow = await BorrowRequest.findOne({
      user: req.user._id,
      returnDate: null,
      status: { $in: ["approved", "overdue"] },
    });

    if (unresolvedBorrow) {
      return res.status(400).json({
        message:
          "You still have an active or overdue borrowed book. Return it before requesting another.",
      });
    }

    const existingRequest = await BorrowRequest.findOne({
      user: req.user._id,
      book: bookId,
      status: { $in: ["pending", "approved", "overdue"] },
    });

    if (existingRequest) {
      return res.status(400).json({
        message: "You already have an active request for this book",
      });
    }

    const borrowRequest = await BorrowRequest.create({
      user: req.user._id,
      book: bookId,
      dueDate: new Date(dueDate),
      ticketNumber: generateTicketNumber(),
    });

    const populatedRequest = await BorrowRequest.findById(
      borrowRequest._id,
    ).populate("book", "title author isbn");

    const io = req.app.get("io");
    io?.to("admins").emit("newBorrowRequest", populatedRequest.toObject());

    res.status(201).json({
      ...populatedRequest.toObject(),
      message: "Borrow request created successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// @desc    Get user's borrow requests
// @route   GET /api/borrow/my-requests
// @access  Private
router.get("/my-requests", protect, async (req, res) => {
  try {
    await syncOverdueRequests(req.user._id);

    const requests = await BorrowRequest.find({ user: req.user._id })
      .populate("book", "title author isbn category coverImage")
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// @desc    Get all borrow requests (admin)
// @route   GET /api/borrow/all
// @access  Private/Admin
router.get("/all", protect, admin, async (req, res) => {
  try {
    await syncOverdueRequests();

    const { status } = req.query;
    let query = {};

    if (status) {
      query.status = status;
    }

    const requests = await BorrowRequest.find(query)
      .populate("user", "name email")
      .populate("book", "title author isbn")
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// @desc    Update borrow request status (admin)
// @route   PUT /api/borrow/:id/status
// @access  Private/Admin
router.put("/:id/status", protect, admin, async (req, res) => {
  try {
    const { status } = req.body;
    const borrowRequest = await BorrowRequest.findById(req.params.id);

    if (!borrowRequest) {
      return res.status(404).json({ message: "Borrow request not found" });
    }

    const previousStatus = borrowRequest.status;
    const book = await Book.findById(borrowRequest.book);

    if (status === "approved" && previousStatus !== "approved") {
      if (book) {
        if (book.available > 0) {
          book.available -= 1;
          await book.save();
        }
      }
    }

    if (["rejected", "returned", "cancelled"].includes(status)) {
      if (book && ["approved", "overdue"].includes(previousStatus)) {
        book.available += 1;
        await book.save();
      }
    }

    if (status === "returned") {
      borrowRequest.returnDate = new Date();
      // Auto-unblock user if blocked for overdue books and now has none
      const user = await User.findById(borrowRequest.user);
      if (
        user &&
        user.status === "blocked" &&
        user.blockReason === "Overdue book return"
      ) {
        const otherOverdue = await BorrowRequest.countDocuments({
          user: user._id,
          _id: { $ne: borrowRequest._id },
          status: "overdue",
        });
        if (otherOverdue === 0) {
          user.status = "active";
          user.blockReason = null;
          await user.save();
        }
      }
    }

    if (status === "overdue") {
      const user = await User.findById(borrowRequest.user);
      if (user) {
        const overdueCount = await BorrowRequest.countDocuments({
          user: user._id,
          status: "overdue",
        });

        if (overdueCount >= 1) {
          user.status = "blocked";
          user.blockReason = "Overdue book return";
          await user.save();
        }
      }
    }

    borrowRequest.status = status;
    await borrowRequest.save();

    const populatedRequest = await BorrowRequest.findById(borrowRequest._id)
      .populate("user", "name email")
      .populate("book", "title author isbn");

    const io = req.app.get("io");
    io?.to(`user-${borrowRequest.user}`).emit(
      "borrowRequestUpdated",
      populatedRequest.toObject(),
    );

    res.json({
      ...populatedRequest.toObject(),
      message: `Borrow request marked as ${status}`,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// @desc    Cancel a pending borrow request
// @route   PUT /api/borrow/:id/cancel
// @access  Private
router.put("/:id/cancel", protect, async (req, res) => {
  try {
    const borrowRequest = await BorrowRequest.findById(req.params.id);

    if (!borrowRequest) {
      return res.status(404).json({ message: "Borrow request not found" });
    }

    if (borrowRequest.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (borrowRequest.status !== "pending") {
      return res
        .status(400)
        .json({ message: "Only pending requests can be cancelled" });
    }

    borrowRequest.status = "cancelled";
    await borrowRequest.save();

    const populatedRequest = await BorrowRequest.findById(borrowRequest._id)
      .populate("user", "name email")
      .populate("book", "title author isbn");

    const io = req.app.get("io");
    io?.to(`user-${borrowRequest.user}`).emit(
      "borrowRequestUpdated",
      populatedRequest.toObject(),
    );

    res.json({
      ...populatedRequest.toObject(),
      message: "Borrow request cancelled successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// @desc    Get dashboard stats (admin)
// @route   GET /api/borrow/stats
// @access  Private/Admin
router.get("/stats", protect, admin, async (req, res) => {
  try {
    const totalBooks = await Book.countDocuments();
    const totalStudents = await User.countDocuments({ role: "student" });
    const totalBorrowed = await BorrowRequest.countDocuments({
      status: { $in: ["approved", "pending"] },
    });
    const overdueBooks = await BorrowRequest.countDocuments({
      status: "overdue",
    });
    const pendingRequests = await BorrowRequest.countDocuments({
      status: "pending",
    });

    res.json({
      totalBooks,
      totalStudents,
      totalBorrowed,
      overdueBooks,
      pendingRequests,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
