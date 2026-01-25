const mongoose = require('mongoose');

/**
 * Employer Profile Schema
 * Contains company/employer information and hiring preferences
 */
const employerProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  
  // Company Information
  companyName: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true
  },
  companyLogo: {
    type: String,
    default: null
  },
  companySize: {
    type: String,
    enum: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+']
  },
  industry: {
    type: String,
    required: true
  },
  foundedYear: Number,
  
  // Contact Information
  contactPerson: {
    firstName: String,
    lastName: String,
    designation: String,
    phone: String
  },
  
  // Location
  headquarters: {
    address: String,
    city: String,
    state: String,
    country: String,
    zipCode: String
  },
  
  locations: [{
    city: String,
    state: String,
    country: String,
    isHeadquarters: {
      type: Boolean,
      default: false
    }
  }],
  
  // Company Details
  description: {
    type: String,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  website: {
    type: String,
    match: [/^https?:\/\/.+/, 'Please provide a valid website URL']
  },
  
  // Social Links
  socialLinks: {
    linkedin: String,
    twitter: String,
    facebook: String,
    instagram: String
  },
  
  // Verification
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationDocuments: [{
    documentType: {
      type: String,
      enum: ['business_license', 'tax_id', 'registration_certificate', 'other']
    },
    documentUrl: String,
    uploadedAt: Date,
    verified: {
      type: Boolean,
      default: false
    }
  }],
  verifiedAt: Date,
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Hiring Preferences
  hiringFor: [{
    type: String,
    enum: ['full-time', 'part-time', 'internship', 'freelance', 'contract']
  }],
  
  // Statistics
  totalJobsPosted: {
    type: Number,
    default: 0
  },
  activeJobs: {
    type: Number,
    default: 0
  },
  totalHires: {
    type: Number,
    default: 0
  },
  
  // Activity
  profileViews: {
    type: Number,
    default: 0
  },
  
  // Rating & Reviews (for future implementation)
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
  
  // Subscription/Plan (for future monetization)
  subscriptionPlan: {
    type: String,
    enum: ['free', 'basic', 'premium', 'enterprise'],
    default: 'free'
  },
  subscriptionExpiry: Date,
  
  // Features
  canPostJobs: {
    type: Boolean,
    default: true
  },
  canViewProfiles: {
    type: Boolean,
    default: true
  },
  maxActiveJobs: {
    type: Number,
    default: 5
  }
}, {
  timestamps: true
});

// Indexes
employerProfileSchema.index({ user: 1 });
employerProfileSchema.index({ companyName: 1 });
employerProfileSchema.index({ industry: 1 });
employerProfileSchema.index({ isVerified: 1 });
employerProfileSchema.index({ 'headquarters.city': 1 });

module.exports = mongoose.model('EmployerProfile', employerProfileSchema);
