import React, { useContext, useEffect, useState } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { AuthContext } from '../../context/AuthContext';
import api from '../../utils/api';
import { User, Mail, Shield, Key } from 'lucide-react';
import Button from '../../components/common/Button';

export default function AdminProfile() {
  const { user } = useContext(AuthContext);
  const [profileData, setProfileData] = useState(user);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/admin/profile');
      if (res.data.success) {
        setProfileData(res.data.user);
      }
    } catch (err) {
      console.error('Failed to fetch admin profile', err);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 text-left max-w-3xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Admin Profile</h1>
          <p className="text-xs text-neutral-400">Account metadata and security privileges</p>
        </div>

        <div className="bg-neutral-900/60 border border-neutral-850 rounded-card p-6 space-y-6 shadow-medium">
          <div className="flex items-center gap-4 border-b border-neutral-800 pb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FF6B00] to-[#E63946] flex items-center justify-center text-white text-xl font-bold">
              {profileData?.name?.charAt(0)?.toUpperCase() || 'A'}
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">{profileData?.name}</h2>
              <p className="text-xs text-[#FF6B00] font-medium uppercase tracking-wider">
                System Administrator
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 space-y-1">
              <span className="text-neutral-400 flex items-center gap-1.5 font-medium">
                <User className="w-4 h-4 text-[#FF6B00]" /> Full Name
              </span>
              <p className="text-sm font-semibold text-white">{profileData?.name || 'N/A'}</p>
            </div>

            <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 space-y-1">
              <span className="text-neutral-400 flex items-center gap-1.5 font-medium">
                <Mail className="w-4 h-4 text-[#FF6B00]" /> Email Address
              </span>
              <p className="text-sm font-semibold text-white">{profileData?.email || 'N/A'}</p>
            </div>

            <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 space-y-1">
              <span className="text-neutral-400 flex items-center gap-1.5 font-medium">
                <Shield className="w-4 h-4 text-[#FF6B00]" /> Role
              </span>
              <p className="text-sm font-semibold text-emerald-400 uppercase tracking-wider">
                {profileData?.role || 'admin'}
              </p>
            </div>

            <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 space-y-1">
              <span className="text-neutral-400 flex items-center gap-1.5 font-medium">
                <Key className="w-4 h-4 text-[#FF6B00]" /> Session Token
              </span>
              <p className="text-xs font-mono text-neutral-400 truncate">Active JWT Signed</p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
