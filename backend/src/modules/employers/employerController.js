const EmployerProfile = require('../../models/EmployerProfile');
const Job = require('../../models/Job');
const Application = require('../../models/Application');
const ProjectChallenge = require('../../models/ProjectChallenge');
const StudentProfile = require('../../models/StudentProfile');
const { asyncHandler, successResponse, paginate } = require('../../utils/helpers');

/**
 * @route   GET /api/employers/profile
 * @desc    Get employer profile
 * @access  Private (Employer)
 */
exports.getProfile = asyncHandler(async (req, res) => {
  let profile = await EmployerProfile.findOne({ user: req.user._id });
  
  // If profile doesn't exist, create a default one
  if (!profile) {
    console.log('Profile not found, creating default profile for user:', req.user._id);
    profile = await EmployerProfile.create({
      user: req.user._id,
      companyName: '',
      industry: '',
      description: ''
    });
  }
  
  console.log('Employer profile retrieved:', { 
    id: profile._id, 
    userId: req.user._id,
    companyName: profile.companyName, 
    isVerified: profile.isVerified,
    verifiedAt: profile.verifiedAt
  });
  
  res.status(200).json(successResponse(profile, 'Profile retrieved successfully'));
});

/**
 * @route   PUT /api/employers/profile
 * @desc    Update employer profile
 * @access  Private (Employer)
 */
exports.updateProfile = asyncHandler(async (req, res) => {
  const allowedUpdates = [
    'companyName', 'companyLogo', 'companySize', 'industry', 'foundedYear',
    'contactPerson', 'headquarters', 'locations', 'description', 'website',
    'socialLinks', 'hiringFor'
  ];
  
  const updates = {};
  Object.keys(req.body).forEach(key => {
    if (allowedUpdates.includes(key) && key !== 'companyLogo') {
      // Parse JSON strings from FormData
      try {
        const value = typeof req.body[key] === 'string' && 
                       (req.body[key].startsWith('{') || req.body[key].startsWith('['))
          ? JSON.parse(req.body[key])
          : req.body[key];
        
        // Skip empty objects, empty arrays, and empty strings
        if (value !== '' && JSON.stringify(value) !== '{}' && JSON.stringify(value) !== '[]') {
          updates[key] = value;
        }
      } catch (e) {
        updates[key] = req.body[key];
      }
    }
  });
  
  // If file uploaded, use the file path
  if (req.file) {
    updates.companyLogo = `/uploads/logos/${req.file.filename}`;
  }
  
  // Try to update existing profile or create new one
  let profile = await EmployerProfile.findOneAndUpdate(
    { user: req.user._id },
    updates,
    { new: true, runValidators: true }
  );
  
  // If profile doesn't exist, create it
  if (!profile) {
    console.log('Profile not found, creating new profile for user:', req.user._id);
    profile = await EmployerProfile.create({
      user: req.user._id,
      ...updates
    });
  }
  
  res.status(200).json(successResponse(profile, 'Profile updated successfully'));
});

/**
 * @route   POST /api/employers/jobs
 * @desc    Create a new job posting
 * @access  Private (Employer)
 */
exports.createJob = asyncHandler(async (req, res) => {
  console.log('Creating job with data:', req.body);
  console.log('User:', req.user._id);
  
  // Add employer to job data
  const jobData = {
    ...req.body,
    employer: req.user._id,
    status: 'pending' // Requires admin approval
  };
  
  const job = await Job.create(jobData);
  console.log('Job created successfully:', job._id);
  
  // Update employer stats (if profile exists)
  try {
    const profile = await EmployerProfile.findOne({ user: req.user._id });
    if (profile) {
      profile.totalJobsPosted += 1;
      await profile.save();
    } else {
      console.warn('Employer profile not found for user:', req.user._id);
    }
  } catch (profileError) {
    console.error('Error updating employer profile stats:', profileError);
    // Don't fail the job creation if profile update fails
  }
  
  res.status(201).json(successResponse(job, 'Job created successfully. Pending admin approval.'));
});

