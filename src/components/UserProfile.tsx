import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { Shield, User } from 'lucide-react';

function UserProfile() {
  const { profile: currentProfile, user } = useAuth();
  const [fullName, setFullName] = useState(currentProfile?.full_name || '');
  const [avatarUrl, setAvatarUrl] = useState(currentProfile?.avatar_url || '');
  const [roles, setRoles] = useState<{ id: string; name: string; description: string | null; }[]>([]);
  const [classifications, setClassifications] = useState<{ id: string; name: string; level: number; description: string | null; }[]>([]);
  const [selectedRole, setSelectedRole] = useState(currentProfile?.role?.name || '');
  const [selectedClassification, setSelectedClassification] = useState(currentProfile?.classification?.name || '');
  const [isAdmin] = useState(currentProfile?.role?.name === 'admin');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRolesAndClassifications();
  }, []);

  const fetchRolesAndClassifications = async () => {
    const [rolesResponse, classificationsResponse] = await Promise.all([
      supabase.from('user_roles').select('*'),
      supabase.from('user_classifications').select('*')
    ]);

    if (rolesResponse.data) setRoles(rolesResponse.data);
    if (classificationsResponse.data) setClassifications(classificationsResponse.data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const updates: any = {
        id: user?.id,
        full_name: fullName,
        avatar_url: avatarUrl,
      };

      if (isAdmin) {
        const roleId = roles.find(r => r.name === selectedRole)?.id;
        const classificationId = classifications.find(c => c.name === selectedClassification)?.id;
        updates.role_id = roleId;
        updates.classification_id = classificationId;
      }

      const { error } = await supabase
        .from('user_profiles')
        .upsert(updates);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const getClassificationColor = (name: string) => {
    switch (name.toLowerCase()) {
      case 'green': return 'bg-green-100 text-green-800 border-green-200';
      case 'yellow': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'black': return 'bg-gray-900 text-white border-gray-700';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-8">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h1 className="text-2xl font-bold mb-6">User Profile</h1>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Avatar URL
            </label>
            <input
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role
              </label>
              {isAdmin ? (
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  {roles.map((role) => (
                    <option key={role.id} value={role.name}>
                      {role.name}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="px-3 py-2 border border-gray-200 rounded-md bg-gray-50">
                  {currentProfile?.role?.name || 'No role assigned'}
                </div>
              )}
            </div>

            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Classification
              </label>
              {isAdmin ? (
                <select
                  value={selectedClassification}
                  onChange={(e) => setSelectedClassification(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  {classifications.map((classification) => (
                    <option key={classification.id} value={classification.name}>
                      {classification.name.toUpperCase()}
                    </option>
                  ))}
                </select>
              ) : (
                <div className={`inline-flex items-center px-3 py-2 rounded-md border ${getClassificationColor(currentProfile?.classification?.name || '')}`}>
                  <Shield className="w-4 h-4 mr-2" />
                  {currentProfile?.classification?.name?.toUpperCase() || 'UNCLASSIFIED'}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default UserProfile;