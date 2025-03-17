const asyncHandler = require("../middleware/asyncHandler")
const ErrorResponse = require("../utils/errorResponse")
const path = require("path")
const fs = require("fs")

//       Upload files
// @route   POST /api/upload
// @access  Private
exports.uploadFiles = asyncHandler(async (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    return next(new ErrorResponse("Please upload at least one file", 400))
  }

  const fileUrls = req.files.map((file) => ({
    name: file.originalname,
    url: `${req.protocol}://${req.get("host")}/uploads/${file.filename}`,
    type: file.mimetype,
    size: file.size,
  }))

  res.status(200).json({
    success: true,
    count: fileUrls.length,
    fileUrls,
  })
})

//       Get file by filename
// @route   GET /api/upload/:filename
// @access  Private
exports.getFile = asyncHandler(async (req, res, next) => {
  const { filename } = req.params
  const filePath = path.join(__dirname, "..", process.env.UPLOAD_PATH || "uploads", filename)

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    return next(new ErrorResponse("File not found", 404))
  }

  // Get file mime type
  const mimeType = require("mime-types").lookup(filePath)

  // Set appropriate headers
  res.setHeader("Content-Type", mimeType)
  res.setHeader("Content-Disposition", `inline; filename="${filename}"`)

  // Stream the file
  const fileStream = fs.createReadStream(filePath)
  fileStream.pipe(res)
})

