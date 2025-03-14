const mongoose = require('mongoose');

const IncidentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a title'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Please add a description']
  },
  category: {
    type: String,
    required: [true, 'Please select a category'],
    enum: [
      'Phishing',
      'Malware',
      'Ransomware',
      'Unauthorized Access',
      'Data Breach',
      'Social Engineering',
      'DDoS Attack',
      'Insider Threat',
      'Physical Security',
      'Other'
    ]
  },
  priority: {
    type: String,
    required: [true, 'Please select a priority'],
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['open', 'in-progress', 'resolved'],
    default: 'open'
  },
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  assignedAt: {
    type: Date
  },
  resolvedAt: {
    type: Date
  },
  evidence: [
    {
      name: String,
      url: String,
      type: String,
      size: Number
    }
  ],
  statusHistory: [
    {
      status: {
        type: String,
        enum: ['open', 'in-progress', 'resolved']
      },
      updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      timestamp: {
        type: Date,
        default: Date.now
      },
      comment: String
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
IncidentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Add initial status to history when creating a new incident
IncidentSchema.pre('save', function(next) {
  if (this.isNew) {
    this.statusHistory.push({
      status: this.status,
      updatedBy: this.reportedBy,
      timestamp: Date.now(),
      comment: 'Incident reported'
    });
  }
  next();
});

module.exports = mongoose.model('Incident', IncidentSchema);