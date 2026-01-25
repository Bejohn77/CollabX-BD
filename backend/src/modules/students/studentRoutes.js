const express = require('express');
const { body } = require('express-validator');
const { validate } = require('../../middleware/validator');
const { protect, authorize } = require('../../middleware/auth');
const studentController = require('./studentController');
const upload = require('../../middleware/upload');

const router = express.Router();

/**
 * Profile routes
 */
router.get('/profile', protect, authorize('student'), studentController.getProfile);
router.put('/profile', 
  protect, 
  authorize('student'),
  upload.single('profilePhoto'),
  studentController.updateProfile
);
router.get('/:id', studentController.getPublicProfile);

/**
 * Social networking routes
 */
router.post('/follow/:userId', protect, authorize('student'), studentController.followUser);
router.delete('/unfollow/:userId', protect, authorize('student'), studentController.unfollowUser);

/**
 * Post routes
 */
router.post('/posts', 
  protect, 
  authorize('student'),
  [
    body('content').trim().notEmpty().withMessage('Post content is required'),
    validate
  ],
  studentController.createPost
);
router.get('/feed', protect, authorize('student'), studentController.getFeed);
router.post('/posts/:postId/like', protect, studentController.likePost);
router.post('/posts/:postId/comment',
  protect,
  [
    body('content').trim().notEmpty().withMessage('Comment content is required'),
    validate
  ],
  studentController.commentOnPost
);

/**
 * Skill endorsement
 */
router.post('/skills/:skillName/endorse',
  protect,
  [
    body('userId').notEmpty().withMessage('User ID is required'),
    validate
  ],
  studentController.endorseSkill
);

module.exports = router;
