import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { X, Trash2 } from 'lucide-react';

interface ConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { description: string; strength: 'strong' | 'weak' }) => void;
  onDelete?: () => void;
  initialData?: {
    description?: string;
    strength?: 'strong' | 'weak';
  };
}

export function ConnectionModal({ isOpen, onClose, onSubmit, onDelete, initialData }: ConnectionModalProps) {
  const [description, setDescription] = useState(initialData?.description || '');
  const [strength, setStrength] = useState<'strong' | 'weak'>(initialData?.strength || 'strong');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ description, strength });
    setDescription('');
    setStrength('strong');
    onClose();
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-sm rounded-lg bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-gray-200 p-4">
            <Dialog.Title className="text-lg font-semibold text-gray-900">
              {initialData ? 'Edit Connection' : 'Define Connection'}
            </Dialog.Title>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                required
                placeholder="Describe the connection..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Connection Strength
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="strong"
                    checked={strength === 'strong'}
                    onChange={(e) => setStrength(e.target.value as 'strong')}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">Strong Connection</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="weak"
                    checked={strength === 'weak'}
                    onChange={(e) => setStrength(e.target.value as 'weak')}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">Weak Connection</span>
                </label>
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-gray-200">
              {onDelete && (
                <button
                  type="button"
                  onClick={onDelete}
                  className="flex items-center px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700"
                >
                  <Trash2 size={16} className="mr-2" />
                  Delete Connection
                </button>
              )}
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {initialData ? 'Save Changes' : 'Create Connection'}
                </button>
              </div>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}