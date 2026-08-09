import React, { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import { useAuth } from '../auth/AuthContext';
import { MathClass, StudentAnalytics, Submission, Assignment } from '../../types';
import { analyzeStudentWeaknesses } from '../../config/gemini';
import { BrainCircuit, Sparkles, UserCheck, AlertCircle, RefreshCw, Clock, CheckCircle2 } from 'lucide-react';

interface AIAnalyticsViewProps {
  currentClass?: MathClass | null;
}

const LOCAL_ASSIGNMENTS_KEY = 'hanhtrinhtoanhoc_local_assignments';
const LOCAL_SUBMISSIONS_KEY = 'hanhtrinhtoanhoc_local_submissions';

export const AIAnalyticsView: React.FC<AIAnalyticsViewProps> = ({ currentClass }) => {
  const { user, profile } = useAuth();
  const [students, setStudents] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<Record<string, StudentAnalytics>>({});
  const [loading, setLoading] = useState(false);
  const [analyzingStudentId, setAnalyzingStudentId] = useState<string | null>(null);

  useEffect(() => {
    fetchClassStudents();
  }, [currentClass]);

  const getLocalAssignments = (): Assignment[] => {
    try {
      const raw = localStorage.getItem(LOCAL_ASSIGNMENTS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  };

  const getLocalSubmissions = (): Submission[] => {
    try {
      const raw = localStorage.getItem(LOCAL_SUBMISSIONS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  };

  const fetchClassStudents = async () => {
    setLoading(true);
    const localSubs = getLocalSubmissions();
    const localAss = getLocalAssignments();

    try {
      let studentList: any[] = [];
      if (currentClass) {
        const { data: members } = await supabase
          .from('class_members')
          .select('student_id, student:profiles(*)')
          .eq('class_id', currentClass.id);

        studentList = (members || []).map((m: any) => m.student).filter(Boolean);
      }

      // Add student profiles from local submissions if missing
      const studentMap = new Map<string, any>();
      studentList.forEach((s) => studentMap.set(s.id, s));

      localSubs.forEach((sub) => {
        if (!studentMap.has(sub.student_id)) {
          studentMap.set(sub.student_id, {
            id: sub.student_id,
            full_name: sub.student_name || profile?.full_name || 'Học sinh Nguyễn Thị Ngọc Ngân',
            email: user?.email || 'ngocngan091002@gmail.com',
          });
        }
      });

      const finalStudents = Array.from(studentMap.values());
      setStudents(finalStudents);

      // Fetch existing AI analytics from DB
      let aiData: any[] = [];
      if (currentClass) {
        const { data } = await supabase
          .from('ai_student_analytics')
          .select('*')
          .eq('class_id', currentClass.id);
        aiData = data || [];
      } else {
        const { data } = await supabase.from('ai_student_analytics').select('*');
        aiData = data || [];
      }

      const analyticsMap: Record<string, StudentAnalytics> = {};
      (aiData || []).forEach((item: StudentAnalytics) => {
        analyticsMap[item.student_id] = item;
      });
      setAnalytics(analyticsMap);
    } catch (err) {
      console.error('Error fetching AI analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRunAIAnalysis = async (student: any) => {
    setAnalyzingStudentId(student.id);

    try {
      const localSubs = getLocalSubmissions().filter((s) => s.student_id === student.id);
      const localAss = getLocalAssignments();
      const assMap = new Map<string, Assignment>();
      localAss.forEach((a) => assMap.set(a.id, a));

      // Fetch DB submissions
      const { data: dbSubs } = await supabase
        .from('submissions')
        .select('*, assignment:assignments(*)')
        .eq('student_id', student.id);

      const mergedMap = new Map<string, any>();
      localSubs.forEach((sub) => {
        const parentAss = assMap.get(sub.assignment_id);
        mergedMap.set(sub.id, {
          ...sub,
          assignment_title: parentAss?.title || 'phép trừ trong phạm vi 20',
          questions_json: parentAss?.questions_json || [],
          duration_minutes: parentAss?.duration_minutes || 30,
        });
      });

      (dbSubs || []).forEach((sub: any) => {
        mergedMap.set(sub.id, {
          ...sub,
          assignment_title: sub.assignment?.title || 'phép trừ trong phạm vi 20',
          questions_json: sub.assignment?.questions_json || [],
          duration_minutes: sub.assignment?.duration_minutes || 30,
        });
      });

      const allSubmissions = Array.from(mergedMap.values());

      // Call Gemini AI analysis with real time & accuracy data
      const result = await analyzeStudentWeaknesses(student.full_name, allSubmissions);

      const newAnalytics: StudentAnalytics = {
        id: 'ai_' + student.id,
        class_id: currentClass?.id || 'class_1',
        student_id: student.id,
        weak_topics: result.weak_topics || [],
        recommendations: result.recommendations || '',
        accuracy_rate: result.accuracy_rate || '100%',
        completion_speed: result.completion_speed || 'Nhanh',
        updated_at: new Date().toISOString(),
      };

      setAnalytics((prev) => ({
        ...prev,
        [student.id]: newAnalytics,
      }));

      // Try upserting into DB
      if (currentClass) {
        try {
          await supabase.from('ai_student_analytics').upsert(
            {
              class_id: currentClass.id,
              student_id: student.id,
              weak_topics: result.weak_topics,
              recommendations: result.recommendations,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'class_id,student_id' }
          );
        } catch (e) {}
      }
    } catch (err: any) {
      alert('Lỗi phân tích AI: ' + err.message);
    } finally {
      setAnalyzingStudentId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center space-x-2 font-display">
            <BrainCircuit className="w-7 h-7 text-sky-600" />
            <span>AI Phân Tích Năng Lực & Dạng Toán Học Sinh Yếu</span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Phân tích chuyên sâu dựa trên **thời gian làm bài thực tế**, **tỉ lệ câu trả lời đúng/sai** và lịch sử làm bài.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="py-8 text-center text-slate-400 text-sm">Đang tải danh sách phân tích AI...</div>
      ) : students.length === 0 ? (
        <div className="bg-white p-12 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
          Lớp chưa có học sinh nào để AI phân tích.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {students.map((st) => {
            const studentAi = analytics[st.id];
            const isAnalyzing = analyzingStudentId === st.id;

            return (
              <div key={st.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-base">
                      {st.full_name?.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">{st.full_name}</h3>
                      <p className="text-xs text-slate-500 font-mono">{st.email}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRunAIAnalysis(st)}
                    disabled={isAnalyzing}
                    className="bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold px-3.5 py-2 rounded-xl text-xs border border-sky-200 transition-colors flex items-center space-x-1.5 shadow-xs"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
                    <span>{isAnalyzing ? 'AI Đang Phân Tích...' : '✨ Phân Tích AI'}</span>
                  </button>
                </div>

                {studentAi ? (
                  <div className="space-y-3 pt-2 border-t border-slate-100">
                    {/* Stats bar */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center space-x-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <div>
                          <div className="text-[10px] font-bold text-emerald-800 uppercase">Tỉ Lệ Làm Đúng</div>
                          <div className="font-extrabold text-emerald-950 text-sm">{studentAi.accuracy_rate || '100%'}</div>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-sky-50 border border-sky-200 flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-sky-600 shrink-0" />
                        <div>
                          <div className="text-[10px] font-bold text-sky-800 uppercase">Thời Gian Làm Bài</div>
                          <div className="font-extrabold text-sky-950 text-sm">{studentAi.completion_speed || 'Nhanh'}</div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <span className="text-xs font-bold text-rose-700 flex items-center gap-1 mb-1">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                        Nội dung còn yếu / cần lưu ý:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {Array.isArray(studentAi.weak_topics) && studentAi.weak_topics.length > 0 ? (
                          studentAi.weak_topics.map((tp, idx) => (
                            <span
                              key={idx}
                              className="bg-rose-50 text-rose-800 text-xs px-2.5 py-1 rounded-lg border border-rose-200 font-medium"
                            >
                              {tp}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-emerald-600 font-bold">Học sinh chưa bộc lộ lỗ hổng kiến thức.</span>
                        )}
                      </div>
                    </div>

                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1 mb-1">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        Đánh giá & Gợi ý hướng hỗ trợ từ AI:
                      </span>
                      <p className="text-xs text-slate-700 leading-relaxed font-medium">{studentAi.recommendations}</p>
                    </div>
                  </div>
                ) : (
                  <div className="py-4 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                    Chưa có báo cáo AI. Hãy bấm nút "✨ Phân Tích AI" để đánh giá học sinh này!
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
