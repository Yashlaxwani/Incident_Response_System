"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import axios from "axios"
import { API_URL, CHART_COLORS } from "../../config"
import { toast } from "react-toastify"
import LoadingSpinner from "../../components/common/LoadingSpinner"
import { Bar, Pie } from "react-chartjs-2"
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from "chart.js"

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title)

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    inProgress: 0,
    resolved: 0,
    averageResolutionTime: 0,
    categoryCounts: {},
    recentIncidents: [],
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/admin/dashboard`)
        setStats(response.data)
      } catch (error) {
        toast.error("Failed to fetch dashboard data")
        console.error(error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  const pieChartData = {
    labels: ["Open", "In Progress", "Resolved"],
    datasets: [
      {
        data: [stats.open, stats.inProgress, stats.resolved],
        backgroundColor: [CHART_COLORS.danger, CHART_COLORS.warning, CHART_COLORS.success],
        borderWidth: 1,
      },
    ],
  }

  const barChartData = {
    labels: Object.keys(stats.categoryCounts || {}),
    datasets: [
      {
        label: "Incidents by Category",
        data: Object.values(stats.categoryCounts || {}),
        backgroundColor: CHART_COLORS.primary,
        borderColor: CHART_COLORS.primary,
        borderWidth: 1,
      },
    ],
  }

  const barChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "Incidents by Category",
      },
    },
  }

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3">Admin Dashboard</h1>
        <Link to="/admin/incidents" className="btn btn-primary">
          <i className="bi bi-list-ul me-2"></i>Manage All Incidents
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

      <div className="row mb-4">
        <div className="col-md-6">
          <div className="card h-100">
            <div className="card-header">
              <h5 className="mb-0">Incidents by Status</h5>
            </div>
            <div className="card-body d-flex align-items-center justify-content-center">
              <div style={{ width: "300px", height: "300px" }}>
                <Pie data={pieChartData} />
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card h-100">
            <div className="card-header">
              <h5 className="mb-0">Most Common Categories</h5>
            </div>
            <div className="card-body">
              <Bar data={barChartData} options={barChartOptions} />
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Average Resolution Time</h5>
            </div>
            <div className="card-body text-center">
              <h2 className="display-4 text-primary">
                {stats.averageResolutionTime ? `${stats.averageResolutionTime.toFixed(1)} hours` : "N/A"}
              </h2>
              <p className="text-muted">Average time to resolve incidents</p>
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Recent Incidents</h5>
              <Link to="/admin/incidents" className="btn btn-sm btn-outline-primary">
                View All
              </Link>
            </div>
            <div className="card-body">
              {stats.recentIncidents.length === 0 ? (
                <p className="text-muted text-center py-4">No recent incidents</p>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>Status</th>
                        <th>Reported</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.recentIncidents.map((incident) => (
                        <tr key={incident._id}>
                          <td>{incident.title}</td>
                          <td>
                            <span
                              className={`badge bg-${incident.status === "open" ? "danger" : incident.status === "in-progress" ? "warning" : "success"}`}
                            >
                              {incident.status === "open"
                                ? "Open"
                                : incident.status === "in-progress"
                                  ? "In Progress"
                                  : "Resolved"}
                            </span>
                          </td>
                          <td>{new Date(incident.createdAt).toLocaleDateString()}</td>
                          <td>
                            <Link to={`/admin/incidents/${incident._id}`} className="btn btn-sm btn-outline-primary">
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
      </div>
    </div>
  )
}

export default AdminDashboard

