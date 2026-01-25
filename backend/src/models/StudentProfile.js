const mongoose = require('mongoose');

/**
 * Student Profile Schema
 * Contains all student-specific information including education, skills, and professional details
 */
const studentProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  
  // Personal Information
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true
  },
  profilePhoto: {
    type: String,
    default: null
  },
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot exceed 500 characters']
  },
  phone: {
    type: String,
    trim: true
  },
  location: {
    city: String,
    state: String,
    country: String
  },
  
  // Education
  education: [{
    institution: {
      type: String,
      required: true
    },
    degree: {
      type: String,
      required: true
    },
    fieldOfStudy: String,
    startDate: Date,
    endDate: Date,
    current: {
      type: Boolean,
      default: false
    },
    gpa: Number,
    description: String
  }],
  
  // University Information
  university: {
    name: String,
    email: {
      type: String,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid university email']
    },
    verified: {
      type: Boolean,
      default: false
    },
    graduationYear: Number
  },
  
  // Skills
  skills: [{
    name: {
      type: String,
      required: true
    },
    proficiency: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'expert'],
      default: 'beginner'
    },
    endorsements: [{
      endorsedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      endorsedAt: {
        type: Date,
        default: Date.now
      }
    }]
  }],
  
  // Projects
  projects: [{
    title: {
      type: String,
      required: true
    },
    description: String,
    technologies: [String],
    startDate: Date,
    endDate: Date,
    current: {
      type: Boolean,
      default: false
    },
    projectUrl: String,
    githubUrl: String,
    demoUrl: String,
    images: [String],
    category: {
      type: String,
      enum: ['academic', 'personal', 'freelance', 'internship']
    }
  }],
  
  // Experience
  experience: [{
    company: String,
    position: String,
    location: String,
    startDate: Date,
    endDate: Date,
    current: {
      type: Boolean,
      default: false
    },
    description: String,
    skills: [String]
  }],
  
  // Certifications
  certifications: [{
    name: String,
    issuingOrganization: String,
    issueDate: Date,
    expiryDate: Date,
    credentialId: String,
    credentialUrl: String
  }],
  
  // Resume
  resume: {
    filename: String,
    url: String,
    uploadedAt: Date
  },
  
  // Preferences
  jobPreferences: {
    jobTypes: [{
      type: String,
      enum: ['full-time', 'part-time', 'internship', 'freelance', 'contract']
    }],
    desiredRoles: [String],
    preferredLocations: [String],
    remotePreference: {
      type: String,
      enum: ['remote', 'onsite', 'hybrid', 'flexible'],
      default: 'flexible'
    },
    expectedSalary: {
      min: Number,
      max: Number,
      currency: {
        type: String,
        default: 'USD'
      }
    },
    availableFrom: Date
  },
  
  // Social & Portfolio Links
  socialLinks: {
    linkedin: String,
    github: String,
    portfolio: String,
    twitter: String,
    other: String
  },
  
  // Recommendations
  recommendations: [{
    recommendedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    relationship: {
      type: String,
      enum: ['professor', 'mentor', 'supervisor', 'colleague', 'other']
    },
    content: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Activity Metrics
  profileViews: {
    type: Number,
    default: 0
  },
  profileCompleteness: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  
  // Followers & Following (for social networking)
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  following: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // Status
  isLookingForJob: {
    type: Boolean,
    default: true
  },
  isAvailableForFreelance: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Calculate profile completeness on save
studentProfileSchema.pre('save', function(next) {
  let completeness = 0;
  const weights = {
    basicInfo: 15,
    education: 15,
    skills: 15,
    projects: 15,
    experience: 10,
    resume: 10,
    certifications: 10,
    preferences: 10
  };
  
  // Basic info
  if (this.firstName && this.lastName && this.bio && this.profilePhoto) {
    completeness += weights.basicInfo;
  }
  
  // Education
  if (this.education && this.education.length > 0) {
    completeness += weights.education;
  }
  
  // Skills
  if (this.skills && this.skills.length >= 3) {
    completeness += weights.skills;
  }
  
  // Projects
  if (this.projects && this.projects.length > 0) {
    completeness += weights.projects;
  }
  
  // Experience
  if (this.experience && this.experience.length > 0) {
    completeness += weights.experience;
  }
  
  // Resume
  if (this.resume && this.resume.url) {
    completeness += weights.resume;
  }
  
  // Certifications
  if (this.certifications && this.certifications.length > 0) {
    completeness += weights.certifications;
  }
  
  // Job preferences
  if (this.jobPreferences && this.jobPreferences.jobTypes && this.jobPreferences.jobTypes.length > 0) {
    completeness += weights.preferences;
  }
  
  this.profileCompleteness = completeness;
  next();
});

// Indexes for better query performance
studentProfileSchema.index({ user: 1 });
studentProfileSchema.index({ 'skills.name': 1 });
studentProfileSchema.index({ 'university.email': 1 });
studentProfileSchema.index({ isLookingForJob: 1 });
studentProfileSchema.index({ 'jobPreferences.jobTypes': 1 });

module.exports = mongoose.model('StudentProfile', studentProfileSchema);
