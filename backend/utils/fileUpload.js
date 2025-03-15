const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

// Set storage engine
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    const uploadPath = path.join(__dirname, '..', process.env.UPLOAD_PATH || 'uploads');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: function(req, file, cb) {
    // Generate unique filename
    const uniqueFilename = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueFilename);
  }
});

// Check file type
// In backend/utils/fileUpload.js
// Make sure the file filter is correctly configured
const fileFilter = (req, file, cb) => {
  // Allowed extensions
  const filetypes = /jpeg|pdf|doc|docx|csv/;
  
  // Check extension
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  
  // Check mime type
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('File type not supported. Allowed types: jpeg,pdf, doc, docx, csv'));
  }
};

// Initialize upload
const upload = multer({
  storage: storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 }, // Default 5MB
  fileFilter: fileFilter
});

module.exports = upload;