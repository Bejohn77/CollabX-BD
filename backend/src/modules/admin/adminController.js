const User = require('../../models/User');
const StudentProfile = require('../../models/StudentProfile');
const EmployerProfile = require('../../models/EmployerProfile');
const Job = require('../../models/Job');
const Application = require('../../models/Application');
const Course = require('../../models/Course');
const Enrollment = require('../../models/Enrollment');
const Post = require('../../models/Post');
const { asyncHandler, successResponse, paginate } = require('../../utils/helpers');

/**
 * @route   GET /api/admin/dashboard
 * @desc    Get admin dashboard statistics
 * @access  Private (Admin)
 */
exports.getDashboard = asyncHandler(async (req, res) => {
  // Get counts
  const totalUsers = await User.countDocuments();
  const totalStudents = await User.countDocuments({ role: 'student' });
  const totalEmployers = await User.countDocuments({ role: 'employer' });
  const totalJobs = await Job.countDocuments();
  const activeJobs = await Job.countDocuments({ status: 'active' });
  const pendingJobs = await Job.countDocuments({ status: 'pending' });
  const totalApplications = await Application.countDocuments();
  const totalCourses = await Course.countDocuments();
  const totalEnrollments = await Enrollment.countDocuments();
  
  // Recent statistics (last 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const newUsersLast30Days = await User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });
  const newJobsLast30Days = await Job.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });
  const newApplicationsLast30Days = await Application.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });
  
  // Application status breakdown
  const applicationsByStatus = await Application.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);
  
  // Top skills in demand
  const topSkills = await Job.aggregate([
    { $match: { status: 'active' } },
    { $unwind: '$requiredSkills' },
    {
      $group: {
        _id: '$requiredSkills.name',
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } },
    { $limit: 10 }
  ]);
  
  // Course completion rate
  const completedEnrollments = await Enrollment.countDocuments({ status: 'completed' });
  const courseCompletionRate = totalEnrollments > 0 
    ? ((completedEnrollments / totalEnrollments) * 100).toFixed(2) 
    : 0;
  
  res.status(200).json(successResponse({
    overview: {
      totalUsers,
      totalStudents,
      totalEmployers,
      totalJobs,
      activeJobs,
      pendingJobs,
      totalApplications,
      totalCourses,
      totalEnrollments
    },
    recentActivity: {
      newUsersLast30Days,
      newJobsLast30Days,
      newApplicationsLast30Days
    },
    applicationsByStatus,
    topSkills,
    courseCompletionRate
  }, 'Dashboard data retrieved successfully'));
});

/**
 * @route   GET /api/admin/users
 * @desc    Get all users with filtering
 * @access  Private (Admin)
 */
exports.getUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, role, isActive, search } = req.query;
  const skip = (page - 1) * limit;
  
  const query = {};
  
  if (role) {
    query.role = role;
  }
  
  if (isActive !== undefined) {
    query.isActive = isActive === 'true';
  }
  
  if (search) {
    query.email = new RegExp(search, 'i');
  }
  
  let users = await User.find(query)
    .sort('-createdAt')
    .skip(skip)
    .limit(parseInt(limit))
    .select('-password');
  
  // Populate role-specific profiles
  if (role === 'employer') {
    users = await User.populate(users, {
      path: 'employerProfile',
      select: 'companyName companySize industry isVerified verifiedAt activeJobs'
    });
  } else if (role === 'student') {
    users = await User.populate(users, {
      path: 'studentProfile',
      select: 'firstName lastName university profileCompleteness'
    });
  }
  
  const total = await User.countDocuments(query);
  
  res.status(200).json({
    success: true,
    data: {
      users,
      total
    },
    pagination: paginate(page, limit, total)
  });
});

/**
 * @route   GET /api/admin/users/:id
 * @desc    Get user details
 * @access  Private (Admin)
 */
exports.getUserDetails = asyncHandler(async (req, res) => {
  let user = await User.findById(req.params.id).select('-password');
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }
  
  // Populate role-specific profile
  if (user.role === 'student') {
    user = await User.findById(req.params.id).populate('studentProfile').select('-password');
  } else if (user.role === 'employer') {
    user = await User.findById(req.params.id).populate('employerProfile').select('-password');
  }
  
  res.status(200).json(successResponse(user, 'User details retrieved successfully'));
});

