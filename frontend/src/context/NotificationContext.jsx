"use client"

import { createContext, useState, useEffect, useContext } from "react"
import io from "socket.io-client"
import { useAuth } from "./AuthContext"
import { API_URL } from "../config"

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
      })

      setSocket(newSocket)

      // Clean up on unmount
      return () => {
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
          setNotifications(data)
          setUnreadCount(data.filter((n) => !n.read).length)
        } catch (error) {
          console.error("Error fetching notifications:", error)
        }
      }

      fetchNotifications()

      // Listen for new notifications
      socket.on("notification", (notification) => {
        setNotifications((prev) => [notification, ...prev])
        setUnreadCount((prev) => prev + 1)
      })

      // Listen for incident updates
      socket.on("incidentUpdate", (updatedIncident) => {
        // Handle real-time incident updates
        // This will be used to update the UI when incidents are modified
      })

      return () => {
        socket.off("notification")
        socket.off("incidentUpdate")
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

      setNotifications((prev) => prev.map((n) => (n._id === notificationId ? { ...n, read: true } : n)))

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

      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))

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

