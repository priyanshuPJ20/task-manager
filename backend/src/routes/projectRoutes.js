const express = require('express');
const router = express.Router();
const {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
} = require('../controllers/projectController');
const { protect, admin } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

const validateProject = [
  body('name', 'Name is required').not().isEmpty(),
  body('description', 'Description is required').not().isEmpty(),
];

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// GET all / POST create
router.route('/')
  .get(protect, getProjects)
  .post(protect, admin, validateProject, handleValidationErrors, createProject);

// GET one / PUT update / DELETE
router.route('/:id')
  .get(protect, getProjectById)
  .put(protect, admin, updateProject)
  .delete(protect, admin, deleteProject);

module.exports = router;
