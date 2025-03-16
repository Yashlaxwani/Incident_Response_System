import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import axios from "axios"
import { API_URL, CHART_COLORS } from "../../config"
import { toast } from "react-toastify"
import LoadingSpinner from "../../components/common/LoadingSpinner"
import { getSocket } from "../../services/socketService"
import { Bar, Pie, Line } from "react-chartjs-2"
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  PointElement,
  LineElement,
} from "chart.js"

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, PointElement, LineElement)

const SuperAdminDashboard = () => {
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    inProgress: 0,
    resolved: 0,
    averageResolutionTime: 0,
    categoryCounts: {},
    userCounts: {
      total: 0,
      users: 0,
      admins: 0,
      superadmins: 0,
    },
    recentIncidents: [],
    incidentTrend: [],
  })
  const [loading, setLoading] = useState(true)

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/superadmin/dashboard`)
      setStats(response.data)
    } catch (error) {
      toast.error("Failed to fetch dashboard data")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()

    // Set up socket event listeners for real-time updates
    const socket = getSocket()

    console.log(socket)

    if (socket) {
      // Listen for incident updates
      socket.on("incidentUpdate", (data) => {
        console.log("Incident updated:", data)
        fetchDashboardData()
      })

      // Listen for new incidents
      socket.on("newIncident", (data) => {
        console.log("New incident created:", data)
        fetchDashboardData()

        // Add toast notification
        toast.info(`New incident reported: ${data.incident?.title || "Untitled"}`)
      })
    }

    return () => {
      // Cleanup event listeners
      if (socket) {
        socket.off("incidentUpdate")
        socket.off("newIncident")
      }
    }
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

  const userChartData = {
    labels: ["Regular Users", "Admins", "Super Admins"],
    datasets: [
      {
        data: [stats.userCounts?.users || 0, stats.userCounts?.admins || 0, stats.userCounts?.superadmins || 0],
        backgroundColor: [CHART_COLORS.info, CHART_COLORS.warning, CHART_COLORS.danger],
        borderWidth: 1,
      },
    ],
  }

  const trendChartData = {
    labels: stats.incidentTrend?.map((item) => item.date) || [],
    datasets: [
      {
        label: "Incidents",
        data: stats.incidentTrend?.map((item) => item.count) || [],
        borderColor: CHART_COLORS.primary,
        backgroundColor: "rgba(13, 110, 253, 0.1)",
        fill: true,
        tension: 0.4,
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

  const lineChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "Incident Trend (Last 30 Days)",
      },
    },
  }

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3">Super Admin Dashboard</h1>
        <div className="d-flex gap-2">
          <Link to="/superadmin/users" className="btn btn-primary">
            <i className="bi bi-people me-2"></i>Manage Users
          </Link>
          <Link to="/superadmin/audit-logs" className="btn btn-outline-secondary">
            <i className="bi bi-journal-text me-2"></i>Audit Logs
          </Link>
        </div>
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
        <div className="col-md-8">
          <div className="card h-100">
            <div className="card-header">
              <h5 className="mb-0">Incident Trend</h5>
            </div>
            <div className="card-body">
              <Line data={trendChartData} options={lineChartOptions} />
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card h-100">
            <div className="card-header">
              <h5 className="mb-0">User Distribution</h5>
            </div>
            <div className="card-body d-flex align-items-center justify-content-center">
              <div style={{ width: "250px", height: "250px" }}>
                <Pie data={userChartData} />
              </div>
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
              <h5 className="mb-0">System Statistics</h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6 mb-3">
                  <div className="border rounded p-3 text-center">
                    <h6 className="text-muted">Total Users</h6>
                    <h3 className="mb-0">{stats.userCounts?.total || 0}</h3>
                  </div>
                </div>
                <div className="col-md-6 mb-3">
                  <div className="border rounded p-3 text-center">
                    <h6 className="text-muted">Average Resolution Time</h6>
                    <h3 className="mb-0">
                      {stats.averageResolutionTime ? `${stats.averageResolutionTime.toFixed(1)} hrs` : "N/A"}
                    </h3>
                  </div>
                </div>
                <div className="col-md-6 mb-3">
                  <div className="border rounded p-3 text-center">
                    <h6 className="text-muted">Incidents This Month</h6>
                    <h3 className="mb-0">{stats.incidentsThisMonth || 0}</h3>
                  </div>
                </div>
                <div className="col-md-6 mb-3">
                  <div className="border rounded p-3 text-center">
                    <h6 className="text-muted">Active Admins</h6>
                    <h3 className="mb-0">{stats.activeAdmins || 0}</h3>
                  </div>
                </div>
              </div>
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

export default SuperAdminDashboard

