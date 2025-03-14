const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")
const dotenv = require("dotenv")
const connectDB = require("./config/db")

// Load env vars
dotenv.config()

// Import models
const User = require("./models/User")

// Connect to DB
connectDB()

// Create users
const createUsers = async () => {
  try {
    // Clear existing users
    await User.deleteMany({})

    console.log("Creating users...")

    // Create a superadmin
    const superAdmin = new User({
      name: "Super Admin",
      email: "superadmin@example.com",
      password: "password123",
      role: "superadmin",
      isActive: true,
    })

    await superAdmin.save()
    console.log("Super Admin created")

    // Create an admin
    const admin = new User({
      name: "Admin User",
      email: "admin@example.com",
      password: "password123",
      role: "admin",
      isActive: true,
    })

    await admin.save()
    console.log("Admin created")

    // Create a regular user
    const user = new User({
      name: "Regular User",
      email: "user@example.com",
      password: "password123",
      role: "user",
      isActive: true,
    })

    await user.save()
    console.log("Regular User created")

    console.log("Users created successfully!")
    process.exit()
  } catch (error) {
    console.error("Error creating users:", error)
    process.exit(1)
  }
}

// Run the function
createUsers()

