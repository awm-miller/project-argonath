import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { X, AlertTriangle, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Profile, Citation } from '../types';

interface EditProfileProps {
  isOpen: boolean;
  onClose: () => void;
  profile: Profile;
  onUpdate: () => void;
}

export function EditProfile({ isOpen, onClose, profile, onUpdate }: EditProfileProps) {
  const [shortDescription, setShortDescription] = useState(profile.short_description);
  const [summary, setSummary] = useState(profile.summary);
  const [detailedRecord, setDetailedRecord] = useState(profile.detailed_record);
  const [shortDescriptionLawyered, setShortDescriptionLawyered] = useState(profile.short_description_lawyered);
  const [summaryLawyered, setSummaryLawyered] = useState(profile.summary_lawyered);
  const [detailedRecordLawyered, setDetailedRecordLawyered] = useState(profile.detailed_record_lawyered);
  const [citations, setCitations] = useState<Citation[][]>(profile.citations || [[], [], []]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          short_description,
          summary,
          detailed_record,
          short_description_lawyered: shortDescriptionLawyered,
          summary_lawyered: summaryLawyered,
          detailed_record_lawyered: detailedRecordLawyered,
          citations,
          // Also update the HTML versions
          short_description_html: shortDescription,
          summary_html: summary,
          detailed_record_html: detailedRecord,
        })
        .eq('id', profile.id);

      if (updateError) throw updateError;

      onUpdate();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while saving');
    } finally {
      setSaving(false);
    }
  };

  const handleCitationChange = (sectionIndex: number, citationIndex: number, field: keyof Citation, value: string) => {
    setCitations(prevCitations => {
      const newCitations = [...prevCitations];
      if (!newCitations[sectionIndex]) {
        newCitations[sectionIndex] = [];
      }
      if (!newCitations[sectionIndex][citationIndex]) {
        newCitations[sectionIndex][citationIndex] = { ref: citationIndex + 1, text: '', url: '' };
      }
      newCitations[sectionIndex][citationIndex] = {
        ...newCitations[sectionIndex][citationIndex],
        [field]: value
      };
      return newCitations;
    });
  };

  const addCitation = (sectionIndex: number) => {
    setCitations(prevCitations => {
      const newCitations = [...prevCitations];
      if (!newCitations[sectionIndex]) {
        newCitations[sectionIndex] = [];
      }
      newCitations[sectionIndex].push({
        ref: newCitations[sectionIndex].length + 1,
        text: '',
        url: ''
      });
      return newCitations;
    });
  };

  const removeCitation = (sectionIndex: number, citationIndex: number) => {
    setCitations(prevCitations => {
      const newCitations = [...prevCitations];
      newCitations[sectionIndex] = newCitations[sectionIndex].filter((_, index) => index !== citationIndex);
      // Update refs after removal
      newCitations[sectionIndex] = newCitations[sectionIndex].map((citation, index) => ({
        ...citation,
        ref: index + 1
      }));
      return newCitations;
    });
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-4xl w-full bg-white rounded-lg shadow-lg max-h-[90vh] flex flex-col">
          <div className="flex-shrink-0 flex items-center justify-between border-b border-gray-200 p-4">
            <Dialog.Title className="text-lg font-semibold text-gray-900">
              Edit Profile: {profile.name}
            </Dialog.Title>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
            <div className="flex-1 overflow-y-auto p-6">
              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center text-red-700">
                  <AlertTriangle className="w-5 h-5 mr-2" />
                  {error}
                </div>
              )}

              <div className="space-y-6">
                {/* Short Description Section */}
                <section>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-medium text-gray-900">Short Description</h3>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={shortDescriptionLawyered}
                        onChange={(e) => setShortDescriptionLawyered(e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-600">Lawyered</span>
                    </label>
                  </div>
                  <textarea
                    value={shortDescription}
                    onChange={(e) => setShortDescription(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                  <div className="mt-2">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Citations</h4>
                    {citations[0]?.map((citation, index) => (
                      <div key={index} className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={citation.text}
                          onChange={(e) => handleCitationChange(0, index, 'text', e.target.value)}
                          placeholder="Citation text"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                        <input
                          type="url"
                          value={citation.url}
                          onChange={(e) => handleCitationChange(0, index, 'url', e.target.value)}
                          placeholder="URL"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                        <button
                          type="button"
                          onClick={() => removeCitation(0, index)}
                          className="px-3 py-2 text-red-600 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addCitation(0)}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      + Add Citation
                    </button>
                  </div>
                </section>

                {/* Summary Section */}
                <section>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-medium text-gray-900">Summary</h3>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={summaryLawyered}
                        onChange={(e) => setSummaryLawyered(e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-600">Lawyered</span>
                    </label>
                  </div>
                  <textarea
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                  <div className="mt-2">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Citations</h4>
                    {citations[1]?.map((citation, index) => (
                      <div key={index} className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={citation.text}
                          onChange={(e) => handleCitationChange(1, index, 'text', e.target.value)}
                          placeholder="Citation text"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                        <input
                          type="url"
                          value={citation.url}
                          onChange={(e) => handleCitationChange(1, index, 'url', e.target.value)}
                          placeholder="URL"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                        <button
                          type="button"
                          onClick={() => removeCitation(1, index)}
                          className="px-3 py-2 text-red-600 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addCitation(1)}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      + Add Citation
                    </button>
                  </div>
                </section>

                {/* Detailed Record Section */}
                <section>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-medium text-gray-900">Detailed Record</h3>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={detailedRecordLawyered}
                        onChange={(e) => setDetailedRecordLawyered(e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-600">Lawyered</span>
                    </label>
                  </div>
                  <textarea
                    value={detailedRecord}
                    onChange={(e) => setDetailedRecord(e.target.value)}
                    rows={10}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                  <div className="mt-2">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Citations</h4>
                    {citations[2]?.map((citation, index) => (
                      <div key={index} className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={citation.text}
                          onChange={(e) => handleCitationChange(2, index, 'text', e.target.value)}
                          placeholder="Citation text"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                        <input
                          type="url"
                          value={citation.url}
                          onChange={(e) => handleCitationChange(2, index, 'url', e.target.value)}
                          placeholder="URL"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                        <button
                          type="button"
                          onClick={() => removeCitation(2, index)}
                          className="px-3 py-2 text-red-600 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addCitation(2)}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      + Add Citation
                    </button>
                  </div>
                </section>
              </div>
            </div>

            <div className="flex-shrink-0 flex justify-end space-x-3 border-t border-gray-200 p-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-800"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}