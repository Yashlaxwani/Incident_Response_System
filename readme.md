# Secure Incident Reporting System

A highly secure and scalable cybersecurity Incident Reporting System with advanced dashboard functionalities, filtering, logging, and role-based access control (RBAC).

## Features

### Authentication & Role-Based Access Control (RBAC)
- **Users**: Can submit incidents and view only their own reports
- **Admins**: Can view, update, filter, and manage all incidents
- **Super Admin**: Can manage users, assign roles, and delete incidents permanently

### Advanced Dashboard (Role-Based Views)
- **For Users**:
  - View their submitted incidents in a clean table format
  - Search, sort, and filter incidents by category, status, or date
  - Receive real-time notifications when an admin updates their incident status

- **For Admins**:
  - Analytics Dashboard with widgets for total incidents, open vs resolved incidents, most common categories, and average resolution time
  - Incident Filters & Sorting by status, category, date, severity, or user reports
  - Bulk Actions to mark multiple incidents as resolved, assign incidents to different admins, and export incidents as CSV or PDF

- **For Super Admin**:
  - User Management System to add, edit, or delete users, assign roles, and block or unblock users
  - Audit Logs to track who created, modified, or deleted incidents

### Incident Reporting Form
- Fields: Title, Description, Category, Priority, Date, Evidence Upload
- Form Validation for required fields, file size limit, and accepted formats

### Real-time Updates & Notifications
- Users get notifications when an admin updates their incident
- Admins see real-time incident reports without page refresh

## Technologies Used

### Frontend
- React.js
- Bootstrap for UI components
- React Router for navigation
- Context API for state management
- Socket.io client for real-time updates
- Chart.js for data visualization

### Backend
- Node.js with Express
- MongoDB with Mongoose
- JWT for authentication
- Socket.io for real-time communication
- Multer for file uploads
- Nodemailer for email notifications
- PDF generation and CSV export functionality

## Project Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (v4 or higher)
- npm or yarn

### Backend Setup
1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/secure-incident-reporting-system.git
   cd secure-incident-reporting-system