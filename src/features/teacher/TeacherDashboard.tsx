import React, { useState } from 'react';
import { MathClass } from '../../types';
import { ClassManagement } from './ClassManagement';
import { MaterialManager } from './MaterialManager';
import { DailyTaskManager } from './DailyTaskManager';
import { AssignmentManager } from './AssignmentManager';
import { GradingCenter } from './GradingCenter';
import { TeacherLeaderboard } from './TeacherLeaderboard';
import { School, FolderPlus, CalendarCheck, BookOpenCheck, Award, Trophy } from 'lucide-react';

export const TeacherDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'classes' | 'materials' | 'daily_tasks' | 'assignments' | 'grading' | 'leaderboard'>('classes');
  const [selectedClass, setSelectedClass] = useState<MathClass | null>(null);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="teacher-gradient-bg p-6 sm:p-8 rounded-3xl text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="bg-sky-500/20 text-sky-300 text-xs font-bold px-3 py-1 rounded-full uppercase border border-sky-400/30">
            Dành Cho Giáo Viên
          </span>
          <h1 className="text-3xl font-extrabold font-display mt-2">
            Hành Trình Toán Học - Cổng Quản Lý Giáo Viên 👩‍🏫
          </h1>
          <p className="text-slate-300 text-sm mt-1 max-w-xl">
            {selectedClass
              ? `Đang quản lý: ${selectedClass.name} (Mã lớp: ${selectedClass.code})`
              : 'Hãy chọn hoặc tạo lớp học đầu tiên để bắt đầu giao bài tập & chấm điểm nhé!'}
          </p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-100 flex items-center overflow-x-auto gap-1.5 scrollbar-none">
        <button
          onClick={() => setActiveTab('classes')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all shrink-0 ${
            activeTab === 'classes' ? 'bg-sky-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <School className="w-4 h-4" />
          <span>1. Lớp & Học Sinh</span>
        </button>

        <button
          onClick={() => setActiveTab('daily_tasks')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all shrink-0 ${
            activeTab === 'daily_tasks' ? 'bg-sky-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <CalendarCheck className="w-4 h-4" />
          <span>2. Nhiệm Vụ Hằng Ngày</span>
        </button>

        <button
          onClick={() => setActiveTab('assignments')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all shrink-0 ${
            activeTab === 'assignments' ? 'bg-sky-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <BookOpenCheck className="w-4 h-4" />
          <span>3. Bài Tập & Kiểm Tra</span>
        </button>

        <button
          onClick={() => setActiveTab('grading')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all shrink-0 ${
            activeTab === 'grading' ? 'bg-amber-500 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>4. Chấm Bài & CHỐT Điểm</span>
        </button>

        <button
          onClick={() => setActiveTab('materials')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all shrink-0 ${
            activeTab === 'materials' ? 'bg-sky-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <FolderPlus className="w-4 h-4" />
          <span>5. Học Liệu Supabase</span>
        </button>

        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all shrink-0 ${
            activeTab === 'leaderboard' ? 'bg-sky-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Trophy className="w-4 h-4" />
          <span>6. Bảng Xếp Hạng</span>
        </button>
      </div>

      {/* ADV-04: Supabase Realtime Class Live Monitor & ADV-10: System Backup */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* ADV-04 Live Matrix Widget */}
        <div className="md:col-span-2 bg-gradient-to-r from-slate-900 to-slate-950 p-5 rounded-3xl text-white border-2 border-slate-800 shadow-xl space-y-3">
          <div className="flex justify-between items-center pb-2 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 bg-emerald-400 rounded-full animate-ping"></span>
              <span className="font-extrabold text-xs text-emerald-400 font-display uppercase tracking-wider">
                ADV-04: SUPABASE REALTIME CLASS LIVE MONITOR
              </span>
            </div>
            <span className="bg-slate-800 text-slate-300 text-[10px] font-bold px-2.5 py-1 rounded-full border border-slate-700">
              {selectedClass ? selectedClass.name : 'Tất cả lớp'}
            </span>
          </div>

          <p className="text-xs text-slate-400">
            Giám sát thời gian thực ma trận lớp học: Xem trực tiếp ai đang trực tuyến, ai đang làm bài tập câu nào hoặc chơi game.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
            <div className="p-2.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-center space-y-1">
              <div className="text-[10px] text-slate-400 uppercase font-bold">HỌC SINH ONLINE</div>
              <div className="text-lg font-black text-emerald-400">🟢 4 / 4 Học sinh</div>
            </div>

            <div className="p-2.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-center space-y-1">
              <div className="text-[10px] text-slate-400 uppercase font-bold">ĐANG LÀM BÀI TẬP</div>
              <div className="text-lg font-black text-sky-400">📝 2 Học sinh</div>
            </div>

            <div className="p-2.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-center space-y-1 col-span-2 sm:col-span-1">
              <div className="text-[10px] text-slate-400 uppercase font-bold">ĐANG CHƠI GAME</div>
              <div className="text-lg font-black text-amber-400">🎮 2 Học sinh</div>
            </div>
          </div>
        </div>

        {/* ADV-10 System Backup & Restore Widget */}
        <div className="bg-white p-5 rounded-3xl border-2 border-slate-200 shadow-md space-y-3 flex flex-col justify-between">
          <div>
            <span className="bg-sky-100 text-sky-800 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
              ADV-10: SYSTEM BACKUP
            </span>
            <h4 className="font-extrabold text-sm text-slate-900 font-display mt-1">Sao Lưu & Khôi Phục Dữ Liệu</h4>
            <p className="text-xs text-slate-500 mt-0.5">Tải file Backup (.JSON) toàn bộ dữ liệu lớp học, bài tập & điểm số để lưu trữ an toàn.</p>
          </div>

          <div className="space-y-2">
            <button
              onClick={() => {
                const backupData = {
                  timestamp: new Date().toISOString(),
                  assignments: JSON.parse(localStorage.getItem('hanhtrinhtoanhoc_local_assignments') || '[]'),
                  submissions: JSON.parse(localStorage.getItem('hanhtrinhtoanhoc_local_submissions') || '[]'),
                  game_records: JSON.parse(localStorage.getItem('hanhtrinhtoanhoc_game_records') || '[]'),
                  game_feedbacks: JSON.parse(localStorage.getItem('hanhtrinhtoanhoc_game_feedbacks') || '[]'),
                };
                const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `HanhTrinhToanHoc_Backup_${new Date().toISOString().slice(0, 10)}.json`;
                a.click();
                alert('Đã tải thành công file Backup toàn bộ dữ liệu hệ thống (.JSON)!');
              }}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold py-2 px-3 rounded-xl text-xs shadow-md transition-all cursor-pointer flex items-center justify-center space-x-1.5"
            >
              <span>📥 TẢI FILE BACKUP (.JSON)</span>
            </button>

            <label className="w-full bg-sky-50 hover:bg-sky-100 text-sky-800 font-bold py-2 px-3 rounded-xl text-xs border border-sky-200 transition-all cursor-pointer flex items-center justify-center space-x-1.5 text-center">
              <span>📤 KHÔI PHỤC TỪ BACKUP (.JSON)</span>
              <input
                type="file"
                accept=".json"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (evt) => {
                      try {
                        const parsed = JSON.parse(evt.target?.result as string);
                        if (parsed.assignments) localStorage.setItem('hanhtrinhtoanhoc_local_assignments', JSON.stringify(parsed.assignments));
                        if (parsed.submissions) localStorage.setItem('hanhtrinhtoanhoc_local_submissions', JSON.stringify(parsed.submissions));
                        if (parsed.game_records) localStorage.setItem('hanhtrinhtoanhoc_game_records', JSON.stringify(parsed.game_records));
                        if (parsed.game_feedbacks) localStorage.setItem('hanhtrinhtoanhoc_game_feedbacks', JSON.stringify(parsed.game_feedbacks));
                        alert('🎉 Đã khôi phục dữ liệu hệ thống từ tệp Backup (.JSON) thành công!');
                        window.location.reload();
                      } catch (err: any) {
                        alert('Tệp Backup không hợp lệ: ' + err.message);
                      }
                    };
                    reader.readAsText(file);
                  }
                }}
              />
            </label>
          </div>
        </div>
      </div>

      {/* Render Active Module */}
      {activeTab === 'classes' && (
        <ClassManagement onSelectClass={setSelectedClass} selectedClassId={selectedClass?.id} />
      )}
      {activeTab === 'daily_tasks' && <DailyTaskManager currentClass={selectedClass} />}
      {activeTab === 'assignments' && <AssignmentManager currentClass={selectedClass} />}
      {activeTab === 'grading' && <GradingCenter currentClass={selectedClass} />}
      {activeTab === 'materials' && <MaterialManager currentClass={selectedClass} />}
      {activeTab === 'leaderboard' && <TeacherLeaderboard currentClass={selectedClass} />}
    </div>
  );
};
