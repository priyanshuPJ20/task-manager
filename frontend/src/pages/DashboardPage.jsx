import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { CheckSquare, Clock, AlertCircle, ListTodo, Users, FolderOpen } from 'lucide-react';

const STATUS_PILL = {
  'Todo': 'bg-gray-100 text-gray-700',
  'In Progress': 'bg-amber-100 text-amber-700',
  'Done': 'bg-green-100 text-green-700',
};

const PRIORITY_PILL = {
  'High': 'text-red-600',
  'Medium': 'text-amber-600',
  'Low': 'text-gray-500',
};

const StatCard = ({ label, value, icon: Icon, color }) => (
  <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex items-center gap-4">
    <div className={`p-3 rounded-lg ${color}`}>
      <Icon className="w-5 h-5" />
    </div>
    <div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500 mt-0.5">{label}</p>
    </div>
  </div>
);

const DashboardPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useContext(AuthContext);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get('/dashboard');
        setData(res.data);
      } catch (err) {
        setError('Failed to load dashboard data.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-48" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
        {error}
      </div>
    );
  }

  const { stats, recentTasks, projects } = data;

  return (
    <div className="space-y-6">

      {/* Page header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Welcome back, <span className="font-medium text-gray-700">{user?.name}</span>
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Tasks"
          value={stats.totalTasks}
          icon={ListTodo}
          color="bg-indigo-50 text-indigo-600"
        />
        <StatCard
          label="Completed"
          value={stats.completedTasks}
          icon={CheckSquare}
          color="bg-green-50 text-green-600"
        />
        <StatCard
          label="In Progress"
          value={stats.inProgressTasks}
          icon={Clock}
          color="bg-amber-50 text-amber-600"
        />
        <StatCard
          label="Overdue"
          value={stats.overdueTasks}
          icon={AlertCircle}
          color="bg-red-50 text-red-600"
        />
      </div>

      {/* Admin: total users */}
      {user?.role === 'admin' && stats.totalUsers !== undefined && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex items-center gap-3">
          <Users className="w-5 h-5 text-indigo-500" />
          <span className="text-sm text-gray-700">
            <span className="font-semibold text-gray-900">{stats.totalUsers}</span> total users in the system
          </span>
        </div>
      )}

      <div className="grid lg:grid-cols-5 gap-6">

        {/* Recent tasks — 3/5 width */}
        <div className="lg:col-span-3 bg-white border border-gray-200 rounded-xl shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">Recent Tasks</h2>
            <Link to="/tasks" className="text-xs text-indigo-600 hover:underline font-medium">
              View all →
            </Link>
          </div>

          {recentTasks.length === 0 ? (
            <p className="text-sm text-gray-500 px-5 py-6">No tasks yet.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {recentTasks.map((task) => {
                const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'Done';
                return (
                  <div key={task._id} className="px-5 py-3.5 flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-xs text-gray-400">
                          {task.projectId?.name || '—'}
                        </span>
                        {task.dueDate && (
                          <span className={`text-xs ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-400'}`}>
                            · {isOverdue ? 'Overdue' : new Date(task.dueDate).toLocaleDateString()}
                          </span>
                        )}
                        {task.priority && (
                          <span className={`text-xs font-medium ${PRIORITY_PILL[task.priority]}`}>
                            · {task.priority}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${STATUS_PILL[task.status]}`}>
                      {task.status}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Projects — 2/5 width */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">Projects</h2>
            <Link to="/projects" className="text-xs text-indigo-600 hover:underline font-medium">
              View all →
            </Link>
          </div>

          {projects.length === 0 ? (
            <p className="text-sm text-gray-500 px-5 py-6">No projects yet.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {projects.map((project) => (
                <div key={project._id} className="px-5 py-3.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <FolderOpen className="w-4 h-4 text-indigo-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{project.name}</p>
                      <p className="text-xs text-gray-400">
                        {project.members?.length || 0} member{project.members?.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      project.status === 'archived'
                        ? 'bg-gray-100 text-gray-500'
                        : 'bg-indigo-50 text-indigo-600'
                    }`}>
                      {project.status || 'active'}
                    </span>
                    <span className="text-xs text-gray-500">{project.taskCount} tasks</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;