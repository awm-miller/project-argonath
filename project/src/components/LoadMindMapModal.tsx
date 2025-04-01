import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { X, Shield, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ConfirmationDialog } from './ConfirmationDialog';

interface MindMap {
  id: string;
  name: string;
  classification: string | null;
  created_at: string;
}

interface LoadMindMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  mindMaps: MindMap[];
}

export function LoadMindMapModal({ isOpen, onClose, onSelect, onDelete, mindMaps }: LoadMindMapModalProps) {
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ show: boolean; mapId: string; mapName: string }>({
    show: false,
    mapId: '',
    mapName: ''
  });
  const [isDeleting, setIsDeleting] = useState(false);

  const getClassificationColor = (name: string | null) => {
    switch (name?.toLowerCase()) {
      case 'green': return 'bg-green-100 text-green-800';
      case 'yellow': return 'bg-yellow-100 text-yellow-800';
      case 'black': return 'bg-gray-900 text-white';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleDelete = (id: string, name: string) => {
    setDeleteConfirmation({
      show: true,
      mapId: id,
      mapName: name
    });
  };

  const confirmDelete = async () => {
    try {
      setIsDeleting(true);
      await onDelete(deleteConfirmation.mapId);
      setDeleteConfirmation({ show: false, mapId: '', mapName: '' });
    } catch (error) {
      console.error('Error during deletion:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onClose={onClose} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-lg w-full rounded-lg bg-white shadow-lg">
            <div className="flex items-center justify-between border-b border-gray-200 p-4">
              <Dialog.Title className="text-lg font-semibold text-gray-900">
                Load Mind Map
              </Dialog.Title>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4">
              {mindMaps.length === 0 ? (
                <p className="text-center text-gray-500 py-4">No saved mind maps found.</p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {mindMaps.map((mindMap) => (
                    <div
                      key={mindMap.id}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      <div
                        onClick={() => {
                          onSelect(mindMap.id);
                          onClose();
                        }}
                        className="flex-1 cursor-pointer"
                      >
                        <h3 className="font-medium text-gray-900">{mindMap.name}</h3>
                        <p className="text-sm text-gray-500">
                          Created {format(new Date(mindMap.created_at), 'PPp')}
                        </p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className={`flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getClassificationColor(mindMap.classification)}`}>
                          <Shield size={12} className="mr-1" />
                          {mindMap.classification?.toUpperCase() || 'UNCLASSIFIED'}
                        </div>
                        <button
                          onClick={() => handleDelete(mindMap.id, mindMap.name)}
                          className="text-red-600 hover:text-red-700 p-1"
                          title="Delete mind map"
                          disabled={isDeleting}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end p-4 border-t border-gray-200">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-800"
              >
                Cancel
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      <ConfirmationDialog
        isOpen={deleteConfirmation.show}
        onClose={() => setDeleteConfirmation({ show: false, mapId: '', mapName: '' })}
        onConfirm={confirmDelete}
        title="Delete Mind Map"
        message={`Are you sure you want to delete "${deleteConfirmation.mapName}"? This action cannot be undone.`}
        confirmLabel={isDeleting ? 'Deleting...' : 'Delete'}
        cancelLabel="Cancel"
      />
    </>
  );
}