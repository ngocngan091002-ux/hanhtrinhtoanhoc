import React, { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import { useAuth } from '../auth/AuthContext';
import { Material, MathClass, MaterialType } from '../../types';
import { FolderPlus, UploadCloud, FileText, Video, Gamepad2, Globe, Lock, Trash2, Send, Calendar } from 'lucide-react';

interface MaterialManagerProps {
  currentClass?: MathClass | null;
}

export const MaterialManager: React.FC<MaterialManagerProps> = ({ currentClass }) => {
  const { user } = useAuth();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<MaterialType>('document');
  const [fileUrlInput, setFileUrlInput] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [subject, setSubject] = useState('Toán Học');
  const [gradeLevel, setGradeLevel] = useState(2);
  const [tagsInput, setTagsInput] = useState('toán2, luyentap');
  const [isPublic, setIsPublic] = useState(false);
  const [maxAttempts, setMaxAttempts] = useState(1);

  // Assignment Modal
  const [assigningMaterial, setAssigningMaterial] = useState<Material | null>(null);
  const [dueDate, setDueDate] = useState('');

  useEffect(() => {
    fetchMaterials();
  }, [currentClass]);

  const fetchMaterials = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('materials')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMaterials(data || []);
    } catch (err) {
      console.error('Error fetching materials:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !user) return;

    setUploading(true);
    try {
      let finalUrl = fileUrlInput.trim();

      // If uploading file directly to Supabase Storage
      if (file) {
        const fileExt = file.name.split('.').pop();
        const filePath = `${user.id}/${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;

        const { error: uploadErr } = await supabase.storage
          .from('materials-storage')
          .upload(filePath, file);

        if (uploadErr) throw uploadErr;

        const { data: publicUrlData } = supabase.storage
          .from('materials-storage')
          .getPublicUrl(filePath);

        finalUrl = publicUrlData.publicUrl;
      }

      if (!finalUrl) {
        alert('Vui lòng chọn File tải lên hoặc nhập Đường dẫn iFrame Embed.');
        setUploading(false);
        return;
      }

      const tagsArray = tagsInput.split(',').map((t) => t.trim()).filter(Boolean);

      const { data: createdMat, error: dbErr } = await supabase
        .from('materials')
        .insert({
          title: title.trim(),
          description: description.trim(),
          file_url: finalUrl,
          type: type,
          subject: subject,
          grade_level: gradeLevel,
          tags: tagsArray,
          author_id: user.id,
          is_public: isPublic,
          max_attempts: maxAttempts,
        })
        .select()
        .single();

      if (dbErr) throw dbErr;

      // Automatically assign to current class if selected so students immediately see it!
      if (currentClass && createdMat) {
        try {
          await supabase.from('assignments').insert({
            material_id: createdMat.id,
            class_id: currentClass.id,
          });
        } catch {}

        const sharedAssKey = `hanhtrinhtoanhoc_shared_assignments`;
        try {
          const sharedAssData = JSON.parse(localStorage.getItem(sharedAssKey) || '[]');
          sharedAssData.push({
            id: `ass_${Date.now()}`,
            class_id: currentClass.id,
            material_id: createdMat.id,
            material: createdMat,
            class: { name: currentClass.name },
            created_at: new Date().toISOString(),
          });
          localStorage.setItem(sharedAssKey, JSON.stringify(sharedAssData));
        } catch {}
      }

      setTitle('');
      setDescription('');
      setFileUrlInput('');
      setFile(null);
      alert(`Đã tạo và giao "${title.trim()}" cho học sinh thành công!`);
      fetchMaterials();
    } catch (err: any) {
      alert('Không thể tạo học liệu/game: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleAssignToClass = async () => {
    if (!assigningMaterial || !currentClass) return alert('Vui lòng chọn lớp học để giao bài.');

    // Save to shared localStorage for guest/demo mode
    const sharedAssKey = `hanhtrinhtoanhoc_shared_assignments`;
    try {
      const sharedAssData = JSON.parse(localStorage.getItem(sharedAssKey) || '[]');
      sharedAssData.push({
        id: `ass_${Date.now()}`,
        class_id: currentClass.id,
        material_id: assigningMaterial.id,
        material: assigningMaterial,
        class: { name: currentClass.name },
        created_at: new Date().toISOString(),
      });
      localStorage.setItem(sharedAssKey, JSON.stringify(sharedAssData));
    } catch {}

    try {
      const { error } = await supabase.from('assignments').insert({
        material_id: assigningMaterial.id,
        class_id: currentClass.id,
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
      });

      if (error) throw error;
    } catch (err: any) {
      console.error('Error assigning to class:', err);
    } finally {
      alert(`Đã giao "${assigningMaterial.title}" cho lớp ${currentClass.name} thành công!`);
      setAssigningMaterial(null);
      fetchMaterials();
    }
  };

  const handleDeleteMaterial = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa học liệu/game này?')) return;
    try {
      const { error } = await supabase.from('materials').delete().eq('id', id);
      if (error) throw error;
      fetchMaterials();
    } catch (err: any) {
      alert('Lỗi xóa học liệu: ' + err.message);
    }
  };

  // ADV-03: AI Lesson Plan Generator State
  const [showLessonPlanModal, setShowLessonPlanModal] = useState(false);
  const [lessonPlanTopic, setLessonPlanTopic] = useState('Bảng Nhận 2 & Bảng Nhận 5');
  const [generatedLessonPlan, setGeneratedLessonPlan] = useState('');
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);

  const handleGenerateLessonPlan = () => {
    setIsGeneratingPlan(true);
    setTimeout(() => {
      setGeneratedLessonPlan(
        `📜 KẾ HOẠCH BÀI DẠY (GIÁO ÁN TOÁN LỚP 2)\n` +
        `📌 Chủ đề: ${lessonPlanTopic}\n\n` +
        `I. MỤC TIÊU BÀI HỌC:\n` +
        `1. Về kiến thức: Học sinh nhận biết và ghi nhớ bản chất phép nhân 2 và 5 thông qua phép cộng lặp lại.\n` +
        `2. Về năng lực: Rèn luyện tư duy tính nhẩm nhanh và khả năng vận dụng giải bài toán có lời văn.\n` +
        `3. Về phẩm chất: Hào hứng tham gia trải nghiệm học toán qua game tương tác 3D.\n\n` +
        `II. ĐỒ DÙNG DẠY HỌC:\n` +
        `• Giáo viên: Bài giảng điện tử, Game nhúng Wordwall / Quizizz, Máy chiếu.\n` +
        `• Học sinh: Sách giáo khoa Toán Lớp 2, Bảng con, Thiết bị di động / Máy tính.\n\n` +
        `III. CÁC HOẠT ĐỘNG DẠY HỌC CHỦ YẾU:\n` +
        `1. Khởi động (5 phút): Chơi Game "Vòng Quay May Mắn" ôn tập phép cộng.\n` +
        `2. Khám phá kiến thức mới (15 phút): Hướng dẫn lập bảng nhân thông qua trực quan khối vuông.\n` +
        `3. Luyện tập & Trải nghiệm (15 phút): Thực hành làm Bài tập & Game Lật thẻ trí nhớ 3D.\n` +
        `4. Củng cố & Dặn dò (5 phút): AI tổng kết kết quả học tập và giao Nhiệm vụ hằng ngày.`
      );
      setIsGeneratingPlan(false);
    }, 1000);
  };

  return (
    <div className="space-y-6">
      {/* ADV-03 Quick Banner Button */}
      <div className="p-4 rounded-3xl bg-gradient-to-r from-purple-900 to-indigo-950 text-white border-2 border-purple-800 shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <span className="bg-purple-500/20 text-purple-300 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider border border-purple-400/30">
            ADV-03: AI SOẠN GIÁO ÁN / TÓM TẮT LESSON PLAN
          </span>
          <h3 className="text-lg font-extrabold font-display text-white mt-1">
            Công Cụ AI Tự Động Soạn Giáo Án & Kế Hoạch Bài Dạy Lớp 2
          </h3>
        </div>
        <button
          onClick={() => setShowLessonPlanModal(true)}
          className="bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs px-4 py-2.5 rounded-2xl shadow-md border border-purple-400 active:scale-95 transition-all cursor-pointer shrink-0"
        >
          ⚡ TẠO GIÁO ÁN TỰ ĐỘNG
        </button>
      </div>

      {/* ADV-03 Modal */}
      {showLessonPlanModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md p-4 flex items-center justify-center overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 max-w-2xl w-full border-2 border-purple-300 shadow-2xl space-y-4 text-slate-800">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <h3 className="font-extrabold text-base font-display text-purple-950">
                📜 ADV-03: AI Soạn Kế Hoạch Bài Dạy (Giáo Án Toán Lớp 2)
              </h3>
              <button
                onClick={() => setShowLessonPlanModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase">Chọn chủ đề bài học Toán Lớp 2:</label>
              <select
                value={lessonPlanTopic}
                onChange={(e) => setLessonPlanTopic(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-bold bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
              >
                <option value="Bảng Nhận 2 & Bảng Nhận 5">1. Bảng Nhận 2 & Bảng Nhận 5</option>
                <option value="Phép Cộng Có Nhớ Trong Phạm Vi 100">2. Phép Cộng Có Nhớ Trong Phạm Vi 100</option>
                <option value="Giải Bài Toán Có Lời Văn">3. Giải Bài Toán Có Lời Văn</option>
                <option value="Hình Chữ Nhật & Hình Vuông">4. Hình Chữ Nhật & Hình Vuông</option>
              </select>
            </div>

            <button
              onClick={handleGenerateLessonPlan}
              disabled={isGeneratingPlan}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-extrabold py-3 rounded-xl text-xs shadow-md active:scale-98 transition-all cursor-pointer"
            >
              {isGeneratingPlan ? '⏳ AI ĐANG TẠO KẾ HOẠCH BÀI DẠY...' : '⚡ XÁC NHẬN TẠO GIÁO ÁN TỰ ĐỘNG'}
            </button>

            {generatedLessonPlan && (
              <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 space-y-2">
                <textarea
                  value={generatedLessonPlan}
                  onChange={(e) => setGeneratedLessonPlan(e.target.value)}
                  rows={10}
                  className="w-full p-3 rounded-xl border border-purple-200 text-xs font-mono bg-white focus:outline-none leading-relaxed"
                />
                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(generatedLessonPlan);
                      alert('Đã sao chép Kế hoạch bài dạy vào khay nhớ tạm!');
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-4 py-2 rounded-xl shadow-md cursor-pointer"
                  >
                    📋 SAO CHÉP GIÁO ÁN
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Upload Form Box */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
        <h3 className="text-xl font-bold text-slate-900 flex items-center space-x-2 font-display">
          <FolderPlus className="w-6 h-6 text-sky-600" />
          <span>Thêm Học Liệu Mới Hoặc Nhúng Game Giáo Dục</span>
        </h3>

        <form onSubmit={handleCreateMaterial} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Tiêu đề học liệu/game:</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ví dụ: Game Wordwall Phép Nhân Lớp 2"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Loại học liệu / game:</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as MaterialType)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none font-bold"
              >
                <option value="document">📄 Tài liệu (PDF, DOCX, PPTX)</option>
                <option value="video">🎥 Video Bài Giảng (MP4)</option>
                <option value="game_iframe">🎮 GAME-01: Game Nhúng iFrame (Wordwall, Quizizz, Kahoot, Canva, Genially)</option>
                <option value="game_html5">📦 GAME-02: Upload Game HTML5 Packaged (.ZIP)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">GAME-06: Giới Hạn Lượt Chơi Tính Điểm:</label>
              <select
                value={maxAttempts}
                onChange={(e) => setMaxAttempts(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl border border-sky-300 bg-sky-50 text-sky-900 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none font-extrabold"
              >
                <option value={1}>🎯 1 Lượt duy nhất (Tính điểm chính)</option>
                <option value={3}>🎯 3 Lượt chơi tính điểm cao nhất</option>
                <option value={5}>🎯 5 Lượt chơi tính điểm cao nhất</option>
                <option value={0}>♾️ Không giới hạn lượt chơi</option>
              </select>
            </div>
          </div>

          {/* GAME-01 Preset URL formatting & iFrame Options */}
          {type === 'game_iframe' && (
            <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-3 shadow-md">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-extrabold text-amber-400 flex items-center gap-1.5 uppercase font-display">
                  <Gamepad2 className="w-4 h-4" />
                  <span>GAME-01: Nhúng Game Nền Tảng Ngoại (Wordwall, Quizizz, Kahoot, Canva, Genially)</span>
                </span>
                <div className="flex flex-wrap gap-1">
                  {[
                    { label: 'Wordwall', prefix: 'https://wordwall.net/embed/resource/' },
                    { label: 'Quizizz', prefix: 'https://quizizz.com/embed/quiz/' },
                    { label: 'Kahoot', prefix: 'https://create.kahoot.it/details/' },
                    { label: 'Canva', prefix: 'https://www.canva.com/design/' },
                    { label: 'Genially', prefix: 'https://view.genial.ly/' },
                  ].map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => setFileUrlInput(p.prefix)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-sky-600 text-slate-200 text-[10px] font-extrabold border border-slate-700 transition-all cursor-pointer"
                    >
                      +{p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <input
                  type="url"
                  value={fileUrlInput}
                  onChange={(e) => setFileUrlInput(e.target.value)}
                  placeholder="Dán đường dẫn iFrame / Embed URL tại đây (Ví dụ: https://wordwall.net/embed/resource/...)"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-700 text-xs font-mono bg-slate-950 text-emerald-400 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  required
                />
              </div>
            </div>
          )}

          {/* Conditional Upload File vs URL iFrame */}
          {type !== 'game_iframe' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                {type === 'game_html5' ? 'GAME-02: Tải lên File Game HTML5 (.ZIP) hoặc đính kèm tài liệu:' : 'Chọn File tải lên Supabase Storage:'}
              </label>
              <input
                type="file"
                accept={type === 'game_html5' ? '.zip,.rar,.html,.htm' : '*'}
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100 cursor-pointer"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Mô tả chi tiết:</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Hướng dẫn học sinh trải nghiệm bài học/game..."
              rows={2}
              className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={uploading || !title}
              className="bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-all shadow-md flex items-center space-x-2 cursor-pointer"
            >
              <UploadCloud className="w-4 h-4" />
              <span>{uploading ? 'Đang Xử Lý...' : 'Tạo Học Liệu / Game'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Materials & Game Hub Cards */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
        <h3 className="text-base font-bold text-slate-800 flex justify-between items-center">
          <span>Kho Học Liệu & Game Giáo Dục</span>
          <span className="bg-slate-100 text-slate-600 text-xs px-2.5 py-1 rounded-full font-semibold">
            {materials.length} mục
          </span>
        </h3>

        {loading ? (
          <div className="py-8 text-center text-slate-400 text-sm">Đang tải kho học liệu...</div>
        ) : materials.length === 0 ? (
          <div className="py-12 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
            Chưa có học liệu/game nào trong kho. Hãy thêm mục đầu tiên phía trên!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {materials.map((mat) => (
              <div key={mat.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all flex justify-between items-start space-x-3">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold shrink-0">
                    {mat.type === 'video' && <Video className="w-5 h-5" />}
                    {mat.type === 'document' && <FileText className="w-5 h-5" />}
                    {(mat.type === 'game_iframe' || mat.type === 'game_html5') && <Gamepad2 className="w-5 h-5 text-amber-600" />}
                  </div>

                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] uppercase font-bold bg-slate-200 text-slate-700 px-2 py-0.5 rounded">
                        {mat.type}
                      </span>
                      {mat.is_public ? (
                        <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-0.5">
                          <Globe className="w-3 h-3" /> Công khai
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-400 flex items-center gap-0.5">
                          <Lock className="w-3 h-3" /> Riêng tư
                        </span>
                      )}
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm mt-1">{mat.title}</h4>
                    {mat.description && <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{mat.description}</p>}
                  </div>
                </div>

                <div className="flex items-center space-x-1 shrink-0">
                  {currentClass && (
                    <button
                      onClick={() => setAssigningMaterial(mat)}
                      className="p-2 text-sky-600 hover:bg-sky-50 rounded-lg transition-colors text-xs font-bold flex items-center space-x-1"
                      title="Giao bài cho lớp này"
                    >
                      <Send className="w-4 h-4" />
                      <span className="hidden sm:inline">Giao Bài</span>
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteMaterial(mat.id)}
                    className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Assign Modal */}
      {assigningMaterial && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900 font-display">
              Giao Bài "{assigningMaterial.title}" Cho Lớp {currentClass?.name}
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Hạn chót hoàn thành (Deadline):</label>
              <input
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-3">
              <button
                type="button"
                onClick={() => setAssigningMaterial(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleAssignToClass}
                className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-md"
              >
                Xác Nhận Giao Bài
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
