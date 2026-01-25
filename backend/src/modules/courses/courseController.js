const Course = require('../../models/Course');
const Enrollment = require('../../models/Enrollment');
const StudentProfile = require('../../models/StudentProfile');
const { asyncHandler, successResponse, paginate } = require('../../utils/helpers');

/**
 * @route   GET /api/courses
 * @desc    Get all courses
 * @access  Public
 */
exports.getCourses = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, category, level, search } = req.query;
  const skip = (page - 1) * limit;
  
  // Admin can see all courses, regular users only see published ones
  const query = {};
  if (!req.user || req.user.role !== 'admin') {
    query.isPublished = true;
  }
  
  if (category) {
    query.category = category;
  }
  
  if (level) {
    query.level = level;
  }
  
  if (search) {
    query.$text = { $search: search };
  }
  
  console.log('getCourses query:', query);
  
  const courses = await Course.find(query)
    .sort('-createdAt')
    .skip(skip)
    .limit(parseInt(limit))
    .select('-modules.lessons.content'); // Don't include full content in list
  
  console.log('Found courses:', courses.length);
  
  const total = await Course.countDocuments(query);
  
  res.status(200).json({
    success: true,
    data: courses,
    pagination: paginate(page, limit, total)
  });
});

/**
 * @route   GET /api/courses/:id
 * @desc    Get single course
 * @access  Public
 */
exports.getCourse = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);
  
  console.log('getCourse - Course ID:', req.params.id);
  console.log('getCourse - Course found:', !!course);
  console.log('getCourse - Course title:', course?.title);
  console.log('getCourse - Topics count:', course?.topics?.length);
  console.log('getCourse - Topics:', JSON.stringify(course?.topics?.map(t => ({ title: t.title, order: t.order })), null, 2));
  
  if (!course) {
    return res.status(404).json({
      success: false,
      message: 'Course not found'
    });
  }
  
  // If user is enrolled, include their progress
  let enrollment = null;
  if (req.user) {
    enrollment = await Enrollment.findOne({
      course: req.params.id,
      student: req.user._id
    });
  }
  
  res.status(200).json(successResponse({ course, enrollment }, 'Course retrieved successfully'));
});

/**
 * @route   POST /api/courses/:id/enroll
 * @desc    Enroll in a course
 * @access  Private (Student)
 */
exports.enrollInCourse = asyncHandler(async (req, res) => {
  const courseId = req.params.id;
  
  // Check if course exists
  const course = await Course.findById(courseId);
  if (!course) {
    return res.status(404).json({
      success: false,
      message: 'Course not found'
    });
  }
  
  if (!course.isPublished) {
    return res.status(400).json({
      success: false,
      message: 'Course is not available for enrollment'
    });
  }
  
  // Check if already enrolled
  const existingEnrollment = await Enrollment.findOne({
    course: courseId,
    student: req.user._id
  });
  
  if (existingEnrollment) {
    return res.status(400).json({
      success: false,
      message: 'Already enrolled in this course'
    });
  }
  
  // Create enrollment
  const enrollment = await Enrollment.create({
    course: courseId,
    student: req.user._id,
    status: 'active'
  });
  
  // Update course enrollment count
  course.enrollmentCount += 1;
  await course.save();
  
  res.status(201).json(successResponse(enrollment, 'Enrolled successfully'));
});

/**
 * @route   GET /api/courses/my/enrollments
 * @desc    Get all enrolled courses
 * @access  Private (Student)
 */
exports.getMyEnrollments = asyncHandler(async (req, res) => {
  const { status } = req.query;
  
  const query = { student: req.user._id };
  if (status) {
    query.status = status;
  }
  
  const enrollments = await Enrollment.find(query)
    .sort('-createdAt')
    .populate('course')
    .populate('student', 'firstName lastName email');
  
  res.status(200).json(successResponse(enrollments, 'Enrollments retrieved successfully'));
});

/**
 * @route   PUT /api/courses/:courseId/lessons/:lessonId/complete
 * @desc    Mark a lesson as complete
 * @access  Private (Student)
 */
exports.completeLesson = asyncHandler(async (req, res) => {
  const { courseId, lessonId } = req.params;
  const { moduleId } = req.body;
  
  const enrollment = await Enrollment.findOne({
    course: courseId,
    student: req.user._id
  });
  
  if (!enrollment) {
    return res.status(404).json({
      success: false,
      message: 'Enrollment not found'
    });
  }
  
  // Check if already completed
  const alreadyCompleted = enrollment.progress.completedLessons.some(
    l => l.lessonId.toString() === lessonId
  );
  
  if (!alreadyCompleted) {
    enrollment.progress.completedLessons.push({
      moduleId,
      lessonId,
      completedAt: new Date()
    });
    
    // Calculate overall progress
    const course = await Course.findById(courseId);
    const totalLessons = course.modules.reduce((sum, module) => sum + module.lessons.length, 0);
    enrollment.progress.overallProgress = Math.round((enrollment.progress.completedLessons.length / totalLessons) * 100);
    
    enrollment.lastAccessedAt = new Date();
    await enrollment.save();
  }
  
  res.status(200).json(successResponse(enrollment, 'Lesson marked as complete'));
});

/**
 * @route   PUT /api/courses/:courseId/topics/:topicId/complete
 * @desc    Mark a topic as complete
 * @access  Private (Student)
 */
exports.completeTopic = asyncHandler(async (req, res) => {
  const { courseId, topicId } = req.params;
  
  const enrollment = await Enrollment.findOne({
    course: courseId,
    student: req.user._id
  });
  
  if (!enrollment) {
    return res.status(404).json({
      success: false,
      message: 'Enrollment not found'
    });
  }
  
  // Check if already completed
  const alreadyCompleted = enrollment.completedTopics.some(
    t => t.toString() === topicId
  );
  
  if (!alreadyCompleted) {
    enrollment.completedTopics.push(topicId);
    enrollment.lastTopicViewed = topicId;
    
    // Calculate overall progress
    const course = await Course.findById(courseId);
    const totalTopics = course.topics?.length || 0;
    
    if (totalTopics > 0) {
      enrollment.progress = Math.round((enrollment.completedTopics.length / totalTopics) * 100);
    }
    
    enrollment.lastAccessedAt = new Date();
    
    // Auto-complete course if all topics done
    if (enrollment.progress >= 100 && enrollment.status !== 'completed') {
      enrollment.status = 'completed';
      enrollment.completedAt = new Date();
      
      // Issue certificate
      if (course.certificateAvailable) {
        enrollment.certificateIssued = true;
        enrollment.certificateId = `CERT-${courseId}-${req.user._id}-${Date.now()}`;
        enrollment.certificateUrl = `/certificates/${enrollment.certificateId}`;
      }
      
      // Update course completion count
      course.completionCount = (course.completionCount || 0) + 1;
      await course.save();
      
      // Add skills to student profile
      const StudentProfile = require('../../models/StudentProfile');
      const profile = await StudentProfile.findOne({ user: req.user._id });
      if (profile && course.skillsCovered) {
        course.skillsCovered.forEach(skill => {
          const existingSkill = profile.skills.find(s => s.name.toLowerCase() === skill.name.toLowerCase());
          if (!existingSkill) {
            profile.skills.push({
              name: skill.name,
              proficiency: skill.proficiencyGained || 'beginner'
            });
          }
        });
        await profile.save();
      }
    }
    
    await enrollment.save();
  }
  
  res.status(200).json(successResponse(enrollment, 'Topic marked as complete'));
});

/**
 * @route   POST /api/courses/:courseId/assessments/:assessmentId/submit
 * @desc    Submit assessment
 * @access  Private (Student)
 */
exports.submitAssessment = asyncHandler(async (req, res) => {
  const { courseId, assessmentId } = req.params;
  const { answers } = req.body;
  
  const enrollment = await Enrollment.findOne({
    course: courseId,
    student: req.user._id
  });
  
  if (!enrollment) {
    return res.status(404).json({
      success: false,
      message: 'Enrollment not found'
    });
  }
  
  const course = await Course.findById(courseId);
  const assessment = course.assessments.id(assessmentId);
  
  if (!assessment) {
    return res.status(404).json({
      success: false,
      message: 'Assessment not found'
    });
  }
  
  // Calculate score
  let score = 0;
  let maxScore = 0;
  
  assessment.questions.forEach((question, index) => {
    maxScore += question.points || 1;
    if (answers[index] === question.correctAnswer) {
      score += question.points || 1;
    }
  });
  
  const percentage = (score / maxScore) * 100;
  const passed = percentage >= assessment.passingScore;
  
  // Save assessment score
  const existingScore = enrollment.assessmentScores.find(
    s => s.assessmentId.toString() === assessmentId
  );
  
  if (existingScore) {
    existingScore.score = score;
    existingScore.maxScore = maxScore;
    existingScore.percentage = percentage;
    existingScore.passed = passed;
    existingScore.attemptedAt = new Date();
    existingScore.attempts += 1;
  } else {
    enrollment.assessmentScores.push({
      assessmentId,
      score,
      maxScore,
      percentage,
      passed,
      attemptedAt: new Date(),
      attempts: 1
    });
  }
  
  await enrollment.save();
  
  res.status(200).json(successResponse({
    score,
    maxScore,
    percentage,
    passed
  }, 'Assessment submitted successfully'));
});

/**
 * @route   POST /api/courses/:id/complete
 * @desc    Mark course as complete and issue certificate
 * @access  Private (Student)
 */
exports.completeCourse = asyncHandler(async (req, res) => {
  const courseId = req.params.id;
  
  const enrollment = await Enrollment.findOne({
    course: courseId,
    student: req.user._id
  });
  
  if (!enrollment) {
    return res.status(404).json({
      success: false,
      message: 'Enrollment not found'
    });
  }
  
  // Check if course is already completed
  if (enrollment.status === 'completed') {
    return res.status(400).json({
      success: false,
      message: 'Course already completed'
    });
  }
  
  // Verify all requirements are met (simplified check)
  if (enrollment.progress.overallProgress < 80) {
    return res.status(400).json({
      success: false,
      message: 'Please complete at least 80% of the course to get certified'
    });
  }
  
  const course = await Course.findById(courseId);
  
  // Mark as completed
  enrollment.status = 'completed';
  enrollment.completedAt = new Date();
  
  // Issue certificate
  if (course.certificateAwarded) {
    enrollment.certificateIssued = true;
    enrollment.certificateId = `CERT-${courseId}-${req.user._id}-${Date.now()}`;
    enrollment.certificateUrl = `/certificates/${enrollment.certificateId}`;
  }
  
  await enrollment.save();
  
  // Update course completion count
  course.completionCount += 1;
  await course.save();
  
  // Add skills to student profile
  const profile = await StudentProfile.findOne({ user: req.user._id });
  if (profile && course.skillsCovered) {
    course.skillsCovered.forEach(skill => {
      const existingSkill = profile.skills.find(s => s.name.toLowerCase() === skill.name.toLowerCase());
      if (!existingSkill) {
        profile.skills.push({
          name: skill.name,
          proficiency: skill.proficiencyGained || 'beginner'
        });
      }
    });
    await profile.save();
  }
  
  res.status(200).json(successResponse(enrollment, 'Course completed successfully'));
});

/**
 * @route   POST /api/courses/:id/rate
 * @desc    Rate and review a course
 * @access  Private (Student)
 */
exports.rateCourse = asyncHandler(async (req, res) => {
  const { rating, review } = req.body;
  const courseId = req.params.id;
  
  const enrollment = await Enrollment.findOne({
    course: courseId,
    student: req.user._id
  });
  
  if (!enrollment) {
    return res.status(404).json({
      success: false,
      message: 'You must be enrolled to rate this course'
    });
  }
  
  enrollment.rating = rating;
  enrollment.review = review;
  enrollment.reviewedAt = new Date();
  await enrollment.save();
  
  // Update course rating
  const course = await Course.findById(courseId);
  const allRatings = await Enrollment.find({ course: courseId, rating: { $exists: true } });
  
  const totalRating = allRatings.reduce((sum, e) => sum + e.rating, 0);
  course.rating.average = totalRating / allRatings.length;
  course.rating.count = allRatings.length;
  await course.save();
  
  res.status(200).json(successResponse(enrollment, 'Rating submitted successfully'));
});

/**
 * @route   GET /api/courses/recommendations/for-job/:jobId
 * @desc    Get course recommendations based on job requirements
 * @access  Public
 */
exports.getCoursesForJob = asyncHandler(async (req, res) => {
  const Job = require('../../models/Job');
  const job = await Job.findById(req.params.jobId);
  
  if (!job) {
    return res.status(404).json({
      success: false,
      message: 'Job not found'
    });
  }
  
  // Get student skills if logged in
  let studentSkills = [];
  if (req.user && req.user.role === 'student') {
    const profile = await StudentProfile.findOne({ user: req.user._id });
    if (profile) {
      studentSkills = profile.skills.map(s => s.name.toLowerCase());
    }
  }
  
  // Find skill gaps
  const jobSkills = job.requiredSkills.map(s => s.name.toLowerCase());
  const skillGaps = jobSkills.filter(skill => !studentSkills.includes(skill));
  
  // Find courses that teach these skills
  const courses = await Course.find({
    isPublished: true,
    'skillsCovered.name': { $in: skillGaps }
  }).limit(10);
  
  res.status(200).json(successResponse({
    skillGaps,
    recommendedCourses: courses
  }, 'Recommended courses retrieved successfully'));
});
