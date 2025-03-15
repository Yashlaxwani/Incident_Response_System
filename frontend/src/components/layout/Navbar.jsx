import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useNotifications } from "../../context/NotificationContext";
import { useNavigate } from "react-router-dom";

const Navbar = () => {
  const { currentUser, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  const navigate = useNavigate();

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
  };

  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const handleLogout = () => {
    logout();
    navigate("/login"); // Redirect to login page after logout
  };

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
            <li className="nav-item">
              <a className="nav-link" href="#" onClick={handleLogout}>
                <i className="bi bi-box-arrow-right me-2"></i>Logout
              </a>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
