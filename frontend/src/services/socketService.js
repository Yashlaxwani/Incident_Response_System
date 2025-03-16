import { io } from "socket.io-client"
import { API_URL } from "../config"

let socket = null

export const initializeSocket = (token) => {
  if (socket) {
    socket.disconnect()
  }

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

  return socket
}

export const getSocket = () => {
  return socket
}

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

// Socket event emitters
export const emitStatusUpdate = (data) => {
  if (socket) {
    console.log("Emitting status update:", data)
    socket.emit("statusUpdate", data)
    return true
  }
  return false
}

export const emitNewIncident = (data) => {
  if (socket) {
    console.log("Emitting new incident:", data)
    socket.emit("newIncident", data)
    return true
  }
  return false
}

export const emitNewComment = (data) => {
  if (socket) {
    console.log("Emitting new comment:", data)
    socket.emit("newComment", data)
    return true
  }
  return false
}

export const emitIncidentAssigned = (data) => {
  if (socket) {
    console.log("Emitting incident assigned:", data)
    socket.emit("incidentAssigned", data)
    return true
  }
  return false
}

