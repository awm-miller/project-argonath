import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { X } from 'lucide-react';

interface SaveMindMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; classification: string; overwriteId?: string }) => void;
  classifications: { name: string }[];
  existingMaps?: {
    id: string;
    name: string;
    classification: string;
    created_at: string;
  }[];
}

export function SaveMindMapModal({ isOpen, onClose, onSubmit, classifications, existingMaps = [] }: SaveMindMapModalProps) {
  const [name, setName] = useState('');
  const [classification, setClassification] = useState(classifications[0]?.name || '');
  const [saveMode, setSaveMode] = useState<'new' | 'overwrite'>('new');
  const [selectedMapId, setSelectedMapId] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name: saveMode === 'new' ? name : existingMaps.find(m => m.id === selectedMapId)?.name || '',
      classification,
      overwriteId: saveMode === 'overwrite' ? selectedMapId : undefined
    });
    setName('');
    setClassification(classifications[0]?.name || '');
    setSaveMode('new');
    setSelectedMapId('');
    onClose();
  };

  const getClassificationColor = (name: string) => {
    switch (name.toLowerCase()) {
      case 'green': return 'bg-green-100 text-green-800';
      case 'yellow': return 'bg-yellow-100 text-yellow-800';
      case 'black': return 'bg-gray-900 text-white';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-sm rounded-lg bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-gray-200 p-4">
            <Dialog.Title className="text-lg font-semibold text-gray-900">
              Save Mind Map
            </Dialog.Title>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Save Mode
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="new"
                    checked={saveMode === 'new'}
                    onChange={(e) => setSaveMode(e.target.value as 'new')}
                    className="mr-2"
                  />
                  Save As New
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="overwrite"
                    checked={saveMode === 'overwrite'}
                    onChange={(e) => setSaveMode(e.target.value as 'overwrite')}
                    className="mr-2"
                  />
                  Overwrite Existing
                </label>
              </div>
            </div>

            {saveMode === 'new' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  required
                  placeholder="Enter mind map name..."
                />
              </div>
            ) : (
              <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-md">
                {existingMaps.map((map) => (
                  <label
                    key={map.id}
                    className={`flex items-center justify-between p-3 hover:bg-gray-50 cursor-pointer ${
                      selectedMapId === map.id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-center">
                      <input
                        type="radio"
                        name="mapSelection"
                        value={map.id}
                        checked={selectedMapId === map.id}
                        onChange={(e) => setSelectedMapId(e.target.value)}
                        className="mr-3"
                      />
                      <div>
                        <div className="font-medium">{map.name}</div>
                        <div className="text-sm text-gray-500">
                          {new Date(map.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getClassificationColor(map.classification)}`}>
                      {map.classification.toUpperCase()}
                    </span>
                  </label>
                ))}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Classification Level
              </label>
              <select
                value={classification}
                onChange={(e) => setClassification(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                required
              >
                {classifications.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saveMode === 'overwrite' && !selectedMapId}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                Save
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}