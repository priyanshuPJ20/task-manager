const express = require('express');
const router = express.Router();
const {
  getTasks,
  getOverdueTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
} = require('../controllers/taskController');
const { protect, admin } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

const validateTask = [
  body('title', 'Title is required').not().isEmpty(),
  body('description', 'Description is required').not().isEmpty(),
  body('projectId', 'Project ID is required').not().isEmpty(),
];

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Overdue — must be before /:id to avoid route conflict
router.get('/overdue', protect, getOverdueTasks);

// GET all (supports ?projectId= ?status= ?priority=) / POST create
router.route('/')
  .get(protect, getTasks)
  .post(protect, admin, validateTask, handleValidationErrors, createTask);

// GET one / PUT full update / DELETE
router.route('/:id')
  .get(protect, getTaskById)
  .put(protect, updateTask)
  .delete(protect, admin, deleteTask);

module.exports = router;
