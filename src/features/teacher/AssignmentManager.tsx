import React, { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import { useAuth } from '../auth/AuthContext';
import { Assignment, MathClass, Question } from '../../types';
import { generateAIQuestions } from '../../config/gemini';
import { BookOpenCheck, Plus, Sparkles, Eye, Send, Edit, Trash2, HelpCircle } from 'lucide-react';

interface AssignmentManagerProps {
  currentClass?: MathClass | null;
}

export const AssignmentManager: React.FC<AssignmentManagerProps> = ({ currentClass }) => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'homework' | 'weekly_test'>('homework');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState(30);
  const [questions, setQuestions] = useState<Question[]>([]);

  // AI Prompting state
  const [aiTopic, setAiTopic] = useState('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  useEffect(() => {
    if (currentClass) fetchAssignments();
  }, [currentClass]);

  const fetchAssignments = async () => {
    if (!currentClass) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('assignments')
        .select('*')
        .eq('class_id', currentClass.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAssignments(data || []);
    } catch (err) {
      console.error('Error fetching assignments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAIQuestions = async () => {
    if (!aiTopic.trim()) return alert('Vui lòng nhập chủ đề toán học cần AI gợi ý (vd: Phép chia có dư, Chu vi hình chữ nhật...)');
    setIsGeneratingAI(true);
    try {
      const generated = await generateAIQuestions(aiTopic, currentClass?.grade || 3, 4);
      setQuestions([...questions, ...generated]);
    } catch (err: any) {
      alert('Không thể tạo câu hỏi AI: ' + err.message);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleAddQuestionManual = () => {
    const newQ: Question = {
      id: 'q_' + Date.now(),
      prompt: 'Nhập nội dung câu hỏi mới...',
      options: ['Lựa chọn A', 'Lựa chọn B', 'Lựa chọn C', 'Lựa chọn D'],
      correct_answer: 'Lựa chọn A',
      explanation: 'Giải thích đáp án...',
    };
    setQuestions([...questions, newQ]);
  };

  const handleUpdateQuestion = (index: number, updated: Question) => {
    const list = [...questions];
    list[index] = updated;
    setQuestions(list);
  };

  const handleRemoveQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleSaveAssignment = async (status: 'draft' | 'published') => {
    if (!title.trim() || !currentClass || !user) return alert('Vui lòng điền tiêu đề bài tập.');
    if (questions.length === 0) return alert('Vui lòng thêm ít nhất 1 câu hỏi.');

    try {
      const payload = {
        class_id: currentClass.id,
        teacher_id: user.id,
        title: title.trim(),
        type: type,
        description: description.trim(),
        duration_minutes: duration,
        questions_json: questions,
        status: status,
      };

      if (editingId) {
        const { error } = await supabase.from('assignments').update(payload).eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('assignments').insert(payload);
        if (error) throw error;
      }

      setShowModal(false);
      resetForm();
      fetchAssignments();
    } catch (err: any) {
      alert('Lỗi lưu bài tập: ' + err.message);
    }
  };

  const handlePublishToggle = async (assignment: Assignment) => {
    const newStatus = assignment.status === 'published' ? 'draft' : 'published';
    try {
      const { error } = await supabase
        .from('assignments')
        .update({ status: newStatus })
        .eq('id', assignment.id);

      if (error) throw error;
      fetchAssignments();
    } catch (err: any) {
      alert('Không thể thay đổi trạng thái bài tập: ' + err.message);
    }
  };

  const handleDeleteAssignment = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa bài tập này?')) return;
    try {
      const { error } = await supabase.from('assignments').delete().eq('id', id);
      if (error) throw error;
      fetchAssignments();
    } catch (err: any) {
      alert('Xóa bài tập thất bại: ' + err.message);
    }
  };

  const resetForm = () => {
    setTitle('');
    setType('homework');
    setDescription('');
    setDuration(30);
    setQuestions([]);
    setEditingId(null);
    setAiTopic('');
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (a: Assignment) => {
    setTitle(a.title || '');
    setType(a.type || 'homework');
    setDescription(a.description || '');
    setDuration(a.duration_minutes || 30);
    setQuestions(a.questions_json || []);
    setEditingId(a.id);
    setShowModal(true);
  };

  if (!currentClass) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-slate-100 text-center text-slate-500">
        Vui lòng chọn 1 lớp học để quản lý bài tập & bài kiểm tra.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center space-x-2 font-display">
            <BookOpenCheck className="w-7 h-7 text-sky-600" />
            <span>Soạn Bài Tập & Bài Kiểm Tra Hằng Tuần</span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Quy trình: Giáo viên soạn/dùng AI gợi ý $\rightarrow$ Xem trước $\rightarrow$ Giáo viên CHỐT xuất bản thì Học sinh mới nhận bài.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="bg-sky-600 hover:bg-sky-700 text-white font-bold px-5 py-2.5 rounded-xl shadow-md transition-all text-sm flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo Bài Tập / Bài Kiểm Tra</span>
        </button>
      </div>

      {/* List Assignments */}
      {loading ? (
        <div className="py-8 text-center text-slate-400 text-sm">Đang tải danh sách bài tập...</div>
      ) : assignments.length === 0 ? (
        <div className="bg-white p-12 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
          Lớp chưa có bài tập nào. Hãy nhấn nút phía trên để bắt đầu soạn bài tập đầu tiên!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {assignments.map((ass) => (
            <div key={ass.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                        ass.type === 'weekly_test'
                          ? 'bg-rose-100 text-rose-700 border border-rose-200'
                          : 'bg-sky-100 text-sky-700 border border-sky-200'
                      }`}
                    >
                      {ass.type === 'weekly_test' ? 'Bài Kiểm Tra Tuần' : 'Bài Tập Về Nhà'}
                    </span>
                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                        ass.status === 'published'
                          ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-100 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {ass.status === 'published' ? 'Đã Chốt - Đã Gửi Học Sinh' : 'Bản Nháp (Chưa Gửi)'}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mt-2 font-display">{ass.title}</h3>
                </div>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => openEditModal(ass)}
                    className="p-1.5 text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                    title="Chỉnh sửa"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteAssignment(ass.id)}
                    className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Xóa bài tập"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {ass.description && <p className="text-xs text-slate-500">{ass.description}</p>}

              <div className="flex justify-between items-center text-xs text-slate-500 pt-3 border-t border-slate-100">
                <span>{ass.questions_json?.length || 0} câu hỏi</span>
                <span>Thời gian: {ass.duration_minutes} phút</span>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => handlePublishToggle(ass)}
                  className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs transition-all flex items-center justify-center space-x-2 ${
                    ass.status === 'published'
                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md'
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{ass.status === 'published' ? 'Chuyển Về Bản Nháp' : 'CHỐT BÀI TẬP & GỬI CHO HỌC SINH'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Soạn Bài Tập */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-3xl w-full shadow-2xl space-y-6 my-8 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-slate-900 font-display">
              {editingId ? 'Chỉnh Sửa Bài Tập' : 'Soạn Bài Tập / Bài Kiểm Tra Mới'}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Tên bài tập:</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ví dụ: Ôn tập phép nhân & chu vi Lớp 3"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Phân loại:</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                >
                  <option value="homework">Bài Tập Về Nhà</option>
                  <option value="weekly_test">Bài Kiểm Tra Hằng Tuần</option>
                </select>
              </div>
            </div>

            {/* AI Generator Banner */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-sky-50 border border-amber-200 space-y-3">
              <div className="flex items-center space-x-2 text-amber-800 font-bold text-sm">
                <Sparkles className="w-5 h-5 text-amber-600" />
                <span>AI Hỗ Trợ Gợi Ý Câu Hỏi Tự Động (Gemini AI)</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  placeholder="Nhập chủ đề toán (vd: Phép chia Lớp 3, Hình vuông, Phân số...)"
                  className="flex-1 px-4 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleGenerateAIQuestions}
                  disabled={isGeneratingAI}
                  className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-sm flex items-center space-x-1 shrink-0"
                >
                  {isGeneratingAI ? 'AI Đang Tạo...' : 'Gợi Ý Câu Hỏi'}
                </button>
              </div>
            </div>

            {/* Questions Editor */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-slate-800 text-sm">
                  Danh Sách Câu Hỏi ({questions.length} câu)
                </h4>
                <button
                  type="button"
                  onClick={handleAddQuestionManual}
                  className="text-xs font-bold text-sky-600 hover:text-sky-800 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Thêm Câu Thủ Công
                </button>
              </div>

              {questions.map((q, qIdx) => (
                <div key={q.id || qIdx} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
                  <div className="flex justify-between items-start gap-2">
                    <span className="font-extrabold text-sky-700 text-xs bg-sky-100 px-2 py-0.5 rounded">
                      Câu {qIdx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveQuestion(qIdx)}
                      className="text-rose-500 hover:text-rose-700 text-xs font-bold"
                    >
                      Xóa câu này
                    </button>
                  </div>

                  <input
                    type="text"
                    value={q.prompt}
                    onChange={(e) => handleUpdateQuestion(qIdx, { ...q, prompt: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold bg-white"
                    placeholder="Nội dung câu hỏi..."
                  />

                  {/* Options */}
                  <div className="grid grid-cols-2 gap-2">
                    {q.options?.map((opt, optIdx) => (
                      <div key={optIdx} className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name={`correct_${qIdx}`}
                          checked={q.correct_answer === opt}
                          onChange={() => handleUpdateQuestion(qIdx, { ...q, correct_answer: opt })}
                        />
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => {
                            const newOpts = [...(q.options || [])];
                            newOpts[optIdx] = e.target.value;
                            handleUpdateQuestion(qIdx, {
                              ...q,
                              options: newOpts,
                              correct_answer: q.correct_answer === opt ? e.target.value : q.correct_answer,
                            });
                          }}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => handleSaveAssignment('draft')}
                className="px-5 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-sm"
              >
                Lưu Bản Nháp
              </button>
              <button
                type="button"
                onClick={() => handleSaveAssignment('published')}
                className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm shadow-md"
              >
                CHỐT BÀI TẬP & GỬI
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
