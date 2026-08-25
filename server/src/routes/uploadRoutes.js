import express from 'express';
import multer from 'multer';
import cloudinary from '../config/cloudinary.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Multer config for in-memory storage
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// @desc    Upload image to Cloudinary
// @route   POST /api/upload
// @access  Private/Admin
router.post('/', protect, authorize('admin', 'dairyOwner'), upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file provided' });
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: 'dairy_products' },
      (error, result) => {
        if (error) {
          console.error('Cloudinary Upload Error:', error);
          return res.status(500).json({ success: false, message: 'Error uploading image' });
        }
        res.json({
          success: true,
          message: 'Image uploaded successfully',
          url: result.secure_url,
        });
      }
    );

    uploadStream.end(req.file.buffer);
  } catch (error) {
    console.error('Upload route error:', error);
    res.status(500).json({ success: false, message: 'Server error during upload' });
  }
});

export default router;