/**
 * @route   GET /api/employers/jobs
 * @desc    Get all jobs posted by employer
 * @access  Private (Employer)
 */
exports.getMyJobs = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;
  const skip = (page - 1) * limit;
  
  const query = { employer: req.user._id };
  if (status) {
    query.status = status;
  }
  
  const jobs = await Job.find(query)
    .sort('-createdAt')
    .skip(skip)
    .limit(parseInt(limit));
  
  const total = await Job.countDocuments(query);
  
  res.status(200).json({
    success: true,
    data: jobs,
    pagination: paginate(page, limit, total)
  });
});

/**
 * @route   PUT /api/employers/jobs/:id
 * @desc    Update job posting
 * @access  Private (Employer)
 */
exports.updateJob = asyncHandler(async (req, res) => {
  let job = await Job.findOne({
    _id: req.params.id,
    employer: req.user._id
  });
  
  if (!job) {
    return res.status(404).json({
      success: false,
      message: 'Job not found'
    });
  }
  
  job = await Job.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );
  
  res.status(200).json(successResponse(job, 'Job updated successfully'));
});

/**
 * @route   DELETE /api/employers/jobs/:id
 * @desc    Delete/close job posting
 * @access  Private (Employer)
 */
exports.deleteJob = asyncHandler(async (req, res) => {
  const job = await Job.findOne({
    _id: req.params.id,
    employer: req.user._id
  });
  
  if (!job) {
    return res.status(404).json({
      success: false,
      message: 'Job not found'
    });
  }
  
  job.status = 'closed';
  await job.save();
  
  // Update employer stats
  const profile = await EmployerProfile.findOne({ user: req.user._id });
  profile.activeJobs = Math.max(0, profile.activeJobs - 1);
  await profile.save();
  
  res.status(200).json(successResponse(null, 'Job closed successfully'));
});

/**
 * @route   GET /api/employers/jobs/:id/applicants
 * @desc    Get all applicants for a job
 * @access  Private (Employer)
 */
exports.getApplicants = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, status } = req.query;
  const skip = (page - 1) * limit;
  
  // Verify job belongs to employer
  const job = await Job.findOne({
    _id: req.params.id,
    employer: req.user._id
  });
  
  if (!job) {
    return res.status(404).json({
      success: false,
      message: 'Job not found'
    });
  }
  
  const query = { job: req.params.id };
  if (status) {
    query.status = status;
  }
  
  const applications = await Application.find(query)
    .sort('-matchScore -createdAt')
    .skip(skip)
    .limit(parseInt(limit))
    .select('job student coverLetter customAnswers resume status matchScore viewedByEmployer employerNotes createdAt')
    .populate('student', 'email isVerified')
    .populate({
      path: 'student',
      populate: {
        path: 'studentProfile',
        select: 'firstName lastName profilePhoto bio skills education experience profileCompleteness'
      }
    });
  
  const total = await Application.countDocuments(query);
  
  console.log(`Found ${applications.length} applications for job ${job.title}`);
  
  res.status(200).json({
    success: true,
    data: {
      job,
      applications
    },
    pagination: paginate(page, limit, total)
  });
});

/**
 * @route   PUT /api/employers/applications/:id/status
 * @desc    Update application status
 * @access  Private (Employer)
 */
exports.updateApplicationStatus = asyncHandler(async (req, res) => {
  const { status, notes } = req.body;
  
  const application = await Application.findById(req.params.id).populate('job');
  
  if (!application) {
    return res.status(404).json({
      success: false,
      message: 'Application not found'
    });
  }
  
  // Verify job belongs to employer
  if (application.job.employer.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to update this application'
    });
  }
  
  application.status = status;
  application.employerNotes = notes || application.employerNotes;
  
  if (!application.viewedByEmployer) {
    application.viewedByEmployer = true;
    application.viewedAt = new Date();
  }
  
  await application.save();
  
  res.status(200).json(successResponse(application, 'Application status updated successfully'));
});

