const Job = require('../../models/Job');
const Application = require('../../models/Application');
const StudentProfile = require('../../models/StudentProfile');
const { asyncHandler, successResponse, paginate, buildQuery } = require('../../utils/helpers');

/**
 * @route   GET /api/jobs
 * @desc    Get all jobs with filtering and pagination
 * @access  Public
 */
exports.getJobs = asyncHandler(async (req, res) => {
  const { query, options } = buildQuery(req.query);
  
  // Add status filter for active jobs
  query.status = 'active';
  query.isPublished = true;
  
  // Handle specific filters
  if (req.query.jobType) {
    query.jobType = req.query.jobType;
  }
  
  if (req.query.workMode) {
    query.workMode = req.query.workMode;
  }
  
  if (req.query.skills) {
    const skills = req.query.skills.split(',');
    query['requiredSkills.name'] = { $in: skills };
  }
  
  if (req.query.location) {
    query['location.city'] = new RegExp(req.query.location, 'i');
  }
  
  if (req.query.search) {
    query.$text = { $search: req.query.search };
  }
  
  const skip = (options.page - 1) * options.limit;
  
  const jobs = await Job.find(query)
    .sort(options.sort)
    .skip(skip)
    .limit(options.limit)
    .populate('employer', 'email')
    .populate({
      path: 'employer',
      populate: {
        path: 'employerProfile',
        select: 'companyName companyLogo industry'
      }
    });
  
  const total = await Job.countDocuments(query);
  
  res.status(200).json({
    success: true,
    data: jobs,
    pagination: paginate(options.page, options.limit, total)
  });
});

/**
 * @route   GET /api/jobs/:id
 * @desc    Get single job
 * @access  Public
 */
exports.getJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id)
    .populate('employer', 'email')
    .populate({
      path: 'employer',
      populate: {
        path: 'employerProfile',
        select: 'companyName companyLogo industry description website companySize location'
      }
    });
  
  if (!job) {
    return res.status(404).json({
      success: false,
      message: 'Job not found'
    });
  }
  
  console.log('Job fetched:', { 
    id: job._id, 
    title: job.title,
    hasEmployer: !!job.employer,
    hasEmployerProfile: !!job.employer?.employerProfile,
    companyName: job.employer?.employerProfile?.companyName,
    hasDescription: !!job.description
  });
  
  // Increment views
  job.views += 1;
  await job.save();
  
  res.status(200).json(successResponse(job, 'Job retrieved successfully'));
});

/**
 * @route   POST /api/jobs/:id/apply
 * @desc    Apply to a job
 * @access  Private (Student)
 */
exports.applyToJob = asyncHandler(async (req, res) => {
  const { coverLetter, customAnswers } = req.body;
  const jobId = req.params.id;
  
  // Check if job exists
  const job = await Job.findById(jobId);
  if (!job) {
    return res.status(404).json({
      success: false,
      message: 'Job not found'
    });
  }
  
  if (job.status !== 'active') {
    return res.status(400).json({
      success: false,
      message: 'This job is not accepting applications'
    });
  }
  
  // Check if already applied
  const existingApplication = await Application.findOne({
    job: jobId,
    student: req.user._id
  });
  
  if (existingApplication) {
    return res.status(400).json({
      success: false,
      message: 'You have already applied to this job'
    });
  }
  
  // Get student profile for resume
  const profile = await StudentProfile.findOne({ user: req.user._id });
  
  // Calculate match score
  const matchScore = calculateMatchScore(profile, job);
  
  // Create application
  const application = await Application.create({
    job: jobId,
    student: req.user._id,
    coverLetter,
    customAnswers,
    resume: profile.resume,
    matchScore,
    status: 'pending'
  });
  
  // Update job applications count
  job.applications += 1;
  await job.save();
  
  res.status(201).json(successResponse(application, 'Application submitted successfully'));
});

/**
 * @route   GET /api/jobs/applications/my
 * @desc    Get all applications by current student
 * @access  Private (Student)
 */
exports.getMyApplications = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;
  const skip = (page - 1) * limit;
  
  const query = { student: req.user._id };
  if (status) {
    query.status = status;
  }
  
  const applications = await Application.find(query)
    .sort('-createdAt')
    .skip(skip)
    .limit(parseInt(limit))
    .populate('job')
    .populate({
      path: 'job',
      populate: {
        path: 'employer',
        populate: {
          path: 'employerProfile',
          select: 'companyName companyLogo'
        }
      }
    });
  
  const total = await Application.countDocuments(query);
  
  res.status(200).json({
    success: true,
    data: applications,
    pagination: paginate(page, limit, total)
  });
});

