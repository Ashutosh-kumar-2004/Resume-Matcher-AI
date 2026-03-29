import express from "express";
import multer from "multer";
import { protect } from "../middleware/authMiddleware.js";
import { analyzeResume } from "../controllers/resumeController.js";
import { MAX_RESUME_FILE_SIZE_BYTES } from "../constants.js";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_RESUME_FILE_SIZE_BYTES,
  },
  fileFilter: (_req, file, cb) => {
    const isPdfMime = file.mimetype === "application/pdf";
    const hasPdfExtension = (file.originalname || "")
      .toLowerCase()
      .endsWith(".pdf");

    if (!isPdfMime && !hasPdfExtension) {
      return cb(new Error("Only PDF files are allowed"));
    }

    return cb(null, true);
  },
});

router.post("/analyze", protect, upload.single("resume"), analyzeResume);

export default router;
