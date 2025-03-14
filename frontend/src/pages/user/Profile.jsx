import { useState, useEffect } from "react"
import { useAuth } from "../../context/AuthContext"
import { toast } from "react-toastify"
import axios from "axios"
import { API_URL } from "../../config"

const Profile = () => {
  const { currentUser, updateProfile } = useAuth()
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    department: "",
    phone: "",
  })
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [loading, setLoading] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [activity, setActivity] = useState([])
  const [loadingActivity, setLoadingActivity] = useState(false)

  useEffect(() => {
    if (currentUser) {
      setFormData({
        name: currentUser.name || "",
        email: currentUser.email || "",
        department: currentUser.department || "",
        phone: currentUser.phone || "",
      })
    }

    fetchActivity()
  }, [currentUser])

  const fetchActivity = async () => {
    setLoadingActivity(true)
    try {
      const response = await axios.get(`${API_URL}/api/users/activity`)
      setActivity(response.data)
    } catch (error) {
      console.error("Failed to fetch activity", error)
    } finally {
      setLoadingActivity(false)
    }
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      await updateProfile(formData)
      toast.success("Profile updated successfully")
    } catch (error) {
      toast.error("Failed to update profile")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords do not match")
      return
    }

    setPasswordLoading(true)

    try {
      await axios.put(`${API_URL}/api/users/change-password`, {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      })

      toast.success("Password changed successfully")
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to change password")
      console.error(error)
    } finally {
      setPasswordLoading(false)
    }
  }

  return (
    <div className="container-fluid">
      <h1 className="h3 mb-4">My Profile</h1>

      <div className="row">
        <div className="col-lg-8">
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="mb-0">Profile Information</h5>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="name" className="form-label">
                    Full Name
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="email" className="form-label">
                    Email Address
                  </label>
                  <input
                    type="email"
                    className="form-control"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    disabled
                  />
                  <small className="form-text text-muted">Email address cannot be changed</small>
                </div>

                <div className="row mb-3">
                  <div className="col-md-6">
                    <label htmlFor="department" className="form-label">
                      Department
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="department"
                      name="department"
                      value={formData.department}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="col-md-6">
                    <label htmlFor="phone" className="form-label">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      className="form-control"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </form>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Change Password</h5>
            </div>
            <div className="card-body">
              <form onSubmit={handlePasswordSubmit}>
                <div className="mb-3">
                  <label htmlFor="currentPassword" className="form-label">
                    Current Password
                  </label>
                  <input
                    type="password"
                    className="form-control"
                    id="currentPassword"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="newPassword" className="form-label">
                    New Password
                  </label>
                  <input
                    type="password"
                    className="form-control"
                    id="newPassword"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    required
                    minLength="8"
                  />
                  <small className="form-text text-muted">Password must be at least 8 characters long</small>
                </div>

                <div className="mb-3">
                  <label htmlFor="confirmPassword" className="form-label">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    className="form-control"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    required
                  />
                </div>

                <button type="submit" className="btn btn-primary" disabled={passwordLoading}>
                  {passwordLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Changing...
                    </>
                  ) : (
                    "Change Password"
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Recent Activity</h5>
            </div>
            <div className="card-body">
              {loadingActivity ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : activity.length === 0 ? (
                <p className="text-muted text-center py-4">No recent activity</p>
              ) : (
                <div className="timeline">
                  {activity.map((item, index) => (
                    <div key={index} className="mb-3 pb-3 border-bottom">
                      <div className="d-flex">
                        <div className="me-3">
                          <div className="bg-light rounded-circle p-2">
                            <i
                              className={`bi bi-${item.type === "login" ? "box-arrow-in-right" : item.type === "incident" ? "exclamation-triangle" : "activity"}`}
                            ></i>
                          </div>
                        </div>
                        <div>
                          <p className="mb-0">{item.description}</p>
                          <small className="text-muted">{new Date(item.timestamp).toLocaleString()}</small>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile

