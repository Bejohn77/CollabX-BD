const express = require('express');
const { body } = require('express-validator');
const { validate } = require('../../middleware/validator');
const { protect, authorize } = require('../../middleware/auth');
const employerController = require('./employerController');
const upload = require('../../middleware/upload');

const router = express.Router();

/**
 * Profile routes
 */
router.get('/profile', protect, authorize('employer'), employerController.getProfile);
router.put('/profile', 
  protect, 
  authorize('employer'),
  upload.single('companyLogo'),
  employerController.updateProfile
);

/**
 * Job posting routes
 */
router.post('/jobs',
  protect,
  authorize('employer'),
  [
    body('title').trim().notEmpty().withMessage('Job title is required'),
    body('description').trim().notEmpty().withMessage('Job description is required'),
    body('jobType').isIn(['full-time', 'part-time', 'internship', 'freelance', 'contract']).withMessage('Invalid job type'),
    body('requiredSkills').isArray({ min: 1 }).withMessage('At least one skill is required'),
    validate
  ],
  employerController.createJob
);

router.get('/jobs', protect, authorize('employer'), employerController.getMyJobs);
router.put('/jobs/:id', protect, authorize('employer'), employerController.updateJob);
router.delete('/jobs/:id', protect, authorize('employer'), employerController.deleteJob);

/**
 * Applicant management routes
 */
router.get('/jobs/:id/applicants', protect, authorize('employer'), employerController.getApplicants);
router.put('/applications/:id/status',
  protect,
  authorize('employer'),
  [
    body('status').isIn(['pending', 'under-review', 'shortlisted', 'interview-scheduled', 'interviewed', 'accepted', 'rejected']).withMessage('Invalid status'),
    validate
  ],
  employerController.updateApplicationStatus
);

/**
 * Candidate search
 */
router.get('/search-candidates', protect, authorize('employer'), employerController.searchCandidates);

/**
 * Project challenges
 */
router.post('/challenges',
  protect,
  authorize('employer'),
  [
    body('title').trim().notEmpty().withMessage('Challenge title is required'),
    body('description').trim().notEmpty().withMessage('Challenge description is required'),
    validate
  ],
  employerController.createChallenge
);

router.get('/challenges', protect, authorize('employer'), employerController.getMyChallenges);
router.get('/challenges/:id/submissions', protect, authorize('employer'), employerController.getChallengeSubmissions);
router.put('/challenges/:challengeId/submissions/:submissionId',
  protect,
  authorize('employer'),
  [
    body('status').isIn(['submitted', 'under-review', 'accepted', 'rejected']).withMessage('Invalid status'),
    validate
  ],
  employerController.evaluateSubmission
);

module.exports = router;
