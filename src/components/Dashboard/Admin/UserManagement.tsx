import React, { useState, useEffect } from 'react';
import { getAllUsers, updateUserRole } from '../../../lib/supabase';
import { User } from '../../../types';
import { LoadingSpinner } from '../../Common/LoadingSpinner';
import { useNotification } from '../../../contexts/NotificationContext';

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const { showNotification } = useNotification();

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);

      try {
        const usersData = await getAllUsers();
        setUsers(usersData);
      } catch (error) {
        console.error("Error fetching users:", error);
        showNotification({
          type: 'error',
          title: 'Error',
          message: 'Failed to load users from database. Please try again later.'
        });
      }
      setLoading(false);
    };

    // Initial fetch
    fetchUsers();
  }, [showNotification]);

  const handleRoleChange = async (userId: string, newRole: 'admin' | 'seller' | 'customer') => {
    try {
      const success = await updateUserRole(userId, newRole);
      if (success) {
        setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
        showNotification({ type: 'success', title: 'Role Updated', message: 'User role has been changed.' });
      } else {
        showNotification({ type: 'error', title: 'Error', message: 'Failed to update user role.' });
      }
    } catch (error) {
      console.error('Error updating role:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to update user role. Please try again later.'
      });
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="p-6 border-b border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900">All Users ({users.length})</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <img src={user.avatar || `https://api.dicebear.com/8.x/initials/svg?seed=${user.name}`} alt={user.name} className="h-10 w-10 rounded-full bg-gray-200" />
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{user.name}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    user.role === 'admin' ? 'bg-red-100 text-red-800' :
                    user.role === 'seller' ? 'bg-blue-100 text-blue-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.createdAt.toLocaleDateString()}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                    className="px-2 py-1 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="customer">Customer</option>
                    <option value="seller">Seller</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
