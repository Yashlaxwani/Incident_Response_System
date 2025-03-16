const Incident = require("../models/Incident")
const Notification = require("../models/Notification")
const asyncHandler = require("../middleware/asyncHandler")
const ErrorResponse = require("../utils/errorResponse")
const { createAuditLog } = require("../middleware/logger")
const path = require("path")
const fs = require("fs")
const PDFDocument = require("pdfkit")
const { createObjectCsvWriter } = require("csv-writer")
const User = require("../models/User")

// @desc    Get all incidents
// @route   GET /api/incidents
// @access  Private/Admin
exports.getIncidents = asyncHandler(async (req, res, next) => {
  // Pagination
  const page = Number.parseInt(req.query.page, 10) || 1
  const limit = Number.parseInt(req.query.limit, 10) || 10
  const startIndex = (page - 1) * limit
  const endIndex = page * limit

  // Build query
  let query = Incident.find()

  // Filter by status
  if (req.query.status) {
    query = query.find({ status: req.query.status })
  }

  // Filter by category
  if (req.query.category) {
    query = query.find({ category: req.query.category })
  }

  // Filter by priority
  if (req.query.priority) {
    query = query.find({ priority: req.query.priority })
  }

  // Search by title or description
  if (req.query.search) {
    const searchRegex = new RegExp(req.query.search, "i")
    query = query.find({
      $or: [{ title: searchRegex }, { description: searchRegex }],
    })
  }

  // Sort
  if (req.query.sortBy && req.query.sortOrder) {
    const sortObj = {}
    sortObj[req.query.sortBy] = req.query.sortOrder === "desc" ? -1 : 1
    query = query.sort(sortObj)
  } else {
    query = query.sort({ createdAt: -1 })
  }

  // Populate with user data
  query = query.populate([
    { path: "reportedBy", select: "name email" },
    { path: "assignedTo", select: "name email" },
  ])

  // Executing query with pagination
  const total = await Incident.countDocuments(query)
  query = query.skip(startIndex).limit(limit)
  const incidents = await query

  // Pagination result
  const pagination = {}

  if (endIndex < total) {
    pagination.next = {
      page: page + 1,
      limit,
    }
  }

  if (startIndex > 0) {
    pagination.prev = {
      page: page - 1,
      limit,
    }
  }

  res.status(200).json({
    success: true,
    count: incidents.length,
    pagination,
    totalPages: Math.ceil(total / limit),
    incidents,
  })
})

// @desc    Get user's incidents
// @route   GET /api/incidents/user
// @access  Private
exports.getUserIncidents = asyncHandler(async (req, res, next) => {
  const incidents = await Incident.find({ reportedBy: req.user.id })
    .sort({ createdAt: -1 })
    .populate([
      { path: "reportedBy", select: "name email" },
      { path: "assignedTo", select: "name email" },
    ])

  res.status(200).json(incidents)
})

// @desc    Get single incident
// @route   GET /api/incidents/:id
// @access  Private
exports.getIncident = asyncHandler(async (req, res, next) => {
  const incident = await Incident.findById(req.params.id).populate([
    { path: "reportedBy", select: "name email" },
    { path: "assignedTo", select: "name email" },
    {
      path: "statusHistory.updatedBy",
      select: "name email",
    },
  ])

  if (!incident) {
    return next(new ErrorResponse(`Incident not found with id of ${req.params.id}`, 404))
  }

  // Check if user has permission to view this incident
  if (
    req.user.role !== "admin" &&
    req.user.role !== "superadmin" &&
    incident.reportedBy._id.toString() !== req.user.id
  ) {
    return next(new ErrorResponse(`Not authorized to access this incident`, 403))
  }

  res.status(200).json(incident)
})

