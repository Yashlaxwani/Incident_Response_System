import { useState, useEffect } from "react"
import axios from "axios"
import { API_URL } from "../../config"
import { toast } from "react-toastify"
import LoadingSpinner from "../../components/common/LoadingSpinner"

const AuditLogs = () => {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState("")
  const [sortBy, setSortBy] = useState("timestamp")
  const [sortOrder, setSortOrder] = useState("desc")

  useEffect(() => {
    fetchAuditLogs()
  }, [page, search, sortBy, sortOrder])

  const fetchAuditLogs = async () => {
    setLoading(true)
    try {
      const queryParams = new URLSearchParams({
        page,
        limit: 10,
        sortBy,
        sortOrder,
        search,
      })
      const response = await axios.get(`${API_URL}/api/audit-logs?${queryParams}`)
      setLogs(response.data.logs)
      setTotalPages(response.data.totalPages)
    } catch (error) {
      toast.error("Failed to fetch audit logs")
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

  if (loading && page === 1) {
    return <LoadingSpinner />
  }

  return (
    <div className="container-fluid">
      <h1 className="h3 mb-4">Audit Logs</h1>

      <div className="card mb-4">
        <div className="card-header">
          <h5 className="mb-0">Filters</h5>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-6">
              <label htmlFor="search" className="form-label">
                Search
              </label>
              <input
                type="text"
                className="form-control"
                id="search"
                placeholder="Search by user or action"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          {logs.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-journal-text fs-1 text-muted"></i>
              <p className="mt-3">No audit logs found.</p>
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th onClick={() => handleSort("user")} className="cursor-pointer">
                        User
                        {sortBy === "user" && (
                          <i className={`bi bi-arrow-${sortOrder === "asc" ? "up" : "down"} ms-1`}></i>
                        )}
                      </th>
                      <th>Action</th>
                      <th onClick={() => handleSort("timestamp")} className="cursor-pointer">
                        Timestamp
                        {sortBy === "timestamp" && (
                          <i className={`bi bi-arrow-${sortOrder === "asc" ? "up" : "down"} ms-1`}></i>
                        )}
                      </th>
                      <th>Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log._id}>
                        <td>{log.user?.name || "System"}</td>
                        <td>{log.action}</td>
                        <td>{new Date(log.timestamp).toLocaleString()}</td>
                        <td>{log.details}</td>
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
    </div>
  )
}

export default AuditLogs

