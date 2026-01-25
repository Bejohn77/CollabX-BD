const express = require('express');
const { body } = require('express-validator');
const { validate } = require('../../middleware/validator');
const { protect, authorize } = require('../../middleware/auth');
const adminController = require('./adminController');

const router = express.Router();

// All routes require admin role
router.use(protect, authorize('admin'));

/**
 * Dashboard
 */
router.get('/dashboard', adminController.getDashboard);

/**
 * User management
 */
router.get('/users', adminController.getUsers);
router.get('/users/:id', adminController.getUserDetails);
router.put('/users/:id/toggle-status', adminController.toggleUserStatus);
router.delete('/users/:id', adminController.deleteUser);

/**
 * Job management
 */
router.get('/jobs', adminController.getJobs);
router.put('/jobs/:id/approve', adminController.approveJob);
router.put('/jobs/:id/reject',
  [
    body('reason').trim().notEmpty().withMessage('Rejection reason is required'),
    validate
  ],
  adminController.rejectJob
);
router.delete('/jobs/:id', adminController.deleteJob);

/**
 * Course management
 */
router.post('/courses',
  [
    body('title').trim().notEmpty().withMessage('Course title is required'),
    body('description').trim().notEmpty().withMessage('Course description is required'),
    body('category').trim().notEmpty().withMessage('Category is required'),
    validate
  ],
  adminController.createCourse
);
router.put('/courses/:id', adminController.updateCourse);
router.delete('/courses/:id', adminController.deleteCourse);

/**
 * Content moderation
 */
router.get('/posts/reported', adminController.getReportedPosts);
router.put('/posts/:id/hide', adminController.togglePostVisibility);

/**
 * Employer verification
 */
router.put('/employers/:id/verify', adminController.verifyEmployer);
router.put('/employers/:id/unverify', adminController.unverifyEmployer);

module.exports = router;
