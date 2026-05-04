import { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { Plus, X, Trash2, CheckSquare } from 'lucide-react';

const STATUS_COLS = ['Todo', 'In Progress', 'Done'];

const STATUS_HEADER = {
  'Todo': 'bg-gray-100 text-gray-700',
  'In Progress': 'bg-amber-100 text-amber-700',
  'Done': 'bg-green-100 text-green-700',
};

const STATUS_PILL = {
  'Todo': 'bg-gray-100 text-gray-700',
  'In Progress': 'bg-amber-100 text-amber-700',
  'Done': 'bg-green-100 text-green-700',
};

const PRIORITY_LABEL = {
  'High': 'text-red-600 font-medium',
  'Medium': 'text-amber-600',
  'Low': 'text-gray-400',
};

// Modal
const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
    <div className="absolute inset-0 bg-black/30" onClick={onClose} />
    <div className="relative bg-white rounded-xl border border-gray-200 shadow-lg w-full max-w-lg p-6 z-10 max-h-[90vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X className="w-5 h-5" />
        </button>
      </div>
      {children}
    </div>
  </div>
);

const TasksPage = () => {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterProject, setFilterProject] = useState('');

  // Create form
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newProjectId, setNewProjectId] = useState('');
  const [newAssignedTo, setNewAssignedTo] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [newPriority, setNewPriority] = useState('Medium');
  const [newStatus, setNewStatus] = useState('Todo');
  const [creating, setCreating] = useState(false);

  // Edit modal
  const [editTask, setEditTask] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editProjectId, setEditProjectId] = useState('');
  const [editAssignedTo, setEditAssignedTo] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editPriority, setEditPriority] = useState('Medium');
  const [editStatus, setEditStatus] = useState('Todo');
  const [saving, setSaving] = useState(false);

  const { user } = useContext(AuthContext);
  const toast = useToast();
  const isAdmin = user?.role === 'admin';

  const fetchData = async () => {
    try {
      const params = filterProject ? `?projectId=${filterProject}` : '';
      const [tasksRes, projectsRes] = await Promise.all([
        api.get(`/tasks${params}`),
        api.get('/projects'),
      ]);
      setTasks(Array.isArray(tasksRes.data) ? tasksRes.data : []);
      setProjects(Array.isArray(projectsRes.data) ? projectsRes.data : []);

      // Set default project for create form
      const projs = Array.isArray(projectsRes.data) ? projectsRes.data : [];
      if (projs.length > 0 && !newProjectId) setNewProjectId(projs[0]._id);
    } catch (err) {
      toast('Failed to load tasks', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    if (!isAdmin) return;
    try {
      const res = await api.get('/users');
      setUsers(res.data);
    } catch (_) {}
  };

  useEffect(() => {
    fetchData();
    fetchUsers();
  }, [filterProject]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newProjectId) { toast('Please select a project', 'error'); return; }
    setCreating(true);
    try {
      await api.post('/tasks', {
        title: newTitle,
        description: newDesc,
        projectId: newProjectId,
        assignedTo: newAssignedTo || undefined,
        dueDate: newDueDate || undefined,
        priority: newPriority,
        status: newStatus,
      });
      toast('Task created', 'success');
      setNewTitle(''); setNewDesc(''); setNewDueDate('');
      setNewAssignedTo(''); setNewPriority('Medium'); setNewStatus('Todo');
      setShowCreate(false);
      fetchData();
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to create task', 'error');
    } finally {
      setCreating(false);
    }
  };

  const openEdit = (task) => {
    setEditTask(task);
    setEditTitle(task.title);
    setEditDesc(task.description);
    setEditProjectId(task.projectId?._id || '');
    setEditAssignedTo(task.assignedTo?._id || '');
    setEditDueDate(task.dueDate ? task.dueDate.split('T')[0] : '');
    setEditPriority(task.priority || 'Medium');
    setEditStatus(task.status);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body = isAdmin
        ? {
            title: editTitle,
            description: editDesc,
            projectId: editProjectId,
            assignedTo: editAssignedTo || null,
            dueDate: editDueDate || null,
            priority: editPriority,
            status: editStatus,
          }
        : { status: editStatus };

      await api.put(`/tasks/${editTask._id}`, body);
      toast('Task updated', 'success');
      setEditTask(null);
      fetchData();
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to update task', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await api.put(`/tasks/${taskId}`, { status: newStatus });
      setTasks((prev) => prev.map((t) => t._id === taskId ? { ...t, status: newStatus } : t));
    } catch {
      toast('Failed to update status', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this task?')) return;
    try {
      await api.delete(`/tasks/${id}`);
      toast('Task deleted', 'success');
      fetchData();
    } catch {
      toast('Failed to delete task', 'error');
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-7 bg-gray-200 rounded w-24" />
        <div className="grid md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-48 bg-gray-200 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const filteredTasks = tasks;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-gray-900">Tasks</h1>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Project filter */}
          <select
            value={filterProject}
            onChange={(e) => setFilterProject(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
          >
            <option value="">All projects</option>
            {projects.map((p) => (
              <option key={p._id} value={p._id}>{p.name}</option>
            ))}
          </select>
          {isAdmin && (
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Task
            </button>
          )}
        </div>
      </div>

      {/* Kanban board */}
      <div className="grid md:grid-cols-3 gap-4">
        {STATUS_COLS.map((col) => {
          const colTasks = filteredTasks.filter((t) => t.status === col);
          return (
            <div key={col} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              {/* Column header */}
              <div className={`px-4 py-3 flex items-center justify-between border-b border-gray-100`}>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_HEADER[col]}`}>
                  {col}
                </span>
                <span className="text-xs text-gray-400">{colTasks.length}</span>
              </div>

              {/* Tasks */}
              <div className="p-3 space-y-3 min-h-[200px]">
                {colTasks.length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-6">No tasks</p>
                )}
                {colTasks.map((task) => {
                  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'Done';
                  return (
                    <div
                      key={task._id}
                      className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-gray-900 leading-snug">{task.title}</p>
                        {isAdmin && (
                          <div className="flex gap-0.5 shrink-0">
                            <button
                              onClick={() => openEdit(task)}
                              className="p-1 rounded text-gray-400 hover:text-indigo-600 hover:bg-indigo-50"
                              title="Edit"
                            >
                              <CheckSquare className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(task._id)}
                              className="p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>

                      <p className="text-xs text-gray-500 line-clamp-2">{task.description}</p>

                      {/* Meta */}
                      <div className="flex items-center gap-2 flex-wrap text-xs">
                        {task.priority && (
                          <span className={PRIORITY_LABEL[task.priority]}>{task.priority}</span>
                        )}
                        {task.assignedTo && (
                          <span className="text-gray-400">{task.assignedTo.name}</span>
                        )}
                        {task.projectId && (
                          <span className="text-gray-400 truncate">{task.projectId.name}</span>
                        )}
                      </div>

                      {task.dueDate && (
                        <p className={`text-xs ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-400'}`}>
                          {isOverdue ? '⚠ Overdue · ' : ''}
                          {new Date(task.dueDate).toLocaleDateString()}
                        </p>
                      )}

                      {/* Status changer */}
                      <select
                        className="w-full text-xs border border-gray-200 rounded-md px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                        value={task.status}
                        onChange={(e) => handleStatusChange(task._id, e.target.value)}
                      >
                        {STATUS_COLS.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Task Modal */}
      {showCreate && (
        <Modal title="New Task" onClose={() => setShowCreate(false)}>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text" required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Task title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                required rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="What needs to be done?"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
                <select
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  value={newProjectId}
                  onChange={(e) => setNewProjectId(e.target.value)}
                >
                  <option value="">Select project</option>
                  {projects.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value)}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                >
                  {STATUS_COLS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due date</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                />
              </div>
            </div>
            {users.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assign to</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  value={newAssignedTo}
                  onChange={(e) => setNewAssignedTo(e.target.value)}
                >
                  <option value="">Unassigned</option>
                  {users.map((u) => <option key={u._id} value={u._id}>{u.name}</option>)}
                </select>
              </div>
            )}
            <div className="flex gap-2 justify-end pt-1">
              <button type="button" onClick={() => setShowCreate(false)}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
                Cancel
              </button>
              <button type="submit" disabled={creating}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-60">
                {creating ? 'Creating…' : 'Create Task'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Task Modal */}
      {editTask && (
        <Modal title="Edit Task" onClose={() => setEditTask(null)}>
          <form onSubmit={handleUpdate} className="space-y-4">
            {isAdmin && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text" required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    required rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                      value={editProjectId}
                      onChange={(e) => setEditProjectId(e.target.value)}
                    >
                      {projects.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                      value={editPriority}
                      onChange={(e) => setEditPriority(e.target.value)}
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Due date</label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={editDueDate}
                      onChange={(e) => setEditDueDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Assign to</label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                      value={editAssignedTo}
                      onChange={(e) => setEditAssignedTo(e.target.value)}
                    >
                      <option value="">Unassigned</option>
                      {users.map((u) => <option key={u._id} value={u._id}>{u.name}</option>)}
                    </select>
                  </div>
                </div>
              </>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
              >
                {STATUS_COLS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex gap-2 justify-end pt-1">
              <button type="button" onClick={() => setEditTask(null)}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
                Cancel
              </button>
              <button type="submit" disabled={saving}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-60">
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default TasksPage;