import { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { Users, ShieldCheck, User } from 'lucide-react';

const ROLE_PILL = {
  admin: 'bg-indigo-100 text-indigo-700',
  member: 'bg-gray-100 text-gray-600',
};

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);
  const toast = useToast();

  useEffect(() => {
    if (user?.role !== 'admin') return;
    api.get('/users')
      .then((res) => setUsers(res.data))
      .catch(() => toast('Failed to load users', 'error'))
      .finally(() => setLoading(false));
  }, []);

  if (user?.role !== 'admin') {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
        You do not have permission to view this page.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        <div className="h-7 bg-gray-200 rounded w-24" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-14 bg-gray-200 rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-bold text-gray-900">Team Members</h1>
        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
          {users.length}
        </span>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-[1fr_1fr_auto] gap-4 px-5 py-3 bg-gray-50 border-b border-gray-200">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</span>
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</span>
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</span>
        </div>

        {users.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No users found.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {users.map((u) => (
              <div
                key={u._id}
                className="grid grid-cols-[1fr_1fr_auto] gap-4 px-5 py-4 items-center hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-semibold shrink-0">
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {u.name}
                      {u._id === user._id && (
                        <span className="ml-1.5 text-xs text-indigo-500">(you)</span>
                      )}
                    </p>
                    <p className="text-xs text-gray-400">
                      Joined {new Date(u.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 truncate">{u.email}</p>
                <span className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium shrink-0 ${ROLE_PILL[u.role]}`}>
                  {u.role === 'admin' ? <ShieldCheck className="w-3 h-3" /> : <User className="w-3 h-3" />}
                  {u.role}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UsersPage;
