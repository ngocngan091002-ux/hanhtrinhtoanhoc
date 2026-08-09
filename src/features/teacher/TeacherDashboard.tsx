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
      <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-100 flex flex-wrap gap-1">
        <button
          onClick={() => setActiveTab('classes')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
            activeTab === 'classes' ? 'bg-sky-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <School className="w-4 h-4" />
          <span>1. Lớp & Học Sinh</span>
        </button>

        <button
          onClick={() => setActiveTab('daily_tasks')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
            activeTab === 'daily_tasks' ? 'bg-sky-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <CalendarCheck className="w-4 h-4" />
          <span>2. Nhiệm Vụ Hằng Ngày</span>
        </button>

        <button
          onClick={() => setActiveTab('assignments')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
            activeTab === 'assignments' ? 'bg-sky-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <BookOpenCheck className="w-4 h-4" />
          <span>3. Bài Tập & Kiểm Tra</span>
        </button>

        <button
          onClick={() => setActiveTab('grading')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
            activeTab === 'grading' ? 'bg-amber-500 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>4. Chấm Bài & CHỐT Điểm</span>
        </button>

        <button
          onClick={() => setActiveTab('materials')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
            activeTab === 'materials' ? 'bg-sky-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <FolderPlus className="w-4 h-4" />
          <span>5. Học Liệu Supabase</span>
        </button>

        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
            activeTab === 'leaderboard' ? 'bg-sky-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Trophy className="w-4 h-4" />
          <span>6. Bảng Xếp Hạng</span>
        </button>
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
