import { useState } from "react"
import { Link } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import { toast } from "react-toastify"

const ForgotPassword = () => {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const { forgotPassword } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      await forgotPassword(email)
      setEmailSent(true)
      toast.success("Password reset email sent. Please check your inbox.")
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send reset email. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container">
      <div className="row justify-content-center align-items-center min-vh-100">
        <div className="col-md-6 col-lg-5">
          <div className="card shadow">
            <div className="card-body p-5">
              <div className="text-center mb-4">
                <i className="bi bi-key fs-1 text-primary"></i>
                <h2 className="mt-2">Forgot Password</h2>
                <p className="text-muted">Enter your email to reset your password</p>
              </div>

              {emailSent ? (
                <div className="alert alert-success" role="alert">
                  <h4 className="alert-heading">Email Sent!</h4>
                  <p>
                    We've sent a password reset link to <strong>{email}</strong>. Please check your email and follow the
                    instructions to reset your password.
                  </p>
                  <hr />
                  <p className="mb-0">
                    Didn't receive the email? Check your spam folder or{" "}
                    <button className="btn btn-link p-0" onClick={handleSubmit}>
                      try again
                    </button>
                    .
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label htmlFor="email" className="form-label">
                      Email address
                    </label>
                    <input
                      type="email"
                      className="form-control"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <button type="submit" className="btn btn-primary w-100" disabled={loading}>
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Sending...
                      </>
                    ) : (
                      "Send Reset Link"
                    )}
                  </button>
                </form>
              )}

              <div className="mt-4 text-center">
                <p>
                  Remember your password?{" "}
                  <Link to="/login" className="text-decoration-none">
                    Back to Login
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword

