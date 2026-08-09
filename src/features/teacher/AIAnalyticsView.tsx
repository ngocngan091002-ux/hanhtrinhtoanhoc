import React, { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import { MathClass, StudentAnalytics } from '../../types';
import { analyzeStudentWeaknesses } from '../../config/gemini';
import { BrainCircuit, Sparkles, UserCheck, AlertCircle, RefreshCw } from 'lucide-react';

interface AIAnalyticsViewProps {
  currentClass?: MathClass | null;
}

export const AIAnalyticsView: React.FC<AIAnalyticsViewProps> = ({ currentClass }) => {
  const [students, setStudents] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<Record<string, StudentAnalytics>>({});
  const [loading, setLoading] = useState(false);
  const [analyzingStudentId, setAnalyzingStudentId] = useState<string | null>(null);

  useEffect(() => {
    if (currentClass) fetchClassStudents();
  }, [currentClass]);

  const fetchClassStudents = async () => {
    if (!currentClass) return;
    setLoading(true);
    try {
      // Fetch students in class
      const { data: members, error: mErr } = await supabase
        .from('class_members')
        .select('student_id, student:profiles(*)')
        .eq('class_id', currentClass.id);

      if (mErr) throw mErr;
      const studentList = (members || []).map((m: any) => m.student).filter(Boolean);
      setStudents(studentList);

      // Fetch existing AI analytics
      const { data: aiData, error: aiErr } = await supabase
        .from('ai_student_analytics')
        .select('*')
        .eq('class_id', currentClass.id);

      if (aiErr) throw aiErr;
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
    if (!currentClass) return;
    setAnalyzingStudentId(student.id);

    try {
      // Fetch student's real submissions
      const { data: subs } = await supabase
        .from('submissions')
        .select('*, assignment:assignments(title, type)')
        .eq('student_id', student.id);

      // Call Gemini AI analysis
      const result = await analyzeStudentWeaknesses(student.full_name, subs || []);

      // Upsert into Supabase AI analytics table
      const { data: upserted, error } = await supabase
        .from('ai_student_analytics')
        .upsert(
          {
            class_id: currentClass.id,
            student_id: student.id,
            weak_topics: result.weak_topics,
            recommendations: result.recommendations,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'class_id,student_id' }
        )
        .select()
        .single();

      if (error) throw error;

      if (upserted) {
        setAnalytics((prev) => ({
          ...prev,
          [student.id]: upserted as StudentAnalytics,
        }));
      }
    } catch (err: any) {
      alert('Lỗi phân tích AI: ' + err.message);
    } finally {
      setAnalyzingStudentId(null);
    }
  };

  if (!currentClass) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-slate-100 text-center text-slate-500">
        Vui lòng chọn 1 lớp học để xem báo cáo phân tích AI.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center space-x-2 font-display">
            <BrainCircuit className="w-7 h-7 text-sky-600" />
            <span>AI Tổng Hợp Kiến Thức Cần Lưu Ý</span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            AI tự động phân tích dữ liệu bài nộp thực tế để nhận diện các dạng toán học sinh còn chưa vững.
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
                    className="bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold px-3 py-1.5 rounded-xl text-xs border border-sky-200 transition-colors flex items-center space-x-1"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
                    <span>{isAnalyzing ? 'Đang Phân Tích...' : 'Cập Nhật AI'}</span>
                  </button>
                </div>

                {studentAi ? (
                  <div className="space-y-3 pt-2 border-t border-slate-100">
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

                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1 mb-1">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        Gợi ý hướng hỗ trợ từ AI:
                      </span>
                      <p className="text-xs text-slate-600">{studentAi.recommendations}</p>
                    </div>
                  </div>
                ) : (
                  <div className="py-4 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                    Chưa có báo cáo AI. Hãy bấm nút "Cập Nhật AI" để phân tích học sinh này!
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
