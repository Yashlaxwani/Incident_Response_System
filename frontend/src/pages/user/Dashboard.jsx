import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import axios from "axios"
import { API_URL, INCIDENT_STATUSES, INCIDENT_CATEGORIES } from "../../config"
import { useAuth } from "../../context/AuthContext"
import { toast } from "react-toastify"
import LoadingSpinner from "../../components/common/LoadingSpinner"
import { getSocket } from "../../services/socketService";

const Dashboard = () => {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    inProgress: 0,
    resolved: 0,
  });
  // Add these states for filtering and sorting
  const [filters, setFilters] = useState({
    status: "",
    category: "",
    search: "",
  });
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  
  const { currentUser } = useAuth();



  const fetchIncidents = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/incidents/user`);
      setIncidents(response.data);

      // Calculate stats
      const total = response.data.length;
      const open = response.data.filter((inc) => inc.status === "open").length;
      const inProgress = response.data.filter((inc) => inc.status === "in-progress").length;
      const resolved = response.data.filter((inc) => inc.status === "resolved").length;
  
      setStats({ total, open, inProgress, resolved });
    } catch (error) {
      toast.error("Failed to fetch incidents");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
    
    // Set up socket listeners
    const socket = getSocket();
    if (socket) {
      socket.on("incidentUpdate", (data) => {
        // Refresh the incidents list when any update occurs
        fetchIncidents();
      });
    }
    
    return () => {
      const socket = getSocket();
      if (socket) {
        socket.off("incidentUpdate");
      }
    };
  }, []);

  // Local filter and sort
  const filteredAndSortedIncidents = () => {
    let filteredIncidents = incidents;

    // Apply filters
    if (filters.status) {
      filteredIncidents = filteredIncidents.filter((inc) => inc.status === filters.status);
    }
    if (filters.category) {
      filteredIncidents = filteredIncidents.filter((inc) => inc.category === filters.category);
    }
    if (filters.search) {
      filteredIncidents = filteredIncidents.filter((inc) =>
        inc.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        inc.description.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    // Apply sorting
    filteredIncidents = filteredIncidents.sort((a, b) => {
      if (sortBy === "createdAt") {
        return sortOrder === "asc" 
          ? new Date(a.createdAt) - new Date(b.createdAt) 
          : new Date(b.createdAt) - new Date(a.createdAt);
      } else {
        if (a[sortBy] < b[sortBy]) return sortOrder === "asc" ? -1 : 1;
        if (a[sortBy] > b[sortBy]) return sortOrder === "asc" ? 1 : -1;
        return 0;
      }
    });

    return filteredIncidents;
  }

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => {
      const newFilters = { ...prev, [name]: value };
      return newFilters;
    });
  };
  
  const handleSort = (field) => {
    setSortBy(prevSortBy => {
      if (prevSortBy === field) {
        const newSortOrder = sortOrder === "asc" ? "desc" : "asc";
        setSortOrder(newSortOrder);
        return field;
      } else {
        setSortOrder("asc");
        return field;
      }
    });
  };

  const getStatusBadge = (status) => {
    const statusObj = INCIDENT_STATUSES.find((s) => s.value === status)
    return <span className={`badge bg-${statusObj?.color || "secondary"}`}>{statusObj?.label || status}</span>
  }

  if (loading) {
    return <LoadingSpinner />
  }

  const incidentsToDisplay = filteredAndSortedIncidents();

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

      <div className="card mb-4">
        <div className="card-header">
          <h5>Filters</h5>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-3">
              <label className="form-label">Status</label>
              <select 
                className="form-select" 
                name="status" 
                value={filters.status} 
                onChange={handleFilterChange}
              >
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
              <select 
                className="form-select" 
                name="category" 
                value={filters.category} 
                onChange={handleFilterChange}
              >
                <option value="">All</option>
                {INCIDENT_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-6">
              <label className="form-label">Search</label>
              <input
                type="text"
                className="form-control"
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
                placeholder="Search by title or description..."
              />
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h5 className="mb-0">My Reported Incidents</h5>
        </div>
        <div className="card-body">
          {incidentsToDisplay.length === 0 ? (
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
                    <th onClick={() => handleSort("title")} style={{cursor: 'pointer'}}>
                      Title {sortBy === "title" && <i className={`bi bi-arrow-${sortOrder === "asc" ? "up" : "down"}`}></i>}
                    </th>
                    <th onClick={() => handleSort("category")} style={{cursor: 'pointer'}}>
                      Category {sortBy === "category" && <i className={`bi bi-arrow-${sortOrder === "asc" ? "up" : "down"}`}></i>}
                    </th>
                    <th onClick={() => handleSort("priority")} style={{cursor: 'pointer'}}>
                      Priority {sortBy === "priority" && <i className={`bi bi-arrow-${sortOrder === "asc" ? "up" : "down"}`}></i>}
                    </th>
                    <th onClick={() => handleSort("status")} style={{cursor: 'pointer'}}>
                      Status {sortBy === "status" && <i className={`bi bi-arrow-${sortOrder === "asc" ? "up" : "down"}`}></i>}
                    </th>
                    <th onClick={() => handleSort("createdAt")} style={{cursor: 'pointer'}}>
                      Date Reported {sortBy === "createdAt" && <i className={`bi bi-arrow-${sortOrder === "asc" ? "up" : "down"}`}></i>}
                    </th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {incidentsToDisplay.map((incident) => (
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

export default Dashboard;
