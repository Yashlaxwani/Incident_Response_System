import { io } from "socket.io-client"
import { API_URL } from "../config"

let socket = null

export const initializeSocket = (token) => {
  if (socket) {
    console.log("Disconnecting existing socket before creating a new one")
    socket.disconnect()
  }

  console.log("Initializing socket connection to:", API_URL)

  socket = io(API_URL, {
    auth: {
      token,
    },
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  })

  socket.on("connect", () => {
    console.log("Socket connected:", socket.id)
  })

  socket.on("connect_error", (error) => {
    console.error("Socket connection error:", error.message)
  })

  socket.on("disconnect", (reason) => {
    console.log("Socket disconnected:", reason)
  })

  socket.on("reconnect", (attemptNumber) => {
    console.log("Socket reconnected after", attemptNumber, "attempts")
  })

  socket.on("reconnect_error", (error) => {
    console.error("Socket reconnection error:", error.message)
  })

  return socket
}

export const getSocket = () => {
  if (!socket) {
    console.warn("Attempting to get socket before initialization")
    return null
  }

  if (!socket.connected) {
    console.warn("Socket exists but is not connected")
  }

  return socket
}

export const disconnectSocket = () => {
  if (socket) {
    console.log("Disconnecting socket")
    socket.disconnect()
    socket = null
  }
}

// Socket event emitters
export const emitStatusUpdate = (data) => {
  if (socket && socket.connected) {
    console.log("Emitting status update:", data)
    socket.emit("statusUpdate", data)
    return true
  }
  console.warn("Cannot emit statusUpdate: Socket not connected")
  return false
}

export const emitNewIncident = (data) => {
  if (socket && socket.connected) {
    console.log("Emitting new incident:", data)
    socket.emit("newIncident", data)
    return true
  }
  console.warn("Cannot emit newIncident: Socket not connected")
  return false
}

export const emitNewComment = (data) => {
  if (socket && socket.connected) {
    console.log("Emitting new comment:", data)
    socket.emit("newComment", data)
    return true
  }
  console.warn("Cannot emit newComment: Socket not connected")
  return false
}

export const emitIncidentAssigned = (data) => {
  if (socket && socket.connected) {
    console.log("Emitting incident assigned:", data)
    socket.emit("incidentAssigned", data)
    return true
  }
  console.warn("Cannot emit incidentAssigned: Socket not connected")
  return false
}

 