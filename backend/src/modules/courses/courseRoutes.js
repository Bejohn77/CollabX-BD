const express = require('express');
const { body, param } = require('express-validator');
const { validate } = require('../../middleware/validator');
const { protect, authorize, optionalAuth } = require('../../middleware/auth');
const courseController = require('./courseController');

const router = express.Router();

/**
 * Public course routes
 */
router.get('/', optionalAuth, courseController.getCourses);
router.get('/recommendations/for-job/:jobId', optionalAuth, courseController.getCoursesForJob);
router.get('/:id', optionalAuth, courseController.getCourse);

/**
 * Enrollment routes
 */
router.post('/:id/enroll', protect, authorize('student'), courseController.enrollInCourse);
router.get('/my/enrollments', protect, authorize('student'), courseController.getMyEnrollments);

/**
 * Progress tracking routes
 */
// Topic-based completion (W3Schools/JavaTpoint style)
router.put('/:courseId/topics/:topicId/complete',
  protect,
  authorize('student'),
  courseController.completeTopic
);

// Legacy lesson completion
router.put('/:courseId/lessons/:lessonId/complete',
  protect,
  authorize('student'),
  [
    body('moduleId').notEmpty().withMessage('Module ID is required'),
    validate
  ],
  courseController.completeLesson
);

router.post('/:courseId/assessments/:assessmentId/submit',
  protect,
  authorize('student'),
  [
    body('answers').isArray().withMessage('Answers must be an array'),
    validate
  ],
  courseController.submitAssessment
);

router.post('/:id/complete', protect, authorize('student'), courseController.completeCourse);

/**
 * Rating routes
 */
router.post('/:id/rate',
  protect,
  authorize('student'),
  [
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('review').optional().trim(),
    validate
  ],
  courseController.rateCourse
);

module.exports = router;
