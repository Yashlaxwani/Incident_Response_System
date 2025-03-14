import React from 'react';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-dark text-white py-4 mt-auto">
      <div className="container">
        <div className="row">
          <div className="col-md-6">
            <p className="mb-0">
              &copy; {currentYear} Incident Reporting System. All Rights Reserved.
            </p>
          </div>
          <div className="col-md-6 text-md-end">
            <p className="mb-0">
              Designed by{' '}
              <a 
                href="https://www.linkedin.com/in/yashlaxwani/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-white text-decoration-underline"
              >
                Yash Laxwani
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;