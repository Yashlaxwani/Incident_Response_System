"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import { API_URL, INCIDENT_CATEGORIES, INCIDENT_PRIORITIES, FILE_UPLOAD_CONFIG } from "../../config"
import { toast } from "react-toastify"

const ReportIncident = () => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    priority: "medium",
    evidence: [],
  })
  const [loading, setLoading] = useState(false)
  const [uploadingFiles, setUploadingFiles] = useState(false)
  const [filePreview, setFilePreview] = useState([])
  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files)

    // Validate file size and type
    const invalidFiles = files.filter((file) => {
      const isValidSize = file.size <= FILE_UPLOAD_CONFIG.maxFileSize
      const fileExt = `.${file.name.split(".").pop().toLowerCase()}`
      const isValidType = FILE_UPLOAD_CONFIG.acceptedFormats.includes(fileExt)

      return !isValidSize || !isValidType
    })

    if (invalidFiles.length > 0) {
      toast.error(`Some files were not added. Please ensure files are under 5MB and in the correct format.`)
      return
    }

    setUploadingFiles(true)

    try {
      // Create preview for each file
      const previews = files.map((file) => {
        return {
          name: file.name,
          size: file.size,
          type: file.type,
          preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : null,
        }
      })

      setFilePreview([...filePreview, ...previews])

      // Prepare files for upload
      const formDataFiles = new FormData()
      files.forEach((file) => {
        formDataFiles.append("files", file)
      })

      // Upload files to server
      const response = await axios.post(`${API_URL}/api/upload`, formDataFiles)

      // Add file URLs to form data
      setFormData({
        ...formData,
        evidence: [...formData.evidence, ...response.data.fileUrls],
      })

      toast.success("Files uploaded successfully")
    } catch (error) {
      toast.error("Failed to upload files")
      console.error(error)
    } finally {
      setUploadingFiles(false)
    }
  }

  const removeFile = (index) => {
    const updatedPreviews = [...filePreview]
    const updatedEvidence = [...formData.evidence]

    updatedPreviews.splice(index, 1)
    updatedEvidence.splice(index, 1)

    setFilePreview(updatedPreviews)
    setFormData({
      ...formData,
      evidence: updatedEvidence,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      await axios.post(`${API_URL}/api/incidents`, formData)
      toast.success("Incident reported successfully")
      navigate("/user/dashboard")
    } catch (error) {
      toast.error("Failed to report incident")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container-fluid">
      <div className="row mb-4">
        <div className="col">
          <h1 className="h3">Report a Security Incident</h1>
          <p className="text-muted">
            Please provide detailed information about the security incident you've encountered.
          </p>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="title" className="form-label">
                Incident Title *
              </label>
              <input
                type="text"
                className="form-control"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                placeholder="Brief title describing the incident"
              />
            </div>

            <div className="row mb-3">
              <div className="col-md-6">
                <label htmlFor="category" className="form-label">
                  Category *
                </label>
                <select
                  className="form-select"
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select a category</option>
                  {INCIDENT_CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-6">
                <label htmlFor="priority" className="form-label">
                  Priority *
                </label>
                <select
                  className="form-select"
                  id="priority"
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  required
                >
                  {INCIDENT_PRIORITIES.map((priority) => (
                    <option key={priority.value} value={priority.value}>
                      {priority.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mb-3">
              <label htmlFor="description" className="form-label">
                Description *
              </label>
              <textarea
                className="form-control"
                id="description"
                name="description"
                rows="5"
                value={formData.description}
                onChange={handleChange}
                required
                placeholder="Provide a detailed description of the incident, including when it occurred, how it was discovered, and any other relevant information."
              ></textarea>
            </div>

            <div className="mb-3">
              <label htmlFor="evidence" className="form-label">
                Evidence (Optional)
              </label>
              <div className="input-group mb-3">
                <input
                  type="file"
                  className="form-control"
                  id="evidence"
                  multiple
                  onChange={handleFileChange}
                  disabled={uploadingFiles}
                />
                <label className="input-group-text" htmlFor="evidence">
                  {uploadingFiles ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Uploading...
                    </>
                  ) : (
                    "Upload"
                  )}
                </label>
              </div>
              <small className="form-text text-muted">
                Accepted formats: JPG, PNG, PDF, DOC, DOCX, TXT. Max size: 5MB per file.
              </small>

              {filePreview.length > 0 && (
                <div className="mt-3">
                  <h6>Uploaded Files:</h6>
                  <div className="row">
                    {filePreview.map((file, index) => (
                      <div key={index} className="col-md-3 mb-3">
                        <div className="card">
                          {file.preview ? (
                            <img
                              src={file.preview || "/placeholder.svg"}
                              className="card-img-top"
                              alt={file.name}
                              style={{ height: "120px", objectFit: "cover" }}
                            />
                          ) : (
                            <div
                              className="card-img-top bg-light d-flex align-items-center justify-content-center"
                              style={{ height: "120px" }}
                            >
                              <i className="bi bi-file-earmark-text fs-1"></i>
                            </div>
                          )}
                          <div className="card-body p-2">
                            <p className="card-text small text-truncate">{file.name}</p>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger w-100"
                              onClick={() => removeFile(index)}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="d-flex justify-content-end gap-2">
              <button type="button" className="btn btn-outline-secondary" onClick={() => navigate("/user/dashboard")}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading || uploadingFiles}>
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Submitting...
                  </>
                ) : (
                  "Submit Report"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default ReportIncident

