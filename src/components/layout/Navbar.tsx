import React from 'react';
import { useAuth } from '../../features/auth/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogOut, School, GraduationCap, ShieldCheck } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { profile, user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!user || !profile) return null;

  const isAdmin = profile.role === 'admin';
  const isTeacher = profile.role === 'teacher';

  return (
    <header className="bg-white/90 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate('/')}>
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-white shadow-md ${
            isAdmin ? 'bg-slate-900' : isTeacher ? 'bg-sky-600' : 'bg-amber-500'
          }`}>
            {isAdmin ? <ShieldCheck className="w-6 h-6 text-emerald-400" /> : isTeacher ? <School className="w-5 h-5" /> : <GraduationCap className="w-6 h-6" />}
          </div>
          <div>
            <span className="font-extrabold text-lg text-slate-900 tracking-tight font-display">
              Hành Trình Toán Học
            </span>
            <div className="flex items-center space-x-1">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                isAdmin
                  ? 'bg-slate-900 text-emerald-300 border border-slate-700'
                  : isTeacher
                  ? 'bg-sky-100 text-sky-800'
                  : 'bg-amber-100 text-amber-800'
              }`}>
                {isAdmin ? '🛡️ Admin & Giáo Viên' : isTeacher ? '👩‍🏫 Giáo Viên' : '👨‍🎓 Học Sinh'}
              </span>
            </div>
          </div>
        </div>

        {/* Portal Switcher for Admin */}
        {isAdmin && (
          <div className="hidden md:flex items-center bg-slate-100 p-1 rounded-xl space-x-1 border border-slate-200">
            <button
              onClick={() => navigate('/teacher')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 ${
                location.pathname.startsWith('/teacher')
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <School className="w-3.5 h-3.5" />
              <span>Cổng Giáo Viên</span>
            </button>

            <button
              onClick={() => navigate('/admin')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 ${
                location.pathname.startsWith('/admin')
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Trang Quản Trị</span>
            </button>

            <button
              onClick={() => navigate('/student')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 ${
                location.pathname.startsWith('/student')
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Góc Học Sinh</span>
            </button>
          </div>
        )}

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
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors flex items-center space-x-1 text-xs font-bold"
            title="Đăng xuất"
          >
            <LogOut className="w-5 h-5" />
            <span className="hidden sm:inline">Thoát</span>
          </button>
        </div>
      </div>
    </header>
  );
};
