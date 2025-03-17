import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import axios from "axios"
import { API_URL, INCIDENT_STATUSES, INCIDENT_PRIORITIES } from "../../config"
import { toast } from "react-toastify"
import LoadingSpinner from "../../components/common/LoadingSpinner"

const ViewIncident = () => {
  const [incident, setIncident] = useState(null)
  const [loading, setLoading] = useState(true)
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState("")
  const [submittingComment, setSubmittingComment] = useState(false)
  const { id } = useParams()
  const navigate = useNavigate()

  useEffect(() => {
    const fetchIncident = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/incidents/${id}`)
        setIncident(response.data)

        // Fetch comments
        const commentsResponse = await axios.get(`${API_URL}/api/incidents/${id}/comments`)
        setComments(commentsResponse.data)
      } catch (error) {
        toast.error("Failed to fetch incident details")
        console.error(error)
        navigate("/user/dashboard")
      } finally {
        setLoading(false)
      }
    }

    fetchIncident()
  }, [id, navigate])

  const getStatusBadge = (status) => {
    const statusObj = INCIDENT_STATUSES.find((s) => s.value === status)
    return <span className={`badge bg-${statusObj?.color || "secondary"}`}>{statusObj?.label || status}</span>
  }

  const getPriorityBadge = (priority) => {
    const priorityObj = INCIDENT_PRIORITIES.find((p) => p.value === priority)
    return <span className={`badge bg-${priorityObj?.color || "secondary"}`}>{priorityObj?.label || priority}</span>
  }

  const handleCommentSubmit = async (e) => {
    e.preventDefault()

    if (!newComment.trim()) return

    setSubmittingComment(true)

    try {
      const response = await axios.post(`${API_URL}/api/incidents/${id}/comments`, {
        content: newComment,
      })

      setComments([...comments, response.data])
      setNewComment("")
      toast.success("Comment added successfully")
    } catch (error) {
      toast.error("Failed to add comment")
      console.error(error)
    } finally {
      setSubmittingComment(false)
    }
  }

  const openFile = (url) => {
    try {
      // Check if URL is defined
      if (!url) {
        console.error("File URL is undefined")
        toast.error("File URL is missing")
        return
      }

      // Check if URL is a string
      if (typeof url !== "string") {
        console.error("File URL is not a string:", url)
        toast.error("Invalid file URL format")
        return
      }

      // Extract the filename from the URL
      const filename = url.split("/").pop()

      // Create a direct URL to the file
      const fileUrl = `${API_URL}/api/upload/${filename}`
      console.log("Opening file URL:", fileUrl)

      // Open in a new tab
      window.open(fileUrl, "_blank")
    } catch (error) {
      console.error("Error opening file:", error)
      toast.error("Failed to open file")
    }
  }

  if (loading) {
    return <LoadingSpinner />
  }

  if (!incident) {
    return (
      <div className="container-fluid">
        <div className="alert alert-danger">Incident not found or you don't have permission to view it.</div>
      </div>
    )
  }

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3">Incident Details</h1>
        <button className="btn btn-outline-secondary" onClick={() => navigate("/user/dashboard")}>
          <i className="bi bi-arrow-left me-2"></i>Back to Dashboard
        </button>
      </div>

      <div className="row">
        <div className="col-lg-8">
          <div className="card mb-4">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Incident Information</h5>
              <div>{getStatusBadge(incident.status)}</div>
            </div>
            <div className="card-body">
              <h4>{incident.title}</h4>
              <div className="mb-3">
                <span className="badge bg-primary me-2">{incident.category}</span>
                {getPriorityBadge(incident.priority)}
              </div>

              <h6>Description</h6>
              <p className="mb-4" style={{ whiteSpace: "pre-line" }}>
                {incident.description}
              </p>

              {incident.evidence && incident.evidence.length > 0 && (
                <div className="mb-4">
                  <h6>Evidence</h6>
                  <div className="row">
                    {incident.evidence.map((file, index) => (
                      <div key={index} className="col-md-3 mb-3">
                        <div className="card h-100">
                          {file.type?.startsWith("image/") ? (
                            <img
                              src={file.url || "/placeholder.svg"}
                              className="card-img-top evidence-thumbnail"
                              alt={file.name}
                              onClick={() => openFile(file.url)}
                              style={{ height: "120px", objectFit: "cover", cursor: "pointer" }}
                            />
                          ) : (
                            <div
                              className="card-img-top bg-light d-flex align-items-center justify-content-center"
                              style={{ height: "120px", cursor: "pointer" }}
                              onClick={() => openFile(file.url)}
                            >
                              <i className="bi bi-file-earmark-text fs-1"></i>
                            </div>
                          )}
                          <div className="card-body p-2">
                            <p className="card-text small text-truncate">{file.name}</p>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-primary w-100"
                              onClick={() => openFile(file.url)}
                            >
                              View
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="d-flex justify-content-between text-muted small">
                <div>Reported by: {incident.reportedBy?.name || "Anonymous"}</div>
                <div>Date: {new Date(incident.createdAt).toLocaleString()}</div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Comments & Updates</h5>
            </div>
            <div className="card-body">
              {comments.length === 0 ? (
                <p className="text-muted text-center py-4">No comments yet</p>
              ) : (
                <div className="mb-4">
                  {comments.map((comment) => (
                    <div key={comment._id} className="mb-3 p-3 border rounded">
                      <div className="d-flex justify-content-between mb-2">
                        <div className="fw-bold">{comment.user?.name || "System"}</div>
                        <div className="text-muted small">{new Date(comment.createdAt).toLocaleString()}</div>
                      </div>
                      <p className="mb-0">{comment.content}</p>
                    </div>
                  ))}
                </div>
              )}

              <form onSubmit={handleCommentSubmit}>
                <div className="mb-3">
                  <label htmlFor="comment" className="form-label">
                    Add a Comment
                  </label>
                  <textarea
                    className="form-control"
                    id="comment"
                    rows="3"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Enter your comment or question here..."
                    required
                  ></textarea>
                </div>
                <button type="submit" className="btn btn-primary" disabled={submittingComment}>
                  {submittingComment ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Submitting...
                    </>
                  ) : (
                    "Submit Comment"
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="mb-0">Status Timeline</h5>
            </div>
            <div className="card-body">
              {incident.statusHistory && incident.statusHistory.length > 0 ? (
                <div className="timeline">
                  {incident.statusHistory.map((status, index) => (
                    <div key={index} className="mb-3 pb-3 border-bottom">
                      <div className="d-flex justify-content-between mb-1">
                        <div>{getStatusBadge(status.status)}</div>
                        <div className="text-muted small">{new Date(status.timestamp).toLocaleString()}</div>
                      </div>
                      {status.comment && <p className="mb-0 small">{status.comment}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted text-center py-4">No status updates yet</p>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Assigned To</h5>
            </div>
            <div className="card-body">
              {incident.assignedTo ? (
                <div className="d-flex align-items-center">
                  <div className="user-avatar me-3">
                    {incident.assignedTo.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .substring(0, 2)}
                  </div>
                  <div>
                    <div className="fw-bold">{incident.assignedTo.name}</div>
                    <div className="text-muted small">{incident.assignedTo.email}</div>
                  </div>
                </div>
              ) : (
                <p className="text-muted text-center py-4">Not assigned yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ViewIncident

