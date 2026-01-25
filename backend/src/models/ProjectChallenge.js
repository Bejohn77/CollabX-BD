const mongoose = require('mongoose');

/**
 * Project Challenge Schema
 * Project-based hiring challenges posted by employers
 */
const projectChallengeSchema = new mongoose.Schema({
  employer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Challenge Details
  title: {
    type: String,
    required: [true, 'Challenge title is required'],
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  
  // Requirements
  requirements: [String],
  deliverables: [String],
  
  // Skills
  requiredSkills: [String],
  
  // Timeline
  duration: {
    value: Number,
    unit: {
      type: String,
      enum: ['hours', 'days', 'weeks'],
      default: 'days'
    }
  },
  deadline: Date,
  
  // Compensation
  compensation: {
    type: {
      type: String,
      enum: ['paid', 'unpaid', 'job-offer', 'internship-offer']
    },
    amount: Number,
    currency: {
      type: String,
      default: 'USD'
    }
  },
  
  // Resources
  resources: [{
    title: String,
    url: String,
    type: {
      type: String,
      enum: ['document', 'link', 'file']
    }
  }],
  
  // Evaluation Criteria
  evaluationCriteria: [{
    criterion: String,
    weight: Number // percentage
  }],
  
  // Status
  status: {
    type: String,
    enum: ['draft', 'active', 'closed', 'cancelled'],
    default: 'draft'
  },
  
  // Participants
  maxParticipants: Number,
  currentParticipants: {
    type: Number,
    default: 0
  },
  
  // Submissions
  submissions: [{
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    submittedAt: Date,
    repositoryUrl: String,
    demoUrl: String,
    description: String,
    files: [String],
    status: {
      type: String,
      enum: ['submitted', 'under-review', 'accepted', 'rejected'],
      default: 'submitted'
    },
    score: Number,
    feedback: String,
    evaluatedAt: Date
  }],
  
  // Featured
  isFeatured: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes
projectChallengeSchema.index({ employer: 1 });
projectChallengeSchema.index({ status: 1 });
projectChallengeSchema.index({ deadline: 1 });
projectChallengeSchema.index({ createdAt: -1 });

module.exports = mongoose.model('ProjectChallenge', projectChallengeSchema);