// @desc    Create new incident
// @route   POST /api/incidents
// @access  Private
exports.createIncident = asyncHandler(async (req, res, next) => {
  // Add user to req.body
  req.body.reportedBy = req.user.id

  const incident = await Incident.create(req.body)

  // Create audit log
  createAuditLog(
    req.user,
    "incident_create",
    `Incident "${incident.title}" created by ${req.user.name}`,
    incident._id,
    "Incident",
    req,
  )

  // Populate user data for socket emission
  const populatedIncident = await Incident.findById(incident._id).populate("reportedBy", "name email")

  // Notify admins via socket.io
  if (req.app.get("io")) {
    const io = req.app.get("io")
    io.emit("newIncident", {
      incident: {
        _id: incident._id,
        title: incident.title,
        category: incident.category,
        priority: incident.priority,
        status: incident.status,
        createdAt: incident.createdAt,
        reportedBy: {
          _id: req.user._id,
          name: req.user.name,
        },
      },
    })

    // Also send a notification to admins
    const admins = await User.find({ role: { $in: ["admin", "superadmin"] } }).select("_id")

    for (const admin of admins) {
      await Notification.create({
        user: admin._id,
        title: "New Incident Reported",
        message: `New incident "${incident.title}" reported by ${req.user.name}`,
        type: "incident_update",
        incidentId: incident._id,
      })

      io.to(admin._id.toString()).emit("notification", {
        type: "incident_update",
        incidentId: incident._id,
        title: "New Incident Reported",
        message: `New incident "${incident.title}" reported by ${req.user.name}`,
      })
    }
  }

  res.status(201).json({
    success: true,
    data: incident,
  })
})

// @desc    Update incident
// @route   PUT /api/incidents/:id
// @access  Private/Admin
exports.updateIncident = asyncHandler(async (req, res, next) => {
  let incident = await Incident.findById(req.params.id)

  if (!incident) {
    return next(new ErrorResponse(`Incident not found with id of ${req.params.id}`, 404))
  }

  // Update incident
  incident = await Incident.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  }).populate([
    { path: "reportedBy", select: "name email" },
    { path: "assignedTo", select: "name email" },
  ])

  // Create audit log
  createAuditLog(
    req.user,
    "incident_update",
    `Incident "${incident.title}" updated by ${req.user.name}`,
    incident._id,
    "Incident",
    req,
  )

  // Notify user via socket.io (handled in socket handler)
  if (req.app.get("io") && incident.reportedBy) {
    const io = req.app.get("io")
    io.to(incident.reportedBy._id.toString()).emit("incidentUpdate", {
      incident: {
        _id: incident._id,
        title: incident.title,
        status: incident.status,
        updatedAt: incident.updatedAt,
      },
    })
  }

  res.status(200).json({
    success: true,
    data: incident,
  })
})

// @desc    Delete incident
// @route   DELETE /api/incidents/:id
// @access  Private/Admin
exports.deleteIncident = asyncHandler(async (req, res, next) => {
  const incident = await Incident.findById(req.params.id)

  if (!incident) {
    return next(new ErrorResponse(`Incident not found with id of ${req.params.id}`, 404))
  }

  // Create audit log before deletion
  createAuditLog(
    req.user,
    "incident_delete",
    `Incident "${incident.title}" deleted by ${req.user.name}`,
    incident._id,
    "Incident",
    req,
  )

  await incident.deleteOne()

  res.status(200).json({
    success: true,
    data: {},
  })
})

