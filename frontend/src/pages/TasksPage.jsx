import { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';

const TasksPage = () => {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState('');
  const [status, setStatus] = useState('Todo');
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);

  const fetchData = async () => {
    try {
      const [tasksRes, projectsRes] = await Promise.all([
        api.get('/tasks'),
        api.get('/projects')
      ]);

      // 🔥 DEBUG (you can remove later)
      console.log("Tasks:", tasksRes.data);
      console.log("Projects:", projectsRes.data);

      // ✅ FIX RESPONSE STRUCTURE
      const tasksData = tasksRes.data.tasks || tasksRes.data;
      const projectsData = projectsRes.data.projects || projectsRes.data;

      setTasks(tasksData);
      setProjects(projectsData);

      // ✅ Set default project
      if (projectsData.length > 0) {
        setProjectId(projectsData[0]._id);
      }

    } catch (error) {
      console.error('Error fetching data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateTask = async (e) => {
    e.preventDefault();

    if (!projectId) {
      alert("Please select a project first");
      return;
    }

    try {
      await api.post('/tasks', { title, description, projectId, status });

      // Reset form
      setTitle('');
      setDescription('');
      setStatus('Todo');

      fetchData();
    } catch (error) {
      console.error('Error creating task', error);
      alert('Failed to create task');
    }
  };

  const updateStatus = async (taskId, newStatus) => {
    try {
      await api.put(`/tasks/${taskId}`, { status: newStatus });
      fetchData();
    } catch (error) {
      console.error('Error updating status', error);
      alert('Failed to update status');
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="max-w-7xl mx-auto py-6 px-4">

      <h1 className="text-3xl font-bold mb-6">Tasks</h1>

      {/* CREATE TASK FORM */}
      <div className="bg-white shadow rounded-lg mb-8 p-6">
        <h2 className="text-lg font-semibold mb-4">Create New Task</h2>

        <form onSubmit={handleCreateTask} className="space-y-4">

          <input
            type="text"
            placeholder="Task Title"
            required
            className="w-full border p-2 rounded"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <textarea
            placeholder="Description"
            required
            className="w-full border p-2 rounded"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <select
            required
            className="w-full border p-2 rounded"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
          >
            {projects.length === 0 ? (
              <option value="">No projects available</option>
            ) : (
              projects.map(p => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))
            )}
          </select>

          <select
            className="w-full border p-2 rounded"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="Todo">Todo</option>
            <option value="In Progress">In Progress</option>
            <option value="Done">Done</option>
          </select>

          <button
            type="submit"
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
          >
            Create Task
          </button>

        </form>
      </div>

      {/* TASK BOARD */}
      <div className="grid md:grid-cols-3 gap-6">
        {['Todo', 'In Progress', 'Done'].map(col => (
          <div key={col} className="bg-gray-100 p-4 rounded-lg">

            <h3 className="font-bold mb-4">{col}</h3>

            {tasks.filter(t => t.status === col).length === 0 && (
              <p className="text-sm text-gray-500">No tasks</p>
            )}

            {tasks
              .filter(t => t.status === col)
              .map(task => (
                <div key={task._id} className="bg-white p-4 mb-3 rounded shadow">

                  <h4 className="font-semibold">{task.title}</h4>
                  <p className="text-sm text-gray-600">{task.description}</p>

                  <p className="text-xs text-indigo-600 mt-2">
                    Project: {task.projectId?.name || 'Unknown'}
                  </p>

                  <select
                    className="mt-2 w-full border rounded"
                    value={task.status}
                    onChange={(e) =>
                      updateStatus(task._id, e.target.value)
                    }
                  >
                    <option value="Todo">Todo</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Done">Done</option>
                  </select>

                </div>
              ))}
          </div>
        ))}
      </div>

    </div>
  );
};

export default TasksPage;