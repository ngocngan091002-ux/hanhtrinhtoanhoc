import React, { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import { useAuth } from '../auth/AuthContext';
import { Submission, MathClass, Assignment } from '../../types';
import { suggestGrading } from '../../config/gemini';
import { CheckCircle, Sparkles, User, FileCheck, AlertCircle, Award } from 'lucide-react';

interface GradingCenterProps {
  currentClass?: MathClass | null;
}

export const GradingCenter: React.FC<GradingCenterProps> = ({ currentClass }) => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>('');
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);

  // Grading form state
  const [score, setScore] = useState<number>(10);
  const [feedback, setFeedback] = useState<string>('');
  const [isGradingAI, setIsGradingAI] = useState(false);

  useEffect(() => {
    if (currentClass) fetchClassAssignments();
  }, [currentClass]);

  useEffect(() => {
    if (selectedAssignmentId) fetchSubmissions(selectedAssignmentId);
  }, [selectedAssignmentId]);

  const fetchClassAssignments = async () => {
    if (!currentClass) return;
    try {
      const { data, error } = await supabase
        .from('assignments')
        .select('*')
        .eq('class_id', currentClass.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAssignments(data || []);
      if (data && data.length > 0) setSelectedAssignmentId(data[0].id);
    } catch (err) {
      console.error('Error fetching assignments:', err);
    }
  };

  const fetchSubmissions = async (assignmentId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('submissions')
        .select('*, student:profiles(full_name, email)')
        .eq('assignment_id', assignmentId)
        .order('submitted_at', { ascending: false });

      if (error) throw error;

      const formatted = (data || []).map((s: any) => ({
        ...s,
        student_name: s.student?.full_name || 'Học sinh',
      }));

      setSubmissions(formatted);
      if (formatted.length > 0) handleSelectSubmission(formatted[0]);
      else setSelectedSubmission(null);
    } catch (err) {
      console.error('Error fetching submissions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSubmission = (sub: Submission) => {
    setSelectedSubmission(sub);
    setScore(sub.final_score ?? sub.ai_suggested_score ?? 10);
    setFeedback(sub.final_feedback ?? sub.ai_suggested_feedback ?? '');
  };

  const handleRequestAIGrading = async () => {
    if (!selectedSubmission) return;
    const currentAssignment = assignments.find((a) => a.id === selectedAssignmentId);
    if (!currentAssignment) return;

    setIsGradingAI(true);
    try {
      const result = await suggestGrading(currentAssignment.questions_json || [], selectedSubmission.answers_json);

      // Save AI suggestion to DB
      const { error } = await supabase
        .from('submissions')
        .update({
          ai_suggested_score: result.suggested_score,
          ai_suggested_feedback: result.suggested_feedback,
        })
        .eq('id', selectedSubmission.id);

      if (error) throw error;

      setScore(result.suggested_score);
      setFeedback(result.suggested_feedback);
      fetchSubmissions(selectedAssignmentId);
    } catch (err: any) {
      alert('Không thể chạy AI chấm bài: ' + err.message);
    } finally {
      setIsGradingAI(false);
    }
  };

  const handleFinalizeGrading = async () => {
    if (!selectedSubmission || !user) return;

    try {
      const { error } = await supabase
        .from('submissions')
        .update({
          final_score: score,
          final_feedback: feedback,
          is_finalized: true,
          finalized_at: new Date().toISOString(),
          finalized_by: user.id,
        })
        .eq('id', selectedSubmission.id);

      if (error) throw error;

      alert('Đã CHỐT điểm và nhận xét thành công! Học sinh đã có thể xem kết quả.');
      fetchSubmissions(selectedAssignmentId);
    } catch (err: any) {
      alert('Không thể chốt điểm: ' + err.message);
    }
  };

  if (!currentClass) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-slate-100 text-center text-slate-500">
        Vui lòng chọn 1 lớp học để thực hiện chấm bài và chốt điểm.
      </div>
    );
  }

  const currentAssignmentObj = assignments.find((a) => a.id === selectedAssignmentId);

  return (
    <div className="space-y-6">
      {/* Top Controls */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center space-x-2 font-display">
            <Award className="w-7 h-7 text-amber-500" />
            <span>Trung Tâm Chấm Bài & Chốt Điểm</span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            AI gợi ý điểm + nhận xét $\rightarrow$ Giáo viên kiểm tra/sửa $\rightarrow$ Giáo viên **CHỐT** $\rightarrow$ Học sinh mới xem được.
          </p>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Chọn bài tập:</label>
          <select
            value={selectedAssignmentId}
            onChange={(e) => setSelectedAssignmentId(e.target.value)}
            className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-bold bg-slate-50 focus:outline-none"
          >
            {assignments.map((a) => (
              <option key={a.id} value={a.id}>
                {a.title} ({a.type === 'weekly_test' ? 'Bài Kiểm Tra' : 'Bài Về Nhà'})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Submissions List */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
          <h3 className="text-base font-bold text-slate-800 flex justify-between items-center">
            <span>Danh Sách Học Sinh Nộp Bài</span>
            <span className="text-xs bg-sky-100 text-sky-800 font-bold px-2 py-0.5 rounded-full">
              {submissions.length} bài nộp
            </span>
          </h3>

          {loading ? (
            <div className="py-8 text-center text-slate-400 text-sm">Đang tải bài nộp...</div>
          ) : submissions.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-xl">
              Chưa có học sinh nào nộp bài tập này.
            </div>
          ) : (
            <div className="space-y-2">
              {submissions.map((sub) => {
                const isSelected = selectedSubmission?.id === sub.id;
                return (
                  <button
                    key={sub.id}
                    onClick={() => handleSelectSubmission(sub)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center justify-between ${
                      isSelected
                        ? 'border-amber-500 bg-amber-50/70 text-slate-900 shadow-sm font-semibold'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-sm">{sub.student_name}</div>
                      <div className="text-[11px] text-slate-500">
                        Nộp lúc: {new Date(sub.submitted_at).toLocaleTimeString('vi-VN')} {new Date(sub.submitted_at).toLocaleDateString('vi-VN')}
                      </div>
                    </div>

                    <div>
                      {sub.is_finalized ? (
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-1 rounded-full border border-emerald-200">
                          Đã Chốt: {sub.final_score}đ
                        </span>
                      ) : (
                        <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-1 rounded-full border border-amber-200">
                          Chờ Duyệt
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Detailed Grading View */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-6">
          {selectedSubmission ? (
            <div className="space-y-6">
              {/* Student Header */}
              <div className="flex justify-between items-center p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-lg">
                    {selectedSubmission.student_name?.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">{selectedSubmission.student_name}</h3>
                    <p className="text-xs text-slate-500">
                      Trạng thái: {selectedSubmission.is_finalized ? '🟢 Đã chốt kết quả (Học sinh đã nhìn thấy)' : '🟠 Chưa chốt (Học sinh chưa thấy điểm)'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleRequestAIGrading}
                  disabled={isGradingAI}
                  className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-md flex items-center space-x-1.5"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isGradingAI ? 'AI Đang Chấm...' : 'Yêu Cầu AI Gợi Ý Chấm'}</span>
                </button>
              </div>

              {/* Student Answers Detail */}
              <div>
                <h4 className="font-bold text-sm text-slate-800 mb-3">Chi Tiết Câu Trả Lời Của Học Sinh:</h4>
                <div className="space-y-3">
                  {currentAssignmentObj?.questions_json?.map((q, idx) => {
                    const studentAns = selectedSubmission.answers_json?.[q.id];
                    const isCorrect = studentAns === q.correct_answer;
                    return (
                      <div key={q.id || idx} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1.5">
                        <div className="flex justify-between text-xs font-bold">
                          <span>Câu {idx + 1}: {q.prompt}</span>
                          <span className={isCorrect ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>
                            {isCorrect ? '✓ Đúng' : '✗ Chưa đúng'}
                          </span>
                        </div>

                        <div className="text-xs text-slate-600">
                          Học sinh chọn: <span className="font-bold text-slate-900">{studentAns || '(Chưa làm)'}</span> | Đáp án đúng: <span className="font-bold text-emerald-700">{q.correct_answer}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* AI Suggestion Box */}
              {(selectedSubmission.ai_suggested_score !== undefined || selectedSubmission.ai_suggested_feedback) && (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-1 text-xs">
                  <div className="font-bold text-amber-900 flex items-center space-x-1">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <span>AI Đề Xuất Chấm: {selectedSubmission.ai_suggested_score} điểm</span>
                  </div>
                  <p className="text-amber-800 font-medium">"{selectedSubmission.ai_suggested_feedback}"</p>
                </div>
              )}

              {/* Teacher Decision Form */}
              <div className="p-5 rounded-2xl bg-sky-50/60 border border-sky-100 space-y-4">
                <h4 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-sky-600" />
                  <span>Giáo Viên Quyết Định Cuối Cùng & CHỐT Bài</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Điểm số chính thức (0 - 10):</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="10"
                      value={score}
                      onChange={(e) => setScore(Number(e.target.value))}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Nhận xét của thầy cô dành cho học sinh:</label>
                    <input
                      type="text"
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      placeholder="Nhập lời khen ngợi hoặc lưu ý dành cho con..."
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleFinalizeGrading}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3 rounded-xl shadow-lg text-sm transition-all transform active:scale-95 flex items-center space-x-2"
                  >
                    <CheckCircle className="w-5 h-5" />
                    <span>CHỐT KẾT QUẢ & PHÁT HÀNH CHO HỌC SINH</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-16 text-center text-slate-400 text-sm">
              Vui lòng chọn 1 học sinh ở bảng bên trái để xem bài nộp và duyệt điểm.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
