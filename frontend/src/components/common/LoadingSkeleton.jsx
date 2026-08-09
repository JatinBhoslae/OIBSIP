import React from 'react';

export function CardSkeleton() {
  return (
    <div className="w-full bg-[#111827] border border-neutral-850 rounded-3xl p-5 space-y-4 animate-pulse">
      <div className="w-full h-40 bg-neutral-900 rounded-2xl" />
      <div className="w-3/4 h-5 bg-neutral-900 rounded-lg" />
      <div className="w-1/2 h-3 bg-neutral-900 rounded-lg" />
      <div className="flex justify-between items-center pt-2">
        <div className="w-20 h-6 bg-neutral-900 rounded-lg" />
        <div className="w-24 h-10 bg-neutral-900 rounded-xl" />
      </div>
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="min-h-screen bg-neutral-950 text-white p-8 space-y-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="h-10 bg-neutral-900 rounded-xl w-1/3 animate-pulse" />
        <div className="h-40 bg-neutral-900 rounded-3xl w-full animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-60 bg-neutral-900 rounded-3xl animate-pulse" />
          <div className="h-60 bg-neutral-900 rounded-3xl animate-pulse" />
        </div>
      </div>
    </div>
  );
}

export function TableSkeleton() {
  return (
    <div className="space-y-4 w-full animate-pulse">
      <div className="h-10 bg-neutral-900 rounded-lg w-full" />
      <div className="h-10 bg-neutral-900 rounded-lg w-full" />
      <div className="h-10 bg-neutral-900 rounded-lg w-full" />
      <div className="h-10 bg-neutral-900 rounded-lg w-full" />
      <div className="h-10 bg-neutral-900 rounded-lg w-full" />
    </div>
  );
}