/**
 * @route   PUT /api/jobs/applications/:id/withdraw
 * @desc    Withdraw application
 * @access  Private (Student)
 */
exports.withdrawApplication = asyncHandler(async (req, res) => {
  const application = await Application.findOne({
    _id: req.params.id,
    student: req.user._id
  });
  
  if (!application) {
    return res.status(404).json({
      success: false,
      message: 'Application not found'
    });
  }
  
  if (application.withdrawn) {
    return res.status(400).json({
      success: false,
      message: 'Application already withdrawn'
    });
  }
  
  application.withdrawn = true;
  application.withdrawnAt = new Date();
  application.withdrawalReason = req.body.reason;
  application.status = 'withdrawn';
  await application.save();
  
  res.status(200).json(successResponse(application, 'Application withdrawn successfully'));
});

/**
 * @route   GET /api/jobs/recommendations
 * @desc    Get personalized job recommendations
 * @access  Private (Student)
 */
exports.getRecommendations = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const skip = (page - 1) * limit;
  
  // Get student profile
  const profile = await StudentProfile.findOne({ user: req.user._id });
  
  if (!profile) {
    return res.status(404).json({
      success: false,
      message: 'Profile not found. Please complete your profile first.'
    });
  }
  
  // Build recommendation query based on profile
  const query = {
    status: 'active',
    isPublished: true
  };
  
  // Match job preferences
  if (profile.jobPreferences && profile.jobPreferences.jobTypes && profile.jobPreferences.jobTypes.length > 0) {
    query.jobType = { $in: profile.jobPreferences.jobTypes };
  }
  
  // Get all active jobs
  let jobs = await Job.find(query)
    .populate('employer', 'email')
    .populate({
      path: 'employer',
      populate: {
        path: 'employerProfile',
        select: 'companyName companyLogo industry'
      }
    });
  
  // Calculate match score for each job
  jobs = jobs.map(job => {
    const score = calculateMatchScore(profile, job);
    return {
      ...job.toObject(),
      matchScore: score
    };
  });
  
  // Sort by match score
  jobs.sort((a, b) => b.matchScore - a.matchScore);
  
  // Apply pagination
  const paginatedJobs = jobs.slice(skip, skip + parseInt(limit));
  const total = jobs.length;
  
  res.status(200).json({
    success: true,
    data: paginatedJobs,
    pagination: paginate(page, limit, total)
  });
});

/**
 * Helper function to calculate job-student match score
 */
function calculateMatchScore(profile, job) {
  let score = 0;
  let maxScore = 100;
  
  // Skills matching (40 points)
  if (profile.skills && profile.skills.length > 0 && job.requiredSkills && job.requiredSkills.length > 0) {
    const profileSkills = profile.skills.map(s => s.name.toLowerCase());
    const jobSkills = job.requiredSkills.map(s => s.name.toLowerCase());
    
    const matchingSkills = jobSkills.filter(skill => profileSkills.includes(skill));
    const skillScore = (matchingSkills.length / jobSkills.length) * 40;
    score += skillScore;
  }
  
  // Job type preference (20 points)
  if (profile.jobPreferences && profile.jobPreferences.jobTypes && profile.jobPreferences.jobTypes.includes(job.jobType)) {
    score += 20;
  }
  
  // Work mode preference (15 points)
  if (profile.jobPreferences && profile.jobPreferences.remotePreference) {
    if (
      (profile.jobPreferences.remotePreference === 'remote' && job.workMode === 'remote') ||
      (profile.jobPreferences.remotePreference === 'hybrid' && job.workMode === 'hybrid') ||
      (profile.jobPreferences.remotePreference === 'flexible')
    ) {
      score += 15;
    }
  }
  
  // Location matching (10 points)
  if (profile.location && job.location && job.location.city) {
    if (profile.location.city && profile.location.city.toLowerCase() === job.location.city.toLowerCase()) {
      score += 10;
    }
  }
  
  // Experience level (15 points)
  if (profile.experience && profile.experience.length > 0) {
    const yearsExperience = profile.experience.length;
    if (
      (job.experienceLevel === 'entry' && yearsExperience >= 0) ||
      (job.experienceLevel === 'intermediate' && yearsExperience >= 1) ||
      (job.experienceLevel === 'senior' && yearsExperience >= 3)
    ) {
      score += 15;
    }
  } else if (job.experienceLevel === 'entry') {
    score += 15;
  }
  
  return Math.round(score);
}

module.exports.calculateMatchScore = calculateMatchScore;
