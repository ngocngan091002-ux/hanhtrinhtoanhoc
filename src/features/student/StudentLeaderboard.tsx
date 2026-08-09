import React, { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import { useAuth } from '../auth/AuthContext';
import { LeaderboardEntry } from '../../types';
import { Trophy, Award, Medal, ShieldCheck } from 'lucide-react';

export const StudentLeaderboard: React.FC = () => {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [className, setClassName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchClassLeaderboard();
  }, [user]);

  const fetchClassLeaderboard = async () => {
    setLoading(true);
    try {
      // 1. Get student's active class
      const { data: memberData } = await supabase
        .from('class_members')
        .select('class_id, class:classes(name)')
        .eq('student_id', user?.id)
        .single();

      if (!memberData) {
        setLoading(false);
        return;
      }

      setClassName((memberData as any).class?.name || 'Lớp Học');

      // 2. Fetch leaderboard for this class strictly
      const { data, error } = await supabase
        .from('class_leaderboard')
        .select('*')
        .eq('class_id', memberData.class_id)
        .order('total_score', { ascending: false });

      if (error) throw error;
      setLeaderboard(data || []);
    } catch (err) {
      console.error('Error fetching student leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 flex items-center space-x-2 font-display">
            <Trophy className="w-7 h-7 text-amber-500" />
            <span>🏆 Bảng Xếp Hạng Lớp {className}</span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Bảng vinh danh các bạn học sinh nỗ lực nhất trong phạm vi lớp học!
          </p>
        </div>

        <div className="bg-amber-50 text-amber-800 text-xs font-bold px-3 py-1.5 rounded-full border border-amber-200 flex items-center space-x-1">
          <ShieldCheck className="w-4 h-4 text-amber-600" />
          <span>Học sinh thật trong lớp</span>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-400">Đang tải bảng xếp hạng...</div>
      ) : leaderboard.length === 0 ? (
        <div className="bg-white p-12 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-3xl">
          Chưa có dữ liệu xếp hạng. Bạn hãy là người nộp bài đầu tiên nhé!
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
          <div className="divide-y divide-slate-100">
            {leaderboard.map((item, idx) => {
              const rank = idx + 1;
              const isMe = item.student_id === user?.id;

              return (
                <div
                  key={item.student_id}
                  className={`p-4 sm:p-5 flex items-center justify-between transition-all ${
                    isMe
                      ? 'bg-sky-50/80 border-l-4 border-l-sky-600 font-bold'
                      : rank === 1
                      ? 'bg-amber-50/50'
                      : rank === 2
                      ? 'bg-slate-50/50'
                      : 'hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center font-black text-lg shrink-0">
                      {rank === 1 && <span className="text-2xl">🥇</span>}
                      {rank === 2 && <span className="text-2xl">🥈</span>}
                      {rank === 3 && <span className="text-2xl">🥉</span>}
                      {rank > 3 && <span className="text-slate-400 font-mono text-sm">#{rank}</span>}
                    </div>

                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-sky-100 text-sky-700 font-bold flex items-center justify-center text-base border border-sky-200">
                        {item.student_name?.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-base flex items-center space-x-2">
                          <span>{item.student_name}</span>
                          {isMe && (
                            <span className="bg-sky-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                              Bạn
                            </span>
                          )}
                        </h4>
                        <span className="text-xs text-slate-500">
                          {item.completed_tasks_count} nhiệm vụ • {item.total_assignments_done} bài nộp
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xl font-black text-amber-600 font-display">
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
