import { useState, useEffect, useCallback } from "react"
import { Link } from "react-router-dom"
import axios from "axios"
import { API_URL, INCIDENT_CATEGORIES, INCIDENT_STATUSES, INCIDENT_PRIORITIES } from "../../config"
import { toast } from "react-toastify"
import LoadingSpinner from "../../components/common/LoadingSpinner"

const ManageIncidents = () => {
  const [incidents, setIncidents] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    status: "",
    category: "",
    priority: "",
    search: "",
  })
  const [sortBy, setSortBy] = useState("createdAt")
  const [sortOrder, setSortOrder] = useState("desc")
  const [selectedIncidents, setSelectedIncidents] = useState([])
  const [bulkActionLoading, setBulkActionLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [exporting, setExporting] = useState(false)

  const fetchIncidents = useCallback(async () => {
    setLoading(true)
    try {
      const queryParams = new URLSearchParams({
        page,
        limit: 10,
        sortBy,
        sortOrder,
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== "")),
      })

      const response = await axios.get(`${API_URL}/api/incidents?${queryParams}`)
      setIncidents(response.data.incidents)
      setTotalPages(response.data.totalPages)
    } catch (error) {
      toast.error("Failed to fetch incidents")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }, [filters, sortBy, sortOrder, page])

  useEffect(() => {
    fetchIncidents()
  }, [fetchIncidents])

  const handleFilterChange = (e) => {
    const { name, value } = e.target
    setFilters((prev) => ({ ...prev, [name]: value }))
    setPage(1) // Reset to first page when filters change
  }

  const handleSort = (field) => {
    setSortBy((prevSortBy) => (prevSortBy === field ? prevSortBy : field))
    setSortOrder((prevSortOrder) => (sortBy === field ? (prevSortOrder === "asc" ? "desc" : "asc") : "asc"))
  }

  const handleSelectAll = (e) => {
    setSelectedIncidents(e.target.checked ? incidents.map((incident) => incident._id) : [])
  }

  const handleSelectIncident = (e, id) => {
    if (e.target.checked) {
      setSelectedIncidents((prev) => [...prev, id])
    } else {
      setSelectedIncidents((prev) => prev.filter((selectedId) => selectedId !== id))
    }
  }

  // Function to delete selected incidents
  const deleteSelected = async () => {
    if (selectedIncidents.length === 0) {
      toast.warn("No incidents selected to delete")
      return
    }

    const confirmation = window.confirm(
      `Are you sure you want to delete ${selectedIncidents.length} incidents? This action cannot be undone.`,
    )

    if (!confirmation) return

    setBulkActionLoading(true)
    try {
      // Send the DELETE request to the server with the selected incident IDs
      const response = await axios.delete(`${API_URL}/api/incidents/bulk-delete`, {
        data: { ids: selectedIncidents },
      })

      // If successful, filter out the deleted incidents from the current list
      setIncidents((prevIncidents) => prevIncidents.filter((incident) => !selectedIncidents.includes(incident._id)))
      setSelectedIncidents([]) // Clear selected incidents after delete
      toast.success(`${response.data.count} incidents deleted successfully`)
    } catch (error) {
      toast.error("Failed to delete selected incidents")
      console.error(error)
    } finally {
      setBulkActionLoading(false)
    }
  }

  return (
    <div className="container-fluid">
      <h1 className="h3">Manage Incidents</h1>

      {/* Filters */}
      <div className="card mb-4">
        <div className="card-header">
          <h5>Filters</h5>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-3">
              <label className="form-label">Status</label>
              <select className="form-select" name="status" value={filters.status} onChange={handleFilterChange}>
                <option value="">All</option>
                {INCIDENT_STATUSES.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-3">
              <label className="form-label">Category</label>
              <select className="form-select" name="category" value={filters.category} onChange={handleFilterChange}>
                <option value="">All</option>
                {INCIDENT_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-3">
              <label className="form-label">Priority</label>
              <select className="form-select" name="priority" value={filters.priority} onChange={handleFilterChange}>
                <option value="">All</option>
                {INCIDENT_PRIORITIES.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-3">
              <label className="form-label">Search</label>
              <input
                type="text"
                className="form-control"
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
                placeholder="Search..."
              />
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="card-header d-flex justify-content-between">
          <h5>Incidents</h5>
          {selectedIncidents.length > 0 && (
            <button className="btn btn-danger btn-sm" onClick={deleteSelected} disabled={bulkActionLoading}>
              {bulkActionLoading ? "Deleting..." : "Delete Selected"}
            </button>
          )}
        </div>
        <div className="card-body">
          {loading ? (
            <LoadingSpinner />
          ) : incidents.length === 0 ? (
            <p className="text-center">No incidents found.</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      checked={selectedIncidents.length === incidents.length && incidents.length > 0}
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th onClick={() => handleSort("title")}>Title</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th onClick={() => handleSort("status")}>Status</th>
                  <th onClick={() => handleSort("createdAt")}>Reported On</th>
                  <th>Reported By</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {incidents.map((incident) => (
                  <tr key={incident._id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedIncidents.includes(incident._id)}
                        onChange={(e) => handleSelectIncident(e, incident._id)}
                      />
                    </td>
                    <td>{incident.title}</td>
                    <td>{incident.category}</td>
                    <td>{incident.priority}</td>
                    <td>{incident.status}</td>
                    <td>{new Date(incident.createdAt).toLocaleDateString()}</td>
                    <td>{incident.reportedBy?.name || "Anonymous"}</td>
                    <td>
                      <Link to={`/admin/incidents/${incident._id}`} className="btn btn-sm btn-outline-primary">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

export default ManageIncidents

