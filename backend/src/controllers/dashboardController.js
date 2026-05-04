const Task = require('../models/Task');
const Project = require('../models/Project');
const User = require('../models/User');

// GET DASHBOARD STATS
const getDashboardStats = async (req, res) => {
  try {
    const now = new Date();
    const isAdmin = req.user.role === 'admin';

    // Task filter based on role
    const taskFilter = isAdmin ? {} : { assignedTo: req.user._id };
    const overdueFilter = {
      ...taskFilter,
      dueDate: { $lt: now },
      status: { $ne: 'Done' },
    };

    const [
      totalTasks,
      completedTasks,
      inProgressTasks,
      todoTasks,
      overdueTasks,
      recentTasks,
      projects,
      totalUsers,
    ] = await Promise.all([
      Task.countDocuments(taskFilter),
      Task.countDocuments({ ...taskFilter, status: 'Done' }),
      Task.countDocuments({ ...taskFilter, status: 'In Progress' }),
      Task.countDocuments({ ...taskFilter, status: 'Todo' }),
      Task.countDocuments(overdueFilter),
      Task.find(taskFilter)
        .populate('assignedTo', 'name email')
        .populate('projectId', 'name')
        .sort({ createdAt: -1 })
        .limit(5),
      isAdmin
        ? Project.find({}).populate('members', 'name').sort({ createdAt: -1 }).limit(5)
        : Project.find({ members: req.user._id }).sort({ createdAt: -1 }).limit(5),
      isAdmin ? User.countDocuments({}) : null,
    ]);

    // Task counts per project (admin gets all, member gets their own)
    const projectTaskCounts = await Task.aggregate([
      { $match: isAdmin ? {} : { assignedTo: req.user._id } },
      { $group: { _id: '$projectId', count: { $sum: 1 } } },
    ]);

    const projectCountMap = {};
    projectTaskCounts.forEach((p) => {
      projectCountMap[p._id.toString()] = p.count;
    });

    const projectsWithCount = projects.map((p) => ({
      ...p.toObject(),
      taskCount: projectCountMap[p._id.toString()] || 0,
    }));

    res.json({
      stats: {
        totalTasks,
        completedTasks,
        inProgressTasks,
        todoTasks,
        overdueTasks,
        totalUsers: isAdmin ? totalUsers : undefined,
      },
      recentTasks,
      projects: projectsWithCount,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { getDashboardStats };
