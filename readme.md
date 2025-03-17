# Incident Response System (MERN Stack)

## 🚀 Project Overview
This is a **Secure Incident Reporting System** built using the **MERN stack** (MongoDB, Express.js, React.js, Node.js). The system allows users to **submit incidents with file attachments**, while **admins and superadmins** can **manage, update, and delete incidents in real-time** with **Socket.io-powered notifications**.

## 📌 Features
### 🔹 **User Features**
- Submit incidents with **PDF/CSV file attachments**.
- View, search, and filter submitted incidents.
- Receive **real-time notifications** when an admin updates an incident status.

### 🔹 **Admin Features**
- View and manage all incidents.
- Change incident status (**Open, In Progress, Resolved**).
- Receive real-time updates on incident submissions and status changes.
- Perform **bulk actions** (delete incidents, mark multiple as resolved).

### 🔹 **Super Admin Features**
- Manage users (add, edit, delete, assign roles).
- View **audit logs** of actions performed.
- Manage all incidents and delete them permanently.

---

## 🛠️ Technologies Used
- **Frontend:** React.js, Axios, Socket.io-client
- **Backend:** Node.js, Express.js, MongoDB, JWT Authentication, Multer (for file uploads), Socket.io (real-time notifications)
- **Database:** MongoDB
- **Security:** JWT Authentication, Role-Based Access Control (RBAC)

---

## ⚙️ Setup & Installation

### **1️⃣ Clone the Repository**
```sh
git clone https://github.com/Yashlaxwani/Incident_Response_System.git
cd incident-response-system
```

### **2️⃣ Install Dependencies**
#### **Backend**
```sh
cd backend
npm install
```
#### **Frontend**
```sh
cd ../frontend
npm install
```

### **3️⃣ Set Up Environment Variables**
Create a `.env` file in the `backend` directory and add:
```env

```

### **4️⃣ Start the Development Server**
#### **Backend**

cd backend
npm start

#### **Frontend**

cd frontend
npm start

The backend will run on **`http://localhost:5000`**, and the frontend will be available at **`http://localhost:3000`**.

---

## 📜 Step-by-Step Guide on How This Project Was Built

### **1️⃣ Backend Setup**
- Initialized **Node.js & Express.js**.
- Connected MongoDB with **Mongoose**.
- Implemented **JWT Authentication** with role-based access control.
- Created RESTful **API routes** for users, incidents, and file uploads.

### **2️⃣ File Upload System**
- Used **Multer** to handle file uploads.
- Configured Express to serve static files from the `uploads/` folder.

### **3️⃣ Real-Time Features with Socket.io**
- Set up **WebSockets** for real-time updates.
- Implemented **status updates** for incidents.
- Added **real-time notifications** when a user submits a new incident.

### **4️⃣ Frontend Development**
- Created React components for **incident forms, dashboard, and user management**.
- Integrated **Axios** for API requests.
- Used **Socket.io-client** to listen for real-time events.

### **5️⃣ Admin & Superadmin Panel**
- Implemented **incident filtering, bulk actions, and analytics widgets**.
- Designed a **dashboard for incident statistics**.

### **6️⃣ Deployment**
- Deployment left 

---

## 🎯 API Endpoints
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | User login |
| GET | `/api/incidents` | Get all incidents |
| POST | `/api/incidents` | Create a new incident |
| PUT | `/api/incidents/:id/status` | Update incident status |
| DELETE | `/api/incidents/bulk-delete` | Bulk delete incidents |
| POST | `/api/upload` | Upload files |

---

## 🛡️ Security Measures
- **JWT-based authentication & authorization**.
- **Multer for file validation** (only allows PDF/CSV files).
- **Role-based access control (RBAC)** to restrict user actions.

---

## 🏁 Conclusion
This **MERN-based Incident Response System** provides a secure and scalable way to report, manage, and track incidents with **real-time notifications and role-based control**. 🚀

Feel free to contribute by submitting pull requests! 🤝

