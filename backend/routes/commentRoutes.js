const express = require('express');
const {
  deleteComment
} = require('../controllers/commentController');

const router = express.Router();

const { protect } = require('../middleware/auth');

// Protect all routes
router.use(protect);

// Delete comment route
router.delete('/:id', deleteComment);

module.exports = router;