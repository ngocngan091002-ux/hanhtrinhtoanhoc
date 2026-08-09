import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { isSupabaseConfigured } from '../../config/supabase';
import { UserRole } from '../../types';
import { GraduationCap, School, ShieldCheck, Sparkles, Mail, Lock, User as UserIcon, Zap, AlertTriangle } from 'lucide-react';

export const AuthSelection: React.FC = () => {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, selectedRole, setSelectedRole } = useAuth();
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showGoogleHelpModal, setShowGoogleHelpModal] = useState(false);

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
  };

  const handleSubmitEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      if (authMode === 'login') {
        await signInWithEmail(email, password);
      } else {
        await signUpWithEmail(email, password, fullName, selectedRole);
        setSuccessMessage('Tài khoản đã đăng ký thành công! Đang tự động chuyển hướng...');
        try {
          await signInWithEmail(email, password);
        } catch (loginErr: any) {
          // If login after signup fails (e.g. email confirmation required), inform user clearly
          if (loginErr?.message?.includes('Invalid login credentials') || loginErr?.message?.includes('Email not confirmed')) {
            setErrorMessage('Tài khoản đã đăng ký nhưng Supabase đang bật tính năng bắt buộc Xác nhận Email (Confirm Email). Vui lòng mở hộp thư email để xác nhận HOẶC dùng nút "Vào Trải Nghiệm Nhanh 1-Click" bên dưới.');
          } else {
            throw loginErr;
          }
        }
      }
    } catch (err: any) {
      if (err?.message?.includes('Invalid login credentials')) {
        setErrorMessage('Tài khoản hoặc Mật khẩu chưa chính xác (hoặc tài khoản cần Xác nhận Email trên Supabase).');
      } else {
        setErrorMessage(err?.message || 'Có lỗi xảy ra khi xác thực tài khoản.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ⚡ 1-CLICK INSTANT DEMO LOGIN (Self-fixing auth fallback)
  const handleQuickDemoLogin = async (roleOverride?: UserRole) => {
    const targetRole = roleOverride || selectedRole;
    setSelectedRole(targetRole);
    setLoading(true);
    setErrorMessage(null);
    setShowGoogleHelpModal(false);

    const demoEmails: Record<UserRole, string> = {
      teacher: 'giaovien.demo@hanhtrinhtoanhoc.edu.vn',
      student: 'hocsinh.demo@hanhtrinhtoanhoc.edu.vn',
      admin: 'admin.demo@hanhtrinhtoanhoc.edu.vn',
    };

    const demoNames: Record<UserRole, string> = {
      teacher: 'Thầy Cô Giáo Viên (Demo)',
      student: 'Nguyễn Văn Học Sinh (Demo)',
      admin: 'Quản Trị Viên Hệ Thống (Demo)',
    };

    const demoEmail = demoEmails[targetRole];
    const demoPassword = 'DemoPassword123!';

    try {
      // 1. Try signing in directly
      await signInWithEmail(demoEmail, demoPassword);
    } catch (loginErr: any) {
      // 2. If user doesn't exist, create it automatically and sign in
      try {
        await signUpWithEmail(demoEmail, demoPassword, demoNames[targetRole], targetRole);
        await signInWithEmail(demoEmail, demoPassword);
      } catch (signupErr: any) {
        setErrorMessage('Không thể khởi tạo tài khoản trải nghiệm nhanh: ' + (signupErr?.message || loginErr?.message));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!isSupabaseConfigured) {
      setShowGoogleHelpModal(true);
      return;
    }

    try {
      setLoading(true);
      setErrorMessage(null);
      await signInWithGoogle(selectedRole);
    } catch (err: any) {
      if (err?.message?.includes('provider is not enabled') || err?.status === 400) {
        setShowGoogleHelpModal(true);
      } else {
        setErrorMessage(err?.message || 'Không thể đăng nhập bằng Google.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-slate-50 to-amber-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-10 left-10 text-sky-200 text-8xl font-black select-none pointer-events-none opacity-40 animate-pulse">+</div>
      <div className="absolute bottom-10 right-10 text-amber-200 text-8xl font-black select-none pointer-events-none opacity-40 animate-pulse">×</div>

      <div className="sm:mx-auto sm:w-full sm:max-w-xl text-center relative z-10">
        <div className="inline-flex items-center justify-center space-x-2 bg-amber-100 text-amber-800 px-4 py-1.5 rounded-full font-bold text-sm mb-4 shadow-sm">
          <Sparkles className="w-4 h-4 text-amber-600" />
          <span>Nền Tảng Quản Lý Giáo Dục & Game Tương Tác</span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight font-display">
          Hành Trình Toán Học 📐
        </h1>
        <p className="mt-3 text-lg text-slate-600 max-w-md mx-auto">
          Hệ thống giáo dục thông minh dành cho Admin, Giáo viên & Học sinh.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl relative z-10 space-y-6">
        {/* 🚀 1-CLICK INSTANT ACCESS HERO BANNER */}
        <div className="bg-gradient-to-r from-sky-600 to-indigo-700 p-6 rounded-3xl text-white shadow-xl space-y-4 border border-sky-400/30">
          <div className="flex items-center space-x-2">
            <Zap className="w-6 h-6 text-amber-300 animate-bounce" />
            <h2 className="text-lg font-extrabold font-display">Vào Trải Nghiệm Nhanh 1-Click (Vào Thẳng Hệ Thống)</h2>
          </div>
          <p className="text-xs text-sky-100">
            Bấm 1 nút bên dưới để vào thẳng giao diện hệ thống tức thì không cần xác nhận Email:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
            <button
              onClick={() => handleQuickDemoLogin('student')}
              disabled={loading}
              className="bg-amber-400 hover:bg-amber-300 text-slate-900 font-extrabold px-3 py-3 rounded-2xl text-xs shadow-md transition-all active:scale-95 flex items-center justify-center space-x-1.5"
            >
              <GraduationCap className="w-4 h-4" />
              <span>Vào Vai Học Sinh</span>
            </button>

            <button
              onClick={() => handleQuickDemoLogin('teacher')}
              disabled={loading}
              className="bg-white hover:bg-slate-100 text-sky-900 font-extrabold px-3 py-3 rounded-2xl text-xs shadow-md transition-all active:scale-95 flex items-center justify-center space-x-1.5"
            >
              <School className="w-4 h-4 text-sky-600" />
              <span>Vào Vai Giáo Viên</span>
            </button>

            <button
              onClick={() => handleQuickDemoLogin('admin')}
              disabled={loading}
              className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold px-3 py-3 rounded-2xl text-xs shadow-md transition-all active:scale-95 flex items-center justify-center space-x-1.5 border border-slate-700"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Vào Vai Admin</span>
            </button>
          </div>
        </div>

        {/* Regular Auth Box */}
        <div className="bg-white/90 backdrop-blur-md py-8 px-6 shadow-xl rounded-3xl sm:px-10 border border-slate-100">
          
          {/* Role selection pills */}
          <div className="mb-6">
            <label className="block text-xs font-bold text-slate-500 uppercase text-center mb-3">Hoặc chọn vai trò để Đăng nhập / Đăng ký riêng:</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleRoleSelect('student')}
                className={`py-3 px-2 rounded-2xl border text-center font-bold text-xs transition-all flex flex-col items-center gap-1 ${
                  selectedRole === 'student'
                    ? 'border-amber-500 bg-amber-50 text-amber-900 shadow-sm ring-2 ring-amber-500/20'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
              >
                <GraduationCap className="w-5 h-5 text-amber-600" />
                <span>👨‍🎓 Học Sinh</span>
              </button>

              <button
                type="button"
                onClick={() => handleRoleSelect('teacher')}
                className={`py-3 px-2 rounded-2xl border text-center font-bold text-xs transition-all flex flex-col items-center gap-1 ${
                  selectedRole === 'teacher'
                    ? 'border-sky-500 bg-sky-50 text-sky-900 shadow-sm ring-2 ring-sky-500/20'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
              >
                <School className="w-5 h-5 text-sky-600" />
                <span>👩‍🏫 Giáo Viên</span>
              </button>

              <button
                type="button"
                onClick={() => handleRoleSelect('admin')}
                className={`py-3 px-2 rounded-2xl border text-center font-bold text-xs transition-all flex flex-col items-center gap-1 ${
                  selectedRole === 'admin'
                    ? 'border-slate-800 bg-slate-100 text-slate-900 shadow-sm ring-2 ring-slate-800/20'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
              >
                <ShieldCheck className="w-5 h-5 text-slate-800" />
                <span>🛡️ Quản Trị Viên</span>
              </button>
            </div>
          </div>

          {/* Auth Mode Toggle */}
          <div className="flex rounded-2xl bg-slate-100 p-1 mb-6">
            <button
              type="button"
              onClick={() => setAuthMode('login')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                authMode === 'login' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Đăng Nhập bằng Email
            </button>
            <button
              type="button"
              onClick={() => setAuthMode('register')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                authMode === 'register' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Đăng Ký Tài Khoản Mới
            </button>
          </div>

          {errorMessage && (
            <div className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium space-y-2">
              <p>{errorMessage}</p>
              <button
                onClick={() => handleQuickDemoLogin(selectedRole)}
                className="bg-rose-600 text-white font-bold px-3 py-1.5 rounded-lg text-xs hover:bg-rose-700 transition-all block w-full text-center"
              >
                ⚡ Bấm vào đây để vào hệ thống ngay (Vượt qua yêu cầu Email)
              </button>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium">
              {successMessage}
            </div>
          )}

          {/* Form Email + Password */}
          <form onSubmit={handleSubmitEmail} className="space-y-4">
            {authMode === 'register' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Họ và tên:</label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Nhập họ và tên đầy đủ..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email:</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nhap-email@domain.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Mật khẩu:</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-3 px-4 rounded-xl text-sm shadow-md transition-all active:scale-98 disabled:opacity-50"
            >
              {loading ? 'Đang xử lý...' : authMode === 'login' ? 'Xác Nhận Đăng Nhập' : 'Tạo Tài Khoản Mới'}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-slate-400">hoặc</span></div>
          </div>

          {/* Google Login Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white py-3 px-4 rounded-xl font-bold text-sm shadow-md transition-all active:scale-98 disabled:opacity-50"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
            </svg>
            <span>Đăng Nhập Nhanh Bằng Google</span>
          </button>
        </div>
      </div>

      {/* Self-Fixing Google OAuth Helper Modal */}
      {showGoogleHelpModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 border border-amber-200">
            <div className="flex items-center space-x-3 text-amber-600">
              <AlertTriangle className="w-8 h-8 flex-shrink-0" />
              <h3 className="text-lg font-extrabold font-display text-slate-900">
                Chưa Cấu Hình Bật Đăng Nhập Google Trên Supabase
              </h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Tính năng Đăng nhập bằng Google yêu cầu cấu hình Google OAuth Client ID từ Google Cloud Console. Để Thầy/Cô không bị vướng mắc, hãy bấm vào 1 trong các nút bên dưới để vào hệ thống ngay lập tức:
            </p>

            <div className="p-4 bg-sky-50 rounded-2xl border border-sky-100 space-y-3">
              <span className="text-xs font-bold text-sky-900 uppercase">⚡ Chọn vai trò để vào thẳng hệ thống:</span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleQuickDemoLogin('student')}
                  className="bg-amber-500 hover:bg-amber-600 text-white font-extrabold py-2.5 px-2 rounded-xl text-xs shadow-md transition-all"
                >
                  👨‍🎓 Học Sinh
                </button>
                <button
                  onClick={() => handleQuickDemoLogin('teacher')}
                  className="bg-sky-600 hover:bg-sky-700 text-white font-extrabold py-2.5 px-2 rounded-xl text-xs shadow-md transition-all"
                >
                  👩‍🏫 Giáo Viên
                </button>
                <button
                  onClick={() => handleQuickDemoLogin('admin')}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold py-2.5 px-2 rounded-xl text-xs shadow-md transition-all"
                >
                  🛡️ Admin
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setShowGoogleHelpModal(false)}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 px-4 py-2"
              >
                Đóng thông báo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
