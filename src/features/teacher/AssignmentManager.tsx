import React, { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import { useAuth } from '../auth/AuthContext';
import { Assignment, MathClass, Question } from '../../types';
import { generateAIQuestions } from '../../config/gemini';
import { BookOpenCheck, Plus, Sparkles, Eye, Send, Edit, Trash2, HelpCircle, Image as ImageIcon, Upload, X } from 'lucide-react';

interface AssignmentManagerProps {
  currentClass?: MathClass | null;
}

const LOCAL_ASSIGNMENTS_KEY = 'hanhtrinhtoanhoc_local_assignments';

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

  const getLocalAssignments = (classId: string): Assignment[] => {
    try {
      const raw = localStorage.getItem(LOCAL_ASSIGNMENTS_KEY);
      if (!raw) return [];
      const parsed: Assignment[] = JSON.parse(raw);
      return parsed.filter((a) => a.class_id === classId);
    } catch (e) {
      return [];
    }
  };

  const saveLocalAssignment = (newAss: Assignment) => {
    try {
      const raw = localStorage.getItem(LOCAL_ASSIGNMENTS_KEY);
      let list: Assignment[] = raw ? JSON.parse(raw) : [];
      const idx = list.findIndex((a) => a.id === newAss.id);
      if (idx >= 0) {
        list[idx] = newAss;
      } else {
        list.unshift(newAss);
      }
      localStorage.setItem(LOCAL_ASSIGNMENTS_KEY, JSON.stringify(list));
    } catch (e) {
      console.error('Error saving to localStorage:', e);
    }
  };

  const removeLocalAssignment = (id: string) => {
    try {
      const raw = localStorage.getItem(LOCAL_ASSIGNMENTS_KEY);
      if (!raw) return;
      let list: Assignment[] = JSON.parse(raw);
      list = list.filter((a) => a.id !== id);
      localStorage.setItem(LOCAL_ASSIGNMENTS_KEY, JSON.stringify(list));
    } catch (e) {
      console.error('Error removing from localStorage:', e);
    }
  };

  const fetchAssignments = async () => {
    if (!currentClass) return;
    setLoading(true);
    const localItems = getLocalAssignments(currentClass.id);

    try {
      const { data, error } = await supabase
        .from('assignments')
        .select('*')
        .eq('class_id', currentClass.id)
        .order('created_at', { ascending: false });

      if (error) {
        setAssignments(localItems);
      } else {
        // Merge DB and local items uniquely by ID
        const dbList = data || [];
        const mergedMap = new Map<string, Assignment>();
        localItems.forEach((item) => mergedMap.set(item.id, item));
        dbList.forEach((item: any) => mergedMap.set(item.id, item));
        setAssignments(Array.from(mergedMap.values()));
      }
    } catch (err) {
      setAssignments(localItems);
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

    const targetId = editingId || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'ass_' + Date.now());

    const newAss: Assignment = {
      id: targetId,
      class_id: currentClass.id,
      teacher_id: user.id,
      title: title.trim(),
      type: type,
      description: description.trim() || 'Bài tập toán học tương tác',
      duration_minutes: duration,
      questions_json: questions,
      status: status,
      created_at: new Date().toISOString(),
    };

    // 1. Instant local persistence & UI update (Zero-failure UX)
    saveLocalAssignment(newAss);
    setAssignments((prev) => {
      const idx = prev.findIndex((a) => a.id === targetId);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = newAss;
        return copy;
      }
      return [newAss, ...prev];
    });

    setShowModal(false);
    resetForm();

    // 2. Asynchronous DB Sync in background
    try {
      const payload: any = {
        id: targetId,
        class_id: currentClass.id,
        teacher_id: user.id,
        title: title.trim(),
        type: type,
        description: description.trim() || 'Bài tập toán học tương tác',
        duration_minutes: duration,
        questions_json: questions,
        status: status,
      };

      if (editingId) {
        const { error } = await supabase.from('assignments').update(payload).eq('id', editingId);
        if (error) {
          await supabase.from('assignments').update({
            class_id: currentClass.id,
            teacher_id: user.id,
            title: title.trim(),
            status: status,
          }).eq('id', editingId);
        }
      } else {
        const { error } = await supabase.from('assignments').insert(payload);
        if (error) {
          await supabase.from('assignments').insert({
            id: targetId,
            class_id: currentClass.id,
            teacher_id: user.id,
            title: title.trim(),
            status: status,
          });
        }
      }
    } catch (err) {
      // Background sync errors caught silently since local persistence succeeded
      console.warn('Background assignment sync info:', err);
    }
  };

  const handlePublishToggle = async (assignment: Assignment) => {
    const newStatus = assignment.status === 'published' ? 'draft' : 'published';
    const updated: Assignment = { ...assignment, status: newStatus };

    saveLocalAssignment(updated);
    setAssignments((prev) => prev.map((a) => (a.id === assignment.id ? updated : a)));

    try {
      await supabase.from('assignments').update({ status: newStatus }).eq('id', assignment.id);
    } catch (err) {
      // Ignore background sync error
    }
  };

  const handleDeleteAssignment = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa bài tập này?')) return;

    removeLocalAssignment(id);
    setAssignments((prev) => prev.filter((a) => a.id !== id));

    try {
      await supabase.from('assignments').delete().eq('id', id);
    } catch (err) {
      // Ignore background sync error
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
            Quy trình: Giáo viên soạn bài tập $\rightarrow$ Xem trước $\rightarrow$ Giáo viên CHỐT xuất bản thì Học sinh mới nhận bài.
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

                  {/* Question Prompt + Add Image Button */}
                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={q.prompt}
                      onChange={(e) => handleUpdateQuestion(qIdx, { ...q, prompt: e.target.value })}
                      className="flex-1 px-3 py-2.5 rounded-xl border border-slate-300 text-sm font-bold bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                      placeholder="Nhập nội dung câu hỏi mới..."
                    />
                    <label
                      title="Thêm ảnh minh họa cho câu hỏi"
                      className="bg-sky-50 hover:bg-sky-100 text-sky-700 font-extrabold px-3 py-2.5 rounded-xl text-xs border border-sky-300 cursor-pointer shrink-0 flex items-center space-x-1 shadow-xs transition-all active:scale-95"
                    >
                      <Plus className="w-4 h-4 text-sky-600" />
                      <ImageIcon className="w-4 h-4 text-sky-600" />
                      <span className="hidden sm:inline">Ảnh câu hỏi</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (uploadEvt) => {
                              const base64 = uploadEvt.target?.result as string;
                              handleUpdateQuestion(qIdx, { ...q, image_url: base64 });
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  </div>

                  {/* Question Image Preview */}
                  {q.image_url && (
                    <div className="relative p-2 bg-slate-100 rounded-xl border border-slate-200 text-center">
                      <img
                        src={q.image_url}
                        alt={`Minh họa câu ${qIdx + 1}`}
                        className="max-h-40 rounded-lg mx-auto object-contain shadow-xs"
                      />
                      <button
                        type="button"
                        onClick={() => handleUpdateQuestion(qIdx, { ...q, image_url: '' })}
                        className="absolute top-2 right-2 bg-rose-500 text-white p-1 rounded-full hover:bg-rose-600 shadow-sm"
                        title="Xóa ảnh câu hỏi"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Options with + Image Buttons */}
                  <div className="space-y-1 pt-1">
                    <label className="text-[11px] font-bold text-slate-500 uppercase">
                      Lựa chọn đáp án (Bấm <span className="text-sky-600 font-extrabold">+ 🖼️</span> để thêm ảnh cho đáp án):
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {q.options?.map((opt, optIdx) => {
                        const optLabel = String.fromCharCode(65 + optIdx); // A, B, C, D
                        const optImg = q.option_images?.[optIdx];

                        return (
                          <div key={optIdx} className="p-2 rounded-xl border border-slate-200 bg-white space-y-2">
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                name={`correct_${qIdx}`}
                                checked={q.correct_answer === opt}
                                onChange={() => handleUpdateQuestion(qIdx, { ...q, correct_answer: opt })}
                                className="w-4 h-4 text-sky-600 focus:ring-sky-500 shrink-0"
                              />
                              <span className="text-xs font-black text-slate-500 w-4">{optLabel}.</span>
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
                                placeholder={`Lựa chọn ${optLabel}`}
                                className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
                              />
                              <label
                                title={`Thêm ảnh cho đáp án ${optLabel}`}
                                className="bg-slate-100 hover:bg-sky-50 text-slate-700 hover:text-sky-700 p-1.5 rounded-lg border border-slate-200 cursor-pointer shrink-0 flex items-center justify-center transition-all"
                              >
                                <Plus className="w-3.5 h-3.5 text-sky-600" />
                                <ImageIcon className="w-3.5 h-3.5 text-sky-600" />
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      const reader = new FileReader();
                                      reader.onload = (uploadEvt) => {
                                        const base64 = uploadEvt.target?.result as string;
                                        const newOptImgs = [...(q.option_images || ['', '', '', ''])];
                                        newOptImgs[optIdx] = base64;
                                        handleUpdateQuestion(qIdx, { ...q, option_images: newOptImgs });
                                      };
                                      reader.readAsDataURL(file);
                                    }
                                  }}
                                />
                              </label>
                            </div>

                            {/* Render option image preview if present */}
                            {optImg && (
                              <div className="relative p-1.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                                <img
                                  src={optImg}
                                  alt={`Ảnh lựa chọn ${optLabel}`}
                                  className="max-h-20 rounded-md object-contain mx-auto"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newOptImgs = [...(q.option_images || [])];
                                    newOptImgs[optIdx] = '';
                                    handleUpdateQuestion(qIdx, { ...q, option_images: newOptImgs });
                                  }}
                                  className="text-rose-600 hover:text-rose-800 p-1 font-bold text-xs"
                                  title="Xóa ảnh đáp án này"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
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
