import { createContext, useState, useEffect, useContext } from "react"
import axios from "axios"
import { API_URL } from "../config"

const AuthContext = createContext()

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Check if user is logged in on mount
    const checkLoggedIn = async () => {
      try {
        const token = localStorage.getItem("token")

        if (token) {
          axios.defaults.headers.common["Authorization"] = `Bearer ${token}`
          const response = await axios.get(`${API_URL}/api/auth/me`)
          setCurrentUser(response.data)
        }
      } catch (err) {
        console.error("Authentication error:", err)
        localStorage.removeItem("token")
        delete axios.defaults.headers.common["Authorization"]
      } finally {
        setLoading(false)
      }
    }

    checkLoggedIn()
  }, [])

  const login = async (email, password) => {
    try {
      setError(null)
      const response = await axios.post(`${API_URL}/api/auth/login`, { email, password })
      const { token, user } = response.data

      localStorage.setItem("token", token)
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`
      setCurrentUser(user)
      return user
    } catch (err) {
      setError(err.response?.data?.message || "Login failed")
      throw err
    }
  }

  const register = async (userData) => {
    try {
      setError(null)
      const response = await axios.post(`${API_URL}/api/auth/register`, userData)
      return response.data
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed")
      throw err
    }
  }

  const logout = () => {
    localStorage.removeItem("token")
    delete axios.defaults.headers.common["Authorization"]
    setCurrentUser(null)
  }

  const forgotPassword = async (email) => {
    try {
      setError(null)
      const response = await axios.post(`${API_URL}/api/auth/forgot-password`, { email })
      return response.data
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send reset email")
      throw err
    }
  }

  const resetPassword = async (token, password) => {
    try {
      setError(null)
      const response = await axios.post(`${API_URL}/api/auth/reset-password`, { token, password })
      return response.data
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reset password")
      throw err
    }
  }

  const updateProfile = async (userData) => {
    try {
      setError(null)
      const response = await axios.put(`${API_URL}/api/users/profile`, userData)
      setCurrentUser(response.data)
      return response.data
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile")
      throw err
    }
  }

  const value = {
    currentUser,
    loading,
    error,
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
    updateProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