/**
 * @route   PUT /api/admin/users/:id/toggle-status
 * @desc    Activate or deactivate user account
 * @access  Private (Admin)
 */
exports.toggleUserStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }
  
  user.isActive = !user.isActive;
  await user.save();
  
  res.status(200).json(successResponse(user, `User ${user.isActive ? 'activated' : 'deactivated'} successfully`));
});

/**
 * @route   DELETE /api/admin/users/:id
 * @desc    Delete user account
 * @access  Private (Admin)
 */
exports.deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }
  
  // Delete role-specific profile
  if (user.role === 'student') {
    await StudentProfile.deleteOne({ user: user._id });
  } else if (user.role === 'employer') {
    await EmployerProfile.deleteOne({ user: user._id });
  }
  
  await user.deleteOne();
  
  res.status(200).json(successResponse(null, 'User deleted successfully'));
});

/**
 * @route   GET /api/admin/jobs
 * @desc    Get all jobs (including pending)
 * @access  Private (Admin)
 */
exports.getJobs = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status } = req.query;
  const skip = (page - 1) * limit;
  
  const query = {};
  if (status) {
    query.status = status;
  }
  
  const jobs = await Job.find(query)
    .sort('-createdAt')
    .skip(skip)
    .limit(parseInt(limit))
    .populate('employer', 'email')
    .populate({
      path: 'employer',
      populate: {
        path: 'employerProfile',
        select: 'companyName'
      }
    });
  
  const total = await Job.countDocuments(query);
  
  res.status(200).json({
    success: true,
    data: jobs,
    pagination: paginate(page, limit, total)
  });
});

/**
 * @route   PUT /api/admin/jobs/:id/approve
 * @desc    Approve job posting
 * @access  Private (Admin)
 */
exports.approveJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);
  
  if (!job) {
    return res.status(404).json({
      success: false,
      message: 'Job not found'
    });
  }
  
  job.status = 'active';
  job.approvedBy = req.user._id;
  job.approvedAt = new Date();
  job.isPublished = true;
  await job.save();
  
  // Update employer stats
  const employerProfile = await EmployerProfile.findOne({ user: job.employer });
  if (employerProfile) {
    employerProfile.activeJobs += 1;
    await employerProfile.save();
  }
  
  res.status(200).json(successResponse(job, 'Job approved successfully'));
});

/**
 * @route   PUT /api/admin/jobs/:id/reject
 * @desc    Reject job posting
 * @access  Private (Admin)
 */
exports.rejectJob = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  
  const job = await Job.findById(req.params.id);
  
  if (!job) {
    return res.status(404).json({
      success: false,
      message: 'Job not found'
    });
  }
  
  job.status = 'cancelled';
  job.rejectionReason = reason;
  await job.save();
  
  res.status(200).json(successResponse(job, 'Job rejected'));
});

/**
 * @route   DELETE /api/admin/jobs/:id
 * @desc    Delete job posting
 * @access  Private (Admin)
 */
exports.deleteJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);
  
  if (!job) {
    return res.status(404).json({
      success: false,
      message: 'Job not found'
    });
  }
  
  // Delete all applications for this job
  await Application.deleteMany({ job: job._id });
  
  await job.deleteOne();
  
  res.status(200).json(successResponse(null, 'Job deleted successfully'));
});

/**
 * @route   POST /api/admin/courses
 * @desc    Create a new course
 * @access  Private (Admin)
 */
exports.createCourse = asyncHandler(async (req, res) => {
  try {
    const courseData = {
      ...req.body,
      createdBy: req.user._id
    };
    
    console.log('Creating course with data:', JSON.stringify(courseData, null, 2));
    
    // Check if slug already exists
    if (courseData.slug) {
      const existingCourse = await Course.findOne({ slug: courseData.slug });
      if (existingCourse) {
        return res.status(400).json({
          success: false,
          message: 'A course with this slug already exists. Please use a different slug or title.'
        });
      }
    }
    
    const course = await Course.create(courseData);
    
    console.log('Course created successfully:', course._id);
    
    res.status(201).json(successResponse(course, 'Course created successfully'));
  } catch (error) {
    console.error('Course creation error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: `Validation failed: ${messages.join(', ')}`
      });
    }
    
    // Handle MongoDB duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `A course with this ${field} already exists. Please use a different value.`
      });
    }
    throw error;
  }
});

