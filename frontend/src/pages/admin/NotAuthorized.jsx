import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import Button from '../../components/common/Button';

export default function NotAuthorized() {
  return (
    <div className="min-h-screen bg-[#0B0F1A] text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-5 bg-neutral-900/60 border border-neutral-850 p-8 rounded-card shadow-large">
        <div className="w-14 h-14 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-2xl mx-auto flex items-center justify-center">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold text-white">403 - Access Denied</h1>
          <p className="text-xs text-neutral-400">
            You do not have administrator permissions to view this section.
          </p>
        </div>
        <div className="pt-2">
          <Link to="/">
            <Button variant="secondary" className="w-full py-2.5">
              <ArrowLeft className="w-4 h-4" />
              Return to Storefront
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
