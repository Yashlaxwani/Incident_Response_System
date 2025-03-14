const Incident = require('../models/Incident');
const User = require('../models/User');
const asyncHandler = require('../middleware/asyncHandler');
const mongoose = require('mongoose');

// @desc    Get admin dashboard data
// @route   GET /api/admin/dashboard
// @access  Private/Admin
exports.getAdminDashboard = asyncHandler(async (req, res, next) => {
  // Get total incidents count
  const total = await Incident.countDocuments();

  // Get open incidents count
  const open = await Incident.countDocuments({ status: 'open' });

  // Get in-progress incidents count
  const inProgress = await Incident.countDocuments({ status: 'in-progress' });

  // Get resolved incidents count
  const resolved = await Incident.countDocuments({ status: 'resolved' });

  // Calculate average resolution time (in hours)
  const resolvedIncidents = await Incident.find({
    status: 'resolved',
    resolvedAt: { $exists: true }
  });

  let averageResolutionTime = 0;
  if (resolvedIncidents.length > 0) {
    const totalResolutionTime = resolvedIncidents.reduce((acc, incident) => {
      const createdAt = new Date(incident.createdAt);
      const resolvedAt = new Date(incident.resolvedAt);
      const resolutionTime = (resolvedAt - createdAt) / (1000 * 60 * 60); // in hours
      return acc + resolutionTime;
    }, 0);
    averageResolutionTime = totalResolutionTime / resolvedIncidents.length;
  }

  // Get incidents by category
  const categoryCounts = await Incident.aggregate([
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);

  const categoryCountsObj = {};
  categoryCounts.forEach(item => {
    categoryCountsObj[item._id] = item.count;
  });

  // Get recent incidents
  const recentIncidents = await Incident.find()
    .sort({ createdAt: -1 })
    .limit(5)
    .populate('reportedBy', 'name');

  res.status(200).json({
    success: true,
    total,
    open,
    inProgress,
    resolved,
    averageResolutionTime,
    categoryCounts: categoryCountsObj,
    recentIncidents
  });
});

// @desc    Get super admin dashboard data
// @route   GET /api/superadmin/dashboard
// @access  Private/SuperAdmin
exports.getSuperAdminDashboard = asyncHandler(async (req, res, next) => {
  // Get basic incident stats
  const total = await Incident.countDocuments();
  const open = await Incident.countDocuments({ status: 'open' });
  const inProgress = await Incident.countDocuments({ status: 'in-progress' });
  const resolved = await Incident.countDocuments({ status: 'resolved' });

  // Calculate average resolution time (in hours)
  const resolvedIncidents = await Incident.find({
    status: 'resolved',
    resolvedAt: { $exists: true }
  });

  let averageResolutionTime = 0;
  if (resolvedIncidents.length > 0) {
    const totalResolutionTime = resolvedIncidents.reduce((acc, incident) => {
      const createdAt = new Date(incident.createdAt);
      const resolvedAt = new Date(incident.resolvedAt);
      const resolutionTime = (resolvedAt - createdAt) / (1000 * 60 * 60); // in hours
      return acc + resolutionTime;
    }, 0);
    averageResolutionTime = totalResolutionTime / resolvedIncidents.length;
  }

  // Get incidents by category
  const categoryCounts = await Incident.aggregate([
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);

  const categoryCountsObj = {};
  categoryCounts.forEach(item => {
    categoryCountsObj[item._id] = item.count;
  });

  // Get user counts
  const totalUsers = await User.countDocuments();
  const usersByRole = await User.aggregate([
    {
      $group: {
        _id: '$role',
        count: { $sum: 1 }
      }
    }
  ]);

  const userCounts = {
    total: totalUsers,
    users: 0,
    admins: 0,
    superadmins: 0
  };

  usersByRole.forEach(item => {
    userCounts[item._id + 's'] = item.count;
  });

  // Get incident trend (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const incidentTrend = await Incident.aggregate([
    {
      $match: {
        createdAt: { $gte: thirtyDaysAgo }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
        },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ]);

  // Format trend data for frontend
  const trendData = incidentTrend.map(item => ({
    date: item._id,
    count: item.count
  }));

  // Get incidents this month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const incidentsThisMonth = await Incident.countDocuments({
    createdAt: { $gte: startOfMonth }
  });

  // Get active admins count
  const activeAdmins = await User.countDocuments({
    role: 'admin',
    isActive: true
  });

  // Get recent incidents
  const recentIncidents = await Incident.find()
    .sort({ createdAt: -1 })
    .limit(5)
    .populate('reportedBy', 'name');

  res.status(200).json({
    success: true,
    total,
    open,
    inProgress,
    resolved,
    averageResolutionTime,
    categoryCounts: categoryCountsObj,
    userCounts,
    incidentTrend: trendData,
    incidentsThisMonth,
    activeAdmins,
    recentIncidents
  });
});