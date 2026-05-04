const Project = require('../models/Project');
const Task = require('../models/Task');

// GET ALL PROJECTS
const getProjects = async (req, res) => {
  try {
    let projects;
    if (req.user.role === 'admin') {
      projects = await Project.find({})
        .populate('members', 'name email role')
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 });
    } else {
      projects = await Project.find({ members: req.user._id })
        .populate('members', 'name email role')
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 });
    }
    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET SINGLE PROJECT
const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('members', 'name email role')
      .populate('createdBy', 'name email');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Members or admin can view
    const isMember = project.members.some(
      (m) => m._id.toString() === req.user._id.toString()
    );
    if (req.user.role !== 'admin' && !isMember) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json(project);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// CREATE PROJECT
const createProject = async (req, res) => {
  try {
    const { name, description, members } = req.body;

    const project = new Project({
      name,
      description,
      members: members || [],
      createdBy: req.user._id,
    });

    const createdProject = await project.save();
    const populated = await createdProject.populate('members', 'name email role');
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// UPDATE PROJECT (admin only)
const updateProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const { name, description, members, status } = req.body;

    if (name) project.name = name;
    if (description) project.description = description;
    if (members !== undefined) project.members = members;
    if (status) project.status = status;

    const updated = await project.save();
    const populated = await updated.populate([
      { path: 'members', select: 'name email role' },
      { path: 'createdBy', select: 'name email' },
    ]);
    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// DELETE PROJECT (admin only)
const deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Also delete all tasks in this project
    await Task.deleteMany({ projectId: req.params.id });
    await project.deleteOne();
    res.json({ message: 'Project and its tasks removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { getProjects, getProjectById, createProject, updateProject, deleteProject };
