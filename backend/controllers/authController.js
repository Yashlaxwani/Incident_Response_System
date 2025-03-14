const crypto = require("crypto")
const User = require("../models/User")
const asyncHandler = require("../middleware/asyncHandler")
const ErrorResponse = require("../utils/errorResponse")
const sendEmail = require("../utils/emailService")
const { generateToken, generateRefreshToken } = require("../utils/generateToken")
const { createAuditLog } = require("../middleware/logger")
const jwt = require("jsonwebtoken")

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = asyncHandler(async (req, res, next) => {
  const { name, email, password } = req.body

  // Check if user already exists
  const userExists = await User.findOne({ email })

  if (userExists) {
    return next(new ErrorResponse("Email already in use", 400))
  }

  // Create user
  const user = await User.create({
    name,
    email,
    password,
  })

  // Create audit log
  createAuditLog(user, "user_register", `User ${user.name} registered`, user._id, "User", req)

  // Send token response
  sendTokenResponse(user, 201, res)
})

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body

  console.log("Login attempt:", email)

  // Validate email & password
  if (!email || !password) {
    return next(new ErrorResponse("Please provide an email and password", 400))
  }

  // Check for user
  const user = await User.findOne({ email }).select("+password")

  console.log("User found:", user ? "Yes" : "No")

  if (!user) {
    return next(new ErrorResponse("Invalid credentials", 401))
  }

  // Check if user is active
  if (!user.isActive) {
    return next(new ErrorResponse("Your account has been deactivated", 403))
  }

  // Check if password matches
  const isMatch = await user.matchPassword(password)

  console.log("Password match:", isMatch ? "Yes" : "No")
  console.log("Stored password hash:", user.password)

  if (!isMatch) {
    return next(new ErrorResponse("Invalid credentials", 401))
  }

  // Update last login
  user.lastLogin = Date.now()
  await user.save({ validateBeforeSave: false })

  // Create audit log
  createAuditLog(user, "user_login", `User ${user.name} logged in`, user._id, "User", req)

  // Send token response
  sendTokenResponse(user, 200, res)
})

// @desc    Logout user / clear cookie
// @route   POST /api/auth/logout
// @access  Private
exports.logout = asyncHandler(async (req, res, next) => {
  // Create audit log
  createAuditLog(req.user, "user_logout", `User ${req.user.name} logged out`, req.user._id, "User", req)

  // Clear refresh token in database
  await User.findByIdAndUpdate(req.user._id, { refreshToken: null })

  res.status(200).json({
    success: true,
    data: {},
  })
})

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id)

  res.status(200).json(user)
})

// @desc    Refresh token
// @route   POST /api/auth/refresh-token
// @access  Public
exports.refreshToken = asyncHandler(async (req, res, next) => {
  const { refreshToken } = req.body

  if (!refreshToken) {
    return next(new ErrorResponse("No refresh token provided", 400))
  }

  try {
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET)

    // Get user from token
    const user = await User.findById(decoded.id)

    if (!user) {
      return next(new ErrorResponse("Invalid refresh token", 401))
    }

    // Check if user is active
    if (!user.isActive) {
      return next(new ErrorResponse("Your account has been deactivated", 403))
    }

    // Send new token response
    sendTokenResponse(user, 200, res)
  } catch (error) {
    return next(new ErrorResponse("Invalid refresh token", 401))
  }
})

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email })

  if (!user) {
    return next(new ErrorResponse("There is no user with that email", 404))
  }

  // Get reset token
  const resetToken = user.getResetPasswordToken()

  await user.save({ validateBeforeSave: false })

  // Create reset url
  const resetUrl = `${req.protocol}://${req.get("host")}/reset-password/${resetToken}`

  const message = `
    <h1>Password Reset Request</h1>
    <p>You are receiving this email because you (or someone else) has requested the reset of a password.</p>
    <p>Please click on the following link to reset your password:</p>
    <a href="${resetUrl}" target="_blank">Reset Password</a>
    <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
  `

  try {
    await sendEmail({
      email: user.email,
      subject: "Password reset token",
      message,
    })

    // Create audit log
    createAuditLog(user, "password_reset", `Password reset requested for user ${user.name}`, user._id, "User", req)

    res.status(200).json({ success: true, data: "Email sent" })
  } catch (err) {
    console.log(err)
    user.resetPasswordToken = undefined
    user.resetPasswordExpire = undefined

    await user.save({ validateBeforeSave: false })

    return next(new ErrorResponse("Email could not be sent", 500))
  }
})

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetPassword = asyncHandler(async (req, res, next) => {
  // Get hashed token
  const resetPasswordToken = crypto.createHash("sha256").update(req.body.token).digest("hex")

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  })

  if (!user) {
    return next(new ErrorResponse("Invalid token", 400))
  }

  // Set new password
  user.password = req.body.password
  user.resetPasswordToken = undefined
  user.resetPasswordExpire = undefined
  await user.save()

  // Create audit log
  createAuditLog(user, "password_reset", `Password reset completed for user ${user.name}`, user._id, "User", req)

  sendTokenResponse(user, 200, res)
})

// @desc    Update user details
// @route   PUT /api/auth/update-details
// @access  Private
exports.updateDetails = asyncHandler(async (req, res, next) => {
  const fieldsToUpdate = {
    name: req.body.name,
    email: req.body.email,
  }

  const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
    new: true,
    runValidators: true,
  })

  // Create audit log
  createAuditLog(req.user, "user_update", `User ${req.user.name} updated their profile`, req.user._id, "User", req)

  res.status(200).json({
    success: true,
    data: user,
  })
})

// @desc    Update password
// @route   PUT /api/auth/update-password
// @access  Private
exports.updatePassword = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id).select("+password")

  // Check current password
  if (!(await user.matchPassword(req.body.currentPassword))) {
    return next(new ErrorResponse("Password is incorrect", 401))
  }

  user.password = req.body.newPassword
  await user.save()

  // Create audit log
  createAuditLog(req.user, "user_update", `User ${req.user.name} changed their password`, req.user._id, "User", req)

  sendTokenResponse(user, 200, res)
})

// Helper function to get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  // Create token
  const token = generateToken(user._id)
  const refreshToken = generateRefreshToken(user._id)

  // Save refresh token to database
  User.findByIdAndUpdate(user._id, { refreshToken })

  res.status(statusCode).json({
    success: true,
    token,
    refreshToken,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      phone: user.phone,
      isActive: user.isActive,
      createdAt: user.createdAt,
    },
  })
}

