const express = require('express');
const { body, param } = require('express-validator');
const { validate } = require('../../middleware/validator');
const { protect } = require('../../middleware/auth');
const postController = require('./postController');
const upload = require('../../middleware/upload');

const router = express.Router();

/**
 * Public routes
 */
router.get('/feed', protect, postController.getFeed);
router.get('/user/:userId', postController.getUserPosts);
router.get('/:id', postController.getPost);

/**
 * Protected routes - Post CRUD
 */
router.post(
  '/',
  protect,
  [
    body('content')
      .trim()
      .notEmpty()
      .withMessage('Post content is required')
      .isLength({ max: 5000 })
      .withMessage('Post content cannot exceed 5000 characters'),
    body('postType')
      .optional()
      .isIn(['general', 'job-achievement', 'course-completion', 'project-showcase', 'article-share'])
      .withMessage('Invalid post type'),
    body('visibility')
      .optional()
      .isIn(['public', 'connections', 'private'])
      .withMessage('Invalid visibility setting'),
    validate
  ],
  postController.createPost
);

router.put(
  '/:id',
  protect,
  [
    param('id').isMongoId().withMessage('Invalid post ID'),
    body('content')
      .optional()
      .trim()
      .isLength({ max: 5000 })
      .withMessage('Post content cannot exceed 5000 characters'),
    validate
  ],
  postController.updatePost
);

router.delete(
  '/:id',
  protect,
  [
    param('id').isMongoId().withMessage('Invalid post ID'),
    validate
  ],
  postController.deletePost
);

/**
 * Engagement routes
 */
router.post(
  '/:id/like',
  protect,
  [
    param('id').isMongoId().withMessage('Invalid post ID'),
    validate
  ],
  postController.toggleLike
);

router.post(
  '/:id/comment',
  protect,
  [
    param('id').isMongoId().withMessage('Invalid post ID'),
    body('content')
      .trim()
      .notEmpty()
      .withMessage('Comment content is required')
      .isLength({ max: 1000 })
      .withMessage('Comment cannot exceed 1000 characters'),
    validate
  ],
  postController.addComment
);

router.delete(
  '/:id/comment/:commentId',
  protect,
  [
    param('id').isMongoId().withMessage('Invalid post ID'),
    param('commentId').isMongoId().withMessage('Invalid comment ID'),
    validate
  ],
  postController.deleteComment
);

/**
 * Reporting
 */
router.post(
  '/:id/report',
  protect,
  [
    param('id').isMongoId().withMessage('Invalid post ID'),
    body('reason')
      .trim()
      .notEmpty()
      .withMessage('Report reason is required'),
    validate
  ],
  postController.reportPost
);

/**
 * My posts
 */
router.get('/my/posts', protect, postController.getMyPosts);

module.exports = router;
