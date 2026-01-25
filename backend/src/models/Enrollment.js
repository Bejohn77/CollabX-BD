const mongoose = require('mongoose');

/**
 * Course Enrollment Schema
 * Tracks student enrollments and progress in courses
 */
const enrollmentSchema = new mongoose.Schema({
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Enrollment Status
  status: {
    type: String,
    enum: ['active', 'completed', 'dropped', 'paused'],
    default: 'active'
  },
  
  // Progress Tracking
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  completedTopics: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course.topics'
  }],
  completedLessons: [{
    type: mongoose.Schema.Types.ObjectId
  }],
  lastTopicViewed: {
    type: mongoose.Schema.Types.ObjectId
  },
  
  // Assessment Results
  assessmentScores: [{
    assessmentId: mongoose.Schema.Types.ObjectId,
    score: Number,
    maxScore: Number,
    percentage: Number,
    passed: Boolean,
    attemptedAt: Date,
    attempts: {
      type: Number,
      default: 1
    }
  }],
  
  // Time Tracking
  totalTimeSpent: {
    type: Number,
    default: 0 // in minutes
  },
  lastAccessedAt: Date,
  
  // Completion
  completedAt: Date,
  certificateIssued: {
    type: Boolean,
    default: false
  },
  certificateId: String,
  certificateUrl: String,
  
  // Notes & Bookmarks
  notes: [{
    lessonId: mongoose.Schema.Types.ObjectId,
    content: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  bookmarks: [{
    lessonId: mongoose.Schema.Types.ObjectId,
    timestamp: Number, // for video bookmarks
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Rating & Review
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  review: String,
  reviewedAt: Date
}, {
  timestamps: true
});

// Compound index to prevent duplicate enrollments
enrollmentSchema.index({ course: 1, student: 1 }, { unique: true });

// Indexes for queries
enrollmentSchema.index({ student: 1, status: 1 });
enrollmentSchema.index({ course: 1 });
enrollmentSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Enrollment', enrollmentSchema);
