import React, { useState, useEffect } from 'react';
import { Search, Tag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Profile, TagType } from '../types';

function ProfileList() {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<TagType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    searchProfiles(searchQuery);
  }, [searchQuery, selectedTags]);

  useEffect(() => {
    updateTagsList();
  }, [profiles]);

  const updateTagsList = () => {
    const tagCounts = new Map<string, number>();
    profiles.forEach(profile => {
      profile.tags?.forEach(tag => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      });
    });
    
    const tags: TagType[] = Array.from(tagCounts.entries()).map(([name, count]) => ({
      name,
      count
    }));
    
    setAllTags(tags.sort((a, b) => b.count - a.count));
  };

  const searchProfiles = async (query: string) => {
    try {
      setLoading(true);
      let supabaseQuery = supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (query) {
        supabaseQuery = supabaseQuery.textSearch('search_vector', query);
      }

      if (selectedTags.length > 0) {
        supabaseQuery = supabaseQuery.contains('tags', selectedTags);
      }

      const { data, error } = await supabaseQuery;
      
      if (error) throw error;
      setProfiles(data || []);
    } catch (error) {
      console.error('Error fetching profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Profile Database</h1>
          <div className="flex gap-4 mb-4">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search profiles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            {allTags.map(tag => (
              <button
                key={tag.name}
                onClick={() => toggleTag(tag.name)}
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
                  selectedTags.includes(tag.name)
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <Tag size={14} className="mr-1" />
                {tag.name}
                <span className="ml-1 text-xs">({tag.count})</span>
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {profiles.map((profile) => (
              <div
                key={profile.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate(`/sunlight/profile/${profile.id}`)}
              >
                <div className="flex">
                  {profile.image_url && (
                    <div className="w-48 h-48 flex-shrink-0">
                      <img
                        src={profile.image_url}
                        alt={profile.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="p-6 flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">{profile.name}</h3>
                    <div className="mb-4">
                      <p className="text-gray-600">{profile.short_description}</p>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {profile.tags?.map(tag => (
                        <span
                          key={tag}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="flex justify-end">
                      <span className="text-blue-600 hover:text-blue-800 font-medium">
                        View Full Profile →
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {profiles.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No profiles found. Try adjusting your search or filters.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ProfileList;