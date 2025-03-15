const Footer = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-light py-3 mt-auto border-top">
      <div className="container-fluid">
        <div className="d-flex flex-wrap justify-content-between align-items-center">
          <p className="mb-0 text-muted">&copy; {currentYear} Incident Reporting System. All rights reserved.</p>
          <div>
            <span className="text-muted">Designed by </span>
            <a
              href="https://www.linkedin.com/in/yash-laxwani/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-decoration-none"
            >
              Yash Laxwani
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer

