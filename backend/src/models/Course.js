const mongoose = require('mongoose');

/**
 * Course Schema
 * Represents skill-learning courses available on the platform
 */
const courseSchema = new mongoose.Schema({
  // Basic Information
  title: {
    type: String,
    required: [true, 'Course title is required'],
    trim: true
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true
  },
  description: {
    type: String,
    required: true
  },
  
  // Media
  thumbnail: String,
  coverImage: String,
  introVideo: String,
  
  // Course Details
  category: {
    type: String,
    required: true
  },
  subcategory: String,
  level: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  },
  
  // Skills Covered
  skillsCovered: [{
    name: String,
    proficiencyGained: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced']
    }
  }],
  
  // Prerequisites
  prerequisites: [String],
  
  // Duration
  duration: {
    value: Number,
    unit: {
      type: String,
      enum: ['hours', 'days', 'weeks', 'months'],
      default: 'hours'
    }
  },
  estimatedTimeToComplete: Number, // in hours
  
  // Course Content - Topic Based (W3Schools/JavaTpoint style)
  topics: [{
    title: {
      type: String,
      required: true
    },
    slug: String,
    order: {
      type: Number,
      required: true
    },
    content: {
      type: String,
      required: true
    },
    codeExamples: [{
      title: String,
      language: String,
      code: String,
      output: String
    }],
    duration: Number, // estimated minutes to complete
    tryItYourselfUrl: String, // Link to live code editor
    resources: [{
      title: String,
      type: {
        type: String,
        enum: ['pdf', 'link', 'video', 'documentation', 'other']
      },
      url: String
    }]
  }],
  
  // Legacy support - keep modules for backward compatibility
  modules: [{
    title: String,
    description: String,
    order: Number,
    lessons: [{
      title: String,
      description: String,
      content: String,
      videoUrl: String,
      duration: Number,
      order: Number,
      resources: [{
        title: String,
        type: {
          type: String,
          enum: ['pdf', 'link', 'video', 'code', 'other']
        },
        url: String
      }]
    }]
  }],
  
  // Assessment
  assessments: [{
    title: String,
    type: {
      type: String,
      enum: ['quiz', 'assignment', 'project', 'exam']
    },
    passingScore: {
      type: Number,
      default: 70
    },
    questions: [{
      question: String,
      type: {
        type: String,
        enum: ['multiple-choice', 'true-false', 'short-answer', 'essay']
      },
      options: [String],
      correctAnswer: String,
      points: Number
    }]
  }],
  
  // Certification
  certificateAwarded: {
    type: Boolean,
    default: true
  },
  certificateTemplate: String,
  
  // Instructors
  instructors: [{
    name: String,
    bio: String,
    photo: String,
    credentials: String
  }],
  
  // Pricing (for future monetization)
  price: {
    amount: {
      type: Number,
      default: 0
    },
    currency: {
      type: String,
      default: 'USD'
    }
  },
  isFree: {
    type: Boolean,
    default: true
  },
  
  // Enrollment
  enrollmentCount: {
    type: Number,
    default: 0
  },
  completionCount: {
    type: Number,
    default: 0
  },
  maxEnrollments: Number,
  
  // Status
  isPublished: {
    type: Boolean,
    default: false
  },
  publishedAt: Date,
  
  // Ratings & Reviews
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  
  // Job Alignment (shows which jobs this course prepares for)
  alignedJobs: [String],
  
  // Tags
  tags: [String],
  
  // Created By (admin or content creator)
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Generate slug from title
courseSchema.pre('save', function(next) {
  if (this.isModified('title') && !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});

// Indexes
courseSchema.index({ slug: 1 });
courseSchema.index({ category: 1 });
courseSchema.index({ level: 1 });
courseSchema.index({ isPublished: 1 });
courseSchema.index({ 'skillsCovered.name': 1 });
courseSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Course', courseSchema);
