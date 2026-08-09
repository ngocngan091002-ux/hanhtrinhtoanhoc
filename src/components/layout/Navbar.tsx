import React from 'react';
import { useAuth } from '../../features/auth/AuthContext';
import { LogOut, School, GraduationCap, Sparkles } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { profile, user, signOut } = useAuth();

  if (!user || !profile) return null;

  const isTeacher = profile.role === 'teacher';

  return (
    <header className="bg-white/90 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-white shadow-md ${isTeacher ? 'bg-slate-900' : 'bg-amber-500'}`}>
            {isTeacher ? <School className="w-5 h-5" /> : <GraduationCap className="w-6 h-6" />}
          </div>
          <div>
            <span className="font-extrabold text-lg text-slate-900 tracking-tight font-display">
              Hành Trình Toán Học
            </span>
            <div className="flex items-center space-x-1">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${isTeacher ? 'bg-sky-100 text-sky-800' : 'bg-amber-100 text-amber-800'}`}>
                {isTeacher ? '👩‍🏫 Giáo Viên' : '👨‍🎓 Học Sinh'}
              </span>
            </div>
          </div>
        </div>

        {/* Right User Info */}
        <div className="flex items-center space-x-4">
          <div className="hidden sm:flex items-center space-x-3 text-right">
            <div>
              <div className="font-bold text-sm text-slate-900">{profile.full_name}</div>
              <div className="text-[11px] text-slate-400 font-mono">{profile.email}</div>
            </div>
          </div>

          <button
            onClick={signOut}
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
            title="Đăng xuất"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};