/**
 * @route   PUT /api/admin/courses/:id
 * @desc    Update course
 * @access  Private (Admin)
 */
exports.updateCourse = asyncHandler(async (req, res) => {
  try {
    console.log('Updating course:', req.params.id);
    console.log('Update data topics count:', req.body.topics?.length);
    console.log('Topics being sent:', JSON.stringify(req.body.topics?.map(t => ({ title: t.title, hasId: !!t._id })), null, 2));
    
    // Check if slug is being updated and if it already exists
    if (req.body.slug) {
      const existingCourse = await Course.findOne({ 
        slug: req.body.slug,
        _id: { $ne: req.params.id }
      });
      if (existingCourse) {
        return res.status(400).json({
          success: false,
          message: 'A course with this slug already exists. Please use a different slug.'
        });
      }
    }
    
    const course = await Course.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }
    
    console.log('Course updated successfully. Topics count:', course.topics?.length);
    
    res.status(200).json(successResponse(course, 'Course updated successfully'));
  } catch (error) {
    // Handle MongoDB duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `A course with this ${field} already exists. Please use a different value.`
      });
    }
    throw error;
  }
});

/**
 * @route   DELETE /api/admin/courses/:id
 * @desc    Delete course
 * @access  Private (Admin)
 */
exports.deleteCourse = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);
  
  if (!course) {
    return res.status(404).json({
      success: false,
      message: 'Course not found'
    });
  }
  
  // Delete all enrollments
  await Enrollment.deleteMany({ course: course._id });
  
  await course.deleteOne();
  
  res.status(200).json(successResponse(null, 'Course deleted successfully'));
});

/**
 * @route   GET /api/admin/posts/reported
 * @desc    Get reported posts
 * @access  Private (Admin)
 */
exports.getReportedPosts = asyncHandler(async (req, res) => {
  const posts = await Post.find({ isReported: true })
    .sort('-createdAt')
    .populate('author', 'email')
    .populate({
      path: 'author',
      populate: {
        path: 'studentProfile',
        select: 'firstName lastName'
      }
    })
    .populate('reports.reportedBy', 'email');
  
  res.status(200).json(successResponse(posts, 'Reported posts retrieved successfully'));
});

/**
 * @route   PUT /api/admin/posts/:id/hide
 * @desc    Hide/unhide post
 * @access  Private (Admin)
 */
exports.togglePostVisibility = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);
  
  if (!post) {
    return res.status(404).json({
      success: false,
      message: 'Post not found'
    });
  }
  
  post.isHidden = !post.isHidden;
  await post.save();
  
  res.status(200).json(successResponse(post, `Post ${post.isHidden ? 'hidden' : 'visible'} successfully`));
});

/**
 * @route   PUT /api/admin/employers/:id/verify
 * @desc    Verify employer profile
 * @access  Private (Admin)
 */
exports.verifyEmployer = asyncHandler(async (req, res) => {
  console.log('Verifying employer with user ID:', req.params.id);
  
  const profile = await EmployerProfile.findOne({ user: req.params.id });
  
  if (!profile) {
    console.log('Employer profile not found for user:', req.params.id);
    return res.status(404).json({
      success: false,
      message: 'Employer profile not found'
    });
  }
  
  console.log('Found profile:', { id: profile._id, companyName: profile.companyName, wasVerified: profile.isVerified });
  
  profile.isVerified = true;
  profile.verifiedAt = new Date();
  profile.verifiedBy = req.user._id;
  await profile.save();
  
  console.log('Profile verified successfully:', { id: profile._id, isVerified: profile.isVerified });
  
  res.status(200).json(successResponse(profile, 'Employer verified successfully'));
});

/**
 * @route   PUT /api/admin/employers/:id/unverify
 * @desc    Remove verification from employer profile
 * @access  Private (Admin)
 */
exports.unverifyEmployer = asyncHandler(async (req, res) => {
  const profile = await EmployerProfile.findOne({ user: req.params.id });
  
  if (!profile) {
    return res.status(404).json({
      success: false,
      message: 'Employer profile not found'
    });
  }
  
  profile.isVerified = false;
  profile.verifiedAt = null;
  profile.verifiedBy = null;
  await profile.save();
  
  res.status(200).json(successResponse(profile, 'Employer verification removed successfully'));
});
