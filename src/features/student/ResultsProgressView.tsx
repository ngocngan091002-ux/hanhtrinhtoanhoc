import React, { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import { useAuth } from '../auth/AuthContext';
import { Submission } from '../../types';
import { Award, CheckCircle2, Clock, MessageSquare, TrendingUp } from 'lucide-react';

export const ResultsProgressView: React.FC = () => {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchResults();
  }, [user]);

  const fetchResults = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('submissions')
        .select('*, assignment:assignments(title, type)')
        .eq('student_id', user?.id)
        .order('submitted_at', { ascending: false });

      if (error) throw error;

      const formatted = (data || []).map((s: any) => ({
        ...s,
        assignment_title: s.assignment?.title || 'Bài tập',
      }));

      setSubmissions(formatted);
    } catch (err) {
      console.error('Error fetching results:', err);
    } finally {
      setLoading(false);
    }
  };

  const finalizedSubmissions = submissions.filter((s) => s.is_finalized);
  const averageScore =
    finalizedSubmissions.length > 0
      ? (finalizedSubmissions.reduce((acc, curr) => acc + (curr.final_score || 0), 0) / finalizedSubmissions.length).toFixed(1)
      : '0.0';

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
            <div className="text-2xl font-black text-sky-600 font-display">{finalizedSubmissions.length}</div>
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
                        ✓ Giáo Viên Đã Chốt
                      </span>
                    </div>
                  ) : (
                    <div className="bg-amber-50 text-amber-800 text-xs font-bold px-3 py-1.5 rounded-2xl border border-amber-200 flex items-center space-x-1">
                      <Clock className="w-4 h-4 text-amber-500" />
                      <span>Bài nộp đang được thầy cô kiểm tra & chốt điểm</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Show feedback only if finalized */}
              {sub.is_finalized && sub.final_feedback && (
                <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-100 text-slate-800 text-xs space-y-1">
                  <div className="font-extrabold text-sky-900 flex items-center space-x-1.5">
                    <MessageSquare className="w-4 h-4 text-sky-600" />
                    <span>Lời Nhắn Của Thầy Cô:</span>
                  </div>
                  <p className="text-slate-700 font-medium italic">"{sub.final_feedback}"</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
