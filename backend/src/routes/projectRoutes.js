const express = require('express');
const router = express.Router();
const { getProjects, createProject, deleteProject } = require('../controllers/projectController');
const { protect, admin } = require('../middleware/auth');
const { body } = require('express-validator');

// Validation middleware
const validateProject = [
  body('name', 'Name is required').not().isEmpty(),
  body('description', 'Description is required').not().isEmpty()
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
  .get(protect, getProjects)
  .post(protect, admin, validateProject, handleValidationErrors, createProject);

router.route('/:id')
  .delete(protect, admin, deleteProject);

module.exports = router;
