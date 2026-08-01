import React from 'react';
import { AlertTriangle } from 'lucide-react';
import Button from '../../common/Button';

export default function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  count = 1,
  loading,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-neutral-900 border border-neutral-800 rounded-card max-w-md w-full p-6 text-center space-y-4 shadow-large">
        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 mx-auto flex items-center justify-center">
          <AlertTriangle className="w-6 h-6" />
        </div>

        <div className="space-y-1.5">
          <h3 className="text-base font-bold text-white">
            {count > 1 ? `Delete ${count} Ingredients?` : 'Delete Ingredient?'}
          </h3>
          <p className="text-xs text-neutral-400">
            {count > 1
              ? `Are you sure you want to delete these ${count} items from inventory? This action cannot be undone.`
              : 'Are you sure you want to remove this ingredient from inventory? Custom pizzas referencing this ingredient will be affected.'}
          </p>
        </div>

        <div className="flex gap-3 pt-2">
          <Button variant="secondary" onClick={onClose} className="flex-1 py-2.5">
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white border-none"
          >
            {loading ? 'Deleting...' : 'Confirm Delete'}
          </Button>
        </div>
      </div>
    </div>
  );
}
