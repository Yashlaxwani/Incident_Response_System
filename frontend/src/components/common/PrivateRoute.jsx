"use client"
import { Navigate, Outlet } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import LoadingSpinner from "./LoadingSpinner"

const PrivateRoute = ({ allowedRoles }) => {
  const { currentUser, loading } = useAuth()

  if (loading) {
    return <LoadingSpinner />
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />
  }

  // Check if user has the required role
  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
    // Redirect based on user role
    if (currentUser.role === "user") {
      return <Navigate to="/user/dashboard" replace />
    } else if (currentUser.role === "admin") {
      return <Navigate to="/admin/dashboard" replace />
    } else if (currentUser.role === "superadmin") {
      return <Navigate to="/superadmin/dashboard" replace />
    } else {
      return <Navigate to="/login" replace />
    }
  }

  return <Outlet />
}

export default PrivateRoute

