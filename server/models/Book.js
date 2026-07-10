import mongoose from "mongoose";

const bookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Please add a title"],
    trim: true,
  },
  author: {
    type: String,
    required: [true, "Please add an author"],
    trim: true,
  },
  accNo: {
    type: String,
    required: [true, "Please add an accession number"],
    trim: true,
  },
  accNoNormalized: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true,
  },
  publisher: {
    type: String,
    required: [true, "Please add a publisher"],
    trim: true,
  },
  year: {
    type: Number,
    required: [true, "Please add a publishing year"],
    min: 1000,
    max: 9999,
  },
  quantity: {
    type: Number,
    required: [true, "Please add quantity"],
    min: 0,
  },
  available: {
    type: Number,
    required: true,
    min: 0,
  },
  description: {
    type: String,
    default: "",
  },
  coverImage: {
    type: String,
    default: "",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

bookSchema.pre("validate", function normalizeBook() {
  if (this.accNo) {
    this.accNoNormalized = this.accNo
      .replace(/[^0-9A-Za-z]/g, "")
      .toUpperCase();
  }
});

export default mongoose.model("Book", bookSchema);
