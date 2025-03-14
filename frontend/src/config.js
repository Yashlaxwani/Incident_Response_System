// API URL - Change this to your backend server URL
export const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000"

// Incident categories
export const INCIDENT_CATEGORIES = [
  "Phishing",
  "Malware",
  "Ransomware",
  "Unauthorized Access",
  "Data Breach",
  "Social Engineering",
  "DDoS Attack",
  "Insider Threat",
  "Physical Security",
  "Other",
]

// Incident priorities
export const INCIDENT_PRIORITIES = [
  { value: "low", label: "Low", color: "success" },
  { value: "medium", label: "Medium", color: "warning" },
  { value: "high", label: "High", color: "danger" },
]

// Incident statuses
export const INCIDENT_STATUSES = [
  { value: "open", label: "Open", color: "danger" },
  { value: "in-progress", label: "In Progress", color: "warning" },
  { value: "resolved", label: "Resolved", color: "success" },
]

// User roles
export const USER_ROLES = [
  { value: "user", label: "User" },
  { value: "admin", label: "Admin" },
  { value: "superadmin", label: "Super Admin" },
]

// File upload config
export const FILE_UPLOAD_CONFIG = {
  maxFileSize: 5 * 1024 * 1024, // 5MB
  acceptedFormats: [".jpg", ".jpeg", ".png", ".pdf", ".doc", ".docx", ".txt"],
}

// Chart colors
export const CHART_COLORS = {
  primary: "#0d6efd",
  success: "#198754",
  danger: "#dc3545",
  warning: "#ffc107",
  info: "#0dcaf0",
  secondary: "#6c757d",
  light: "#f8f9fa",
  dark: "#212529",
}

