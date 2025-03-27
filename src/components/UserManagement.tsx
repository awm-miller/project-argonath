import React, { useState, useEffect } from 'react';
import { supabase, supabaseAdmin } from '../lib/supabase';
import { Shield, UserCog, Key, AlertTriangle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface User {
  id: string;
  email: string;
  created_at: string;
  user_access_levels?: {
    classification_id: string;
    user_classifications: {
      name: string;
      level: number;
    };
  }[];
}

interface Classification {
  id: string;
  name: string;
  level: number;
  description: string;
}

function UserManagement() {
  const { session } = useAuth();
  const isAdmin = session?.user?.email === 'admin@admin.com';
  const [users, setUsers] = useState<User[]>([]);
  const [classifications, setClassifications] = useState<Classification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [selectedClassification, setSelectedClassification] = useState<string | null>(null);

  useEffect(() => {
    if (isAdmin) {
      if (!supabaseAdmin) {
        setError('Admin functionality is not available. Missing service role key.');
        setLoading(false);
        return;
      }
      
      // Only fetch data if we have the admin client
      const fetchData = async () => {
        try {
          await Promise.all([
            fetchUsers(),
            fetchClassifications()
          ]);
        } catch (error) {
          console.error('Error fetching data:', error);
          setError('Failed to load data');
        } finally {
          setLoading(false);
        }
      };
      
      fetchData();
    } else {
      setLoading(false);
      setError('You do not have permission to access this page');
    }
  }, [isAdmin]);

  const fetchUsers = async () => {
    try {
      if (!supabaseAdmin) {
        throw new Error('Admin client not available');
      }

      // Get all users from the auth API using the admin client
      const { data: { users: authUsers }, error: authError } = await supabaseAdmin.auth.admin.listUsers();
      
      if (authError) throw authError;

      // Get all access levels
      const { data: accessLevels, error: accessError } = await supabase
        .from('user_access_levels')
        .select(`
          user_id,
          classification_id,
          user_classifications (
            name,
            level
          )
        `);

      if (accessError) throw accessError;

      // Combine user data with access levels
      const formattedUsers = authUsers.map(user => ({
        id: user.id,
        email: user.email || 'No Email',
        created_at: user.created_at,
        user_access_levels: accessLevels?.filter(level => level.user_id === user.id) || []
      }));

      setUsers(formattedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  };

  const fetchClassifications = async () => {
    try {
      const { data, error } = await supabase
        .from('user_classifications')
        .select('*')
        .order('level', { ascending: true });

      if (error) throw error;
      setClassifications(data);
    } catch (error) {
      console.error('Error fetching classifications:', error);
      throw error;
    }
  };

  const updateUserClassification = async () => {
    if (!selectedUser || !selectedClassification) return;

    try {
      // Remove existing classification
      await supabase
        .from('user_access_levels')
        .delete()
        .eq('user_id', selectedUser);

      // Add new classification
      const { error } = await supabase
        .from('user_access_levels')
        .insert({
          user_id: selectedUser,
          classification_id: selectedClassification,
          granted_by: session?.user?.id
        });

      if (error) throw error;

      await fetchUsers();
      setSelectedUser(null);
      setSelectedClassification(null);
    } catch (error) {
      console.error('Error updating user classification:', error);
      setError('Failed to update user classification');
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      alert('Password reset email sent successfully');
    } catch (error) {
      console.error('Error resetting password:', error);
      setError('Failed to send password reset email');
    }
  };

  if (!isAdmin) {
    return (
      <div className="p-8 max-w-6xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
          <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
          <span className="text-red-700">You do not have permission to access this page</span>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">User Management</h1>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
          <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h2 className="text-lg font-medium">Users</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Classification
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created At
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
                      <span className="text-sm text-gray-900">{user.email}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {selectedUser === user.id ? (
                      <div className="flex items-center space-x-2">
                        <select
                          className="rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                          value={selectedClassification || ''}
                          onChange={(e) => setSelectedClassification(e.target.value)}
                        >
                          <option value="">Select classification</option>
                          {classifications.map((classification) => (
                            <option key={classification.id} value={classification.id}>
                              {classification.name}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={updateUserClassification}
                          className="px-3 py-1 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setSelectedUser(null)}
                          className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <Shield className={`w-5 h-5 mr-2 ${
                          user.user_access_levels?.[0]?.user_classifications?.name === 'red' ? 'text-red-500' :
                          user.user_access_levels?.[0]?.user_classifications?.name === 'yellow' ? 'text-yellow-500' :
                          user.user_access_levels?.[0]?.user_classifications?.name === 'green' ? 'text-green-500' :
                          'text-gray-400'
                        }`} />
                        <span className="text-sm text-gray-900">
                          {user.user_access_levels?.[0]?.user_classifications?.name || 'None'}
                        </span>
                        <button
                          onClick={() => setSelectedUser(user.id)}
                          className="ml-2 text-sm text-blue-600 hover:text-blue-800"
                        >
                          Change
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-500">
                      {new Date(user.created_at).toLocaleDateString()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => resetPassword(user.email)}
                      className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                    >
                      <Key className="w-4 h-4 mr-1" />
                      Reset Password
                    </button>
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