import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { X, Trash2 } from 'lucide-react';

interface EditNodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { name: string; description: string }) => void;
  onDelete: () => void;
  initialData: {
    name: string;
    description?: string;
  };
}

export function EditNodeModal({ isOpen, onClose, onSave, onDelete, initialData }: EditNodeModalProps) {
  const [name, setName] = useState(initialData.name);
  const [description, setDescription] = useState(initialData.description || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ name, description });
    onClose();
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-sm rounded-lg bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-gray-200 p-4">
            <Dialog.Title className="text-lg font-semibold text-gray-900">
              Edit Node
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
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                rows={3}
              />
            </div>

            <div className="flex justify-between pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => {
                  onDelete();
                  onClose();
                }}
                className="flex items-center px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700"
              >
                <Trash2 size={16} className="mr-2" />
                Delete Node
              </button>
              <div className="flex space-x-3">
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
                  Save Changes
                </button>
              </div>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}