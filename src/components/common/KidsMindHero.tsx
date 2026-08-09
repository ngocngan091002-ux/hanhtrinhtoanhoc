import React from 'react';
import { ShieldCheck, Star, BookOpen, Gamepad2, Palette, Lightbulb, Rocket, Sparkles, CheckCircle2, ChevronRight } from 'lucide-react';

interface KidsMindHeroProps {
  studentName?: string;
  onNavigateTab?: (tab: string) => void;
}

export const KidsMindHero: React.FC<KidsMindHeroProps> = ({ studentName = 'Học sinh', onNavigateTab }) => {
  return (
    <div className="space-y-8 py-2 max-w-6xl mx-auto">
      {/* ☁️ TOP BRAND & FLOATING CLOUD BADGES */}
      <div className="relative flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
        {/* Left Floating Cloud */}
        <div className="bg-white/95 backdrop-blur-md p-4 px-6 rounded-3xl shadow-lg border-2 border-emerald-100 flex items-center space-x-3 w-full md:w-auto transform hover:-translate-y-1 transition-transform">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center text-xl shadow-md">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div className="text-left">
            <div className="text-sm font-black text-emerald-600 uppercase tracking-wide">100% AN TOÀN</div>
            <div className="text-xs text-slate-500 font-bold max-w-[180px]">Nền tảng học toán an toàn & bổ ích cho trẻ</div>
          </div>
        </div>

        {/* Center Main Title */}
        <div className="text-center space-y-2 flex-1">
          <div className="inline-flex items-center space-x-2 bg-amber-100/90 text-amber-900 px-4 py-1.5 rounded-full border border-amber-300 text-xs font-black uppercase tracking-wider shadow-2xs">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>Toán Lớp 2 • Học — Chơi — Phát Triển</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black font-display tracking-tight text-slate-900 drop-shadow-xs">
            HànhTrình<span className="text-sky-600">Toán</span><span className="text-amber-500">Học</span>
          </h1>

          <p className="text-sm sm:text-base font-extrabold text-slate-600 max-w-2xl mx-auto">
            Hàng ngàn học sinh đang học, chơi và cùng nhau phát triển môn <strong className="text-sky-700">Toán Lớp 2</strong> mỗi ngày!
          </p>
        </div>

        {/* Right Floating Cloud */}
        <div className="bg-white/95 backdrop-blur-md p-4 px-6 rounded-3xl shadow-lg border-2 border-amber-100 flex items-center space-x-3 w-full md:w-auto transform hover:-translate-y-1 transition-transform">
          <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center text-xl shadow-md">
            <Star className="w-7 h-7 fill-white text-amber-500" />
          </div>
          <div className="text-left">
            <div className="text-sm font-black text-amber-600 uppercase tracking-wide">XUẤT SẮC</div>
            <div className="text-xs text-slate-500 font-bold max-w-[180px]">Trải nghiệm học tập Toán Lớp 2 số 1</div>
          </div>
        </div>
      </div>

      {/* 👦👧 CARTOON KIDS WELCOME SUBTITLE */}
      <div className="bg-gradient-to-r from-sky-50 via-amber-50 to-rose-50 p-6 rounded-3xl border-2 border-sky-100 text-center space-y-2 shadow-sm">
        <p className="text-base sm:text-lg font-black text-slate-800">
          Bài học sinh động, Game toán học, Thử thách sáng tạo, Trắc nghiệm tư duy — Tất cả tích hợp trong một nơi!
        </p>
        <p className="text-xs font-bold text-sky-700">
          Chào mừng em <strong>{studentName}</strong> sẵn sàng bước vào hành trình rèn luyện tuyệt vời hôm nay! 🎉
        </p>
      </div>

      {/* 🎴 5 KIDS MIND FEATURE CARDS ROW */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Card 1 */}
        <div
          onClick={() => onNavigateTab && onNavigateTab('materials')}
          className="bg-white p-5 rounded-3xl border-2 border-purple-200 shadow-md hover:shadow-xl hover:-translate-y-1.5 transition-all cursor-pointer text-center space-y-3 group"
        >
          <div className="w-14 h-14 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center mx-auto text-2xl group-hover:scale-110 transition-transform shadow-xs">
            📚
          </div>
          <div>
            <h3 className="font-black text-base text-purple-950 font-display">Bài Học Sinh Động</h3>
            <p className="text-[11px] text-slate-500 font-bold mt-0.5">Bám sát SGK Lớp 2</p>
          </div>
        </div>

        {/* Card 2 */}
        <div
          onClick={() => onNavigateTab && onNavigateTab('games')}
          className="bg-white p-5 rounded-3xl border-2 border-sky-200 shadow-md hover:shadow-xl hover:-translate-y-1.5 transition-all cursor-pointer text-center space-y-3 group"
        >
          <div className="w-14 h-14 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center mx-auto text-2xl group-hover:scale-110 transition-transform shadow-xs">
            🎮
          </div>
          <div>
            <h3 className="font-black text-base text-sky-950 font-display">Game Vui Nhộn</h3>
            <p className="text-[11px] text-slate-500 font-bold mt-0.5">Giải trí & Toán học</p>
          </div>
        </div>

        {/* Card 3 */}
        <div
          onClick={() => onNavigateTab && onNavigateTab('daily_tasks')}
          className="bg-white p-5 rounded-3xl border-2 border-orange-200 shadow-md hover:shadow-xl hover:-translate-y-1.5 transition-all cursor-pointer text-center space-y-3 group"
        >
          <div className="w-14 h-14 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center mx-auto text-2xl group-hover:scale-110 transition-transform shadow-xs">
            🎨
          </div>
          <div>
            <h3 className="font-black text-base text-orange-950 font-display">Thử Thách Sáng Tạo</h3>
            <p className="text-[11px] text-slate-500 font-bold mt-0.5">Nhiệm vụ hằng ngày</p>
          </div>
        </div>

        {/* Card 4 */}
        <div
          onClick={() => onNavigateTab && onNavigateTab('assignments')}
          className="bg-white p-5 rounded-3xl border-2 border-emerald-200 shadow-md hover:shadow-xl hover:-translate-y-1.5 transition-all cursor-pointer text-center space-y-3 group"
        >
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-2xl group-hover:scale-110 transition-transform shadow-xs">
            💡
          </div>
          <div>
            <h3 className="font-black text-base text-emerald-950 font-display">Trắc Nghiệm Tư Duy</h3>
            <p className="text-[11px] text-slate-500 font-bold mt-0.5">Bài thi phản xạ Lớp 2</p>
          </div>
        </div>

        {/* Card 5 */}
        <div
          onClick={() => onNavigateTab && onNavigateTab('profile')}
          className="bg-white p-5 rounded-3xl border-2 border-rose-200 shadow-md hover:shadow-xl hover:-translate-y-1.5 transition-all cursor-pointer text-center space-y-3 group relative overflow-hidden col-span-2 sm:col-span-1"
        >
          <div className="absolute top-2 right-2 bg-rose-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
            MỚI
          </div>
          <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto text-2xl group-hover:scale-110 transition-transform shadow-xs">
            🚀
          </div>
          <div>
            <h3 className="font-black text-base text-rose-950 font-display">Góc Chinh Phục XP</h3>
            <p className="text-[11px] text-slate-500 font-bold mt-0.5">Bộ sưu tập huy hiệu</p>
          </div>
        </div>
      </div>

      {/* 📱💻 HERO MOCKUP INTERACTIVE CONTAINER & PURPLE CALLOUT BOX */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center pt-2">
        {/* Left 2 Cols: Tablet & Phone Graphic Display */}
        <div className="lg:col-span-2 bg-gradient-to-br from-sky-500 via-indigo-600 to-sky-700 p-6 sm:p-8 rounded-3xl text-white shadow-2xl space-y-6 relative overflow-hidden">
          <div className="flex justify-between items-center border-b border-white/20 pb-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-rose-400"></div>
              <div className="w-3 h-3 rounded-full bg-amber-400"></div>
              <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
              <span className="text-xs font-mono font-bold text-sky-100 ml-2">HànhTrìnhToánHọc App Lớp 2</span>
            </div>
            <span className="text-xs font-extrabold bg-white/20 px-3 py-1 rounded-full uppercase border border-white/30">
              Trải Nghiệm Trực Quan
            </span>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl sm:text-3xl font-black font-display drop-shadow-xs">
              Chào Mừng Đến Với Hành Trình Toán Học Lớp 2! 👋
            </h2>
            <p className="text-sky-100 text-sm leading-relaxed max-w-xl font-medium">
              Cùng nhau học tập, vui chơi và làm chủ các dạng bài phép cộng trừ phạm vi 100, bảng nhân 2, bảng nhân 5 và bài toán lời văn 1 phép tính cực kỳ dễ hiểu!
            </p>

            <div className="pt-2 flex flex-wrap gap-3">
              <button
                onClick={() => onNavigateTab && onNavigateTab('assignments')}
                className="bg-amber-400 hover:bg-amber-300 text-amber-950 font-black px-6 py-3 rounded-2xl shadow-lg transition-all text-sm flex items-center space-x-2 active:scale-95 cursor-pointer"
              >
                <Rocket className="w-5 h-5 text-amber-900" />
                <span>BẮT ĐẦU HÀNH TRÌNH HỌC TẬP</span>
              </button>

              <button
                onClick={() => onNavigateTab && onNavigateTab('games')}
                className="bg-white/20 hover:bg-white/30 text-white font-bold px-6 py-3 rounded-2xl border border-white/40 transition-all text-sm flex items-center space-x-2 cursor-pointer"
              >
                <Gamepad2 className="w-5 h-5" />
                <span>KHÁM PHÁ GAME TOÁN</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Soft Rounded Purple Callout Box */}
        <div className="bg-gradient-to-br from-purple-600 via-indigo-700 to-purple-800 p-6 sm:p-8 rounded-3xl text-white shadow-xl space-y-4 relative overflow-hidden flex flex-col justify-between h-full border-4 border-purple-300/40">
          <div className="space-y-3">
            <span className="inline-flex items-center space-x-1.5 bg-amber-400 text-purple-950 text-xs font-black px-3.5 py-1 rounded-full uppercase tracking-wider shadow-sm">
              <Sparkles className="w-4 h-4" />
              <span>TƯƠNG LAI TƯƠI SÁNG!</span>
            </span>

            <h3 className="text-xl sm:text-2xl font-black font-display leading-tight">
              Tương Lai Tươi Sáng Bắt Đầu Từ Đây! ✨
            </h3>

            <p className="text-xs sm:text-sm text-purple-100 font-medium leading-relaxed">
              Chúng em liên tục bổ sung các <strong className="text-amber-300">Bài Tập & Thử Thách Mới</strong> để giúp học sinh rèn luyện tư duy Toán Lớp 2 ngày càng giỏi hơn!
            </p>
          </div>

          <div className="pt-4 border-t border-purple-400/40 text-xs text-purple-200 font-bold flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-amber-400" />
            <span>Tích hợp đồng bộ kết quả trực tiếp với Giáo Viên</span>
          </div>
        </div>
      </div>

      {/* 🔴 GIANT BOTTOM CTA BUTTON */}
      <div className="text-center pt-2">
        <button
          onClick={() => onNavigateTab && onNavigateTab('assignments')}
          className="bg-gradient-to-r from-rose-500 via-amber-500 to-rose-500 hover:from-rose-600 hover:to-rose-600 text-white font-black text-lg sm:text-xl px-10 py-4.5 rounded-full shadow-2xl hover:shadow-rose-300/50 transition-all transform hover:scale-105 active:scale-95 inline-flex items-center space-x-3 cursor-pointer uppercase border-4 border-white tracking-wide"
        >
          <Rocket className="w-6 h-6 text-amber-200 animate-bounce" />
          <span>THAM GIA HÀNH TRÌNH TOÁN HỌC NGAY HÔM NAY!</span>
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};
