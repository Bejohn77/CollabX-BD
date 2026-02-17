const express = require('express');
const { body } = require('express-validator');
const { validate } = require('../../middleware/validator');
const { protect, authorize, optionalAuth } = require('../../middleware/auth');
const jobController = require('./jobController');
const upload = require('../../middleware/upload');

const router = express.Router();

/**
 * Public job routes
 */
router.get('/', optionalAuth, jobController.getJobs);
router.get('/recommendations', protect, authorize('student'), jobController.getRecommendations);
router.get('/:id', jobController.getJob);

/**
 * Application routes
 */
router.post('/:id/apply',
  protect,
  authorize('student'),
  upload.single('resume'),
  [
    body('coverLetter').optional().trim(),
    validate
  ],
  jobController.applyToJob
);

router.get('/applications/my', protect, authorize('student'), jobController.getMyApplications);
router.put('/applications/:id/withdraw', protect, authorize('student'), jobController.withdrawApplication);

module.exports = router;
