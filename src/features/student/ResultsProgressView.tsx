import React, { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import { useAuth } from '../auth/AuthContext';
import { Submission, Assignment } from '../../types';
import { Award, CheckCircle2, Clock, MessageSquare, TrendingUp } from 'lucide-react';

const LOCAL_ASSIGNMENTS_KEY = 'hanhtrinhtoanhoc_local_assignments';
const LOCAL_SUBMISSIONS_KEY = 'hanhtrinhtoanhoc_local_submissions';

export const ResultsProgressView: React.FC = () => {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchResults();
  }, [user]);

  const getLocalAssignmentsMap = (): Record<string, string> => {
    try {
      const raw = localStorage.getItem(LOCAL_ASSIGNMENTS_KEY);
      if (!raw) return {};
      const parsed: Assignment[] = JSON.parse(raw);
      const map: Record<string, string> = {};
      parsed.forEach((a) => {
        if (a.id) map[a.id] = a.title || 'Bài tập';
      });
      return map;
    } catch (e) {
      return {};
    }
  };

  const getLocalSubmissions = (studentId: string): Submission[] => {
    try {
      const raw = localStorage.getItem(LOCAL_SUBMISSIONS_KEY);
      if (!raw) return [];
      const parsed: Submission[] = JSON.parse(raw);
      return parsed.filter((s) => s.student_id === studentId);
    } catch (e) {
      return [];
    }
  };

  const fetchResults = async () => {
    setLoading(true);
    const assTitleMap = getLocalAssignmentsMap();
    const localSubs = getLocalSubmissions(user?.id || '');

    try {
      const { data, error } = await supabase
        .from('submissions')
        .select('*, assignment:assignments(title, type)')
        .eq('student_id', user?.id)
        .order('submitted_at', { ascending: false });

      let dbSubs: Submission[] = [];
      if (!error && data) {
        dbSubs = data.map((s: any) => ({
          ...s,
          assignment_title: s.assignment?.title || assTitleMap[s.assignment_id] || 'Bài tập toán học',
        }));
      }

      // Merge DB and Local submissions uniquely by id/assignment_id
      const mergedMap = new Map<string, Submission>();
      localSubs.forEach((item) => {
        mergedMap.set(item.id, {
          ...item,
          assignment_title: assTitleMap[item.assignment_id] || 'phép trừ trong phạm vi 20',
        });
      });
      dbSubs.forEach((item) => mergedMap.set(item.id, item));

      const finalSubs = Array.from(mergedMap.values());
      setSubmissions(finalSubs);
    } catch (err) {
      const formatted = localSubs.map((item) => ({
        ...item,
        assignment_title: assTitleMap[item.assignment_id] || 'phép trừ trong phạm vi 20',
      }));
      setSubmissions(formatted);
    } finally {
      setLoading(false);
    }
  };

  const finalizedSubmissions = submissions.filter((s) => s.is_finalized);
  const averageScore =
    finalizedSubmissions.length > 0
      ? (finalizedSubmissions.reduce((acc, curr) => acc + (curr.final_score || 0), 0) / finalizedSubmissions.length).toFixed(1)
      : '10.0';

  return (
    <div className="space-y-6">
      {/* Top Banner Stats */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 flex items-center space-x-2 font-display">
            <Award className="w-7 h-7 text-amber-500" />
            <span>📊 Kết Quả Học Tập & Tiến Bộ</span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Điểm số và lời nhận xét chân thành từ Thầy Cô sau khi đã được chốt kết quả.
          </p>
        </div>

        <div className="flex items-center space-x-4">
          <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 text-center">
            <div className="text-2xl font-black text-amber-600 font-display">{averageScore}</div>
            <div className="text-[11px] font-bold text-amber-800 uppercase">Điểm Trung Bình</div>
          </div>

          <div className="bg-sky-50 p-4 rounded-2xl border border-sky-200 text-center">
            <div className="text-2xl font-black text-sky-600 font-display">
              {finalizedSubmissions.length > 0 ? finalizedSubmissions.length : submissions.length}
            </div>
            <div className="text-[11px] font-bold text-sky-800 uppercase">Bài Đã Được Chốt</div>
          </div>
        </div>
      </div>

      {/* Submissions List */}
      {loading ? (
        <div className="py-12 text-center text-slate-400">Đang tải kết quả...</div>
      ) : submissions.length === 0 ? (
        <div className="bg-white p-12 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-3xl">
          Bạn chưa nộp bài tập nào. Hãy bắt đầu làm bài ở mục "📝 Bài tập" nhé!
        </div>
      ) : (
        <div className="space-y-4">
          {submissions.map((sub) => (
            <div key={sub.id} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 font-display">{sub.assignment_title}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Nộp lúc: {new Date(sub.submitted_at).toLocaleTimeString('vi-VN')} {new Date(sub.submitted_at).toLocaleDateString('vi-VN')}
                  </p>
                </div>

                <div>
                  {sub.is_finalized ? (
                    <div className="text-right">
                      <div className="text-2xl font-black text-emerald-600 font-display">
                        {sub.final_score} <span className="text-xs text-slate-400 font-normal">điểm</span>
                      </div>
                      <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        ✓ Giáo Viên Đã Chốt Kết Quả
                      </span>
                    </div>
                  ) : (
                    <div className="bg-amber-50 text-amber-800 text-xs font-bold px-3 py-1.5 rounded-2xl border border-amber-200 flex items-center space-x-1">
                      <Clock className="w-4 h-4 text-amber-500" />
                      <span>Bài nộp đang chờ thầy cô kiểm tra & chốt điểm</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Show teacher feedback */}
              {sub.is_finalized && sub.final_feedback && (
                <div className="p-4 rounded-2xl bg-sky-50/80 border border-sky-200 text-slate-800 text-xs space-y-1">
                  <div className="font-extrabold text-sky-900 flex items-center space-x-1.5">
                    <MessageSquare className="w-4 h-4 text-sky-600" />
                    <span>Lời Nhận Xét Của Thầy Cô:</span>
                  </div>
                  <p className="text-slate-700 font-medium italic text-sm">
                    "{sub.final_feedback}"
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
