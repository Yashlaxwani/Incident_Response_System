import { useState, useEffect } from "react"
import axios from "axios"
import { API_URL, USER_ROLES } from "../../config"
import { toast } from "react-toastify"
import LoadingSpinner from "../../components/common/LoadingSpinner"

const UserManagement = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState("add") // 'add', 'edit', 'delete'
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "user",
    department: "",
    phone: "",
  })
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("")
  const [sortBy, setSortBy] = useState("name")
  const [sortOrder, setSortOrder] = useState("asc")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [search, roleFilter, sortBy, sortOrder, page])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const queryParams = new URLSearchParams({
        page,
        limit: 10,
        sortBy,
        sortOrder,
        search,
        role: roleFilter,
      })

      const response = await axios.get(`${API_URL}/api/users?${queryParams}`)
      setUsers(response.data.users)
      setTotalPages(response.data.totalPages)
    } catch (error) {
      toast.error("Failed to fetch users")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortBy(field)
      setSortOrder("asc")
    }
  }

  const handleAddUser = () => {
    setFormData({
      name: "",
      email: "",
      password: "",
      role: "user",
      department: "",
      phone: "",
    })
    setModalMode("add")
    setShowModal(true)
  }

  const handleEditUser = (user) => {
    setSelectedUser(user)
    setFormData({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
      department: user.department || "",
      phone: user.phone || "",
    })
    setModalMode("edit")
    setShowModal(true)
  }

  const handleDeleteUser = (user) => {
    setSelectedUser(user)
    setModalMode("delete")
    setShowModal(true)
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setActionLoading(true)

    try {
      if (modalMode === "add") {
        await axios.post(`${API_URL}/api/users`, formData)
        toast.success("User added successfully")
      } else if (modalMode === "edit") {
        const updateData = { ...formData }
        if (!updateData.password) {
          delete updateData.password
        }
        await axios.put(`${API_URL}/api/users/${selectedUser._id}`, updateData)
        toast.success("User updated successfully")
      }

      fetchUsers()
      setShowModal(false)
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to ${modalMode} user`)
      console.error(error)
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async () => {
    setActionLoading(true)

    try {
      await axios.delete(`${API_URL}/api/users/${selectedUser._id}`)
      toast.success("User deleted successfully")
      fetchUsers()
      setShowModal(false)
    } catch (error) {
      toast.error("Failed to delete user")
      console.error(error)
    } finally {
      setActionLoading(false)
    }
  }

  const handleToggleStatus = async (userId, isActive) => {
    try {
      await axios.put(`${API_URL}/api/users/${userId}/status`, {
        isActive: !isActive,
      })

      setUsers(users.map((user) => (user._id === userId ? { ...user, isActive: !isActive } : user)))

      toast.success(`User ${!isActive ? "activated" : "deactivated"} successfully`)
    } catch (error) {
      toast.error("Failed to update user status")
      console.error(error)
    }
  }

  if (loading && page === 1) {
    return <LoadingSpinner />
  }

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3">User Management</h1>
        <button className="btn btn-primary" onClick={handleAddUser}>
          <i className="bi bi-person-plus me-2"></i>Add User
        </button>
      </div>

      <div className="card mb-4">
        <div className="card-header">
          <h5 className="mb-0">Filters</h5>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-6 mb-3">
              <label htmlFor="search" className="form-label">
                Search
              </label>
              <input
                type="text"
                className="form-control"
                id="search"
                placeholder="Search by name or email"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="col-md-6 mb-3">
              <label htmlFor="roleFilter" className="form-label">
                Role
              </label>
              <select
                className="form-select"
                id="roleFilter"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="">All Roles</option>
                {USER_ROLES.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h5 className="mb-0">Users</h5>
        </div>
        <div className="card-body">
          {loading && page > 1 ? (
            <div className="text-center py-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-people fs-1 text-muted"></i>
              <p className="mt-3">No users found matching your filters.</p>
              <button
                className="btn btn-outline-primary mt-2"
                onClick={() => {
                  setSearch("")
                  setRoleFilter("")
                }}
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th className="cursor-pointer" onClick={() => handleSort("name")}>
                        Name
                        {sortBy === "name" && (
                          <i className={`bi bi-arrow-${sortOrder === "asc" ? "up" : "down"} ms-1`}></i>
                        )}
                      </th>
                      <th className="cursor-pointer" onClick={() => handleSort("email")}>
                        Email
                        {sortBy === "email" && (
                          <i className={`bi bi-arrow-${sortOrder === "asc" ? "up" : "down"} ms-1`}></i>
                        )}
                      </th>
                      <th className="cursor-pointer" onClick={() => handleSort("role")}>
                        Role
                        {sortBy === "role" && (
                          <i className={`bi bi-arrow-${sortOrder === "asc" ? "up" : "down"} ms-1`}></i>
                        )}
                      </th>
                      <th>Department</th>
                      <th className="cursor-pointer" onClick={() => handleSort("createdAt")}>
                        Created On
                        {sortBy === "createdAt" && (
                          <i className={`bi bi-arrow-${sortOrder === "asc" ? "up" : "down"} ms-1`}></i>
                        )}
                      </th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user._id}>
                        <td>{user.name}</td>
                        <td>{user.email}</td>
                        <td>
                          <span
                            className={`badge bg-${user.role === "superadmin" ? "danger" : user.role === "admin" ? "warning" : "primary"}`}
                          >
                            {USER_ROLES.find((r) => r.value === user.role)?.label || user.role}
                          </span>
                        </td>
                        <td>{user.department || "-"}</td>
                        <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                        <td>
                          <span className={`badge bg-${user.isActive ? "success" : "secondary"}`}>
                            {user.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td>
                          <div className="btn-group">
                            <button className="btn btn-sm btn-outline-primary" onClick={() => handleEditUser(user)}>
                              <i className="bi bi-pencil"></i>
                            </button>
                            <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteUser(user)}>
                              <i className="bi bi-trash"></i>
                            </button>
                            <button
                              className={`btn btn-sm btn-outline-${user.isActive ? "warning" : "success"}`}
                              onClick={() => handleToggleStatus(user._id, user.isActive)}
                              title={user.isActive ? "Deactivate" : "Activate"}
                            >
                              <i className={`bi bi-${user.isActive ? "slash-circle" : "check-circle"}`}></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <nav className="d-flex justify-content-center mt-4">
                  <ul className="pagination">
                    <li className={`page-item ${page === 1 ? "disabled" : ""}`}>
                      <button className="page-link" onClick={() => setPage(page - 1)} disabled={page === 1}>
                        Previous
                      </button>
                    </li>

                    {[...Array(totalPages).keys()].map((i) => (
                      <li key={i} className={`page-item ${page === i + 1 ? "active" : ""}`}>
                        <button className="page-link" onClick={() => setPage(i + 1)}>
                          {i + 1}
                        </button>
                      </li>
                    ))}

                    <li className={`page-item ${page === totalPages ? "disabled" : ""}`}>
                      <button className="page-link" onClick={() => setPage(page + 1)} disabled={page === totalPages}>
                        Next
                      </button>
                    </li>
                  </ul>
                </nav>
              )}
            </>
          )}
        </div>
      </div>

      {/* Add/Edit User Modal */}
      {(modalMode === "add" || modalMode === "edit") && (
        <div className={`modal ${showModal ? "show" : ""}`} style={{ display: showModal ? "block" : "none" }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{modalMode === "add" ? "Add New User" : "Edit User"}</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowModal(false)}
                  disabled={actionLoading}
                ></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
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
                      disabled={modalMode === "edit"}
                    />
                    {modalMode === "edit" && (
                      <small className="form-text text-muted">Email address cannot be changed</small>
                    )}
                  </div>

                  <div className="mb-3">
                    <label htmlFor="password" className="form-label">
                      {modalMode === "add" ? "Password" : "New Password (leave blank to keep current)"}
                    </label>
                    <input
                      type="password"
                      className="form-control"
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      required={modalMode === "add"}
                      minLength={modalMode === "add" || formData.password ? "8" : undefined}
                    />
                    {modalMode === "add" && (
                      <small className="form-text text-muted">Password must be at least 8 characters long</small>
                    )}
                  </div>

                  <div className="mb-3">
                    <label htmlFor="role" className="form-label">
                      Role
                    </label>
                    <select
                      className="form-select"
                      id="role"
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                      required
                    >
                      {USER_ROLES.map((role) => (
                        <option key={role.value} value={role.value}>
                          {role.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-3">
                    <label htmlFor="department" className="form-label">
                      Department (Optional)
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

                  <div className="mb-3">
                    <label htmlFor="phone" className="form-label">
                      Phone Number (Optional)
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
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowModal(false)}
                    disabled={actionLoading}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                    {actionLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        {modalMode === "add" ? "Adding..." : "Updating..."}
                      </>
                    ) : modalMode === "add" ? (
                      "Add User"
                    ) : (
                      "Update User"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete User Modal */}
      {modalMode === "delete" && (
        <div className={`modal ${showModal ? "show" : ""}`} style={{ display: showModal ? "block" : "none" }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Delete User</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowModal(false)}
                  disabled={actionLoading}
                ></button>
              </div>
              <div className="modal-body">
                <p>
                  Are you sure you want to delete the user <strong>{selectedUser?.name}</strong>?
                </p>
                <p className="text-danger">This action cannot be undone.</p>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button type="button" className="btn btn-danger" onClick={handleDelete} disabled={actionLoading}>
                  {actionLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Deleting...
                    </>
                  ) : (
                    "Delete User"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default UserManagement

