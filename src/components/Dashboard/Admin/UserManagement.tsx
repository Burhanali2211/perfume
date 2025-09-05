import React, { useState, useEffect } from 'react';
import { getAllUsers, updateUserRole, createNewUser, updateUser, deleteUser, deleteUsersBulk, updateUsersBulk } from '../../../lib/supabase';
import { User } from '../../../types';
import { LoadingSpinner } from '../../Common/LoadingSpinner';
import { useNotification } from '../../../contexts/NotificationContext';
import { ResponsiveTable } from '../../Common/ResponsiveTable';
import { EnhancedButton } from '../../Common/EnhancedButton';
import { Modal } from '../../Common/Modal';

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [isActiveFilter, setIsActiveFilter] = useState<boolean | null>(null);
  const { showNotification } = useNotification();

  // Form state for create/edit user
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'customer' as 'admin' | 'seller' | 'customer',
    phone: '',
    dateOfBirth: '',
    isActive: true
  });

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);

      try {
        const usersData = await getAllUsers({
          searchTerm,
          roleFilter: roleFilter || undefined,
          isActiveFilter: isActiveFilter !== null ? isActiveFilter : undefined
        });
        setUsers(usersData.users || []);
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
  }, [searchTerm, roleFilter, isActiveFilter, showNotification]);

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

  const handleCreateUser = async () => {
    try {
      const result = await createNewUser({
        email: formData.email,
        name: formData.name,
        role: formData.role,
        phone: formData.phone,
        dateOfBirth: formData.dateOfBirth,
        isActive: formData.isActive
      });

      if (result.success && result.user) {
        setUsers([...users, result.user]);
        setIsCreateModalOpen(false);
        resetForm();
        showNotification({ type: 'success', title: 'User Created', message: 'User has been created successfully.' });
      } else {
        showNotification({ type: 'error', title: 'Error', message: result.error || 'Failed to create user.' });
      }
    } catch (error) {
      console.error('Error creating user:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to create user. Please try again later.'
      });
    }
  };

  const handleUpdateUser = async () => {
    if (!currentUser) return;

    try {
      const result = await updateUser(currentUser.id, {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        phone: formData.phone,
        dateOfBirth: formData.dateOfBirth,
        isActive: formData.isActive
      });

      if (result.success && result.user) {
        setUsers(users.map(u => u.id === currentUser.id ? result.user! : u));
        setIsEditModalOpen(false);
        resetForm();
        showNotification({ type: 'success', title: 'User Updated', message: 'User has been updated successfully.' });
      } else {
        showNotification({ type: 'error', title: 'Error', message: result.error || 'Failed to update user.' });
      }
    } catch (error) {
      console.error('Error updating user:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to update user. Please try again later.'
      });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      const result = await deleteUser(userId);

      if (result.success) {
        setUsers(users.filter(u => u.id !== userId));
        setSelectedUsers(selectedUsers.filter(id => id !== userId));
        showNotification({ type: 'success', title: 'User Deleted', message: 'User has been deleted successfully.' });
      } else {
        showNotification({ type: 'error', title: 'Error', message: result.error || 'Failed to delete user.' });
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to delete user. Please try again later.'
      });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedUsers.length === 0) {
      showNotification({ type: 'warning', title: 'No Users Selected', message: 'Please select users to delete.' });
      return;
    }

    if (!window.confirm(`Are you sure you want to delete ${selectedUsers.length} users? This action cannot be undone.`)) {
      return;
    }

    try {
      const result = await deleteUsersBulk(selectedUsers);

      if (result.success) {
        setUsers(users.filter(u => !selectedUsers.includes(u.id)));
        setSelectedUsers([]);
        showNotification({ 
          type: 'success', 
          title: 'Users Deleted', 
          message: `${result.deletedCount} users have been deleted successfully.` 
        });
      } else {
        showNotification({ type: 'error', title: 'Error', message: result.error || 'Failed to delete users.' });
      }
    } catch (error) {
      console.error('Error deleting users:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to delete users. Please try again later.'
      });
    }
  };

  const handleBulkUpdate = async (newRole: 'admin' | 'seller' | 'customer') => {
    if (selectedUsers.length === 0) {
      showNotification({ type: 'warning', title: 'No Users Selected', message: 'Please select users to update.' });
      return;
    }

    try {
      const result = await updateUsersBulk(selectedUsers, { role: newRole });

      if (result.success) {
        setUsers(users.map(u => 
          selectedUsers.includes(u.id) ? { ...u, role: newRole } : u
        ));
        showNotification({ 
          type: 'success', 
          title: 'Users Updated', 
          message: `${result.updatedCount} users have been updated successfully.` 
        });
      } else {
        showNotification({ type: 'error', title: 'Error', message: result.error || 'Failed to update users.' });
      }
    } catch (error) {
      console.error('Error updating users:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to update users. Please try again later.'
      });
    }
  };

  const openCreateModal = () => {
    resetForm();
    setIsCreateModalOpen(true);
  };

  const openEditModal = (user: User) => {
    setCurrentUser(user);
    setFormData({
      name: user.name || '',
      email: user.email || '',
      role: user.role || 'customer',
      phone: user.phone || '',
      dateOfBirth: user.dateOfBirth || '',
      isActive: user.isActive !== undefined ? user.isActive : true
    });
    setIsEditModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      role: 'customer',
      phone: '',
      dateOfBirth: '',
      isActive: true
    });
    setCurrentUser(null);
  };

  const handleSelectUser = (userId: string) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    } else {
      setSelectedUsers([...selectedUsers, userId]);
    }
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(u => u.id));
    }
  };

  // Prepare columns for ResponsiveTable
  const tableColumns = [
    {
      key: 'selection',
      title: (
        <input
          type="checkbox"
          checked={selectedUsers.length === users.length && users.length > 0}
          onChange={handleSelectAll}
          className="h-4 w-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
        />
      ),
      width: 50,
      render: (_: any, record: User) => (
        <input
          type="checkbox"
          checked={selectedUsers.includes(record.id)}
          onChange={() => handleSelectUser(record.id)}
          className="h-4 w-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
        />
      )
    },
    {
      key: 'user',
      title: 'User',
      minWidth: 200,
      render: (value: any, record: User) => (
        <div className="flex items-center">
          <img 
            src={record.avatar || `https://api.dicebear.com/8.x/initials/svg?seed=${record.name}`} 
            alt={record.name} 
            className="h-10 w-10 rounded-full bg-gray-200" 
          />
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">{record.name}</div>
            <div className="text-sm text-gray-500">{record.email}</div>
          </div>
        </div>
      )
    },
    {
      key: 'role',
      title: 'Role',
      width: 100,
      render: (value: string) => (
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          value === 'admin' ? 'bg-red-100 text-red-800' :
          value === 'seller' ? 'bg-blue-100 text-blue-800' :
          'bg-green-100 text-green-800'
        }`}>
          {value}
        </span>
      )
    },
    {
      key: 'status',
      title: 'Status',
      width: 100,
      render: (value: any, record: User) => (
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          record.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {record.isActive ? 'Active' : 'Inactive'}
        </span>
      )
    },
    {
      key: 'createdAt',
      title: 'Created At',
      width: 120,
      render: (value: Date) => <span className="text-sm text-gray-500">{value.toLocaleDateString()}</span>
    },
    {
      key: 'actions',
      title: 'Actions',
      width: 150,
      render: (value: any, record: User) => (
        <div className="flex space-x-2">
          <button
            onClick={() => openEditModal(record)}
            className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
          >
            Edit
          </button>
          <select
            value={record.role}
            onChange={(e) => handleRoleChange(record.id, e.target.value as 'admin' | 'seller' | 'customer')}
            className="px-2 py-1 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500 text-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <option value="customer">Customer</option>
            <option value="seller">Seller</option>
            <option value="admin">Admin</option>
          </select>
          <button
            onClick={() => handleDeleteUser(record.id)}
            className="text-red-600 hover:text-red-900 text-sm font-medium"
          >
            Delete
          </button>
        </div>
      )
    }
  ];

  if (loading) return <LoadingSpinner />;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="p-6 border-b border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">User Management</h3>
            <p className="mt-1 text-sm text-gray-500">Manage all users in the system</p>
          </div>
          <div className="mt-4 md:mt-0 flex space-x-3">
            <EnhancedButton
              onClick={openCreateModal}
              variant="primary"
              size="sm"
            >
              Add User
            </EnhancedButton>
            {selectedUsers.length > 0 && (
              <div className="flex space-x-2">
                <select
                  onChange={(e) => handleBulkUpdate(e.target.value as 'admin' | 'seller' | 'customer')}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-indigo-500"
                  defaultValue=""
                >
                  <option value="" disabled>Bulk Role Change</option>
                  <option value="customer">Set as Customer</option>
                  <option value="seller">Set as Seller</option>
                  <option value="admin">Set as Admin</option>
                </select>
                <EnhancedButton
                  onClick={handleBulkDelete}
                  variant="danger"
                  size="sm"
                >
                  Delete Selected ({selectedUsers.length})
                </EnhancedButton>
              </div>
            )}
          </div>
        </div>
        
        {/* Filters */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="seller">Seller</option>
              <option value="customer">Customer</option>
            </select>
          </div>
          <div>
            <select
              value={isActiveFilter === null ? '' : isActiveFilter.toString()}
              onChange={(e) => setIsActiveFilter(e.target.value === '' ? null : e.target.value === 'true')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">All Statuses</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
          <div>
            <div className="text-sm text-gray-500 mt-2">
              Showing {users.length} users
            </div>
          </div>
        </div>
      </div>
      
      <ResponsiveTable
        columns={tableColumns}
        data={users}
        loading={loading}
        emptyMessage="No users found"
      />
      
      {/* Create User Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New User"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Role</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({...formData, role: e.target.value as any})}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500"
            >
              <option value="customer">Customer</option>
              <option value="seller">Seller</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Phone</label>
            <input
              type="text"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
            <input
              type="date"
              value={formData.dateOfBirth}
              onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
              className="h-4 w-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
            />
            <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
              Active User
            </label>
          </div>
          <div className="flex justify-end space-x-3">
            <EnhancedButton
              onClick={() => setIsCreateModalOpen(false)}
              variant="secondary"
            >
              Cancel
            </EnhancedButton>
            <EnhancedButton
              onClick={handleCreateUser}
              variant="primary"
            >
              Create User
            </EnhancedButton>
          </div>
        </div>
      </Modal>
      
      {/* Edit User Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit User"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Role</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({...formData, role: e.target.value as any})}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500"
            >
              <option value="customer">Customer</option>
              <option value="seller">Seller</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Phone</label>
            <input
              type="text"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
            <input
              type="date"
              value={formData.dateOfBirth}
              onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActiveEdit"
              checked={formData.isActive}
              onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
              className="h-4 w-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
            />
            <label htmlFor="isActiveEdit" className="ml-2 block text-sm text-gray-700">
              Active User
            </label>
          </div>
          <div className="flex justify-end space-x-3">
            <EnhancedButton
              onClick={() => setIsEditModalOpen(false)}
              variant="secondary"
            >
              Cancel
            </EnhancedButton>
            <EnhancedButton
              onClick={handleUpdateUser}
              variant="primary"
            >
              Update User
            </EnhancedButton>
          </div>
        </div>
      </Modal>
    </div>
  );
};