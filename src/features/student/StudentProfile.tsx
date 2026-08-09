import React, { useEffect } from 'react';
import { supabase } from '../../config/supabase';
import { useAuth } from '../auth/AuthContext';
import { User, LogOut, ShieldCheck, School } from 'lucide-react';

export const StudentProfile: React.FC = () => {
  const { profile, user, signOut, refreshProfile } = useAuth();

  useEffect(() => {
    if (user && profile && profile.grade_level !== 2) {
      supabase
        .from('profiles')
        .update({ grade_level: 2 })
        .eq('id', user.id)
        .then(() => {
          if (refreshProfile) refreshProfile();
        });
    }
  }, [user, profile]);

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-amber-500 text-white text-3xl font-extrabold flex items-center justify-center mx-auto shadow-lg border-4 border-amber-100">
          {profile?.full_name?.charAt(0) || 'H'}
        </div>

        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 font-display">{profile?.full_name || 'Học sinh'}</h2>
          <p className="text-sm text-slate-500 font-mono mt-1">{profile?.email || user?.email}</p>
          <span className="inline-block mt-3 bg-amber-100 text-amber-800 text-xs font-extrabold px-4 py-1.5 rounded-full border border-amber-200 uppercase shadow-2xs">
            HỌC SINH LỚP 2
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-500">Hình thức đăng nhập:</span>
            <span className="font-bold text-slate-800 flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-emerald-500" /> Google OAuth (Supabase Auth)
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Mã định danh ID:</span>
            <span className="font-mono text-slate-700">{user?.id?.substring(0, 18)}...</span>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100">
          <button
            onClick={signOut}
            className="w-full bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold py-3 px-6 rounded-2xl border border-rose-200 transition-all flex items-center justify-center space-x-2 text-sm"
          >
            <LogOut className="w-4 h-4" />
            <span>Đăng Xuất Tài Khoản</span>
          </button>
        </div>
      </div>
    </div>
  );
};
