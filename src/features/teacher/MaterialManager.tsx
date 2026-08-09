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

      const { error: dbErr } = await supabase.from('materials').insert({
        title: title.trim(),
        description: description.trim(),
        file_url: finalUrl,
        type: type,
        subject: subject,
        grade_level: gradeLevel,
        tags: tagsArray,
        author_id: user.id,
        is_public: isPublic,
      });

      if (dbErr) throw dbErr;

      setTitle('');
      setDescription('');
      setFileUrlInput('');
      setFile(null);
      fetchMaterials();
    } catch (err: any) {
      alert('Không thể tạo học liệu/game: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleAssignToClass = async () => {
    if (!assigningMaterial || !currentClass) return alert('Vui lòng chọn lớp học để giao bài.');

    try {
      const { error } = await supabase.from('assignments').insert({
        material_id: assigningMaterial.id,
        class_id: currentClass.id,
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
      });

      if (error) throw error;
      alert(`Đã giao "${assigningMaterial.title}" cho lớp ${currentClass.name} thành công!`);
      setAssigningMaterial(null);
    } catch (err: any) {
      alert('Lỗi khi giao bài tập: ' + err.message);
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

  return (
    <div className="space-y-6">
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
                placeholder="Ví dụ: Game Wordwall Phép Nhân Lớp 3"
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
                <option value="game_iframe">🎮 Game Nhúng iFrame (Wordwall, Quizizz, Kahoot)</option>
                <option value="game_html5">📦 Game HTML5 Packaged</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Phạm vi chia sẻ:</label>
              <select
                value={isPublic ? 'public' : 'private'}
                onChange={(e) => setIsPublic(e.target.value === 'public')}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
              >
                <option value="private">🔒 Dành riêng cho Lớp học</option>
                <option value="public">🌐 Công khai toàn hệ thống</option>
              </select>
            </div>
          </div>

          {/* Conditional Upload File vs URL iFrame */}
          {type === 'game_iframe' ? (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Đường dẫn iFrame / URL nhúng game (Wordwall/Quizizz/Kahoot):</label>
              <input
                type="url"
                value={fileUrlInput}
                onChange={(e) => setFileUrlInput(e.target.value)}
                placeholder="https://wordwall.net/embed/..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none font-mono"
                required
              />
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Chọn File tải lên Supabase Storage:</label>
              <input
                type="file"
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
              className="bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-all shadow-md flex items-center space-x-2"
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
