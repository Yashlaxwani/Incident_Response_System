import { createContext, useState, useEffect, useContext } from "react"
import io from "socket.io-client"
import { useAuth } from "./AuthContext"
import { API_URL } from "../config"
import { toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"

const NotificationContext = createContext()

export const useNotifications = () => useContext(NotificationContext)

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [socket, setSocket] = useState(null)
  const { currentUser } = useAuth()

  // Initialize socket connection
  useEffect(() => {
    if (currentUser) {
      const newSocket = io(API_URL, {
        auth: {
          token: localStorage.getItem("token"),
        },
        transports: ["websocket", "polling"], // Try both WebSocket and polling
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      })
      newSocket.on("connect", () => {
        console.log("Socket connected:", newSocket.id)
      })

      newSocket.on("connect_error", (err) => {
        console.error("Socket connection error:", err.message)
      })

      setSocket(newSocket)

      // Clean up on unmount
      return () => {
        console.log("Disconnecting socket")
        newSocket.disconnect()
      }
    }
  }, [currentUser])

  // Set up socket event listeners
  useEffect(() => {
    if (socket && currentUser) {
      // Fetch existing notifications
      const fetchNotifications = async () => {
        try {
          const response = await fetch(`${API_URL}/api/notifications`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          })
          const data = await response.json()
          setNotifications(data || []) // Ensure data is an array
          setUnreadCount(data && Array.isArray(data) ? data.filter((n) => !n.read).length : 0)
        } catch (error) {
          console.error("Error fetching notifications:", error)
          setNotifications([]) // Set to empty array on error
        }
      }

      fetchNotifications()

      // Listen for new notifications
      socket.on("notification", (notification) => {
        console.log("Received notification:", notification)

        // Make sure we're adding to an array
        setNotifications((prev) => {
          // Check if prev is an array, if not, initialize as empty array
          const prevArray = Array.isArray(prev) ? prev : []
          return [notification, ...prevArray]
        })

        setUnreadCount((prev) => prev + 1)

        // Add toast notification
        toast.info(notification.message)
      })

      // Listen for incident updates
      socket.on("incidentUpdate", (updatedIncident) => {
        // Handle real-time incident updates
        console.log("Incident updated:", updatedIncident)

        // Add toast notification for incident updates
        if (updatedIncident.status) {
          const statusText =
            updatedIncident.status === "open"
              ? "Open"
              : updatedIncident.status === "in-progress"
                ? "In Progress"
                : "Resolved"
          toast.info(`Incident status updated to: ${statusText}`)
        }
      })

      // Listen for new incidents
      socket.on("newIncident", (data) => {
        console.log("New incident received:", data)
        // Add toast notification for new incidents
        if (data.incident && data.incident.title) {
          toast.info(`New incident reported: ${data.incident.title}`)
        } else {
          toast.info("New incident reported")
        }
      })

      return () => {
        socket.off("notification")
        socket.off("incidentUpdate")
        socket.off("newIncident")
      }
    }
  }, [socket, currentUser])

  const markAsRead = async (notificationId) => {
    try {
      await fetch(`${API_URL}/api/notifications/${notificationId}/read`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })

      setNotifications((prev) => {
        // Check if prev is an array
        if (!Array.isArray(prev)) return []
        return prev.map((n) => (n._id === notificationId ? { ...n, read: true } : n))
      })

      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }

  const markAllAsRead = async () => {
    try {
      await fetch(`${API_URL}/api/notifications/read-all`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })

      setNotifications((prev) => {
        // Check if prev is an array
        if (!Array.isArray(prev)) return []
        return prev.map((n) => ({ ...n, read: true }))
      })

      setUnreadCount(0)
    } catch (error) {
      console.error("Error marking all notifications as read:", error)
    }
  }

  const value = {
    notifications,
    unreadCount,
    socket,
    markAsRead,
    markAllAsRead,
  }

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
}

