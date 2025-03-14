"use client"
import { Link } from "react-router-dom"
import { useNotifications } from "../../context/NotificationContext"
import { formatDistanceToNow } from "date-fns"

const NotificationDropdown = () => {
  const { notifications, markAsRead, markAllAsRead } = useNotifications()

  const handleMarkAsRead = (e, id) => {
    e.stopPropagation()
    markAsRead(id)
  }

  const getNotificationLink = (notification) => {
    if (notification.type === "incident_update") {
      return `/user/incidents/${notification.incidentId}`
    }
    return "#"
  }

  return (
    <div
      className="dropdown-menu dropdown-menu-end p-0 show"
      style={{ width: "300px", maxHeight: "400px", overflow: "auto", position: "absolute", right: 0 }}
    >
      <div className="d-flex justify-content-between align-items-center p-3 border-bottom">
        <h6 className="mb-0">Notifications</h6>
        <button className="btn btn-sm btn-link text-decoration-none" onClick={markAllAsRead}>
          Mark all as read
        </button>
      </div>

      {notifications.length === 0 ? (
        <div className="p-3 text-center text-muted">No notifications</div>
      ) : (
        <div>
          {notifications.map((notification) => (
            <Link
              key={notification._id}
              to={getNotificationLink(notification)}
              className={`notification-item d-flex text-decoration-none text-dark ${!notification.read ? "unread" : ""}`}
              onClick={() => !notification.read && markAsRead(notification._id)}
            >
              <div className="flex-shrink-0 me-3">
                <div
                  className={`bg-${notification.type === "incident_update" ? "primary" : "info"} text-white rounded-circle p-2`}
                >
                  <i className={`bi bi-${notification.type === "incident_update" ? "bell" : "info-circle"}`}></i>
                </div>
              </div>
              <div className="flex-grow-1">
                <div className="d-flex justify-content-between">
                  <p className="mb-0 fw-bold">{notification.title}</p>
                  {!notification.read && (
                    <button
                      className="btn btn-sm text-primary p-0"
                      onClick={(e) => handleMarkAsRead(e, notification._id)}
                    >
                      <i className="bi bi-check-circle"></i>
                    </button>
                  )}
                </div>
                <p className="mb-0 small">{notification.message}</p>
                <small className="text-muted">
                  {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                </small>
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="p-2 border-top text-center">
        <Link to="/notifications" className="btn btn-sm btn-link text-decoration-none">
          View all notifications
        </Link>
      </div>
    </div>
  )
}

export default NotificationDropdown

