import multer from 'multer';

// Configure multer for memory storage (we'll upload to GCS)
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Allow PDF files
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed'), false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
});

