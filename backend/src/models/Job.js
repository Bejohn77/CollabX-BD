const mongoose = require('mongoose');

/**
 * Job Schema
 * Represents job postings by employers
 */
const jobSchema = new mongoose.Schema({
  employer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Basic Information
  title: {
    type: String,
    required: [true, 'Job title is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Job description is required']
  },
  
  // Job Details
  jobType: {
    type: String,
    enum: ['full-time', 'part-time', 'internship', 'freelance', 'contract'],
    required: true
  },
  workMode: {
    type: String,
    enum: ['remote', 'office', 'onsite', 'hybrid'],
    default: 'office'
  },
  
  // Location
  location: {
    city: String,
    state: String,
    country: String,
    remote: {
      type: Boolean,
      default: false
    },
    isRemote: {
      type: Boolean,
      default: false
    }
  },
  
  // Requirements
  experienceLevel: {
    type: String,
    enum: ['entry', 'intermediate', 'senior', 'lead'],
    default: 'entry'
  },
  minimumExperience: {
    type: Number,
    default: 0
  },
  education: [{
    type: String,
    enum: ['high-school', 'associate', 'bachelor', 'master', 'phd']
  }],
  
  // Skills
  requiredSkills: [{
    name: {
      type: String,
      required: true
    },
    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'expert']
    },
    proficiency: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'expert']
    }
  }],
  
  preferredSkills: [String],
  
  // Job Details
  responsibilities: [String],
  qualifications: [String],
  
  // Compensation
  salary: {
    min: Number,
    max: Number,
    currency: {
      type: String,
      default: 'USD'
    },
    period: {
      type: String,
      enum: ['hourly', 'monthly', 'yearly'],
      default: 'yearly'
    },
    negotiable: {
      type: Boolean,
      default: true
    }
  },
  salaryRange: {
    min: Number,
    max: Number,
    currency: {
      type: String,
      default: 'USD'
    }
  },
  
  // Benefits
  benefits: [String],
  
  // Application Details
  applicationDeadline: Date,
  startDate: Date,
  duration: {
    value: Number,
    unit: {
      type: String,
      enum: ['days', 'weeks', 'months', 'years']
    }
  },
  
  // Openings
  numberOfOpenings: {
    type: Number,
    default: 1,
    min: 1
  },
  
  // Application Requirements
  requireResume: {
    type: Boolean,
    default: true
  },
  requireCoverLetter: {
    type: Boolean,
    default: false
  },
  customQuestions: [{
    question: String,
    required: {
      type: Boolean,
      default: false
    },
    type: {
      type: String,
      enum: ['text', 'textarea', 'multiple-choice', 'yes-no'],
      default: 'text'
    },
    options: [String]
  }],
  
  // Status
  status: {
    type: String,
    enum: ['draft', 'pending', 'active', 'closed', 'cancelled'],
    default: 'pending'
  },
  
  // Moderation (for admin approval)
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date,
  rejectionReason: String,
  
  // Statistics
  views: {
    type: Number,
    default: 0
  },
  applications: {
    type: Number,
    default: 0
  },
  
  // Featured/Premium
  isFeatured: {
    type: Boolean,
    default: false
  },
  featuredUntil: Date,
  
  // Tags & Categories
  category: String,
  tags: [String],
  
  // Visibility
  isPublished: {
    type: Boolean,
    default: false
  },
  publishedAt: Date,
  expiresAt: Date
}, {
  timestamps: true
});

// Indexes for better search performance
jobSchema.index({ employer: 1 });
jobSchema.index({ status: 1, isPublished: 1 });
jobSchema.index({ jobType: 1 });
jobSchema.index({ 'requiredSkills.name': 1 });
jobSchema.index({ 'location.city': 1 });
jobSchema.index({ createdAt: -1 });
jobSchema.index({ applicationDeadline: 1 });
jobSchema.index({ title: 'text', description: 'text' });

// Auto-set publishedAt when status changes to active
jobSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'active' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  
  // Sync location.remote with location.isRemote
  if (this.location) {
    if (this.isModified('location.remote')) {
      this.location.isRemote = this.location.remote;
    } else if (this.isModified('location.isRemote')) {
      this.location.remote = this.location.isRemote;
    }
  }
  
  // Sync salaryRange with salary
  if (this.salaryRange && this.salaryRange.min !== undefined) {
    this.salary = {
      min: this.salaryRange.min,
      max: this.salaryRange.max,
      currency: this.salaryRange.currency || 'USD',
      period: 'yearly',
      negotiable: true
    };
  }
  
  // Sync skill level with proficiency
  if (this.requiredSkills && this.requiredSkills.length > 0) {
    this.requiredSkills.forEach(skill => {
      if (skill.level && !skill.proficiency) {
        skill.proficiency = skill.level;
      } else if (skill.proficiency && !skill.level) {
        skill.level = skill.proficiency;
      }
    });
  }
  
  next();
});

module.exports = mongoose.model('Job', jobSchema);
