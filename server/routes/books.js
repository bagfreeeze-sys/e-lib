import express from "express";
import multer from "multer";
import * as XLSX from "xlsx";
import { body, validationResult } from "express-validator";
import Book from "../models/Book.js";
import { protect, admin } from "../middleware/auth.js";

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

const normalizeAccNo = (accNo = "") =>
  accNo
    .toString()
    .replace(/[^0-9A-Za-z]/g, "")
    .toUpperCase();

const DELETE_AFTER_MS = 30 * 24 * 60 * 60 * 1000;
const bookDeletionTimers = new Map();

const bookValidation = [
  body("title").trim().notEmpty().withMessage("Title is required"),
  body("author").trim().notEmpty().withMessage("Author is required"),
  body("accNo").trim().notEmpty().withMessage("Accession number is required"),
  body("publisher").trim().notEmpty().withMessage("Publisher is required"),
  body("year")
    .isInt({ min: 1000, max: 9999 })
    .withMessage("Year is required and must be valid"),
  body("quantity").isInt({ min: 1 }).withMessage("Quantity must be at least 1"),
];

const schedulePermanentDeletion = (bookId) => {
  if (bookDeletionTimers.has(bookId)) return;

  const timer = setTimeout(async () => {
    try {
      await Book.deleteOne({ _id: bookId, deletedAt: { $ne: null } });
    } catch (error) {
      console.error(
        "Failed to permanently delete book after grace period:",
        error,
      );
    } finally {
      bookDeletionTimers.delete(bookId);
    }
  }, DELETE_AFTER_MS);

  bookDeletionTimers.set(bookId, timer);
};

const cancelPermanentDeletion = (bookId) => {
  const timer = bookDeletionTimers.get(bookId);
  if (timer) {
    clearTimeout(timer);
    bookDeletionTimers.delete(bookId);
  }
};

