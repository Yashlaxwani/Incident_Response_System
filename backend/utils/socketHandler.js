const jwt = require("jsonwebtoken")
const User = require("../models/User")

// Setup Socket.io
exports.setupSocketIO = (io) => {
  // Authentication middleware for Socket.io
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token

      if (!token) {
        return next(new Error("Authentication error: Token not provided"))
      }

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET)

      // Get user from token
      const user = await User.findById(decoded.id)

      if (!user) {
        return next(new Error("Authentication error: User not found"))
      }

      if (!user.isActive) {
        return next(new Error("Authentication error: User account is deactivated"))
      }

      // Attach user to socket
      socket.user = user
      console.log(`Socket authenticated for user: ${user.name} (${user._id})`)
      next()
    } catch (error) {
      console.error("Socket authentication error:", error)
      return next(new Error("Authentication error: Invalid token"))
    }
  })

  // Connection event
  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.user._id}`)

    // Join user to their own room for private notifications
    socket.join(socket.user._id.toString())

    // Join room based on user role
    if (socket.user.role === "admin" || socket.user.role === "superadmin") {
      socket.join("admins")
    }

    // Handle status updates
    socket.on("statusUpdate", (data) => {
      console.log("Status update received:", data)

      // Broadcast to all connected clients except sender
      socket.broadcast.emit("incidentUpdate", data)

      // If incident has a reportedBy user, send notification to that user
      if (data.reportedBy) {
        io.to(data.reportedBy.toString()).emit("notification", {
          type: "incident_update",
          incidentId: data.incidentId,
          title: "Incident Status Updated",
          message: `Your incident status has been updated to ${data.status}`,
        })
      }
    })

    // Handle new incidents
    socket.on("newIncident", (data) => {
      console.log("New incident received:", data)
      // Broadcast to admin users
      io.to("admins").emit("newIncident", data)
    })

    // Handle new comments
    socket.on("newComment", (data) => {
      // Broadcast to specific incident room
      io.to(`incident-${data.incidentId}`).emit("newComment", data)

      // Send notification to incident owner if not the commenter
      if (data.incidentOwner && data.incidentOwner !== socket.user._id.toString()) {
        io.to(data.incidentOwner).emit("notification", {
          type: "comment",
          incidentId: data.incidentId,
          title: "New Comment",
          message: `${socket.user.name} commented on your incident`,
        })
      }
    })

    // Handle incident assignment
    socket.on("incidentAssigned", (data) => {
      // Send notification to assigned user
      if (data.assignedTo) {
        io.to(data.assignedTo.toString()).emit("notification", {
          type: "assignment",
          incidentId: data.incidentId,
          title: "Incident Assigned",
          message: `An incident has been assigned to you`,
        })
      }
    })

    // Disconnect event
    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.user._id}`)
    })
  })
}

