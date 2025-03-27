import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Copy } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Profile, Citation } from '../types';

function ProfileView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile();
  }, [id]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      navigate('/');
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
            onClick={() => navigate('/')}
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
            onClick={() => navigate('/')}
            className="flex items-center text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back to profiles
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
                  <h2 className="text-xl font-semibold text-gray-900">Short Description</h2>
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
                {profile.citations?.[0]?.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-sm font-medium text-gray-700">Sources:</h3>
                    <ul className="mt-2 space-y-1">
                      {profile.citations[0].map((citation) => (
                        <li key={citation.ref}>
                          <a
                            href={citation.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:text-blue-800"
                          >
                            [{citation.ref}] {citation.text}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </section>

              <section>
                <div className="flex justify-between items-start mb-2">
                  <h2 className="text-xl font-semibold text-gray-900">Summary</h2>
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
                {profile.citations?.[1]?.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-sm font-medium text-gray-700">Sources:</h3>
                    <ul className="mt-2 space-y-1">
                      {profile.citations[1].map((citation) => (
                        <li key={citation.ref}>
                          <a
                            href={citation.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:text-blue-800"
                          >
                            [{citation.ref}] {citation.text}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </section>

              <section>
                <div className="flex justify-between items-start mb-2">
                  <h2 className="text-xl font-semibold text-gray-900">Detailed Record</h2>
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
            </div>
          </div>
        </div>

        {copiedText && (
          <div className="fixed bottom-4 right-4 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg">
            {copiedText}
          </div>
        )}
      </div>
    </div>
  );
}

export default ProfileView;