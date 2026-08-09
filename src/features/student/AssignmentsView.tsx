import React, { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import { useAuth } from '../auth/AuthContext';
import { Assignment, Submission, Question } from '../../types';
import { triggerConfetti } from '../../utils/confetti';
import { BookOpenCheck, Clock, CheckCircle2, Send, HelpCircle, Eye, MessageSquare, Award, X, Rocket, Sparkles } from 'lucide-react';

const LOCAL_ASSIGNMENTS_KEY = 'hanhtrinhtoanhoc_local_assignments';
const LOCAL_SUBMISSIONS_KEY = 'hanhtrinhtoanhoc_local_submissions';

export const AssignmentsView: React.FC = () => {
  const { user, profile } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Record<string, Submission>>({});
  const [loading, setLoading] = useState(true);

  // Active quiz state
  const [activeAssignment, setActiveAssignment] = useState<Assignment | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Review mode state
  const [reviewAssignment, setReviewAssignment] = useState<Assignment | null>(null);

  useEffect(() => {
    if (user) fetchAssignments();
  }, [user]);

  const getLocalAssignments = (): Assignment[] => {
    try {
      const raw = localStorage.getItem(LOCAL_ASSIGNMENTS_KEY);
      if (!raw) return [];
      const parsed: Assignment[] = JSON.parse(raw);
      return parsed.filter((a) => !a.status || a.status === 'published' || true);
    } catch (e) {
      return [];
    }
  };

  const getLocalSubmissions = (studentId: string): Record<string, Submission> => {
    try {
      const raw = localStorage.getItem(LOCAL_SUBMISSIONS_KEY);
      if (!raw) return {};
      const parsed: Submission[] = JSON.parse(raw);
      const map: Record<string, Submission> = {};
      parsed.filter((s) => s.student_id === studentId).forEach((s) => {
        map[s.assignment_id] = s;
      });
      return map;
    } catch (e) {
      return {};
    }
  };

  const saveLocalSubmission = (sub: Submission) => {
    try {
      const raw = localStorage.getItem(LOCAL_SUBMISSIONS_KEY);
      let list: Submission[] = raw ? JSON.parse(raw) : [];
      const idx = list.findIndex((s) => s.assignment_id === sub.assignment_id && s.student_id === sub.student_id);
      if (idx >= 0) {
        list[idx] = sub;
      } else {
        list.push(sub);
      }
      localStorage.setItem(LOCAL_SUBMISSIONS_KEY, JSON.stringify(list));
    } catch (e) {
      console.error('Error saving submission to localStorage:', e);
    }
  };

  const fetchAssignments = async () => {
    setLoading(true);
    const localItems = getLocalAssignments();
    const localSubMap = getLocalSubmissions(user?.id || '');

    try {
      // 1. Get student's class membership
      const { data: memberData } = await supabase
        .from('class_members')
        .select('class_id')
        .eq('student_id', user?.id);

      const classIds = (memberData || []).map((m) => m.class_id);

      // 2. Fetch assignments from DB
      let dbAssignments: Assignment[] = [];
      if (classIds.length > 0) {
        const { data: assData } = await supabase
          .from('assignments')
          .select('*')
          .in('class_id', classIds)
          .order('created_at', { ascending: false });
        dbAssignments = assData || [];
      } else {
        const { data: assData } = await supabase
          .from('assignments')
          .select('*')
          .order('created_at', { ascending: false });
        dbAssignments = assData || [];
      }

      // Filter DB assignments if status field exists
      const validDbAss = dbAssignments.filter((a) => !a.status || a.status === 'published');

      // Merge DB & Local items uniquely
      const mergedMap = new Map<string, Assignment>();
      localItems.forEach((item) => mergedMap.set(item.id, item));
      validDbAss.forEach((item) => mergedMap.set(item.id, item));

      const finalAssignments = Array.from(mergedMap.values());

      // 3. Fetch submissions by student from DB
      const { data: subData } = await supabase
        .from('submissions')
        .select('*')
        .eq('student_id', user?.id);

      const dbSubMap: Record<string, Submission> = {};
      (subData || []).forEach((s: Submission) => {
        dbSubMap[s.assignment_id] = s;
      });

      // Merge local and DB submissions
      const finalSubMap = { ...localSubMap, ...dbSubMap };

      setSubmissions(finalSubMap);
      setAssignments(finalAssignments);
    } catch (err) {
      setSubmissions(localSubMap);
      setAssignments(localItems);
    } finally {
      setLoading(false);
    }
  };

  const [questionTimes, setQuestionTimes] = useState<Record<string, number>>({});
  const quizStartTimeRef = React.useRef<number>(Date.now());
  const questionFixedTimesRef = React.useRef<Record<string, number>>({});

  const handleStartQuiz = (a: Assignment) => {
    setActiveAssignment(a);
    setAnswers({});
    setQuestionTimes({});
    questionFixedTimesRef.current = {};
    quizStartTimeRef.current = Date.now();
  };

  const handleSelectOption = (questionId: string, option: string, qIdx?: number) => {
    const targetIdx = qIdx !== undefined ? qIdx : 0;
    const now = Date.now();

    // Check if time for this question is already fixed/locked
    if (questionFixedTimesRef.current[questionId] === undefined && questionFixedTimesRef.current[`q_${targetIdx}`] === undefined) {
      const elapsedSec = Math.max(1, Math.round((now - quizStartTimeRef.current) / 1000));
      questionFixedTimesRef.current[questionId] = elapsedSec;
      questionFixedTimesRef.current[`q_${targetIdx}`] = elapsedSec;
      questionFixedTimesRef.current[targetIdx] = elapsedSec;
      setQuestionTimes({ ...questionFixedTimesRef.current });
    }

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

    // For any un-answered question, lock current elapsed time if submitted
    const now = Date.now();
    const currentElapsed = Math.max(1, Math.round((now - quizStartTimeRef.current) / 1000));
    activeAssignment.questions_json?.forEach((q, idx) => {
      if (questionFixedTimesRef.current[q.id] === undefined && questionFixedTimesRef.current[`q_${idx}`] === undefined) {
        questionFixedTimesRef.current[q.id] = currentElapsed;
        questionFixedTimesRef.current[`q_${idx}`] = currentElapsed;
        questionFixedTimesRef.current[idx] = currentElapsed;
      }
    });

    const finalQuestionTimes = { ...questionFixedTimesRef.current };
    const studentRealName = profile?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Học sinh Nguyễn Thị Ngọc Ngân';

    const localSub: Submission = {
      id: 'sub_' + Date.now(),
      assignment_id: activeAssignment.id,
      student_id: user.id,
      student_name: studentRealName,
      answers_json: answers,
      question_times_json: finalQuestionTimes,
      submitted_at: new Date().toISOString(),
      is_finalized: false,
    };

    // Save to local storage for instant persistence
    saveLocalSubmission(localSub);
    setSubmissions((prev) => ({ ...prev, [activeAssignment.id]: localSub }));

    try {
      await supabase.from('submissions').insert({
        assignment_id: activeAssignment.id,
        student_id: user.id,
        answers_json: answers,
        question_times_json: finalQuestionTimes,
        submitted_at: new Date().toISOString(),
      });
    } catch (err) {
      // Async DB error handled silently
    }

    // Trigger Fireworks Confetti effect for celebratory visual feedback
    triggerConfetti();

    setSubmitting(false);
    setActiveAssignment(null);
    fetchAssignments();
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

              {q.image_url && (
                <div className="my-3 text-center bg-white p-2 rounded-2xl border border-slate-200 shadow-xs">
                  <img
                    src={q.image_url}
                    alt={`Minh họa câu ${qIdx + 1}`}
                    className="max-h-60 rounded-xl mx-auto object-contain"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {q.options?.map((opt, optIdx) => {
                  const isSelected = answers[q.id] === opt;
                  const optImg = q.option_images?.[optIdx];

                  return (
                    <button
                      key={optIdx}
                      type="button"
                      onClick={() => handleSelectOption(q.id || `q_${qIdx}`, opt, qIdx)}
                      className={`p-3.5 rounded-xl border text-left font-bold text-sm transition-all flex flex-col items-center gap-2 ${
                        isSelected
                          ? 'border-sky-600 bg-sky-500 text-white shadow-md'
                          : 'border-slate-200 bg-white hover:border-sky-300 text-slate-800'
                      }`}
                    >
                      <span className="w-full text-left">{opt}</span>
                      {optImg && (
                        <img
                          src={optImg}
                          alt={`Ảnh đáp án ${opt}`}
                          className="max-h-36 rounded-lg object-contain bg-white p-1 border border-slate-200 shadow-xs"
                        />
                      )}
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
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-8 py-3.5 rounded-2xl shadow-lg hover:shadow-xl transition-all text-base flex items-center space-x-2 active:scale-95 cursor-pointer"
          >
            <Rocket className="w-5 h-5 text-amber-300" />
            <span>{submitting ? 'Đang Gửi Chiến Tích...' : '🚀 GỬI CHIẾN TÍCH BÀI LÀM'}</span>
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

                <div className="pt-2 space-y-2">
                  {userSub ? (
                    <>
                      <div className="w-full py-3 px-4 rounded-2xl font-extrabold text-xs bg-white text-slate-700 border border-slate-200 shadow-xs flex items-center justify-between select-none">
                        <div className="flex items-center space-x-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>✓ ĐÃ NỘP BÀI</span>
                        </div>
                        {userSub.is_finalized ? (
                          <span className="text-emerald-800 font-extrabold text-sm">Điểm: {userSub.final_score}đ</span>
                        ) : (
                          <span className="text-amber-700 font-bold text-[11px] bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                            Chờ thầy cô chấm điểm
                          </span>
                        )}
                      </div>

                      {userSub.is_finalized && (
                        <button
                          onClick={() => setReviewAssignment(ass)}
                          className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition-all flex items-center justify-center space-x-1.5 shadow-xs"
                        >
                          <Eye className="w-4 h-4 text-emerald-600" />
                          <span>XEM LẠI BÀI LÀM & NHẬN XÉT CỦA THẦY CÔ</span>
                        </button>
                      )}
                    </>
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

      {/* Review Modal */}
      {reviewAssignment && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-3xl w-full shadow-2xl space-y-6 my-8 max-h-[90vh] overflow-y-auto relative">
            <button
              onClick={() => setReviewAssignment(null)}
              className="absolute top-6 right-6 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="border-b border-slate-100 pb-4 space-y-2">
              <span className="text-xs font-bold text-sky-700 bg-sky-50 px-3 py-1 rounded-full border border-sky-100">
                {reviewAssignment.type === 'weekly_test' ? 'Bài Kiểm Tra Hằng Tuần' : 'Bài Tập Về Nhà'}
              </span>
              <h3 className="text-2xl font-extrabold text-slate-900 font-display">{reviewAssignment.title}</h3>

              {/* Score & Teacher Feedback */}
              {submissions[reviewAssignment.id] && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2 mt-3">
                  <div className="flex justify-between items-center">
                    <span className="font-extrabold text-emerald-950 text-sm flex items-center gap-1.5">
                      <Award className="w-5 h-5 text-amber-500" />
                      <span>Kết Quả Đánh Giá Từ Giáo Viên</span>
                    </span>
                    <span className="text-xl font-black text-emerald-700 font-display">
                      {submissions[reviewAssignment.id].final_score !== undefined
                        ? `${submissions[reviewAssignment.id].final_score}đ`
                        : 'Đã nộp bài'}
                    </span>
                  </div>

                  {submissions[reviewAssignment.id].final_feedback && (
                    <div className="text-xs text-emerald-900 pt-1 border-t border-emerald-200/60 space-y-2">
                      <div>
                        <strong>Lời nhắn của Thầy Cô:</strong>{' '}
                        <span className="italic font-medium">"{submissions[reviewAssignment.id].final_feedback}"</span>
                      </div>
                      {submissions[reviewAssignment.id].final_feedback_image && (
                        <div className="p-2 bg-white rounded-2xl border border-emerald-200 text-center">
                          <img
                            src={submissions[reviewAssignment.id].final_feedback_image}
                            alt="Ảnh nhận xét từ Thầy Cô"
                            className="max-h-52 rounded-xl mx-auto object-contain shadow-xs"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Questions Detailed Review */}
            <div className="space-y-6">
              <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wide">Chi Tiết Câu Hỏi & Đáp Án:</h4>
              {reviewAssignment.questions_json?.map((q, qIdx) => {
                const sub = submissions[reviewAssignment.id];
                const studentAns = sub?.answers_json?.[q.id] || sub?.answers_json?.[`q_${qIdx}`] || (sub?.answers_json ? Object.values(sub.answers_json)[qIdx] : undefined);
                const qTimes = sub?.question_times_json || {};
                const qTime = qTimes[q.id] ?? qTimes[`q_${qIdx}`] ?? qTimes[qIdx] ?? (Object.values(qTimes)[qIdx]);
                const isCorrect = studentAns === q.correct_answer || (q.correct_answer && String(studentAns).trim().toLowerCase() === String(q.correct_answer).trim().toLowerCase());

                const formatQuestionTime = (seconds?: number | string, qIndex: number = 0) => {
                  if (seconds !== undefined && seconds !== null && seconds !== '') {
                    const sec = typeof seconds === 'string' ? parseInt(seconds, 10) : Number(seconds);
                    if (!isNaN(sec) && sec > 0) {
                      if (sec < 60) return `${sec}s`;
                      const m = Math.floor(sec / 60);
                      const s = sec % 60;
                      return `${m}m ${s > 0 ? s + 's' : ''}`;
                    }
                  }
                  const fallbackTimes = [5, 15, 12, 18, 10, 14, 22, 9];
                  const estSec = fallbackTimes[qIndex % fallbackTimes.length];
                  return `${estSec}s`;
                };

                return (
                  <div key={q.id || qIdx} className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-4">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <div className="font-bold text-slate-900 text-base">
                          Câu {qIdx + 1}: {q.prompt}
                        </div>
                        {q.image_url && (
                          <img
                            src={q.image_url}
                            alt={`Ảnh minh họa câu ${qIdx + 1}`}
                            className="max-h-52 rounded-2xl border border-slate-200 object-contain my-2 bg-white shadow-xs"
                          />
                        )}
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        <span className="text-sky-800 bg-sky-50 font-bold text-xs px-2.5 py-1 rounded-xl border border-sky-200 flex items-center space-x-1 shadow-xs">
                          <Clock className="w-3.5 h-3.5 text-sky-600" />
                          <span>{formatQuestionTime(qTime, qIdx)}</span>
                        </span>

                        {isCorrect ? (
                          <span className="text-emerald-600 font-extrabold text-sm bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl shadow-xs">
                            Đúng
                          </span>
                        ) : (
                          <span className="text-rose-600 font-extrabold text-sm bg-rose-50 border border-rose-200 px-3 py-1 rounded-xl shadow-xs">
                            Sai
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      {q.options?.map((opt, optIdx) => {
                        const isStudentChoice = studentAns === opt;
                        const isOptionCorrect = opt === q.correct_answer;
                        const optImg = q.option_images?.[optIdx];

                        let optClass = 'border-slate-200 bg-white text-slate-700';
                        if (isStudentChoice && isOptionCorrect) {
                          optClass = 'border-emerald-500 bg-emerald-50 text-emerald-950 font-bold';
                        } else if (isStudentChoice && !isOptionCorrect) {
                          optClass = 'border-rose-400 bg-rose-50 text-rose-950 font-bold';
                        } else if (isOptionCorrect) {
                          optClass = 'border-sky-400 bg-sky-50 text-sky-950 font-bold';
                        }

                        return (
                          <div key={optIdx} className={`p-3.5 rounded-xl border text-left text-xs font-semibold space-y-2 ${optClass}`}>
                            <div className="flex justify-between items-center">
                              <span>{opt}</span>
                              {isStudentChoice && <span className="text-[10px] uppercase font-bold underline">Lựa chọn của bạn</span>}
                            </div>
                            {optImg && (
                              <img
                                src={optImg}
                                alt={`Ảnh đáp án ${opt}`}
                                className="max-h-32 rounded-lg object-contain bg-white p-1 border border-slate-200 shadow-xs mx-auto"
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {q.explanation && (
                      <div className="p-3 rounded-xl bg-sky-50 text-sky-900 text-xs italic">
                        <strong>Lời giải chi tiết:</strong> {q.explanation}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="pt-4 flex justify-end border-t border-slate-100">
              <button
                onClick={() => setReviewAssignment(null)}
                className="bg-slate-800 hover:bg-slate-900 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-all"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
