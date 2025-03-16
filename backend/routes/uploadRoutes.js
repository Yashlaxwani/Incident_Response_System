const express = require("express")
const { uploadFiles, getFile } = require("../controllers/uploadController")
const upload = require("../utils/fileUpload")
const { protect } = require("../middleware/auth")

const router = express.Router()

// Protect all routes
router.use(protect)

// Upload route
router.post("/", upload.array("files", 5), uploadFiles)

// Get file route
router.get("/:filename", getFile)

module.exports = router

