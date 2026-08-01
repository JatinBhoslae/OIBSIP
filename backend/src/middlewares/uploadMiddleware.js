import multer from 'multer';
import cloudinary from '../config/cloudinary.js';

// Setup local disk storage for temporary files before upload
const storage = multer.diskStorage({});

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  },
});

// Upload Helper function to handle Cloudinary promise wrapping
export const uploadToCloudinary = async (filePath, folder = 'pizzahub') => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder,
      resource_type: 'auto',
    });
    return result.secure_url;
  } catch (error) {
    throw new Error(`Cloudinary upload failed: ${error.message}`);
  }
};
