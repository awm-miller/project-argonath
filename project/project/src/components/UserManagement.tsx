import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Shield, UserCog, Key, AlertTriangle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface User {
  id: string;
  email: string;
  full_name: string | null;
  role: {
    id: string;
    name: string;
  } | null;
  classification: {
    id: string;
    name: string;
    level: number;
  } | null;
  created_at: string;
}

function UserManagement() {
  const { profile } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<{ id: string; name: string; }[]>([]);
  const [classifications, setClassifications] = useState<{ id: string; name: string; level: number; }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [selectedClassification, setSelectedClassification] = useState<string>('');
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Get users from edge function
      const { data: session } = await supabase.auth.getSession();
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-users`, {
        headers: {
          Authorization: `Bearer ${session.session?.access_token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch users');
      }

      const users = await response.json();

      // Get roles and classifications
      const [rolesResponse, classificationsResponse] = await Promise.all([
        supabase.from('user_roles').select('id, name'),
        supabase.from('user_classifications').select('id, name, level')
      ]);

      if (rolesResponse.error) throw rolesResponse.error;
      if (classificationsResponse.error) throw classificationsResponse.error;

      setUsers(users);
      setRoles(rolesResponse.data || []);
      setClassifications(classificationsResponse.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const syncUsers = async () => {
    try {
      setSyncing(true);
      const { error } = await supabase.rpc('sync_all_users');
      if (error) throw error;
      await fetchData();
    } catch (error) {
      console.error('Error syncing users:', error);
      setError('Failed to sync users');
    } finally {
      setSyncing(false);
    }
  };

  const updateUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          role_id: selectedRole || null,
          classification_id: selectedClassification || null
        })
        .eq('id', userId);

      if (error) throw error;

      setSelectedUser(null);
      fetchData();
    } catch (error) {
      console.error('Error updating user:', error);
      setError('Failed to update user');
    }
  };

  const getClassificationColor = (name?: string) => {
    switch (name?.toLowerCase()) {
      case 'green': return 'bg-green-100 text-green-800';
      case 'yellow': return 'bg-yellow-100 text-yellow-800';
      case 'black': return 'bg-gray-900 text-white';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (profile?.classification?.name !== 'black') {
    return (
      <div className="p-8 max-w-6xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
          <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
          <span className="text-red-700">You do not have permission to access this page</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">User Management</h1>
        <button
          onClick={syncUsers}
          disabled={syncing}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {syncing ? 'Syncing...' : 'Sync Users'}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h2 className="text-lg font-medium">Users ({users.length})</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Classification
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <UserCog className="w-5 h-5 text-gray-400 mr-2" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">{user.full_name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {selectedUser === user.id ? (
                      <select
                        className="rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                        value={selectedRole}
                        onChange={(e) => setSelectedRole(e.target.value)}
                      >
                        <option value="">No role</option>
                        {roles.map((role) => (
                          <option key={role.id} value={role.id}>
                            {role.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-sm text-gray-900">
                        {user.role?.name || 'No role'}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {selectedUser === user.id ? (
                      <select
                        className="rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                        value={selectedClassification}
                        onChange={(e) => setSelectedClassification(e.target.value)}
                      >
                        <option value="">No classification</option>
                        {classifications.map((classification) => (
                          <option key={classification.id} value={classification.id}>
                            {classification.name.toUpperCase()}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="flex items-center">
                        <Shield className={`w-5 h-5 mr-2 ${
                          user.classification?.name === 'green' ? 'text-green-500' :
                          user.classification?.name === 'yellow' ? 'text-yellow-500' :
                          user.classification?.name === 'black' ? 'text-gray-900' :
                          'text-gray-400'
                        }`} />
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          getClassificationColor(user.classification?.name)
                        }`}>
                          {user.classification?.name?.toUpperCase() || 'NONE'}
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {selectedUser === user.id ? (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => updateUser(user.id)}
                          className="text-sm text-white bg-blue-600 px-3 py-1 rounded-md hover:bg-blue-700"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setSelectedUser(null)}
                          className="text-sm text-gray-600 hover:text-gray-800"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setSelectedUser(user.id);
                          setSelectedRole(user.role?.id || '');
                          setSelectedClassification(user.classification?.id || '');
                        }}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        Edit
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default UserManagement;