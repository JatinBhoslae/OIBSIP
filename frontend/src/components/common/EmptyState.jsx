import React from 'react';
import Button from './Button';
import { ShoppingBag } from 'lucide-react';

export default function EmptyState({ title, message, icon: Icon = ShoppingBag, actionText, onAction }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 space-y-5 text-center">
      <div className="bg-neutral-900/80 border border-neutral-800 p-6 rounded-full text-[#FF6B00] shadow-medium">
        <Icon className="w-12 h-12" />
      </div>
      <div className="space-y-1">
        <h3 className="text-xl font-bold text-white">{title}</h3>
        <p className="text-sm text-neutral-500 max-w-sm">{message}</p>
      </div>
      {actionText && onAction && (
        <Button onClick={onAction} variant="primary">
          {actionText}
        </Button>
      )}
    </div>
  );
}
