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
    <header className="bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-2.5 cursor-pointer" onClick={() => navigate('/')}>
          <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center font-bold text-white shadow-md shrink-0 ${
            isAdmin ? 'bg-slate-900' : isTeacher ? 'bg-sky-600' : 'bg-amber-500'
          }`}>
            {isAdmin ? <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" /> : isTeacher ? <School className="w-5 h-5" /> : <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6" />}
          </div>
          <div>
            <span className="font-extrabold text-base sm:text-lg text-slate-900 tracking-tight font-display block leading-tight">
              Hành Trình Toán Học
            </span>
            <div className="flex items-center space-x-1 mt-0.5">
              <span className={`text-[9px] sm:text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
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

        {/* Portal Switcher for Admin / Teacher (Desktop) */}
        {(isAdmin || isTeacher) && (
          <div className="hidden md:flex items-center bg-slate-100 p-1 rounded-xl space-x-1 border border-slate-200">
            {isTeacher && (
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
            )}

            {isAdmin && (
              <>
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
              </>
            )}

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

        {/* Right User Info & Google Avatar */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          <div className="flex items-center space-x-2 text-right">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.full_name}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border-2 border-amber-400 shadow-sm object-cover"
              />
            ) : (
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-sky-100 border border-sky-300 flex items-center justify-center font-bold text-sky-800 text-xs sm:text-sm shadow-xs">
                {profile.full_name?.charAt(0).toUpperCase() || 'U'}
              </div>
            )}
            <div className="text-left hidden sm:block">
              <div className="font-bold text-xs sm:text-sm text-slate-900 max-w-[150px] truncate">{profile.full_name}</div>
              <div className="text-[10px] sm:text-[11px] text-slate-400 font-mono max-w-[150px] truncate">{profile.email}</div>
            </div>
          </div>

          <button
            onClick={signOut}
            className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors flex items-center space-x-1 text-xs font-bold"
            title="Đăng xuất khỏi hệ thống"
          >
            <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Đăng Xuất</span>
          </button>
        </div>
      </div>

      {/* 📱 MOBILE PORTAL SWITCHER BAR (ALWAYS ACCESSIBLE ON PHONES) */}
      {(isAdmin || isTeacher) && (
        <div className="flex md:hidden bg-slate-100 p-1.5 border-t border-slate-200 overflow-x-auto gap-1.5 px-3">
          {isTeacher && (
            <button
              onClick={() => navigate('/teacher')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center space-x-1 shrink-0 ${
                location.pathname.startsWith('/teacher')
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-700 bg-white border border-slate-200'
              }`}
            >
              <School className="w-3.5 h-3.5" />
              <span>Cổng Giáo Viên</span>
            </button>
          )}

          {isAdmin && (
            <>
              <button
                onClick={() => navigate('/teacher')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center space-x-1 shrink-0 ${
                  location.pathname.startsWith('/teacher')
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-slate-700 bg-white border border-slate-200'
                }`}
              >
                <School className="w-3.5 h-3.5" />
                <span>Cổng Giáo Viên</span>
              </button>

              <button
                onClick={() => navigate('/admin')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center space-x-1 shrink-0 ${
                  location.pathname.startsWith('/admin')
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-700 bg-white border border-slate-200'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Trang Quản Trị</span>
              </button>
            </>
          )}

          <button
            onClick={() => navigate('/student')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center space-x-1 shrink-0 ${
              location.pathname.startsWith('/student')
                ? 'bg-amber-500 text-white shadow-sm'
                : 'text-slate-700 bg-white border border-slate-200'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Góc Học Sinh</span>
          </button>
        </div>
      )}
    </header>
  );
};
