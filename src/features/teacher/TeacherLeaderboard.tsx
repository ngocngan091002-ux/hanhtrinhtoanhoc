import React, { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import { LeaderboardEntry, MathClass } from '../../types';
import { Trophy, Award, Medal, Flame } from 'lucide-react';

interface TeacherLeaderboardProps {
  currentClass?: MathClass | null;
}

export const TeacherLeaderboard: React.FC<TeacherLeaderboardProps> = ({ currentClass }) => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (currentClass) fetchLeaderboard();
  }, [currentClass]);

  const fetchLeaderboard = async () => {
    if (!currentClass) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('class_leaderboard')
        .select('*')
        .eq('class_id', currentClass.id)
        .order('total_score', { ascending: false });

      if (error) throw error;
      setLeaderboard(data || []);
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!currentClass) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-slate-100 text-center text-slate-500">
        Vui lòng chọn 1 lớp học để xem bảng xếp hạng.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center space-x-2 font-display">
            <Trophy className="w-7 h-7 text-amber-500" />
            <span>Bảng Xếp Hạng Lớp {currentClass.name}</span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Dữ liệu xếp hạng tính dựa trên nhiệm vụ hoàn thành và tổng điểm bài nộp đã được Giáo viên CHỐT.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="py-8 text-center text-slate-400 text-sm">Đang tính toán bảng xếp hạng...</div>
      ) : leaderboard.length === 0 ? (
        <div className="bg-white p-12 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
          Chưa có dữ liệu học tập thực tế để lập bảng xếp hạng.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
          <div className="divide-y divide-slate-100">
            {leaderboard.map((item, idx) => {
              const rank = idx + 1;
              return (
                <div
                  key={item.student_id}
                  className={`p-4 flex items-center justify-between transition-colors ${
                    rank === 1
                      ? 'bg-amber-50/50'
                      : rank === 2
                      ? 'bg-slate-50/50'
                      : rank === 3
                      ? 'bg-orange-50/30'
                      : 'hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    {/* Rank Badge */}
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-base shrink-0">
                      {rank === 1 && <span className="text-2xl">🥇</span>}
                      {rank === 2 && <span className="text-2xl">🥈</span>}
                      {rank === 3 && <span className="text-2xl">🥉</span>}
                      {rank > 3 && <span className="text-slate-400 font-mono">#{rank}</span>}
                    </div>

                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-sky-100 text-sky-700 font-bold flex items-center justify-center text-base">
                        {item.student_name?.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-base">{item.student_name}</h4>
                        <span className="text-xs text-slate-500">
                          {item.completed_tasks_count} nhiệm vụ hoàn thành • {item.total_assignments_done} bài đã nộp
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xl font-extrabold text-amber-600 font-display">
                      {item.total_score} <span className="text-xs text-slate-400 font-normal">điểm</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