router.get("/", async (req, res) => {
  try {
    const { search } = req.query;
    const query = { deletedAt: null };

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { author: { $regex: search, $options: "i" } },
        { accNo: { $regex: search, $options: "i" } },
        { publisher: { $regex: search, $options: "i" } },
      ];
    }
    const books = await Book.find(query).sort({ createdAt: -1 });
    return res.json(books);
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

router.get("/trash", protect, admin, async (_req, res) => {
  try {
    const books = await Book.find({ deletedAt: { $ne: null } }).sort({
      deletedAt: -1,
    });
    return res.json(books);
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

router.get("/categories/list", async (_req, res) => {
  try {
    const categories = await Book.distinct("category");
    return res.json(categories);
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: "Book not found" });
    return res.json(book);
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

router.post("/", protect, admin, bookValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ message: errors.array()[0].msg });

  try {
    const {
      title,
      author,
      accNo,
      publisher,
      year,
      quantity,
      description,
      coverImage,
    } = req.body;
    const accNoNormalized = normalizeAccNo(accNo);
    const exists = await Book.findOne({ accNoNormalized, deletedAt: null });
    if (exists)
      return res
        .status(400)
        .json({ message: "A book with this accession number already exists" });

    const book = await Book.create({
      title,
      author,
      accNo,
      accNoNormalized,
      publisher,
      year,
      quantity,
      available: quantity,
      description: description || "",
      coverImage: coverImage || "",
    });
    return res.status(201).json(book);
  } catch (error) {
    console.error("Error creating book:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

router.put("/:id", protect, admin, async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: "Book not found" });

    const payload = { ...req.body };
    if (payload.accNo) {
      payload.accNoNormalized = normalizeAccNo(payload.accNo);
      const dupe = await Book.findOne({
        accNoNormalized: payload.accNoNormalized,
        _id: { $ne: book._id },
        deletedAt: null,
      });
      if (dupe)
        return res
          .status(400)
          .json({ message: "Another book already uses this accession number" });
    }

    const nextQuantity = Number(payload.quantity ?? book.quantity);
    const quantityDiff = nextQuantity - book.quantity;
    const nextAvailable = Math.max(0, book.available + quantityDiff);

    book.title = payload.title ?? book.title;
    book.author = payload.author ?? book.author;
    book.accNo = payload.accNo ?? book.accNo;
    book.accNoNormalized = payload.accNoNormalized ?? book.accNoNormalized;
    book.publisher = payload.publisher ?? book.publisher;
    book.year = payload.year ?? book.year;
    book.quantity = nextQuantity;
    book.available = nextAvailable;
    book.description = payload.description ?? book.description;
    book.coverImage = payload.coverImage ?? book.coverImage;

    const updated = await book.save();
    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

router.put("/:id/recover", protect, admin, async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: "Book not found" });
    if (!book.deletedAt) {
      return res.status(400).json({ message: "Book is already active" });
    }

    book.deletedAt = null;
    await book.save();
    cancelPermanentDeletion(req.params.id);
    return res.json({ message: "Book recovered successfully", book });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

router.put("/recover-all", protect, admin, async (_req, res) => {
  try {
    await Book.updateMany(
      { deletedAt: { $ne: null } },
      { $set: { deletedAt: null } },
    );
    return res.json({ message: "All deleted books recovered successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

router.delete("/:id", protect, admin, async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: "Book not found" });

    book.deletedAt = new Date();
    await book.save();
    schedulePermanentDeletion(book._id.toString());

    return res.json({
      message:
        "Book moved to trash bin. It will be permanently deleted after 30 days.",
      book,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

router.delete("/:id/permanent", protect, admin, async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: "Book not found" });

    await Book.deleteOne({ _id: book._id });
    cancelPermanentDeletion(req.params.id);
    return res.json({ message: "Book deleted permanently" });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

router.delete("/trash", protect, admin, async (_req, res) => {
  try {
    const deletedBooks = await Book.find({ deletedAt: { $ne: null } });
    for (const book of deletedBooks) {
      cancelPermanentDeletion(book._id.toString());
    }
    await Book.deleteMany({ deletedAt: { $ne: null } });
    return res.json({ message: "All deleted books were removed permanently" });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

router.post(
  "/import-excel",
  protect,
  admin,
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file)
        return res.status(400).json({ message: "Excel file is required" });
      const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

      let importedCount = 0;
      let updatedCount = 0;
      let skippedCount = 0;
      const errors = [];

      for (let i = 0; i < rows.length; i += 1) {
        const row = rows[i];
        const title = String(row.title || "").trim();
        const author = String(row.author || "").trim();
        const accNo = String(row.accNo || "").trim();
        const publisher = String(row.publisher || "").trim();
        const year = Number(row.year || 0);
        const quantity = Number(row.quantity || 0);
        const description = String(row.description || "").trim();
        const coverImage = String(row.coverImage || "").trim();

        if (
          !title ||
          !author ||
          !accNo ||
          !publisher ||
          Number.isNaN(year) ||
          year < 1000 ||
          year > 9999 ||
          Number.isNaN(quantity) ||
          quantity < 1
        ) {
          skippedCount += 1;
          errors.push(`Row ${i + 2}: missing/invalid required fields`);
          continue;
        }

        const accNoNormalized = normalizeAccNo(accNo);
        const existing = await Book.findOne({ accNoNormalized });

        if (existing) {
          existing.title = title;
          existing.author = author;
          existing.publisher = publisher;
          existing.year = year;
          existing.accNo = accNo;
          existing.quantity = quantity;
          existing.available = Math.max(existing.available, quantity);
          existing.description = description;
          existing.coverImage = coverImage;
          await existing.save();
          updatedCount += 1;
        } else {
          await Book.create({
            title,
            author,
            accNo,
            accNoNormalized,
            publisher,
            year,
            quantity,
            available: quantity,
            description,
            coverImage,
          });
          importedCount += 1;
        }
      }

      return res.json({
        importedCount,
        updatedCount,
        skippedCount,
        errors: errors.slice(0, 20),
      });
    } catch (error) {
      return res.status(500).json({ message: "Failed to import Excel file" });
    }
  },
);

export default router;