/**
 * @route   GET /api/employers/search-candidates
 * @desc    Search for candidates
 * @access  Private (Employer)
 */
exports.searchCandidates = asyncHandler(async (req, res) => {
  const { skills, education, location, page = 1, limit = 10 } = req.query;
  const skip = (page - 1) * limit;
  
  const query = { isLookingForJob: true };
  
  // Search by skills
  if (skills) {
    const skillArray = skills.split(',').map(s => s.trim());
    query['skills.name'] = { $in: skillArray };
  }
  
  // Search by education
  if (education) {
    query['education.degree'] = new RegExp(education, 'i');
  }
  
  // Search by location
  if (location) {
    query['location.city'] = new RegExp(location, 'i');
  }
  
  const profiles = await StudentProfile.find(query)
    .sort('-profileCompleteness')
    .skip(skip)
    .limit(parseInt(limit))
    .populate('user', 'email isVerified createdAt')
    .select('-resume'); // Don't include resume in search results
  
  const total = await StudentProfile.countDocuments(query);
  
  res.status(200).json({
    success: true,
    data: profiles,
    pagination: paginate(page, limit, total)
  });
});

/**
 * @route   POST /api/employers/challenges
 * @desc    Create a project-based hiring challenge
 * @access  Private (Employer)
 */
exports.createChallenge = asyncHandler(async (req, res) => {
  const challengeData = {
    ...req.body,
    employer: req.user._id
  };
  
  const challenge = await ProjectChallenge.create(challengeData);
  
  res.status(201).json(successResponse(challenge, 'Challenge created successfully'));
});

/**
 * @route   GET /api/employers/challenges
 * @desc    Get all challenges by employer
 * @access  Private (Employer)
 */
exports.getMyChallenges = asyncHandler(async (req, res) => {
  const challenges = await ProjectChallenge.find({ employer: req.user._id })
    .sort('-createdAt');
  
  res.status(200).json(successResponse(challenges, 'Challenges retrieved successfully'));
});

/**
 * @route   GET /api/employers/challenges/:id/submissions
 * @desc    Get all submissions for a challenge
 * @access  Private (Employer)
 */
exports.getChallengeSubmissions = asyncHandler(async (req, res) => {
  const challenge = await ProjectChallenge.findOne({
    _id: req.params.id,
    employer: req.user._id
  }).populate({
    path: 'submissions.student',
    populate: {
      path: 'studentProfile',
      select: 'firstName lastName profilePhoto skills'
    }
  });
  
  if (!challenge) {
    return res.status(404).json({
      success: false,
      message: 'Challenge not found'
    });
  }
  
  res.status(200).json(successResponse(challenge.submissions, 'Submissions retrieved successfully'));
});

/**
 * @route   PUT /api/employers/challenges/:challengeId/submissions/:submissionId
 * @desc    Evaluate a challenge submission
 * @access  Private (Employer)
 */
exports.evaluateSubmission = asyncHandler(async (req, res) => {
  const { status, score, feedback } = req.body;
  
  const challenge = await ProjectChallenge.findOne({
    _id: req.params.challengeId,
    employer: req.user._id
  });
  
  if (!challenge) {
    return res.status(404).json({
      success: false,
      message: 'Challenge not found'
    });
  }
  
  const submission = challenge.submissions.id(req.params.submissionId);
  
  if (!submission) {
    return res.status(404).json({
      success: false,
      message: 'Submission not found'
    });
  }
  
  submission.status = status;
  submission.score = score;
  submission.feedback = feedback;
  submission.evaluatedAt = new Date();
  
  await challenge.save();
  
  res.status(200).json(successResponse(submission, 'Submission evaluated successfully'));
});
