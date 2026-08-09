import React, { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import { useAuth } from '../auth/AuthContext';
import { Assignment, MathClass, Question } from '../../types';
import { generateAIQuestions } from '../../config/gemini';
import { BookOpenCheck, Plus, Sparkles, Eye, Send, Edit, Trash2, HelpCircle, Image as ImageIcon, Upload, X, Link as LinkIcon } from 'lucide-react';

interface AssignmentManagerProps {
  currentClass?: MathClass | null;
}

const LOCAL_ASSIGNMENTS_KEY = 'hanhtrinhtoanhoc_local_assignments';

// Helper function to compress and resize image before converting to base64
const compressAndResizeImage = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        } else {
          resolve(e.target?.result as string);
        }
      };
      img.onerror = () => resolve(e.target?.result as string);
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
};

export const AssignmentManager: React.FC<AssignmentManagerProps> = ({ currentClass }) => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'homework' | 'weekly_test'>('homework');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState(30);
  const [questions, setQuestions] = useState<Question[]>([]);
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
      const generated = await generateAIQuestions(aiTopic, currentClass?.grade || 2, 4);
      setQuestions([...questions, ...generated]);
    } catch (err: any) {
      alert('Không thể tạo câu hỏi AI: ' + err.message);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const createDefaultQuestion = (index: number = 1): Question => ({
    id: 'q_' + Date.now() + '_' + index,
    prompt: '',
    options: ['Lựa chọn A', 'Lựa chọn B', 'Lựa chọn C', 'Lựa chọn D'],
    option_images: ['', '', '', ''],
    correct_answer: 'Lựa chọn A',
    explanation: '',
  });

  const handleAddQuestionManual = () => {
    setQuestions([...questions, createDefaultQuestion(questions.length + 1)]);
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

    try {
      const payload: any = {
        id: targetId,
        class_id: currentClass.id,
        teacher_id: user.id,
        title: title.trim(),
        type: type,
        description: description.trim() || 'Bài tập toán học tương tác',
        duration_minutes: duration,
        questions_json: JSON.stringify(questions),
        status: status,
        updated_at: new Date().toISOString(),
      };

      const { data: existing } = await supabase.from('assignments').select('id').eq('id', targetId).single();
      if (existing) {
        await supabase.from('assignments').update(payload).eq('id', targetId);
      } else {
        await supabase.from('assignments').insert([{ ...payload, created_at: new Date().toISOString() }]);
      }
    } catch (err) {
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
    } catch (err) {}
  };

  const handleDeleteAssignment = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa bài tập này?')) return;

    removeLocalAssignment(id);
    setAssignments((prev) => prev.filter((a) => a.id !== id));

    try {
      await supabase.from('assignments').delete().eq('id', id);
    } catch (err) {}
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
    setQuestions([createDefaultQuestion(1)]);
    setShowModal(true);
  };

  const openEditModal = (a: Assignment) => {
    setTitle(a.title || '');
    setType(a.type || 'homework');
    setDescription(a.description || '');
    setDuration(a.duration_minutes || 30);
    
    let loadedQs: Question[] = [];
    if (a.questions_json) {
      if (Array.isArray(a.questions_json)) {
        loadedQs = a.questions_json;
      } else if (typeof a.questions_json === 'string') {
        try {
          loadedQs = JSON.parse(a.questions_json);
        } catch (e) {}
      }
    }
    if (loadedQs.length === 0) {
      loadedQs = [createDefaultQuestion(1)];
    }
    setQuestions(loadedQs);
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
            <span>Bài Tập & Bài Kiểm Tra Lớp {currentClass.name}</span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Soạn thảo, giao bài tập về nhà và đề kiểm tra hằng tuần cho học sinh.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="bg-sky-600 hover:bg-sky-700 text-white font-bold px-5 py-2.5 rounded-xl shadow-md transition-all flex items-center space-x-2 text-sm shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo Bài Tập Mới</span>
        </button>
      </div>

      {/* Assignment List */}
      {loading ? (
        <div className="py-8 text-center text-slate-400 text-sm">Đang tải danh sách bài tập...</div>
      ) : assignments.length === 0 ? (
        <div className="bg-white p-12 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
          Chưa có bài tập nào. Hãy bấm "Tạo Bài Tập Mới" ở trên nhé!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {assignments.map((a) => {
            const qCount = Array.isArray(a.questions_json)
              ? a.questions_json.length
              : typeof a.questions_json === 'string'
              ? (JSON.parse(a.questions_json || '[]') as any[]).length
              : 0;

            return (
              <div key={a.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                        a.type === 'weekly_test'
                          ? 'bg-rose-100 text-rose-700 border border-rose-200'
                          : 'bg-sky-100 text-sky-700 border border-sky-200'
                      }`}
                    >
                      {a.type === 'weekly_test' ? 'Bài Kiểm Tra Tuần' : 'Bài Tập Về Nhà'}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-1 font-display">{a.title}</h3>
                  </div>

                  <span
                    className={`text-[10px] font-extrabold px-2.5 py-1 rounded-xl ${
                      a.status === 'published'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}
                  >
                    {a.status === 'published' ? 'Đã Giao Bài' : 'Bản Nháp'}
                  </span>
                </div>

                <p className="text-xs text-slate-500 line-clamp-2">{a.description}</p>

                <div className="flex items-center text-xs text-slate-400 space-x-4 pt-2 border-t border-slate-50">
                  <span>⏱️ {a.duration_minutes} phút</span>
                  <span>❓ {qCount} câu hỏi</span>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={() => handlePublishToggle(a)}
                    className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center space-x-1 ${
                      a.status === 'published'
                        ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    }`}
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{a.status === 'published' ? 'Thu Hồi Bài' : 'Giao Cho Học Sinh'}</span>
                  </button>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => openEditModal(a)}
                      className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg"
                      title="Sửa bài tập"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteAssignment(a.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                      title="Xóa bài tập"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Soạn Thảo Bài Tập */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-3xl w-full shadow-2xl space-y-6 my-8 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-3 font-display">
              {editingId ? '✏️ Cập Nhật Bài Tập' : '➕ Tạo Bài Tập Mới'}
            </h3>

            {/* General Info Form */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tiêu đề bài tập:</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ví dụ: Ôn tập phép cộng có nhớ phạm vi 100..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Loại bài làm:</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold bg-white"
                >
                  <option value="homework">Bài Tập Về Nhà</option>
                  <option value="weekly_test">Bài Kiểm Tra Tuần</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Thời gian làm bài (Phút):</label>
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value) || 15)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mô tả hướng dẫn:</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Hướng dẫn cho học sinh..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                />
              </div>
            </div>

            {/* Questions Header */}
            <div className="flex justify-between items-center pt-4 border-t border-slate-100">
              <h4 className="font-bold text-slate-900 text-sm">Danh Sách Câu Hỏi ({questions.length} câu)</h4>
              <button
                type="button"
                onClick={handleAddQuestionManual}
                className="bg-sky-50 hover:bg-sky-100 text-sky-700 font-extrabold px-3 py-1.5 rounded-xl text-xs border border-sky-200 transition-all flex items-center space-x-1"
              >
                <Plus className="w-4 h-4 text-sky-600" />
                <span>+ Thêm Câu Hỏi Tiếp Theo</span>
              </button>
            </div>

            {/* Questions List */}
            <div className="space-y-6">
              {questions.map((q, qIdx) => (
                <div key={q.id || qIdx} className="p-5 rounded-2xl border-2 border-slate-200 bg-slate-50/70 space-y-4 shadow-sm">
                  {/* Question Header */}
                  <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                    <span className="bg-sky-600 text-white font-extrabold text-xs px-3 py-1 rounded-xl shadow-xs">
                      Câu {qIdx + 1}
                    </span>

                    {questions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveQuestion(qIdx)}
                        className="text-rose-600 hover:bg-rose-50 px-2.5 py-1 rounded-lg text-xs font-bold transition-colors"
                      >
                        Xóa câu này
                      </button>
                    )}
                  </div>

                  {/* Question Prompt Input + Image Upload Options */}
                  <div className="space-y-2 p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                    <label className="block text-xs font-extrabold text-slate-800 uppercase">
                      Nội dung đề câu hỏi {qIdx + 1}:
                    </label>
                    <input
                      type="text"
                      value={q.prompt}
                      onChange={(e) => handleUpdateQuestion(qIdx, { ...q, prompt: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none shadow-xs"
                      placeholder="Nhập nội dung câu hỏi mới..."
                    />

                    {/* Image Attachment Controls for Question */}
                    <div className="pt-2 border-t border-slate-100 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-sky-800 uppercase flex items-center gap-1">
                          <ImageIcon className="w-3.5 h-3.5 text-sky-600" />
                          <span>Ảnh minh họa câu hỏi {qIdx + 1}:</span>
                        </span>
                        {q.image_url && (
                          <button
                            type="button"
                            onClick={() => handleUpdateQuestion(qIdx, { ...q, image_url: '' })}
                            className="text-[11px] font-bold text-rose-600 hover:underline flex items-center gap-0.5"
                          >
                            <X className="w-3.5 h-3.5" /> Xóa ảnh
                          </button>
                        )}
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          value={q.image_url || ''}
                          onChange={(e) => handleUpdateQuestion(qIdx, { ...q, image_url: e.target.value })}
                          placeholder="Dán liên kết URL ảnh (https://...)..."
                          className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white font-medium"
                        />
                        <label className="bg-sky-600 hover:bg-sky-700 text-white font-extrabold px-3 py-2 rounded-xl text-xs shadow-xs cursor-pointer shrink-0 flex items-center justify-center space-x-1.5 transition-all active:scale-95">
                          <Upload className="w-3.5 h-3.5" />
                          <span>Tải Ảnh Từ Máy</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const base64 = await compressAndResizeImage(file);
                                handleUpdateQuestion(qIdx, { ...q, image_url: base64 });
                              }
                            }}
                          />
                        </label>
                      </div>

                      {q.image_url && (
                        <div className="mt-2 p-2 bg-slate-50 rounded-xl border border-slate-200 text-center">
                          <img
                            src={q.image_url}
                            alt={`Minh họa câu ${qIdx + 1}`}
                            className="max-h-48 rounded-lg mx-auto object-contain shadow-xs bg-white p-1"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Options with Image Uploads */}
                  <div className="space-y-2 pt-2 border-t border-slate-200/60">
                    <label className="block text-xs font-bold text-slate-600 uppercase">
                      Lựa chọn đáp án (Mỗi lựa chọn A, B, C, D đều có ô nhập văn bản và nút <span className="text-sky-600 font-black">Tải ảnh / Dán URL ảnh</span> riêng biệt):
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {q.options?.map((opt, optIdx) => {
                        const optLabel = String.fromCharCode(65 + optIdx); // A, B, C, D
                        const optImg = q.option_images?.[optIdx];

                        return (
                          <div key={optIdx} className="p-3 rounded-2xl border-2 border-slate-200 bg-white space-y-2.5 shadow-2xs">
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                name={`correct_${qIdx}`}
                                checked={q.correct_answer === opt}
                                onChange={() => handleUpdateQuestion(qIdx, { ...q, correct_answer: opt })}
                                className="w-4 h-4 text-sky-600 focus:ring-sky-500 shrink-0"
                              />
                              <span className="text-xs font-black text-slate-700 w-4">{optLabel}.</span>
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
                                className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold focus:ring-2 focus:ring-sky-500 focus:outline-none"
                              />
                            </div>

                            {/* Option Image Controls */}
                            <div className="pt-2 border-t border-slate-100 space-y-1.5">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="font-bold text-slate-600">Ảnh đáp án {optLabel}:</span>
                                {optImg && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newOptImgs = [...(q.option_images || [])];
                                      newOptImgs[optIdx] = '';
                                      handleUpdateQuestion(qIdx, { ...q, option_images: newOptImgs });
                                    }}
                                    className="text-rose-600 font-bold hover:underline text-[10px]"
                                  >
                                    Xóa ảnh
                                  </button>
                                )}
                              </div>

                              <div className="flex gap-1.5">
                                <input
                                  type="text"
                                  value={optImg || ''}
                                  onChange={(e) => {
                                    const newOptImgs = [...(q.option_images || ['', '', '', ''])];
                                    newOptImgs[optIdx] = e.target.value;
                                    handleUpdateQuestion(qIdx, { ...q, option_images: newOptImgs });
                                  }}
                                  placeholder="URL ảnh..."
                                  className="flex-1 px-2 py-1 rounded-lg border border-slate-200 text-[11px] font-medium"
                                />
                                <label className="bg-sky-600 hover:bg-sky-700 text-white font-extrabold px-2.5 py-1 rounded-lg border border-sky-600 cursor-pointer text-[11px] shrink-0 flex items-center space-x-1 shadow-2xs transition-all active:scale-95">
                                  <Upload className="w-3 h-3" />
                                  <span>Tải Ảnh</span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={async (e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        const base64 = await compressAndResizeImage(file);
                                        const newOptImgs = [...(q.option_images || ['', '', '', ''])];
                                        newOptImgs[optIdx] = base64;
                                        handleUpdateQuestion(qIdx, { ...q, option_images: newOptImgs });
                                      }
                                    }}
                                  />
                                </label>
                              </div>

                              {optImg && (
                                <div className="mt-1 p-1 bg-slate-50 rounded-lg border border-slate-200 text-center">
                                  <img
                                    src={optImg}
                                    alt={`Ảnh lựa chọn ${optLabel}`}
                                    className="max-h-24 rounded object-contain mx-auto bg-white p-1"
                                  />
                                </div>
                              )}
                            </div>
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
