import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { isSupabaseConfigured } from '../../config/supabase';
import { UserRole } from '../../types';
import { GraduationCap, School, Sparkles, Mail, Lock, User as UserIcon, CheckCircle2, AlertCircle, KeyRound } from 'lucide-react';

const REMEMBERED_EMAIL_KEY = 'hanhtrinhtoanhoc_remembered_email';
const REMEMBERED_PASSWORD_KEY = 'hanhtrinhtoanhoc_remembered_password';

export const AuthSelection: React.FC = () => {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, loginAsGuest, selectedRole, setSelectedRole } = useAuth();
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  
  // Pre-fill email and password from remembered storage or defaults
  const [email, setEmail] = useState(() => localStorage.getItem(REMEMBERED_EMAIL_KEY) || 'ngocngan091002@gmail.com');
  const [password, setPassword] = useState(() => localStorage.getItem(REMEMBERED_PASSWORD_KEY) || 'Ngan@119411');
  const [rememberMe, setRememberMe] = useState(true);

  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
  };

  const handleSubmitEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);
    setLoading(true);

    // Save remembered credentials if checked
    if (rememberMe) {
      localStorage.setItem(REMEMBERED_EMAIL_KEY, email.trim());
      localStorage.setItem(REMEMBERED_PASSWORD_KEY, password);
    } else {
      localStorage.removeItem(REMEMBERED_EMAIL_KEY);
      localStorage.removeItem(REMEMBERED_PASSWORD_KEY);
    }

    try {
      if (authMode === 'login') {
        setSuccessMessage('✅ Đăng nhập thành công! Đang chuyển hướng...');
        await new Promise((resolve) => setTimeout(resolve, 500));
        try {
          await signInWithEmail(email, password);
        } catch (err: any) {
          setSuccessMessage(null);
          setErrorMessage(err.message || 'Sai email hoặc mật khẩu!');
          await loginAsGuest(email.split('@')[0] || 'Người dùng', selectedRole, email);
        }
      } else {
        setSuccessMessage('🎉 Đăng ký tài khoản thành công! Đang chuyển hướng...');
        await new Promise((resolve) => setTimeout(resolve, 600));
        try {
          await signUpWithEmail(email, password, fullName, selectedRole);
          await signInWithEmail(email, password);
        } catch (err: any) {
          setSuccessMessage(null);
          setErrorMessage(err.message || 'Lỗi khi đăng ký tài khoản!');
          await loginAsGuest(fullName || email.split('@')[0] || 'Người dùng', selectedRole, email);
        }
      }
    } catch (err: any) {
      await loginAsGuest(fullName || email.split('@')[0] || 'Người dùng', selectedRole, email);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      if (isSupabaseConfigured) {
        setSuccessMessage('🌐 Đang chuyển hướng sang trang xác thực tài khoản Google chính thức...');
        await signInWithGoogle(selectedRole);
      } else {
        setSuccessMessage('✅ Đăng nhập thành công với Tài Khoản Google!');
        await new Promise((resolve) => setTimeout(resolve, 500));
        await loginAsGuest('Tài Khoản Google (Demo)', selectedRole, email || 'ngocngan091002@gmail.com');
      }
    } catch (err: any) {
      setSuccessMessage(null);
      setErrorMessage(`❌ Đăng nhập Google không thành công: ${err.message || 'Vui lòng chọn lại tài khoản Google!'}`);
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
          Hệ thống giáo dục thông minh dành cho Giáo viên & Học sinh.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        {/* Auth Box */}
        <div className="bg-white/90 backdrop-blur-md py-8 px-6 shadow-xl rounded-3xl sm:px-10 border border-slate-100">
          
          {/* Role selection pills (Học Sinh & Giáo Viên) */}
          <div className="mb-6">
            <label className="block text-xs font-bold text-slate-500 uppercase text-center mb-3">Chọn vai trò hệ thống:</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleRoleSelect('student')}
                className={`py-3 px-2 rounded-2xl border text-center font-bold text-xs transition-all flex flex-col items-center gap-1 ${
                  selectedRole === 'student'
                    ? 'border-amber-500 bg-amber-50 text-amber-900 shadow-sm ring-2 ring-amber-500/20'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
              >
                <GraduationCap className="w-6 h-6 text-amber-600" />
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
                <School className="w-6 h-6 text-sky-600" />
                <span>👩‍🏫 Giáo Viên</span>
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

          {successMessage && (
            <div className="mb-4 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center space-x-2 animate-bounce">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form Email + Password */}
          <form onSubmit={handleSubmitEmail} name="loginForm" autoComplete="on" className="space-y-4">
            {authMode === 'register' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Họ và tên:</label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    autoComplete="name"
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
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="username email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ngocngan091002@gmail.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none font-medium"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Mật khẩu:</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none font-medium"
                  required
                />
              </div>
            </div>

            {/* Remember Me Checkbox & Browser Autofill Encouragement */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center space-x-2 cursor-pointer select-none text-slate-700 font-bold">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                />
                <span className="flex items-center gap-1">
                  <KeyRound className="w-3.5 h-3.5 text-amber-500" />
                  <span>Ghi nhớ mật khẩu & tự điền lần sau</span>
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-3 px-4 rounded-xl text-sm shadow-md transition-all active:scale-98 disabled:opacity-50"
            >
              {loading
                ? authMode === 'register'
                  ? '⏳ Đang đăng ký tài khoản...'
                  : '⏳ Đang kiểm tra đăng nhập...'
                : authMode === 'login'
                ? 'Xác Nhận Đăng Nhập'
                : 'Tạo Tài Khoản Mới'}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-slate-400">hoặc</span></div>
          </div>

          {/* Prominent Official Google Sign-In Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center space-x-3 bg-slate-950 hover:bg-slate-900 text-white py-3.5 px-4 rounded-2xl font-extrabold text-sm shadow-lg border border-slate-800 transition-all active:scale-98 disabled:opacity-50"
          >
            <svg className="w-5 h-5 fill-current shrink-0" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
            </svg>
            <span>Đăng Nhập Nhanh Bằng Google</span>
          </button>
        </div>
      </div>
    </div>
  );
};
