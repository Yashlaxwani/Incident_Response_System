 import { NavLink, Link } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"

const Sidebar = () => {
  const { currentUser, logout } = useAuth()

  // Define navigation items based on user role
  const getUserNavItems = () => [
    { path: "/user/dashboard", icon: "bi-speedometer2", label: "Dashboard" },
    { path: "/user/report-incident", icon: "bi-exclamation-triangle", label: "Report Incident" },
    { path: "/user/profile", icon: "bi-person", label: "Profile" },
  ]

  const getAdminNavItems = () => [
    { path: "/admin/dashboard", icon: "bi-speedometer2", label: "Dashboard" },
    { path: "/admin/incidents", icon: "bi-exclamation-triangle", label: "Manage Incidents" },
    { path: "/user/profile", icon: "bi-person", label: "Profile" },
  ]

  const getSuperAdminNavItems = () => [
    { path: "/superadmin/dashboard", icon: "bi-speedometer2", label: "Dashboard" },
    { path: "/admin/incidents", icon: "bi-exclamation-triangle", label: "Manage Incidents" },
    { path: "/superadmin/users", icon: "bi-people", label: "User Management" },
    { path: "/superadmin/audit-logs", icon: "bi-journal-text", label: "Audit Logs" },
    { path: "/user/profile", icon: "bi-person", label: "Profile" },
  ]

  // Get navigation items based on user role
  const getNavItems = () => {
    switch (currentUser?.role) {
      case "superadmin":
        return getSuperAdminNavItems()
      case "admin":
        return getAdminNavItems()
      case "user":
      default:
        return getUserNavItems()
    }
  }

  return (
    <div className="sidebar d-flex flex-column flex-shrink-0 p-3 text-white">
      <Link to="/" className="d-flex align-items-center mb-3 mb-md-0 me-md-auto text-white text-decoration-none">
        <i className="bi bi-shield-lock fs-4 me-2"></i>
        <span className="fs-4">SecureReport</span>
      </Link>
      <hr />
      <ul className="nav nav-pills flex-column mb-auto">
        {getNavItems().map((item) => (
          <li className="nav-item" key={item.path}>
            <NavLink to={item.path} className={({ isActive }) => `nav-link text-white ${isActive ? "active" : ""}`}>
              <i className={`bi ${item.icon} me-2`}></i>
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
      <hr />
      <div className="dropdown">
        <a
          href="#"
          className="d-flex align-items-center text-white text-decoration-none dropdown-toggle"
          id="dropdownUser1"
          data-bs-toggle="dropdown"
          aria-expanded="false"
        >
          <div className="user-avatar me-2">
            {currentUser?.name
              ?.split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .substring(0, 2)}
          </div>
          <strong>{currentUser?.name}</strong>
        </a>
        <ul className="dropdown-menu dropdown-menu-dark text-small shadow" aria-labelledby="dropdownUser1">
          <li>
            <a className="dropdown-item" href="#" onClick={() => logout()}>
              Sign out
            </a>
          </li>
        </ul>
      </div>
    </div>
  )
}

export default Sidebar

