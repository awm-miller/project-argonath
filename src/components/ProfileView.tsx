import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Copy, Check, X, Network, Edit } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Profile, Citation } from '../types';
import { EditProfile } from './EditProfile';

function ProfileView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [suggestedProfiles, setSuggestedProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, [id]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Fetch connected profiles if there are valid UUIDs in the connections array
      if (profileData?.connections?.length) {
        // Validate UUIDs before making the query
        const validUUIDs = profileData.connections.filter(conn => {
          try {
            // Simple UUID validation regex
            return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(conn);
          } catch {
            return false;
          }
        });

        if (validUUIDs.length > 0) {
          const { data: connectedProfiles, error: connectionsError } = await supabase
            .from('profiles')
            .select('id, name, short_description, image_url')
            .in('id', validUUIDs);

          if (!connectionsError && connectedProfiles) {
            setSuggestedProfiles(connectedProfiles);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      navigate('/sunlight');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, citations?: Citation[]) => {
    try {
      let finalText = text;
      if (citations?.length) {
        finalText += '\n\nSources:\n' + citations.map(c => `[${c.ref}] ${c.url}`).join('\n');
      }
      await navigator.clipboard.writeText(finalText);
      setCopiedText('Text copied!');
      setTimeout(() => setCopiedText(null), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const copyTextOnly = async (text: string) => {
    try {
      const cleanText = text.replace(/\[\d+\]/g, '');
      await navigator.clipboard.writeText(cleanText);
      setCopiedText('Text copied without citations!');
      setTimeout(() => setCopiedText(null), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Profile not found</h2>
          <button
            onClick={() => navigate('/sunlight')}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            ← Back to profiles
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => navigate('/sunlight')}
            className="flex items-center text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back to profiles
          </button>
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="flex items-center px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            <Edit size={20} className="mr-2" />
            Edit Profile
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6">
            {profile.image_url && (
              <div className="mb-6">
                <img
                  src={profile.image_url}
                  alt={profile.name}
                  className="w-full h-64 object-cover rounded-lg"
                />
              </div>
            )}

            <div className="space-y-8">
              <section>
                <div className="flex justify-between items-start mb-2">
                  <h1 className="text-3xl font-bold text-gray-900">{profile.name}</h1>
                  <button
                    onClick={() => copyToClipboard(profile.name)}
                    className="text-gray-400 hover:text-gray-600"
                    title="Copy name"
                  >
                    <Copy size={20} />
                  </button>
                </div>
              </section>

              <section>
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-4">
                    <h2 className="text-xl font-semibold text-gray-900">Short Description</h2>
                    <div className={`flex items-center px-3 py-1 rounded-full text-sm ${
                      profile.short_description_lawyered
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {profile.short_description_lawyered ? (
                        <Check className="w-4 h-4 mr-1" />
                      ) : (
                        <X className="w-4 h-4 mr-1" />
                      )}
                      Lawyered
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => copyTextOnly(profile.short_description)}
                      className="text-gray-400 hover:text-gray-600"
                      title="Copy text only"
                    >
                      <Copy size={16} />
                      <span className="text-xs">Text</span>
                    </button>
                    <button
                      onClick={() => copyToClipboard(profile.short_description, profile.citations?.[0])}
                      className="text-gray-400 hover:text-gray-600"
                      title="Copy with citations"
                    >
                      <Copy size={16} />
                      <span className="text-xs">With Citations</span>
                    </button>
                  </div>
                </div>
                <div
                  className="text-gray-600"
                  dangerouslySetInnerHTML={{ __html: profile.short_description }}
                />
              </section>

              <section>
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-4">
                    <h2 className="text-xl font-semibold text-gray-900">Summary</h2>
                    <div className={`flex items-center px-3 py-1 rounded-full text-sm ${
                      profile.summary_lawyered
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {profile.summary_lawyered ? (
                        <Check className="w-4 h-4 mr-1" />
                      ) : (
                        <X className="w-4 h-4 mr-1" />
                      )}
                      Lawyered
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => copyTextOnly(profile.summary)}
                      className="text-gray-400 hover:text-gray-600"
                      title="Copy text only"
                    >
                      <Copy size={16} />
                      <span className="text-xs">Text</span>
                    </button>
                    <button
                      onClick={() => copyToClipboard(profile.summary, profile.citations?.[1])}
                      className="text-gray-400 hover:text-gray-600"
                      title="Copy with citations"
                    >
                      <Copy size={16} />
                      <span className="text-xs">With Citations</span>
                    </button>
                  </div>
                </div>
                <div
                  className="text-gray-600"
                  dangerouslySetInnerHTML={{ __html: profile.summary }}
                />
              </section>

              <section>
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-4">
                    <h2 className="text-xl font-semibold text-gray-900">Detailed Record</h2>
                    <div className={`flex items-center px-3 py-1 rounded-full text-sm ${
                      profile.detailed_record_lawyered
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {profile.detailed_record_lawyered ? (
                        <Check className="w-4 h-4 mr-1" />
                      ) : (
                        <X className="w-4 h-4 mr-1" />
                      )}
                      Lawyered
                    </div>
                  </div>
                </div>
                {profile.iframe_url ? (
                  <div className="w-full aspect-[4/3] relative">
                    <iframe
                      src={profile.iframe_url}
                      className="w-full h-full absolute inset-0 border-0"
                      title="Detailed Record"
                      allowFullScreen
                    />
                  </div>
                ) : (
                  <p className="text-gray-500 italic">No detailed record available</p>
                )}
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Tags</h2>
                <div className="flex flex-wrap gap-2">
                  {profile.tags?.map(tag => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </section>

              {suggestedProfiles.length > 0 && (
                <section>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Suggested Profiles</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {suggestedProfiles.map(suggested => (
                      <div
                        key={suggested.id}
                        onClick={() => navigate(`/sunlight/profile/${suggested.id}`)}
                        className="bg-gray-50 rounded-lg p-4 cursor-pointer hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center space-x-4">
                          {suggested.image_url && (
                            <img
                              src={suggested.image_url}
                              alt={suggested.name}
                              className="w-16 h-16 rounded-full object-cover"
                            />
                          )}
                          <div>
                            <h3 className="font-medium text-gray-900">{suggested.name}</h3>
                            <p className="text-sm text-gray-500 line-clamp-2">
                              {suggested.short_description}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </div>
        </div>

        {copiedText && (
          <div className="fixed bottom-4 right-4 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg">
            {copiedText}
          </div>
        )}

        <EditProfile
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          profile={profile}
          onUpdate={fetchProfile}
        />
      </div>
    </div>
  );
}

export default ProfileView;