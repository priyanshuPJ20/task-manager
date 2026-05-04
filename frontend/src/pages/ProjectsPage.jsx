import { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { Plus, X, Users, Pencil, Trash2, FolderOpen } from 'lucide-react';

const STATUS_PILL = {
  active: 'bg-green-100 text-green-700',
  archived: 'bg-gray-100 text-gray-500',
};

// Modal component
const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
    <div className="absolute inset-0 bg-black/30" onClick={onClose} />
    <div className="relative bg-white rounded-xl border border-gray-200 shadow-lg w-full max-w-lg p-6 z-10">
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

const ProjectsPage = () => {
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Create form state
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newMembers, setNewMembers] = useState([]);
  const [creating, setCreating] = useState(false);

  // Edit modal state
  const [editProject, setEditProject] = useState(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editMembers, setEditMembers] = useState([]);
  const [editStatus, setEditStatus] = useState('active');
  const [saving, setSaving] = useState(false);

  const { user } = useContext(AuthContext);
  const toast = useToast();
  const isAdmin = user?.role === 'admin';

  const fetchProjects = async () => {
    try {
      const res = await api.get('/projects');
      setProjects(res.data);
    } catch (err) {
      toast('Failed to load projects', 'error');
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
    fetchProjects();
    fetchUsers();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await api.post('/projects', { name: newName, description: newDesc, members: newMembers });
      toast('Project created', 'success');
      setNewName(''); setNewDesc(''); setNewMembers([]);
      setShowCreate(false);
      fetchProjects();
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to create project', 'error');
    } finally {
      setCreating(false);
    }
  };

  const openEdit = (project) => {
    setEditProject(project);
    setEditName(project.name);
    setEditDesc(project.description);
    setEditMembers(project.members.map((m) => m._id));
    setEditStatus(project.status || 'active');
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(`/projects/${editProject._id}`, {
        name: editName,
        description: editDesc,
        members: editMembers,
        status: editStatus,
      });
      toast('Project updated', 'success');
      setEditProject(null);
      fetchProjects();
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to update project', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this project and all its tasks?')) return;
    try {
      await api.delete(`/projects/${id}`);
      toast('Project deleted', 'success');
      fetchProjects();
    } catch (err) {
      toast('Failed to delete project', 'error');
    }
  };

  const toggleMember = (userId, setter) => {
    setter((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        <div className="h-7 bg-gray-200 rounded w-32" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 bg-gray-200 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Projects</h1>
        {isAdmin && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Project
          </button>
        )}
      </div>

      {/* Projects list */}
      {projects.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-10 text-center">
          <FolderOpen className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No projects yet.</p>
          {isAdmin && (
            <button
              onClick={() => setShowCreate(true)}
              className="mt-3 text-indigo-600 text-sm font-medium hover:underline"
            >
              Create your first project →
            </button>
          )}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {projects.map((project) => (
            <div
              key={project._id}
              className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex flex-col gap-3"
            >
              {/* Top row */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-gray-900 truncate">{project.name}</h3>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{project.description}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${STATUS_PILL[project.status || 'active']}`}>
                  {project.status || 'active'}
                </span>
              </div>

              {/* Members */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <Users className="w-3.5 h-3.5 text-gray-400" />
                {project.members.length === 0 ? (
                  <span className="text-xs text-gray-400">No members</span>
                ) : (
                  project.members.map((m) => (
                    <span
                      key={m._id}
                      className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full"
                    >
                      {m.name}
                    </span>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100">
                <span className="text-xs text-gray-400">
                  By {project.createdBy?.name || 'Unknown'}
                </span>
                {isAdmin && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEdit(project)}
                      className="p-1.5 rounded-md text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                      title="Edit project"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(project._id)}
                      className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Delete project"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <Modal title="New Project" onClose={() => setShowCreate(false)}>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Project name</label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Website Redesign"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                required
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="What's this project about?"
              />
            </div>
            {users.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Add members</label>
                <div className="space-y-1 max-h-36 overflow-y-auto border border-gray-200 rounded-lg p-2">
                  {users.map((u) => (
                    <label key={u._id} className="flex items-center gap-2 cursor-pointer py-1 px-1 rounded hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={newMembers.includes(u._id)}
                        onChange={() => toggleMember(u._id, setNewMembers)}
                        className="rounded border-gray-300 text-indigo-600"
                      />
                      <span className="text-sm text-gray-700">{u.name}</span>
                      <span className="text-xs text-gray-400">{u.email}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
            <div className="flex gap-2 justify-end pt-1">
              <button type="button" onClick={() => setShowCreate(false)}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
                Cancel
              </button>
              <button type="submit" disabled={creating}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-60">
                {creating ? 'Creating…' : 'Create'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Modal */}
      {editProject && (
        <Modal title="Edit Project" onClose={() => setEditProject(null)}>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Project name</label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                required
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="active">Active</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            {users.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Members</label>
                <div className="space-y-1 max-h-36 overflow-y-auto border border-gray-200 rounded-lg p-2">
                  {users.map((u) => (
                    <label key={u._id} className="flex items-center gap-2 cursor-pointer py-1 px-1 rounded hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={editMembers.includes(u._id)}
                        onChange={() => toggleMember(u._id, setEditMembers)}
                        className="rounded border-gray-300 text-indigo-600"
                      />
                      <span className="text-sm text-gray-700">{u.name}</span>
                      <span className="text-xs text-gray-400">{u.email}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
            <div className="flex gap-2 justify-end pt-1">
              <button type="button" onClick={() => setEditProject(null)}
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

export default ProjectsPage;
