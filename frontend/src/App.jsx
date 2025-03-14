import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import "bootstrap/dist/css/bootstrap.min.css"
import "./App.css"

// Auth Components
import Login from "./components/auth/Login"
import Register from "./components/auth/Register"
import ForgotPassword from "./components/auth/ForgotPassword"
import ResetPassword from "./components/auth/ResetPassword"

// Layout Components
import PrivateRoute from "./components/common/PrivateRoute"
import Layout from "./components/layout/Layout"

// User Pages
import UserDashboard from "./pages/user/Dashboard"
import ReportIncident from "./pages/user/ReportIncident"
import ViewIncident from "./pages/user/ViewIncident"
import UserProfile from "./pages/user/Profile"

// Admin Pages
import AdminDashboard from "./pages/admin/Dashboard"
import ManageIncidents from "./pages/admin/ManageIncidents"
import IncidentDetails from "./pages/admin/IncidentDetails"

// Super Admin Pages
import SuperAdminDashboard from "./pages/superadmin/Dashboard"
import UserManagement from "./pages/superadmin/UserManagement"
import AuditLogs from "./pages/superadmin/AuditLogs"

// Context
import { AuthProvider } from "./context/AuthContext"
import { NotificationProvider } from "./context/NotificationContext"

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Router>
          <ToastContainer position="top-right" autoClose={3000} />
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />

            {/* Protected Routes */}
            <Route element={<PrivateRoute allowedRoles={["user", "admin", "superadmin"]} />}>
              <Route element={<Layout />}>
                {/* User Routes */}
                <Route path="/user/dashboard" element={<UserDashboard />} />
                <Route path="/user/report-incident" element={<ReportIncident />} />
                <Route path="/user/incidents/:id" element={<ViewIncident />} />
                <Route path="/user/profile" element={<UserProfile />} />

                {/* Admin Routes */}
                <Route element={<PrivateRoute allowedRoles={["admin", "superadmin"]} />}>
                  <Route path="/admin/dashboard" element={<AdminDashboard />} />
                  <Route path="/admin/incidents" element={<ManageIncidents />} />
                  <Route path="/admin/incidents/:id" element={<IncidentDetails />} />
                </Route>

                {/* Super Admin Routes */}
                <Route element={<PrivateRoute allowedRoles={["superadmin"]} />}>
                  <Route path="/superadmin/dashboard" element={<SuperAdminDashboard />} />
                  <Route path="/superadmin/users" element={<UserManagement />} />
                  <Route path="/superadmin/audit-logs" element={<AuditLogs />} />
                </Route>
              </Route>
            </Route>

            {/* Redirect to login if no route matches */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Router>
      </NotificationProvider>
    </AuthProvider>
  )
}

export default App

