"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import axios from "axios"
import { API_URL, INCIDENT_STATUSES } from "../../config"
import { useAuth } from "../../context/AuthContext"
import { toast } from "react-toastify"
import LoadingSpinner from "../../components/common/LoadingSpinner"

const Dashboard = () => {
  const [incidents, setIncidents] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    inProgress: 0,
    resolved: 0,
  })
  const { currentUser } = useAuth()

  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/incidents/user`)
        setIncidents(response.data)

        // Calculate stats
        const total = response.data.length
        const open = response.data.filter((inc) => inc.status === "open").length
        const inProgress = response.data.filter((inc) => inc.status === "in-progress").length
        const resolved = response.data.filter((inc) => inc.status === "resolved").length

        setStats({ total, open, inProgress, resolved })
      } catch (error) {
        toast.error("Failed to fetch incidents")
        console.error(error)
      } finally {
        setLoading(false)
      }
    }

    fetchIncidents()
  }, [])

  const getStatusBadge = (status) => {
    const statusObj = INCIDENT_STATUSES.find((s) => s.value === status)
    return <span className={`badge bg-${statusObj?.color || "secondary"}`}>{statusObj?.label || status}</span>
  }

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3">User Dashboard</h1>
        <Link to="/user/report-incident" className="btn btn-primary">
          <i className="bi bi-plus-circle me-2"></i>Report New Incident
        </Link>
      </div>

      <div className="row mb-4">
        <div className="col-md-3">
          <div className="card bg-primary text-white">
            <div className="card-body">
              <h5 className="card-title">Total Incidents</h5>
              <h2 className="display-4">{stats.total}</h2>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-danger text-white">
            <div className="card-body">
              <h5 className="card-title">Open</h5>
              <h2 className="display-4">{stats.open}</h2>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-warning text-white">
            <div className="card-body">
              <h5 className="card-title">In Progress</h5>
              <h2 className="display-4">{stats.inProgress}</h2>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-success text-white">
            <div className="card-body">
              <h5 className="card-title">Resolved</h5>
              <h2 className="display-4">{stats.resolved}</h2>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h5 className="mb-0">My Reported Incidents</h5>
        </div>
        <div className="card-body">
          {incidents.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-exclamation-circle fs-1 text-muted"></i>
              <p className="mt-3">You haven't reported any incidents yet.</p>
              <Link to="/user/report-incident" className="btn btn-primary mt-2">
                Report an Incident
              </Link>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Category</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Date Reported</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {incidents.map((incident) => (
                    <tr key={incident._id}>
                      <td>{incident.title}</td>
                      <td>{incident.category}</td>
                      <td>
                        <span
                          className={`badge bg-${incident.priority === "high" ? "danger" : incident.priority === "medium" ? "warning" : "success"}`}
                        >
                          {incident.priority.charAt(0).toUpperCase() + incident.priority.slice(1)}
                        </span>
                      </td>
                      <td>{getStatusBadge(incident.status)}</td>
                      <td>{new Date(incident.createdAt).toLocaleDateString()}</td>
                      <td>
                        <Link to={`/user/incidents/${incident._id}`} className="btn btn-sm btn-outline-primary">
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard

