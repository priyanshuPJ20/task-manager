const express = require('express');
const router = express.Router();
const { getTasks, createTask, updateTaskStatus, deleteTask } = require('../controllers/taskController');
const { protect, admin } = require('../middleware/auth');
const { body } = require('express-validator');

// Validation middleware
const validateTask = [
  body('title', 'Title is required').not().isEmpty(),
  body('description', 'Description is required').not().isEmpty(),
  body('projectId', 'Project ID is required').not().isEmpty()
];

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const { validationResult } = require('express-validator');
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

router.route('/')
  .get(protect, getTasks)
  .post(protect, admin, validateTask, handleValidationErrors, createTask);

router.route('/:id')
  .put(protect, updateTaskStatus)
  .delete(protect, admin, deleteTask);

module.exports = router;
