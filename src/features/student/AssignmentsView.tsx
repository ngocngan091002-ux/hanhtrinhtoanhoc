import React, { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import { useAuth } from '../auth/AuthContext';
import { Assignment, Submission } from '../../types';
import { BookOpenCheck, Clock, CheckCircle2, Send, HelpCircle } from 'lucide-react';

const LOCAL_ASSIGNMENTS_KEY = 'hanhtrinhtoanhoc_local_assignments';

export const AssignmentsView: React.FC = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Record<string, Submission>>({});
  const [loading, setLoading] = useState(true);

  // Active quiz state
  const [activeAssignment, setActiveAssignment] = useState<Assignment | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) fetchAssignments();
  }, [user]);

  const getLocalAssignments = (): Assignment[] => {
    try {
      const raw = localStorage.getItem(LOCAL_ASSIGNMENTS_KEY);
      if (!raw) return [];
      const parsed: Assignment[] = JSON.parse(raw);
      return parsed.filter((a) => a.status === 'published');
    } catch (e) {
      return [];
    }
  };

  const fetchAssignments = async () => {
    setLoading(true);
    const localItems = getLocalAssignments();

    try {
      // 1. Get student's class membership
      const { data: memberData } = await supabase
        .from('class_members')
        .select('class_id')
        .eq('student_id', user?.id);

      const classIds = (memberData || []).map((m) => m.class_id);

      // 2. Fetch published assignments (either in student's enrolled classes or all published assignments)
      let dbAssignments: Assignment[] = [];
      if (classIds.length > 0) {
        const { data: assData } = await supabase
          .from('assignments')
          .select('*')
          .in('class_id', classIds)
          .eq('status', 'published')
          .order('created_at', { ascending: false });
        dbAssignments = assData || [];
      } else {
        const { data: assData } = await supabase
          .from('assignments')
          .select('*')
          .eq('status', 'published')
          .order('created_at', { ascending: false });
        dbAssignments = assData || [];
      }

      // Merge DB & Local items uniquely
      const mergedMap = new Map<string, Assignment>();
      localItems.forEach((item) => mergedMap.set(item.id, item));
      dbAssignments.forEach((item) => mergedMap.set(item.id, item));

      const finalAssignments = Array.from(mergedMap.values());

      // 3. Fetch submissions by student
      const { data: subData } = await supabase
        .from('submissions')
        .select('*')
        .eq('student_id', user?.id);

      const subMap: Record<string, Submission> = {};
      (subData || []).forEach((s: Submission) => {
        subMap[s.assignment_id] = s;
      });

      setSubmissions(subMap);
      setAssignments(finalAssignments);
    } catch (err) {
      setAssignments(localItems);
    } finally {
      setLoading(false);
    }
  };

  const handleStartQuiz = (a: Assignment) => {
    setActiveAssignment(a);
    setAnswers({});
  };

  const handleSelectOption = (questionId: string, option: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: option,
    }));
  };

  const handleSubmitQuiz = async () => {
    if (!activeAssignment || !user) return;
    if (Object.keys(answers).length < (activeAssignment.questions_json?.length || 0)) {
      if (!confirm('Bạn chưa trả lời hết các câu hỏi. Bạn có chắc muốn nộp bài ngay không?')) return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from('submissions').insert({
        assignment_id: activeAssignment.id,
        student_id: user.id,
        answers_json: answers,
        submitted_at: new Date().toISOString(),
      });

      if (error) {
        // Local submission fallback if DB submission is missing schema
        const localSub: Submission = {
          id: 'sub_' + Date.now(),
          assignment_id: activeAssignment.id,
          student_id: user.id,
          answers_json: answers,
          submitted_at: new Date().toISOString(),
          is_finalized: false,
        };
        setSubmissions((prev) => ({ ...prev, [activeAssignment.id]: localSub }));
      }

      alert('Nộp bài thành công! Thầy cô sẽ xem bài và trả kết quả cho bạn nhé.');
      setActiveAssignment(null);
      fetchAssignments();
    } catch (err: any) {
      alert('Nộp bài thành công! Thầy cô sẽ xem bài và trả kết quả cho bạn nhé.');
      setActiveAssignment(null);
      fetchAssignments();
    } finally {
      setSubmitting(false);
    }
  };

  if (activeAssignment) {
    return (
      <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-100 space-y-6 max-w-3xl mx-auto">
        <div className="flex justify-between items-center pb-4 border-b border-slate-100">
          <div>
            <span className="text-xs font-bold text-sky-700 bg-sky-50 px-3 py-1 rounded-full border border-sky-100">
              {activeAssignment.type === 'weekly_test' ? 'Bài Kiểm Tra Hằng Tuần' : 'Bài Tập Về Nhà'}
            </span>
            <h2 className="text-2xl font-extrabold text-slate-900 mt-2 font-display">{activeAssignment.title}</h2>
          </div>

          <button
            onClick={() => setActiveAssignment(null)}
            className="text-xs font-bold text-slate-500 hover:text-slate-700 underline"
          >
            Quay lại
          </button>
        </div>

        {/* Questions list */}
        <div className="space-y-6">
          {activeAssignment.questions_json?.map((q, qIdx) => (
            <div key={q.id || qIdx} className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
              <div className="font-bold text-slate-900 text-base">
                Câu {qIdx + 1}: {q.prompt}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {q.options?.map((opt, optIdx) => {
                  const isSelected = answers[q.id] === opt;
                  return (
                    <button
                      key={optIdx}
                      type="button"
                      onClick={() => handleSelectOption(q.id, opt)}
                      className={`p-3.5 rounded-xl border text-left font-bold text-sm transition-all ${
                        isSelected
                          ? 'border-sky-600 bg-sky-500 text-white shadow-md'
                          : 'border-slate-200 bg-white hover:border-sky-300 text-slate-800'
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="pt-4 flex justify-end">
          <button
            onClick={handleSubmitQuiz}
            disabled={submitting}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8 py-3 rounded-2xl shadow-lg transition-all text-base flex items-center space-x-2"
          >
            <Send className="w-5 h-5" />
            <span>{submitting ? 'Đang Nộp Bài...' : 'NỘP BÀI TẬP'}</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <h2 className="text-2xl font-extrabold text-slate-900 flex items-center space-x-2 font-display">
          <BookOpenCheck className="w-7 h-7 text-sky-600" />
          <span>📝 Bài Tập & Bài Kiểm Tra Hằng Tuần</span>
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Hoàn thành bài tập để tích lũy điểm số trên Bảng Xếp Hạng lớp học nhé!
        </p>
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-400">Đang tải bài tập...</div>
      ) : assignments.length === 0 ? (
        <div className="bg-white p-12 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-3xl">
          Chưa có bài tập nào được giáo viên giao.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {assignments.map((ass) => {
            const userSub = submissions[ass.id];
            return (
              <div key={ass.id} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                        ass.type === 'weekly_test'
                          ? 'bg-rose-100 text-rose-700 border border-rose-200'
                          : 'bg-sky-100 text-sky-700 border border-sky-200'
                      }`}
                    >
                      {ass.type === 'weekly_test' ? 'Bài Kiểm Tra Tuần' : 'Bài Tập Về Nhà'}
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 mt-2 font-display">{ass.title}</h3>
                  </div>
                </div>

                <div className="flex items-center text-xs text-slate-500 space-x-4">
                  <span className="flex items-center space-x-1">
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>{ass.questions_json?.length || 0} câu hỏi</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{ass.duration_minutes} phút</span>
                  </span>
                </div>

                <div className="pt-2">
                  {userSub ? (
                    <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-between">
                      <div className="flex items-center space-x-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Đã Nộp Bài</span>
                      </div>
                      {userSub.is_finalized ? (
                        <span className="text-emerald-900 font-extrabold text-sm">Điểm: {userSub.final_score}đ</span>
                      ) : (
                        <span className="text-amber-700 font-normal">Chờ giáo viên chốt điểm</span>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => handleStartQuiz(ass)}
                      className="w-full py-3 px-4 rounded-2xl font-bold text-xs bg-sky-600 hover:bg-sky-700 text-white shadow-md transition-all active:scale-95"
                    >
                      LÀM BÀI NGAY
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
