import React, { useEffect } from 'react';
import { supabase } from '../../config/supabase';
import { useAuth } from '../auth/AuthContext';
import { triggerConfetti } from '../../utils/confetti';
import { User, LogOut, ShieldCheck, Award, Zap, Target, BookOpen, Flame, Star, Trophy, Lock, MessageCircle, Sparkles, CheckCircle2 } from 'lucide-react';

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

  const handleClaimBadgeEffect = () => {
    triggerConfetti();
  };

  const skillsList = [
    { title: '⚡ Tính Nhẩm Phạm Vi 100', percent: 96, grade: 'Hạng S (Xuất Sắc)', color: 'bg-emerald-500' },
    { title: '📐 Hình Học & Nhận Biết Hình', percent: 90, grade: 'Hạng A (Thành Thạo)', color: 'bg-sky-500' },
    { title: '📖 Giải Toán Lời Văn Lớp 2', percent: 85, grade: 'Hạng A (Khá Giỏi)', color: 'bg-amber-500' },
    { title: '🎯 Tỉ Lệ Làm Đúng Tổng Thể', percent: 92, grade: 'Hạng S (Siêu Sao)', color: 'bg-purple-500' },
  ];

  const badgesList = [
    {
      id: 'b1',
      icon: '🥇',
      title: 'Vua Tính Nhẩm',
      desc: 'Hoàn thành 5 bài tính nhẩm dưới 2 phút',
      unlocked: true,
      bg: 'bg-amber-50 border-amber-300 text-amber-900',
    },
    {
      id: 'b2',
      icon: '⚡',
      title: 'Thần Tốc Toán Học',
      desc: 'Nộp bài thi trong thời gian kỷ lục',
      unlocked: true,
      bg: 'bg-sky-50 border-sky-300 text-sky-900',
    },
    {
      id: 'b3',
      icon: '📚',
      title: 'Siêu Chăm Chỉ',
      desc: 'Hoàn thành nhiệm vụ 3 ngày liên tiếp',
      unlocked: true,
      bg: 'bg-emerald-50 border-emerald-300 text-emerald-900',
    },
    {
      id: 'b4',
      icon: '🏆',
      title: 'Bậc Thầy Điểm 10',
      desc: 'Đạt điểm 10 tuyệt đối bài kiểm tra tuần',
      unlocked: true,
      bg: 'bg-purple-50 border-purple-300 text-purple-900',
    },
    {
      id: 'b5',
      icon: '🛡️',
      title: 'Đại Sứ Lớp 2',
      desc: 'Điều kiện: Đạt 500 XP kinh nghiệm (Cần thêm 50 XP)',
      unlocked: false,
      bg: 'bg-slate-100 border-slate-200 text-slate-400 opacity-70',
    },
    {
      id: 'b6',
      icon: '🔥',
      title: 'Thánh Chuỗi Thắng',
      desc: 'Điều kiện: 10 bài thi điểm 10 liên tiếp (Tiến độ: 4/10)',
      unlocked: false,
      bg: 'bg-slate-100 border-slate-200 text-slate-400 opacity-70',
    },
  ];

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* 🌟 Top Hero Gamified Profile Card */}
      <div className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 p-6 sm:p-8 rounded-3xl text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="flex items-center space-x-5 z-10">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-white text-amber-600 text-4xl font-black flex items-center justify-center shadow-lg border-4 border-amber-200">
              {profile?.full_name?.charAt(0) || 'N'}
            </div>
            <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-1.5 rounded-full border-2 border-white shadow-sm" title="Hoạt động">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="bg-white/30 text-white text-xs font-black px-3 py-1 rounded-full border border-white/40 uppercase tracking-wide">
                HỌC SINH LỚP 2
              </span>
              <span className="bg-amber-900/30 text-amber-100 text-xs font-bold px-3 py-1 rounded-full border border-amber-200/30 flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-amber-300 fill-amber-300" /> 450 XP
              </span>
            </div>
            <h2 className="text-3xl font-black font-display drop-shadow-xs">{profile?.full_name || 'Nguyễn Thị Ngọc Ngân'}</h2>
            <p className="text-amber-100 text-sm font-mono">{profile?.email || user?.email}</p>
          </div>
        </div>

        <div className="bg-white/20 backdrop-blur-md p-4 rounded-2xl border border-white/30 text-center space-y-1 z-10 w-full sm:w-auto">
          <div className="text-xs font-extrabold uppercase text-amber-100 flex items-center justify-center gap-1">
            <Star className="w-4 h-4 text-amber-200 fill-amber-200" />
            <span>Danh Hiệu Hiện Tại</span>
          </div>
          <div className="text-xl font-black text-white">⭐ NGÔI SAO TOÁN HỌC LỚP 2</div>
          <div className="text-xs text-amber-100">Bảng Xếp Hạng: Top 1 Lớp</div>
        </div>
      </div>

      {/* 📊 1. BIỂU ĐỒ NĂNG LỰC HỌC TẬP (VISUAL PROGRESS BARS) */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-100 space-y-5">
        <div className="flex justify-between items-center pb-3 border-b border-slate-100">
          <h3 className="text-xl font-black text-slate-900 flex items-center space-x-2 font-display">
            <Target className="w-6 h-6 text-sky-600" />
            <span>Biểu Đồ Năng Lực Toán Học Visual (Phân Tích Tiến Độ)</span>
          </h3>
          <span className="text-xs font-bold text-sky-700 bg-sky-50 px-3 py-1 rounded-full border border-sky-200">
            Cập nhật theo thực tế
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
          {skillsList.map((skill, idx) => (
            <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 hover:bg-white hover:shadow-md transition-all">
              <div className="flex justify-between items-center">
                <span className="text-sm font-extrabold text-slate-800">{skill.title}</span>
                <span className="text-xs font-black text-sky-700 bg-sky-100 px-2.5 py-0.5 rounded-full">{skill.percent}%</span>
              </div>

              {/* Progress Bar Container */}
              <div className="w-full bg-slate-200 h-3.5 rounded-full overflow-hidden p-0.5">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${skill.color}`}
                  style={{ width: `${skill.percent}%` }}
                />
              </div>

              <div className="text-xs text-slate-500 font-bold text-right">{skill.grade}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 🎖️ 2. BỘ SƯU TẬP HUY HIỆU (BADGES COLLECTION) */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-100 space-y-5">
        <div className="flex justify-between items-center pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-xl font-black text-slate-900 flex items-center space-x-2 font-display">
              <Trophy className="w-6 h-6 text-amber-500" />
              <span>Bộ Sưu Tập Huy Hiệu Chinh Phục ({badgesList.filter((b) => b.unlocked).length}/{badgesList.length})</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Huy hiệu tô màu rực rỡ thể hiện các chiến tích em đã xuất sắc chinh phục được!
            </p>
          </div>

          <button
            onClick={handleClaimBadgeEffect}
            className="text-xs font-extrabold bg-amber-100 hover:bg-amber-200 text-amber-900 px-3.5 py-2 rounded-xl border border-amber-300 transition-all flex items-center gap-1 shadow-2xs"
          >
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>Pháo Hoa Chúc Mừng</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2">
          {badgesList.map((badge) => (
            <div
              key={badge.id}
              className={`p-5 rounded-2xl border-2 flex flex-col items-center text-center space-y-2 transition-all relative ${
                badge.unlocked ? `${badge.bg} shadow-md hover:scale-105 cursor-pointer` : badge.bg
              }`}
            >
              <div className="text-4xl mb-1 relative">
                {badge.icon}
                {!badge.unlocked && (
                  <div className="absolute -top-1 -right-1 bg-slate-700 text-white p-1 rounded-full shadow-md">
                    <Lock className="w-3 h-3" />
                  </div>
                )}
              </div>

              <div className="font-extrabold text-base">{badge.title}</div>
              <div className="text-xs leading-relaxed font-medium">{badge.desc}</div>

              {badge.unlocked ? (
                <span className="mt-2 text-[10px] font-black uppercase px-2.5 py-0.5 bg-emerald-600 text-white rounded-full shadow-2xs">
                  ✓ Đã Mở Khóa
                </span>
              ) : (
                <span className="mt-2 text-[10px] font-bold uppercase px-2.5 py-0.5 bg-slate-300 text-slate-700 rounded-full">
                  🔒 Đang Khóa
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 💬 3. KHUNG NHẬN XÉT CỬA SỔ MESSENGER MỀM MẠI */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-100 space-y-4">
        <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
          <div className="w-10 h-10 rounded-full bg-sky-600 text-white flex items-center justify-center shadow-md">
            <MessageCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 font-display">Lời Nhận Xét & Động Viên Từ Thầy Cô</h3>
            <p className="text-xs text-slate-500">Cửa sổ thông điệp hướng dẫn cá nhân hóa dành riêng cho em</p>
          </div>
        </div>

        {/* Messenger Rounded Chat Bubble Container */}
        <div className="bg-sky-50/80 p-5 rounded-3xl border border-sky-200 space-y-4 relative">
          <div className="flex items-start space-x-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 text-white font-extrabold text-lg flex items-center justify-center shadow-md border-2 border-white flex-shrink-0">
              👩‍🏫
            </div>

            <div className="space-y-2 flex-1">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-sm text-sky-950">Giáo Viên Chủ Nhiệm Toán Lớp 2</span>
                <span className="text-[11px] text-slate-400 font-mono">Vừa cập nhật</span>
              </div>

              {/* Chat Bubble Box */}
              <div className="bg-white p-4 rounded-2xl rounded-tl-xs shadow-sm border border-sky-100 text-sm text-slate-800 leading-relaxed font-medium space-y-2">
                <p>
                  Chào em <strong>{profile?.full_name || 'Nguyễn Thị Ngọc Ngân'}</strong>! 🌟 Thầy Cô vô cùng tự hào về tinh thần chăm chỉ và tiến bộ vượt bậc của em trong các bài luyện tập vừa qua.
                </p>
                <p>
                  Kỹ năng <strong>Tính Nhẩm Phạm Vi 100</strong> của em đang đạt kết quả cực kỳ ấn tượng (96%). Hãy tiếp tục phát huy sự cẩn thận và sẵn sàng <strong>🚀 Gửi Chiến Tích</strong> ở các bài tập mới để tích lũy thêm <strong>XP Kinh Nghiệm</strong> nhé!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Account Info Box */}
      <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 space-y-4">
        <div className="flex justify-between items-center text-xs text-slate-600">
          <span className="font-bold flex items-center gap-1">
            <ShieldCheck className="w-4 h-4 text-emerald-600" /> Hệ Thống Xác Thực Tài Khoản: Google OAuth (Supabase)
          </span>
          <span className="font-mono text-slate-500">ID: {user?.id?.substring(0, 16)}...</span>
        </div>

        <button
          onClick={signOut}
          className="w-full bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold py-3.5 px-6 rounded-2xl border border-rose-200 transition-all flex items-center justify-center space-x-2 text-sm shadow-2xs"
        >
          <LogOut className="w-4 h-4" />
          <span>Đăng Xuất Tài Khoản</span>
        </button>
      </div>
    </div>
  );
};
