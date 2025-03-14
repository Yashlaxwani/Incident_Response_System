"use client"

import { useState } from "react"
import { Link } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import { useNotifications } from "../../context/NotificationContext"
import NotificationDropdown from "./NotificationDropdown"

const Navbar = () => {
  const { currentUser, logout } = useAuth()
  const { unreadCount } = useNotifications()
  const [showNotifications, setShowNotifications] = useState(false)

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications)
  }

  const getInitials = (name) => {
    if (!name) return "U"
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  const getProfileLink = () => {
    if (currentUser.role === "superadmin") {
      return "/superadmin/dashboard"
    } else if (currentUser.role === "admin") {
      return "/admin/dashboard"
    } else {
      return "/user/profile"
    }
  }

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-light border-bottom">
      <div className="container-fluid">
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarSupportedContent"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarSupportedContent">
          <ul className="navbar-nav ms-auto mb-2 mb-lg-0">
            <li className="nav-item dropdown me-3 position-relative">
              <a className="nav-link" href="#" role="button" onClick={toggleNotifications}>
                <i className="bi bi-bell"></i>
                {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
              </a>
              {showNotifications && <NotificationDropdown />}
            </li>

            <li className="nav-item dropdown">
              <a
                className="nav-link dropdown-toggle d-flex align-items-center"
                href="#"
                id="navbarDropdown"
                role="button"
                data-bs-toggle="dropdown"
              >
                <div className="user-avatar me-2">{getInitials(currentUser?.name)}</div>
                <span>{currentUser?.name}</span>
              </a>
              <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="navbarDropdown">
                <li>
                  <Link className="dropdown-item" to={getProfileLink()}>
                    <i className="bi bi-person me-2"></i>Profile
                  </Link>
                </li>
                <li>
                  <hr className="dropdown-divider" />
                </li>
                <li>
                  <a className="dropdown-item" href="#" onClick={logout}>
                    <i className="bi bi-box-arrow-right me-2"></i>Logout
                  </a>
                </li>
              </ul>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  )
}

export default Navbar

