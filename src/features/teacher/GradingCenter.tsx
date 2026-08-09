import React, { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import { useAuth } from '../auth/AuthContext';
import { Submission, MathClass, Assignment } from '../../types';
import { suggestGrading } from '../../config/gemini';
import { CheckCircle, Sparkles, User, FileCheck, AlertCircle, Award } from 'lucide-react';

interface GradingCenterProps {
  currentClass?: MathClass | null;
}

const LOCAL_ASSIGNMENTS_KEY = 'hanhtrinhtoanhoc_local_assignments';
const LOCAL_SUBMISSIONS_KEY = 'hanhtrinhtoanhoc_local_submissions';

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
    fetchClassAssignments();
  }, [currentClass]);

  useEffect(() => {
    if (selectedAssignmentId) fetchSubmissions(selectedAssignmentId);
  }, [selectedAssignmentId]);

  const getLocalAssignments = (): Assignment[] => {
    try {
      const raw = localStorage.getItem(LOCAL_ASSIGNMENTS_KEY);
      if (!raw) return [];
      const parsed: Assignment[] = JSON.parse(raw);
      if (currentClass) {
        return parsed.filter((a) => a.class_id === currentClass.id || !a.class_id);
      }
      return parsed;
    } catch (e) {
      return [];
    }
  };

  const getLocalSubmissions = (assignmentId: string): Submission[] => {
    try {
      const raw = localStorage.getItem(LOCAL_SUBMISSIONS_KEY);
      if (!raw) return [];
      const parsed: Submission[] = JSON.parse(raw);
      return parsed.filter((s) => s.assignment_id === assignmentId);
    } catch (e) {
      return [];
    }
  };

  const saveLocalSubmission = (updatedSub: Submission) => {
    try {
      const raw = localStorage.getItem(LOCAL_SUBMISSIONS_KEY);
      let list: Submission[] = raw ? JSON.parse(raw) : [];
      const idx = list.findIndex((s) => s.id === updatedSub.id || (s.assignment_id === updatedSub.assignment_id && s.student_id === updatedSub.student_id));
      if (idx >= 0) {
        list[idx] = updatedSub;
      } else {
        list.push(updatedSub);
      }
      localStorage.setItem(LOCAL_SUBMISSIONS_KEY, JSON.stringify(list));
    } catch (e) {
      console.error('Error saving local submission:', e);
    }
  };

  const fetchClassAssignments = async () => {
    const localAss = getLocalAssignments();
    try {
      let dbAssignments: Assignment[] = [];
      if (currentClass) {
        const { data, error } = await supabase
          .from('assignments')
          .select('*')
          .eq('class_id', currentClass.id)
          .order('created_at', { ascending: false });
        if (!error && data) dbAssignments = data;
      } else {
        const { data, error } = await supabase
          .from('assignments')
          .select('*')
          .order('created_at', { ascending: false });
        if (!error && data) dbAssignments = data;
      }

      // Merge DB & Local assignments uniquely
      const mergedMap = new Map<string, Assignment>();
      localAss.forEach((item) => mergedMap.set(item.id, item));
      dbAssignments.forEach((item) => mergedMap.set(item.id, item));

      const finalAss = Array.from(mergedMap.values());
      setAssignments(finalAss);

      if (finalAss.length > 0) {
        setSelectedAssignmentId(finalAss[0].id);
      }
    } catch (err) {
      setAssignments(localAss);
      if (localAss.length > 0) setSelectedAssignmentId(localAss[0].id);
    }
  };

  const fetchSubmissions = async (assignmentId: string) => {
    setLoading(true);
    const localSubs = getLocalSubmissions(assignmentId);

    try {
      const { data, error } = await supabase
        .from('submissions')
        .select('*, student:profiles(full_name, email)')
        .eq('assignment_id', assignmentId)
        .order('submitted_at', { ascending: false });

      let dbSubs: Submission[] = [];
      if (!error && data) {
        dbSubs = data.map((s: any) => ({
          ...s,
          student_name: s.student?.full_name || s.student_name || 'Học sinh',
        }));
      }

      // Merge DB & Local submissions uniquely
      const mergedMap = new Map<string, Submission>();
      localSubs.forEach((item) => {
        mergedMap.set(item.id, {
          ...item,
          student_name: item.student_name || 'Học Sinh Nguyễn Văn Học',
        });
      });
      dbSubs.forEach((item) => mergedMap.set(item.id, item));

      const formatted = Array.from(mergedMap.values());
      setSubmissions(formatted);

      if (formatted.length > 0) {
        handleSelectSubmission(formatted[0]);
      } else {
        setSelectedSubmission(null);
      }
    } catch (err) {
      const formatted = localSubs.map((item) => ({
        ...item,
        student_name: item.student_name || 'Học Sinh Nguyễn Văn Học',
      }));
      setSubmissions(formatted);
      if (formatted.length > 0) handleSelectSubmission(formatted[0]);
      else setSelectedSubmission(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSubmission = (sub: Submission) => {
    setSelectedSubmission(sub);
    setScore(sub.final_score ?? sub.ai_suggested_score ?? 10);
    setFeedback(sub.final_feedback ?? sub.ai_suggested_feedback ?? 'Con làm bài rất xuất sắc! Đã làm đúng toàn bộ câu hỏi.');
  };

  const handleRequestAIGrading = async () => {
    if (!selectedSubmission) return;
    const currentAssignment = assignments.find((a) => a.id === selectedAssignmentId);
    if (!currentAssignment) return;

    setIsGradingAI(true);
    try {
      const result = await suggestGrading(currentAssignment.questions_json || [], selectedSubmission.answers_json);

      const updatedSub: Submission = {
        ...selectedSubmission,
        ai_suggested_score: result.suggested_score,
        ai_suggested_feedback: result.suggested_feedback,
      };

      saveLocalSubmission(updatedSub);
      setScore(result.suggested_score);
      setFeedback(result.suggested_feedback);

      try {
        await supabase
          .from('submissions')
          .update({
            ai_suggested_score: result.suggested_score,
            ai_suggested_feedback: result.suggested_feedback,
          })
          .eq('id', selectedSubmission.id);
      } catch (e) {}

      fetchSubmissions(selectedAssignmentId);
    } catch (err: any) {
      alert('Không thể chạy AI chấm bài: ' + err.message);
    } finally {
      setIsGradingAI(false);
    }
  };

  const handleFinalizeGrading = async () => {
    if (!selectedSubmission) return;

    const finalizedSub: Submission = {
      ...selectedSubmission,
      final_score: score,
      final_feedback: feedback,
      is_finalized: true,
      finalized_at: new Date().toISOString(),
      finalized_by: user?.id,
    };

    saveLocalSubmission(finalizedSub);
    setSelectedSubmission(finalizedSub);
    setSubmissions((prev) => prev.map((s) => (s.id === finalizedSub.id ? finalizedSub : s)));

    try {
      await supabase
        .from('submissions')
        .update({
          final_score: score,
          final_feedback: feedback,
          is_finalized: true,
          finalized_at: new Date().toISOString(),
          finalized_by: user?.id,
        })
        .eq('id', selectedSubmission.id);
    } catch (err) {
      // Async DB error handled silently
    }

    alert('Đã CHỐT ĐIỂM và gửi kết quả về cho học sinh thành công!');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center space-x-2 font-display">
            <Award className="w-7 h-7 text-amber-500" />
            <span>Trung Tâm Chấm Bài & Chốt Điểm</span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            AI gợi ý điểm + nhận xét $\rightarrow$ Giáo viên kiểm tra/sửa $\rightarrow$ Giáo viên **CHỐT** $\rightarrow$ Học sinh mới xem được.
          </p>
        </div>

        {/* Assignment Selector */}
        <div className="w-full sm:w-auto">
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Chọn Bài Tập:</label>
          <select
            value={selectedAssignmentId}
            onChange={(e) => setSelectedAssignmentId(e.target.value)}
            className="w-full sm:w-64 px-4 py-2 rounded-xl border border-slate-200 text-sm font-bold bg-slate-50 focus:ring-2 focus:ring-sky-500 focus:outline-none"
          >
            {assignments.length === 0 && <option value="">Chưa có bài tập nào</option>}
            {assignments.map((a) => (
              <option key={a.id} value={a.id}>
                {a.title} ({a.type === 'weekly_test' ? 'Kiểm tra' : 'Bài tập'})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Submissions List */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
          <h3 className="text-base font-bold text-slate-800 flex items-center justify-between">
            <span>Danh Sách Học Sinh Nộp Bài</span>
            <span className="bg-slate-100 text-slate-600 text-xs px-2.5 py-1 rounded-full font-semibold">
              {submissions.length} bài nộp
            </span>
          </h3>

          {loading ? (
            <div className="py-8 text-center text-slate-400 text-sm">Đang tải danh sách bài nộp...</div>
          ) : submissions.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-xl p-4">
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
                        ? 'border-sky-500 bg-sky-50/70 text-sky-950 shadow-sm font-semibold'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-sm">{sub.student_name}</div>
                      <div className="text-xs text-slate-400">
                        {new Date(sub.submitted_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>

                    <div>
                      {sub.is_finalized ? (
                        <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-1 rounded-full font-bold">
                          {sub.final_score}đ (Đã chốt)
                        </span>
                      ) : (
                        <span className="bg-amber-100 text-amber-800 text-xs px-2.5 py-1 rounded-full font-bold">
                          Chờ chốt
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Grading Details & AI Suggestions */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          {selectedSubmission ? (
            <div className="space-y-6">
              <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{selectedSubmission.student_name}</h3>
                  <div className="text-xs text-slate-400 mt-0.5">
                    Nộp bài lúc: {new Date(selectedSubmission.submitted_at).toLocaleString('vi-VN')}
                  </div>
                </div>

                <button
                  onClick={handleRequestAIGrading}
                  disabled={isGradingAI}
                  className="bg-gradient-to-r from-amber-500 to-sky-600 hover:from-amber-600 hover:to-sky-700 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-md transition-all flex items-center space-x-1.5"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isGradingAI ? 'AI Đang Phân Tích...' : 'AI Chấm Bài Tự Động'}</span>
                </button>
              </div>

              {/* Student Answers View */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-slate-800">Chi Tiết Bài Làm Của Học Sinh:</h4>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
                  {Object.entries(selectedSubmission.answers_json || {}).map(([qId, ans], idx) => (
                    <div key={qId} className="flex justify-between items-center py-1 border-b border-slate-200/60 last:border-0">
                      <span className="font-bold text-slate-700">Câu {idx + 1}:</span>
                      <span className="font-mono text-sky-800 bg-white px-2 py-0.5 rounded border border-slate-200 font-bold">{ans}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Suggestion Box */}
              {selectedSubmission.ai_suggested_score !== undefined && (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 space-y-2 text-xs">
                  <div className="font-bold flex items-center space-x-1.5 text-amber-800">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <span>Gợi Ý Chấm Bài Từ AI (Gemini):</span>
                  </div>
                  <div>
                    <strong>Điểm đề xuất:</strong> <span className="font-extrabold text-sm text-amber-900">{selectedSubmission.ai_suggested_score}đ</span>
                  </div>
                  <div>
                    <strong>Nhận xét đề xuất:</strong> {selectedSubmission.ai_suggested_feedback}
                  </div>
                </div>
              )}

              {/* Teacher Manual Edit Form */}
              <div className="space-y-4 pt-2">
                <h4 className="text-sm font-bold text-slate-800">Chỉnh Sửa & Chốt Điểm (Giáo Viên):</h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Điểm số (0 - 10):</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="10"
                      value={score}
                      onChange={(e) => setScore(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Nhận xét của Giáo viên:</label>
                    <input
                      type="text"
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      placeholder="Con làm bài rất tốt, phát huy nhé!"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={handleFinalizeGrading}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3 rounded-xl shadow-lg transition-all text-sm flex items-center space-x-2"
                  >
                    <CheckCircle className="w-5 h-5" />
                    <span>CHỐT KẾT QUẢ & GỬI CHO HỌC SINH</span>
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