// @desc    Update incident status
// @route   PUT /api/incidents/:id/status
// @access  Private/Admin
exports.updateIncidentStatus = asyncHandler(async (req, res, next) => {
  const { status, comment } = req.body

  let incident = await Incident.findById(req.params.id)

  if (!incident) {
    return next(new ErrorResponse(`Incident not found with id of ${req.params.id}`, 404))
  }

  // Update status
  incident.status = status

  // Add to status history
  incident.statusHistory.push({
    status,
    updatedBy: req.user.id,
    timestamp: Date.now(),
    comment: comment || `Status changed to ${status}`,
  })

  // If status is resolved, set resolvedAt
  if (status === "resolved" && !incident.resolvedAt) {
    incident.resolvedAt = Date.now()
  }

  await incident.save()

  // Populate user data
  incident = await Incident.findById(req.params.id).populate([
    { path: "reportedBy", select: "name email" },
    { path: "assignedTo", select: "name email" },
    {
      path: "statusHistory.updatedBy",
      select: "name email",
    },
  ])

  // Create audit log
  createAuditLog(
    req.user,
    "incident_status_change",
    `Incident "${incident.title}" status changed to ${status} by ${req.user.name}`,
    incident._id,
    "Incident",
    req,
  )

  // Create notification for the user who reported the incident
  if (incident.reportedBy && incident.reportedBy._id.toString() !== req.user.id) {
    await Notification.create({
      user: incident.reportedBy._id,
      title: "Incident Status Updated",
      message: `Your incident "${incident.title}" status has been updated to ${status}`,
      type: "incident_update",
      incidentId: incident._id,
    })

    // Notify user via socket.io (handled in socket handler)
    if (req.app.get("io")) {
      const io = req.app.get("io")
      io.to(incident.reportedBy._id.toString()).emit("notification", {
        type: "incident_update",
        incidentId: incident._id,
        title: "Incident Status Updated",
        message: `Your incident "${incident.title}" status has been updated to ${status}`,
      })
    }
  }

  res.status(200).json({
    success: true,
    data: incident,
  })
})

// @desc    Assign incident to user
// @route   PUT /api/incidents/:id/assign
// @access  Private/Admin
exports.assignIncident = asyncHandler(async (req, res, next) => {
  const { assignedTo } = req.body

  let incident = await Incident.findById(req.params.id)

  if (!incident) {
    return next(new ErrorResponse(`Incident not found with id of ${req.params.id}`, 404))
  }

  // Update assigned user
  incident.assignedTo = assignedTo
  incident.assignedAt = Date.now()

  // If status is open, change to in-progress
  if (incident.status === "open") {
    incident.status = "in-progress"

    // Add to status history
    incident.statusHistory.push({
      status: "in-progress",
      updatedBy: req.user.id,
      timestamp: Date.now(),
      comment: "Status changed to in-progress due to assignment",
    })
  }

  await incident.save()

  // Populate user data
  incident = await Incident.findById(req.params.id).populate([
    { path: "reportedBy", select: "name email" },
    { path: "assignedTo", select: "name email" },
  ])

  // Create audit log
  createAuditLog(
    req.user,
    "incident_assignment",
    `Incident "${incident.title}" assigned to ${incident.assignedTo.name} by ${req.user.name}`,
    incident._id,
    "Incident",
    req,
  )

  // Create notification for the assigned user
  if (assignedTo && assignedTo !== req.user.id) {
    await Notification.create({
      user: assignedTo,
      title: "Incident Assigned",
      message: `Incident "${incident.title}" has been assigned to you`,
      type: "assignment",
      incidentId: incident._id,
    })

    // Notify assigned user via socket.io (handled in socket handler)
    if (req.app.get("io")) {
      const io = req.app.get("io")
      io.to(assignedTo).emit("notification", {
        type: "assignment",
        incidentId: incident._id,
        title: "Incident Assigned",
        message: `Incident "${incident.title}" has been assigned to you`,
      })
    }
  }

  res.status(200).json({
    success: true,
    data: incident,
  })
})

