const express = require('express');
const { body } = require('express-validator');
const { validate } = require('../../middleware/validator');
const { protect } = require('../../middleware/auth');
const authController = require('./authController');

const router = express.Router();

/**
 * Validation rules
 */
const registerValidation = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['student', 'employer']).withMessage('Invalid role'),
  body('firstName').optional().trim().notEmpty().withMessage('First name is required for students'),
  body('lastName').optional().trim().notEmpty().withMessage('Last name is required for students'),
  body('companyName').optional().trim().notEmpty().withMessage('Company name is required for employers'),
  validate
];

const loginValidation = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required'),
  validate
];

/**
 * Routes
 */
router.post('/register', registerValidation, authController.register);
router.post('/login', loginValidation, authController.login);
router.post('/logout', protect, authController.logout);
router.get('/me', protect, authController.getMe);
router.put('/update-password', protect, authController.updatePassword);

module.exports = router;
