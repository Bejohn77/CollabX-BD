const mongoose = require('mongoose');

/**
 * Job Application Schema
 * Tracks student applications to jobs
 */
const applicationSchema = new mongoose.Schema({
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Application Materials
  resume: {
    filename: String,
    url: String,
    uploadedAt: Date
  },
  coverLetter: {
    type: String,
    maxlength: 2000
  },
  
  // Custom Answers
  customAnswers: [{
    question: String,
    answer: String
  }],
  
  // Status Tracking
  status: {
    type: String,
    enum: ['pending', 'under-review', 'shortlisted', 'interview-scheduled', 'interviewed', 'accepted', 'rejected', 'withdrawn'],
    default: 'pending'
  },
  
  // Timeline
  statusHistory: [{
    status: String,
    changedAt: {
      type: Date,
      default: Date.now
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    notes: String
  }],
  
  // Employer Actions
  viewedByEmployer: {
    type: Boolean,
    default: false
  },
  viewedAt: Date,
  
  // Rating (by employer)
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  
  // Notes
  employerNotes: {
    type: String,
    maxlength: 1000
  },
  studentNotes: {
    type: String,
    maxlength: 500
  },
  
  // Interview Details (if applicable)
  interview: {
    scheduled: {
      type: Boolean,
      default: false
    },
    date: Date,
    time: String,
    mode: {
      type: String,
      enum: ['video', 'phone', 'in-person']
    },
    location: String,
    interviewerNotes: String
  },
  
  // Match Score (calculated by recommendation engine)
  matchScore: {
    type: Number,
    min: 0,
    max: 100
  },
  
  // Withdrawal
  withdrawn: {
    type: Boolean,
    default: false
  },
  withdrawnAt: Date,
  withdrawalReason: String
}, {
  timestamps: true
});

// Compound index to prevent duplicate applications
applicationSchema.index({ job: 1, student: 1 }, { unique: true });

// Indexes for queries
applicationSchema.index({ student: 1, status: 1 });
applicationSchema.index({ job: 1, status: 1 });
applicationSchema.index({ createdAt: -1 });

// Update status history on status change
applicationSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    this.statusHistory.push({
      status: this.status,
      changedAt: new Date()
    });
  }
  next();
});

module.exports = mongoose.model('Application', applicationSchema);