// @desc    Bulk update incidents
// @route   PUT /api/incidents/bulk-update
// @access  Private/Admin
exports.bulkUpdateIncidents = asyncHandler(async (req, res, next) => {
  const { ids, status } = req.body

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return next(new ErrorResponse("Please provide an array of incident IDs", 400))
  }

  // Update all incidents
  const result = await Incident.updateMany(
    { _id: { $in: ids } },
    {
      status,
      $push: {
        statusHistory: {
          status,
          updatedBy: req.user.id,
          timestamp: Date.now(),
          comment: `Status changed to ${status} in bulk update`,
        },
      },
    },
  )

  // If status is resolved, set resolvedAt for all incidents
  if (status === "resolved") {
    await Incident.updateMany(
      {
        _id: { $in: ids },
        resolvedAt: { $exists: false },
      },
      { resolvedAt: Date.now() },
    )
  }

  // Create audit log
  createAuditLog(
    req.user,
    "incident_status_change",
    `Bulk update: ${result.modifiedCount} incidents status changed to ${status} by ${req.user.name}`,
    null,
    "Incident",
    req,
  )

  // Create notifications for each incident owner
  const incidents = await Incident.find({ _id: { $in: ids } }).populate("reportedBy", "name email")

  // Send notifications
  for (const incident of incidents) {
    if (incident.reportedBy && incident.reportedBy._id.toString() !== req.user.id) {
      await Notification.create({
        user: incident.reportedBy._id,
        title: "Incident Status Updated",
        message: `Your incident "${incident.title}" status has been updated to ${status}`,
        type: "incident_update",
        incidentId: incident._id,
      })

      // Notify user via socket.io (handled in socket handler)
      if (req.app.get("io")) {
        const io = req.app.get("io")
        io.to(incident.reportedBy._id.toString()).emit("notification", {
          type: "incident_update",
          incidentId: incident._id,
          title: "Incident Status Updated",
          message: `Your incident "${incident.title}" status has been updated to ${status}`,
        })
      }
    }
  }

  res.status(200).json({
    success: true,
    count: result.modifiedCount,
  })
})

// @desc    Bulk delete incidents
// @route   DELETE /api/incidents/bulk-delete
// @access  Private/SuperAdmin
exports.bulkDeleteIncidents = asyncHandler(async (req, res, next) => {
  const { ids } = req.body

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return next(new ErrorResponse("Please provide an array of incident IDs", 400))
  }

  console.log("Bulk delete request received for IDs:", ids)

  // Get incident titles for audit log
  const incidents = await Incident.find({ _id: { $in: ids } }).select("title")

  // Delete all incidents
  const result = await Incident.deleteMany({ _id: { $in: ids } })

  console.log("Delete result:", result)

  // Create audit log
  createAuditLog(
    req.user,
    "incident_delete",
    `Bulk delete: ${result.deletedCount} incidents deleted by ${req.user.name}`,
    null,
    "Incident",
    req,
  )

  res.status(200).json({
    success: true,
    count: result.deletedCount,
  })
})

// @desc    Export incidents
// @route   GET /api/incidents/export
// @access  Private/Admin
exports.exportIncidents = asyncHandler(async (req, res, next) => {
  const { format } = req.query

  if (!format || !["csv", "pdf"].includes(format)) {
    return next(new ErrorResponse("Please provide a valid export format (csv or pdf)", 400))
  }

  // Build query
  let query = Incident.find()

  // Filter by status
  if (req.query.status) {
    query = query.find({ status: req.query.status })
  }

  // Filter by category
  if (req.query.category) {
    query = query.find({ category: req.query.category })
  }

  // Filter by priority
  if (req.query.priority) {
    query = query.find({ priority: req.query.priority })
  }

  // Search by title or description
  if (req.query.search) {
    const searchRegex = new RegExp(req.query.search, "i")
    query = query.find({
      $or: [{ title: searchRegex }, { description: searchRegex }],
    })
  }

  // Sort by created date
  query = query.sort({ createdAt: -1 })

  // Populate with user data
  query = query.populate([
    { path: "reportedBy", select: "name email" },
    { path: "assignedTo", select: "name email" },
  ])

  // Execute query
  const incidents = await query

  // Create audit log
  createAuditLog(
    req.user,
    "system",
    `Incidents exported as ${format.toUpperCase()} by ${req.user.name}`,
    null,
    "System",
    req,
  )

  if (format === "csv") {
    return exportToCsv(incidents, res)
  } else {
    return exportToPdf(incidents, res)
  }
})

