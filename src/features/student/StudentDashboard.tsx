import React, { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import { useAuth } from '../auth/AuthContext';
import { MathClass, Assignment, StudentProgress } from '../../types';
import { DailyTasksView } from './DailyTasksView';
import { AssignmentsView } from './AssignmentsView';
import { GamesView } from './GamesView';
import { MaterialsView } from './MaterialsView';
import { ResultsProgressView } from './ResultsProgressView';
import { StudentLeaderboard } from './StudentLeaderboard';
import { StudentProfile } from './StudentProfile';
import { KidsMindHero } from '../../components/common/KidsMindHero';
import { Home, CalendarCheck, BookOpenCheck, Gamepad2, BookOpen, Award, Trophy, User, PlusCircle, CheckCircle, Play, X } from 'lucide-react';

export const StudentDashboard: React.FC = () => {
  const { profile, user } = useAuth();
  const [activeTab, setActiveTab] = useState<
    'home' | 'daily_tasks' | 'assignments' | 'games' | 'materials' | 'results' | 'leaderboard' | 'profile'
  >('home');

  // Student classes & assignments state
  const [enrolledClasses, setEnrolledClasses] = useState<MathClass[]>([]);
  const [assignedMaterials, setAssignedMaterials] = useState<Assignment[]>([]);
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [joinMessage, setJoinMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  // Active game/material modal viewer
  const [activeMaterial, setActiveMaterial] = useState<Assignment | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);

  useEffect(() => {
    if (user) {
      fetchStudentData();
    }
  }, [user]);

  const fetchStudentData = async () => {
    setLoading(true);
    try {
      // 1. Get enrolled classes
      const { data: memberData } = await supabase
        .from('class_members')
        .select('class_id, class:classes(*)')
        .eq('student_id', user?.id);

      const classesList = (memberData || []).map((m: any) => m.class).filter(Boolean);
      setEnrolledClasses(classesList);

      const classIds = classesList.map((c) => c.id);

      // 2. Get assignments assigned to student's classes
      const { data: assData } = await supabase
        .from('assignments')
        .select('*, material:materials(*), class:classes(name)')
        .in('class_id', classIds)
        .order('created_at', { ascending: false });

      // Merge with shared localStorage assignments for 100% demo/guest mode support
      const sharedAssKey = `hanhtrinhtoanhoc_shared_assignments`;
      let sharedAssData: any[] = [];
      try {
        sharedAssData = JSON.parse(localStorage.getItem(sharedAssKey) || '[]');
      } catch {}

      const allAss = [...(assData || []), ...sharedAssData];

      // Also fetch public materials
      const { data: publicMats } = await supabase
        .from('materials')
        .select('*')
        .order('created_at', { ascending: false });

      const publicAss = (publicMats || []).map((m: any) => ({
        id: `pub_${m.id}`,
        class_id: classIds[0] || 'class_2',
        material_id: m.id,
        material: m,
        class: { name: classesList[0]?.name || 'Toán Lớp 2' },
        created_at: m.created_at,
      }));

      // Deduplicate by material ID
      const combinedMap = new Map<string, any>();
      [...allAss, ...publicAss].forEach((item) => {
        if (item.material && !combinedMap.has(item.material.id || item.material_id)) {
          combinedMap.set(item.material.id || item.material_id, item);
        }
      });

      const combinedList = Array.from(combinedMap.values());

      // 3. Get student progress for these assignments
      const { data: progData } = await supabase
        .from('student_progress')
        .select('*')
        .eq('student_id', user?.id);

      const progMap: Record<string, StudentProgress> = {};
      (progData || []).forEach((p: StudentProgress) => {
        progMap[p.assignment_id] = p;
      });

      const formatted = combinedList.map((a: any) => ({
        ...a,
        progress: progMap[a.id] || { status: 'not_started', score: 0 },
      }));

      setAssignedMaterials(formatted);
    } catch (err) {
      console.error('Error fetching student data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinClassByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCodeInput.trim() || !user) return;

    setJoinMessage(null);
    try {
      // Find class by join code
      const { data: cls, error: clsErr } = await supabase
        .from('classes')
        .select('*')
        .eq('code', joinCodeInput.trim().toUpperCase())
        .single();

      if (clsErr || !cls) {
        setJoinMessage({ type: 'error', text: 'Mã lớp không hợp lệ. Vui lòng kiểm tra lại.' });
        return;
      }

      // Join class
      const { error: joinErr } = await supabase.from('class_members').insert({
        class_id: cls.id,
        student_id: user.id,
      });

      if (joinErr) {
        if (joinErr.code === '23505') {
          setJoinMessage({ type: 'error', text: 'Bạn đã tham gia lớp học này rồi!' });
        } else {
          throw joinErr;
        }
        return;
      }

      setJoinMessage({ type: 'success', text: `Chúc mừng! Bạn đã tham gia lớp "${cls.name}" thành công!` });
      setJoinCodeInput('');
      fetchStudentData();
    } catch (err: any) {
      setJoinMessage({ type: 'error', text: err.message || 'Lỗi khi gia nhập lớp' });
    }
  };

  const handleOpenMaterialPlayer = (ass: Assignment) => {
    setActiveMaterial(ass);
    setIsPlaying(true);
    setStartTime(Date.now());
  };

  const handleCompleteMaterial = async () => {
    if (!activeMaterial || !user || !startTime) return;
    const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);

    try {
      const { error } = await supabase.from('student_progress').upsert(
        {
          assignment_id: activeMaterial.id,
          student_id: user.id,
          status: 'completed',
          score: 100,
          completion_time_seconds: elapsedSeconds,
          completed_at: new Date().toISOString(),
        },
        { onConflict: 'assignment_id,student_id' }
      );

      if (error) throw error;
      alert('Tuyệt vời! Bạn đã hoàn thành bài học/game!');
      setIsPlaying(false);
      setActiveMaterial(null);
      fetchStudentData();
    } catch (err: any) {
      alert('Không thể lưu tiến độ: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Student Banner */}
      <div className="student-gradient-bg p-6 sm:p-8 rounded-3xl text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full uppercase border border-white/30">
            Giao Diện Học Sinh
          </span>
          <h1 className="text-3xl font-extrabold font-display mt-2">
            Chào mừng em, {profile?.full_name || 'Học sinh'}! 👋
          </h1>
          <p className="text-sky-100 text-sm mt-1 max-w-xl">
            {enrolledClasses.length > 0
              ? `Đã tham gia ${enrolledClasses.length} lớp học: ${enrolledClasses.map((c) => c.name).join(', ')}`
              : 'Hãy nhập Mã Gia Nhập Lớp (Join Code) do thầy cô cung cấp để tham gia lớp học ngay nhé!'}
          </p>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-100 flex flex-wrap gap-1">
        <button
          onClick={() => setActiveTab('home')}
          className={`flex items-center space-x-2 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all ${
            activeTab === 'home' ? 'bg-sky-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Home className="w-4 h-4" />
          <span>🏠 Trang Chủ</span>
        </button>

        <button
          onClick={() => setActiveTab('daily_tasks')}
          className={`flex items-center space-x-2 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all ${
            activeTab === 'daily_tasks' ? 'bg-sky-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <CalendarCheck className="w-4 h-4" />
          <span>📚 Nhiệm Vụ Hôm Nay</span>
        </button>

        <button
          onClick={() => setActiveTab('assignments')}
          className={`flex items-center space-x-2 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all ${
            activeTab === 'assignments' ? 'bg-sky-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <BookOpenCheck className="w-4 h-4" />
          <span>📝 Bài Tập</span>
        </button>

        <button
          onClick={() => setActiveTab('games')}
          className={`flex items-center space-x-2 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all ${
            activeTab === 'games' ? 'bg-amber-500 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Gamepad2 className="w-4 h-4" />
          <span>🎮 Trò Chơi</span>
        </button>

        <button
          onClick={() => setActiveTab('materials')}
          className={`flex items-center space-x-2 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all ${
            activeTab === 'materials' ? 'bg-sky-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>📖 Học Liệu</span>
        </button>

        <button
          onClick={() => setActiveTab('results')}
          className={`flex items-center space-x-2 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all ${
            activeTab === 'results' ? 'bg-sky-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>📊 Kết Quả & Tiến Bộ</span>
        </button>

        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`flex items-center space-x-2 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all ${
            activeTab === 'leaderboard' ? 'bg-sky-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Trophy className="w-4 h-4" />
          <span>🏆 Bảng Xếp Hạng</span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center space-x-2 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all ${
            activeTab === 'profile' ? 'bg-sky-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <User className="w-4 h-4" />
          <span>👤 Hồ Sơ</span>
        </button>
      </div>

      {/* Render Active View */}
      {activeTab === 'home' && (
        <div className="space-y-8">
          {/* 🌟 KidsMind Inspired 3D Visual Hero Banner */}
          <KidsMindHero
            studentName={profile?.full_name || 'Học sinh'}
            onNavigateTab={(tab) => setActiveTab(tab as any)}
          />

          {/* Join Class Box */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2 font-display">
              <PlusCircle className="w-5 h-5 text-sky-600" />
              <span>Gia Nhập Lớp Học Bằng Mã (Join Code)</span>
            </h3>

            <form onSubmit={handleJoinClassByCode} className="flex gap-2">
              <input
                type="text"
                value={joinCodeInput}
                onChange={(e) => setJoinCodeInput(e.target.value)}
                placeholder="Nhập mã lớp 6 ký tự (vd: ABC123)..."
                className="flex-1 px-4 py-3 rounded-2xl border border-slate-200 text-sm font-mono uppercase font-bold focus:ring-2 focus:ring-sky-500 bg-slate-50"
                required
              />
              <button
                type="submit"
                className="bg-sky-600 hover:bg-sky-700 text-white font-bold px-6 py-3 rounded-2xl text-sm shadow-md transition-all active:scale-95"
              >
                Gia Nhập Lớp
              </button>
            </form>

            {joinMessage && (
              <div
                className={`p-3 rounded-xl text-xs font-bold ${
                  joinMessage.type === 'success'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-100 text-rose-800 border border-rose-200'
                }`}
              >
                {joinMessage.text}
              </div>
            )}
          </div>

          {/* Assigned Materials & Games Hub for Student */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4">
            <h3 className="text-lg font-bold text-slate-900 font-display">
              Học Liệu & Game Giáo Dục Được Thầy Cô Giao ({assignedMaterials.length})
            </h3>

            {assignedMaterials.length === 0 ? (
              <div className="py-12 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-3xl">
                Chưa có học liệu hay game nào được giao cho lớp bạn.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {assignedMaterials.map((ass) => {
                  const isDone = ass.progress?.status === 'completed';
                  return (
                    <div
                      key={ass.id}
                      className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all flex justify-between items-center space-x-3"
                    >
                      <div>
                        <span className="text-[10px] uppercase font-bold bg-sky-100 text-sky-800 px-2 py-0.5 rounded">
                          {ass.material?.type}
                        </span>
                        <h4 className="font-bold text-slate-900 text-base mt-1">{ass.material?.title}</h4>
                        <span className="text-xs text-slate-500">Lớp: {ass.class?.name}</span>
                      </div>

                      <div>
                        {isDone ? (
                          <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1.5 rounded-full border border-emerald-200 flex items-center space-x-1">
                            <CheckCircle className="w-3.5 h-3.5" /> <span>Đã Xong</span>
                          </span>
                        ) : (
                          <button
                            onClick={() => handleOpenMaterialPlayer(ass)}
                            className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-md transition-all flex items-center space-x-1"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" /> <span>MỞ TRẢI NGHIỆM</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'daily_tasks' && <DailyTasksView />}
      {activeTab === 'assignments' && <AssignmentsView />}
      {activeTab === 'games' && <GamesView />}
      {activeTab === 'materials' && <MaterialsView />}
      {activeTab === 'results' && <ResultsProgressView />}
      {activeTab === 'leaderboard' && <StudentLeaderboard />}
      {activeTab === 'profile' && <StudentProfile />}

      {/* Interactive Game / Material Modal Player */}
      {isPlaying && activeMaterial && activeMaterial.material && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-md z-[9999] flex flex-col items-center justify-center p-2 sm:p-4">
          {/* FLOATING TOP-RIGHT PROMINENT EXIT BUTTON */}
          <button
            onClick={() => {
              if (document.fullscreenElement) {
                document.exitFullscreen().catch(() => {});
              }
              setIsPlaying(false);
            }}
            className="fixed top-4 right-4 z-[10000] bg-rose-600 hover:bg-rose-700 text-white font-black text-xs sm:text-sm px-6 py-3.5 rounded-full shadow-2xl border-4 border-white flex items-center space-x-2 transition-all transform hover:scale-105 active:scale-95 cursor-pointer uppercase tracking-wide"
          >
            <X className="w-6 h-6 text-white" />
            <span>QUAY TRỞ LẠI HỌC LIỆU</span>
          </button>

          <div className="bg-slate-900 rounded-3xl max-w-5xl w-full h-[90vh] shadow-2xl flex flex-col overflow-hidden border-2 border-slate-700 relative">
            <div className="p-4 bg-slate-900 text-white flex justify-between items-center pr-48">
              <div>
                <span className="text-xs text-amber-400 font-black uppercase tracking-wider">{activeMaterial.material.type}</span>
                <h3 className="font-extrabold text-base text-slate-100">{activeMaterial.material.title}</h3>
              </div>

              <button
                onClick={handleCompleteMaterial}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-5 py-2.5 rounded-2xl text-xs shadow-md border border-emerald-400 transition-all flex items-center space-x-1.5 active:scale-95 cursor-pointer"
              >
                <CheckCircle className="w-4 h-4" />
                <span>ĐÁNH DẤU HOÀN THÀNH</span>
              </button>
            </div>

            {/* Embedded Player */}
            <div className="flex-1 bg-black flex items-center justify-center relative overflow-hidden">
              {activeMaterial.material.type === 'game_iframe' ? (
                <iframe
                  src={activeMaterial.material.file_url}
                  className="w-full h-full border-0"
                  title={activeMaterial.material.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : activeMaterial.material.type === 'video' ? (
                <video
                  src={activeMaterial.material.file_url}
                  controls
                  autoPlay
                  className="max-h-full max-w-full rounded-xl shadow-2xl"
                />
              ) : (
                <iframe
                  src={activeMaterial.material.file_url}
                  className="w-full h-full border-0 bg-white"
                  title={activeMaterial.material.title}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
