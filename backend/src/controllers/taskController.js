const Task = require('../models/Task');
const Project = require('../models/Project');

// GET ALL TASKS (with optional ?projectId= filter)
const getTasks = async (req, res) => {
  try {
    const filter = {};

    if (req.user.role !== 'admin') {
      filter.assignedTo = req.user._id;
    }

    if (req.query.projectId) {
      filter.projectId = req.query.projectId;
    }

    if (req.query.status) {
      filter.status = req.query.status;
    }

    if (req.query.priority) {
      filter.priority = req.query.priority;
    }

    const tasks = await Task.find(filter)
      .populate('assignedTo', 'name email')
      .populate('projectId', 'name')
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET OVERDUE TASKS
const getOverdueTasks = async (req, res) => {
  try {
    const now = new Date();
    const filter = {
      dueDate: { $lt: now },
      status: { $ne: 'Done' },
    };

    if (req.user.role !== 'admin') {
      filter.assignedTo = req.user._id;
    }

    const tasks = await Task.find(filter)
      .populate('assignedTo', 'name email')
      .populate('projectId', 'name')
      .sort({ dueDate: 1 });

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET SINGLE TASK
const getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'name email')
      .populate('projectId', 'name');

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// CREATE TASK
const createTask = async (req, res) => {
  try {
    const { title, description, assignedTo, projectId, dueDate, priority } = req.body;

    // Verify project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const task = new Task({
      title,
      description,
      assignedTo: assignedTo || null,
      projectId,
      dueDate: dueDate || null,
      priority: priority || 'Medium',
    });

    const createdTask = await task.save();
    const populated = await createdTask.populate([
      { path: 'assignedTo', select: 'name email' },
      { path: 'projectId', select: 'name' },
    ]);
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// UPDATE TASK (full update — admin can update all fields; assigned user can update only status)
const updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const isAdmin = req.user.role === 'admin';
    const isAssigned = task.assignedTo && task.assignedTo.toString() === req.user._id.toString();

    if (!isAdmin && !isAssigned) {
      return res.status(403).json({ message: 'Not authorized to update this task' });
    }

    // Admin can update everything; assigned user can only update status
    if (isAdmin) {
      const { title, description, assignedTo, projectId, dueDate, priority, status } = req.body;
      if (title) task.title = title;
      if (description) task.description = description;
      if (assignedTo !== undefined) task.assignedTo = assignedTo || null;
      if (projectId) task.projectId = projectId;
      if (dueDate !== undefined) task.dueDate = dueDate || null;
      if (priority) task.priority = priority;
      if (status) task.status = status;
    } else {
      // Member: only status
      if (req.body.status) task.status = req.body.status;
    }

    const updatedTask = await task.save();
    const populated = await updatedTask.populate([
      { path: 'assignedTo', select: 'name email' },
      { path: 'projectId', select: 'name' },
    ]);
    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// DELETE TASK
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    await task.deleteOne();
    res.json({ message: 'Task removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { getTasks, getOverdueTasks, getTaskById, createTask, updateTask, deleteTask };