// Helper function to export incidents to CSV
const exportToCsv = async (incidents, res) => {
  const csvWriter = createObjectCsvWriter({
    path: "incidents.csv",
    header: [
      { id: "id", title: "ID" },
      { id: "title", title: "Title" },
      { id: "category", title: "Category" },
      { id: "priority", title: "Priority" },
      { id: "status", title: "Status" },
      { id: "reportedBy", title: "Reported By" },
      { id: "assignedTo", title: "Assigned To" },
      { id: "createdAt", title: "Created At" },
      { id: "updatedAt", title: "Updated At" },
      { id: "resolvedAt", title: "Resolved At" },
    ],
  })

  const records = incidents.map((incident) => ({
    id: incident._id,
    title: incident.title,
    category: incident.category,
    priority: incident.priority,
    status: incident.status,
    reportedBy: incident.reportedBy ? incident.reportedBy.name : "N/A",
    assignedTo: incident.assignedTo ? incident.assignedTo.name : "N/A",
    createdAt: new Date(incident.createdAt).toLocaleString(),
    updatedAt: new Date(incident.updatedAt).toLocaleString(),
    resolvedAt: incident.resolvedAt ? new Date(incident.resolvedAt).toLocaleString() : "N/A",
  }))

  await csvWriter.writeRecords(records)

  // Send file to client
  res.download("incidents.csv", "incidents.csv", (err) => {
    if (err) {
      console.error("Error downloading file:", err)
    }

    // Delete file after download
    fs.unlink("incidents.csv", (err) => {
      if (err) console.error("Error deleting file:", err)
    })
  })
}

// Helper function to export incidents to PDF
const exportToPdf = async (incidents, res) => {
  // Create a document
  const doc = new PDFDocument()
  const filename = "incidents.pdf"

  // Set response headers
  res.setHeader("Content-Type", "application/pdf")
  res.setHeader("Content-Disposition", `attachment; filename=${filename}`)

  // Pipe PDF to response
  doc.pipe(res)

  // Add content to PDF
  doc.fontSize(20).text("Incident Report", { align: "center" })
  doc.moveDown()
  doc.fontSize(12).text(`Generated on: ${new Date().toLocaleString()}`, { align: "center" })
  doc.moveDown()
  doc.moveDown()

  // Add incidents
  incidents.forEach((incident, index) => {
    doc.fontSize(14).text(`Incident #${index + 1}: ${incident.title}`)
    doc.moveDown(0.5)
    doc.fontSize(10).text(`ID: ${incident._id}`)
    doc.fontSize(10).text(`Category: ${incident.category}`)
    doc.fontSize(10).text(`Priority: ${incident.priority}`)
    doc.fontSize(10).text(`Status: ${incident.status}`)
    doc.fontSize(10).text(`Reported By: ${incident.reportedBy ? incident.reportedBy.name : "N/A"}`)
    doc.fontSize(10).text(`Assigned To: ${incident.assignedTo ? incident.assignedTo.name : "N/A"}`)
    doc.fontSize(10).text(`Created At: ${new Date(incident.createdAt).toLocaleString()}`)
    doc.fontSize(10).text(`Updated At: ${new Date(incident.updatedAt).toLocaleString()}`)

    if (incident.resolvedAt) {
      doc.fontSize(10).text(`Resolved At: ${new Date(incident.resolvedAt).toLocaleString()}`)
    }

    doc.moveDown(0.5)
    doc.fontSize(10).text("Description:")
    doc.fontSize(10).text(incident.description, {
      width: 500,
      align: "left",
    })

    doc.moveDown()

    // Add a separator between incidents
    if (index < incidents.length - 1) {
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke()
      doc.moveDown()
    }
  })

  // Finalize PDF
  doc.end()
}

