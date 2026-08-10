import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../config/supabase';
import { useAuth } from '../auth/AuthContext';
import { MathClass, ClassMember, UserProfile } from '../../types';
import { Users, Plus, UserPlus, Copy, Check, School, Trash2, FileSpreadsheet, Download, Upload } from 'lucide-react';

interface ClassManagementProps {
  onSelectClass?: (cls: MathClass) => void;
  selectedClassId?: string;
}

export const ClassManagement: React.FC<ClassManagementProps> = ({ onSelectClass, selectedClassId }) => {
  const { user } = useAuth();
  const [classes, setClasses] = useState<ActiveClassWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [className, setClassName] = useState('');
  const [classDescription, setClassDescription] = useState('');
  const [selectedClass, setSelectedClass] = useState<ActiveClassWithCount | null>(null);
  const [members, setMembers] = useState<ClassMember[]>([]);
  const [studentEmail, setStudentEmail] = useState('');
  const [csvContent, setCsvContent] = useState('');
  const [showCsvImport, setShowCsvImport] = useState(false);
  const [addMessage, setAddMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  type ActiveClassWithCount = MathClass & { member_count?: number };

  useEffect(() => {
    if (user) fetchClasses();
  }, [user]);

  const fetchClasses = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('*, class_members(count)')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formatted = (data || []).map((c: any) => ({
        ...c,
        member_count: c.class_members?.[0]?.count || 0,
      }));

      setClasses(formatted);
      if (formatted.length > 0 && !selectedClass) {
        handleSelectClass(formatted[0]);
      }
    } catch (err) {
      console.error('Error fetching classes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectClass = async (cls: ActiveClassWithCount) => {
    setSelectedClass(cls);
    if (onSelectClass) onSelectClass(cls);
    fetchMembers(cls.id);
  };

  const fetchMembers = async (classId: string) => {
    try {
      const { data, error } = await supabase
        .from('class_members')
        .select('*, student:profiles(*)')
        .eq('class_id', classId);

      if (error) throw error;
      setMembers(data || []);
    } catch (err) {
      console.error('Error fetching class members:', err);
    }
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!className.trim() || !user) return;

    // Generate random 6-character unique join code
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();

    try {
      const { data, error } = await supabase
        .from('classes')
        .insert({
          name: className.trim(),
          description: classDescription.trim(),
          code: code,
          teacher_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      setShowCreateModal(false);
      setClassName('');
      setClassDescription('');
      fetchClasses();
      if (data) handleSelectClass(data);
    } catch (err: any) {
      alert('Không thể tạo lớp: ' + err.message);
    }
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentEmail.trim() || !selectedClass) return;

    setAddMessage(null);
    try {
      const { data: studentProfile, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', studentEmail.trim())
        .single();

      if (profileErr || !studentProfile) {
        setAddMessage({
          type: 'error',
          text: 'Không tìm thấy tài khoản với email này. Vui lòng kiểm tra lại.',
        });
        return;
      }

      const { error: insertErr } = await supabase
        .from('class_members')
        .insert({
          class_id: selectedClass.id,
          student_id: studentProfile.id,
        });

      if (insertErr) {
        if (insertErr.code === '23505') {
          setAddMessage({ type: 'error', text: 'Học sinh này đã có trong lớp!' });
        } else {
          throw insertErr;
        }
        return;
      }

      setAddMessage({ type: 'success', text: `Đã thêm thành công học sinh ${studentProfile.full_name}!` });
      setStudentEmail('');
      fetchMembers(selectedClass.id);
      fetchClasses();
    } catch (err: any) {
      setAddMessage({ type: 'error', text: err.message || 'Lỗi khi thêm học sinh' });
    }
  };

  const handleImportCsv = async () => {
    if (!csvContent.trim() || !selectedClass) return;
    const emails = csvContent
      .split('\n')
      .map((line) => line.trim())
      .filter((e) => e.length > 0 && e.includes('@'));

    if (emails.length === 0) return alert('Không tìm thấy email hợp lệ trong nội dung CSV.');

    let count = 0;
    for (const email of emails) {
      try {
        const { data: studentProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', email)
          .single();

        if (studentProfile) {
          await supabase.from('class_members').insert({
            class_id: selectedClass.id,
            student_id: studentProfile.id,
          });
          count++;
        }
      } catch (err) {
        // Continue silently for duplicates
      }
    }

    alert(`Đã nhập thành công ${count}/${emails.length} học sinh vào lớp!`);
    setCsvContent('');
    setShowCsvImport(false);
    fetchMembers(selectedClass.id);
    fetchClasses();
  };

  const handleRemoveStudent = async (memberId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa học sinh này khỏi lớp?')) return;
    try {
      const { error } = await supabase.from('class_members').delete().eq('id', memberId);
      if (error) throw error;
      if (selectedClass) {
        fetchMembers(selectedClass.id);
        fetchClasses();
      }
    } catch (err: any) {
      alert('Không thể xóa học sinh: ' + err.message);
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setCsvContent(text);
        setShowCsvImport(true);
      }
    };
    reader.readAsText(file, 'UTF-8');
  };

  const exportToCsv = () => {
    if (!selectedClass || members.length === 0) return alert('Lớp chưa có học sinh nào để xuất file.');

    let csv = '\uFEFF'; // UTF-8 BOM for Windows Excel compatibility
    csv += 'STT,Họ và Tên,Email,Ngày Tham Gia\n';

    members.forEach((m, idx) => {
      const name = `"${(m.student?.full_name || 'Học sinh').replace(/"/g, '""')}"`;
      const email = `"${(m.student?.email || '').replace(/"/g, '""')}"`;
      const date = `"${new Date(m.joined_at).toLocaleDateString('vi-VN')}"`;
      csv += `${idx + 1},${name},${email},${date}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const safeName = selectedClass.name.replace(/\s+/g, '_');
    link.setAttribute('download', `Danh_Sach_Hoc_Sinh_${safeName}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyClassCode = () => {
    if (!selectedClass) return;
    navigator.clipboard.writeText(selectedClass.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2 font-display">
            <School className="w-7 h-7 text-sky-600" />
            <span>Quản Lý Lớp Học & Mã Gia Nhập</span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Tạo lớp, cung cấp Mã Gia Nhập (Join Code) cho học sinh hoặc Import danh sách Email/CSV.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center space-x-2 bg-sky-600 hover:bg-sky-700 text-white font-bold px-4 py-2.5 rounded-xl shadow-md transition-all text-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo Lớp Mới</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Class List Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center justify-between">
            <span>Danh Sách Lớp Học</span>
            <span className="bg-slate-100 text-slate-600 text-xs px-2.5 py-1 rounded-full font-semibold">
              {classes.length} lớp
            </span>
          </h3>

          {loading ? (
            <div className="py-8 text-center text-slate-400 text-sm">Đang tải danh sách lớp...</div>
          ) : classes.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-sm border-2 border-dashed border-slate-200 rounded-xl p-4">
              Chưa có lớp học nào. Hãy bấm "Tạo Lớp Mới" để bắt đầu!
            </div>
          ) : (
            <div className="space-y-3">
              {classes.map((cls) => {
                const isSelected = selectedClass?.id === cls.id;
                return (
                  <button
                    key={cls.id}
                    onClick={() => handleSelectClass(cls)}
                    className={`w-full text-left p-4 rounded-xl border transition-all flex items-center justify-between ${
                      isSelected
                        ? 'border-sky-500 bg-sky-50/70 text-sky-950 shadow-sm font-semibold'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-base">{cls.name}</div>
                      <div className="text-xs text-slate-500 flex items-center gap-2 mt-1">
                        <span>Mã Join: <code className="bg-white px-1.5 py-0.5 rounded border text-sky-700 font-mono font-bold">{cls.code}</code></span>
                      </div>
                    </div>
                    <div className="flex items-center text-xs font-bold text-slate-500 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                      <Users className="w-3.5 h-3.5 mr-1 text-sky-600" />
                      {cls.member_count} HS
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Student Roster & Add Methods */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          {selectedClass ? (
            <div className="space-y-6">
              {/* Selected Class Header Info */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 rounded-xl bg-slate-50 border border-slate-200 gap-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{selectedClass.name}</h3>
                  <div className="text-xs text-slate-500 mt-1 flex items-center space-x-2">
                    <span>Mã Gia Nhập Lớp (Join Code):</span>
                    <span className="font-mono font-bold text-sky-700 bg-white px-2 py-0.5 rounded border border-slate-200 text-sm">
                      {selectedClass.code}
                    </span>
                    <button
                      onClick={copyClassCode}
                      className="text-xs text-sky-600 hover:text-sky-800 font-medium inline-flex items-center ml-2"
                    >
                      {copiedCode ? <Check className="w-3.5 h-3.5 mr-1 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                      {copiedCode ? 'Đã chép' : 'Sao chép mã'}
                    </button>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-2xl font-black text-sky-600 font-display">{members.length}</div>
                  <div className="text-xs text-slate-500">Học sinh trong lớp</div>
                </div>
              </div>

              {/* Add Methods Bar */}
              <div className="space-y-3">
                <form onSubmit={handleAddStudent} className="bg-sky-50/50 p-4 rounded-xl border border-sky-100">
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-bold text-slate-800 flex items-center gap-1.5">
                      <UserPlus className="w-4 h-4 text-sky-600" />
                      <span>Thêm học sinh trực tiếp qua Email:</span>
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="file"
                        accept=".csv,.txt"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-xs font-bold bg-sky-100 hover:bg-sky-200 text-sky-800 px-3 py-1.5 rounded-lg border border-sky-300 transition-all flex items-center gap-1 shadow-2xs"
                        title="Chọn file CSV / TXT chứa danh sách email từ máy tính"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>📂 Chọn File CSV Tải Lên</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowCsvImport(!showCsvImport)}
                        className="text-xs font-bold text-sky-700 hover:text-sky-900 flex items-center gap-1"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                        {showCsvImport ? 'Ẩn Dán CSV' : 'Dán Mã CSV'}
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={studentEmail}
                      onChange={(e) => setStudentEmail(e.target.value)}
                      placeholder="Nhập email học sinh (vd: hocsinh@gmail.com)"
                      className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                    />
                    <button
                      type="submit"
                      className="bg-sky-600 hover:bg-sky-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-sm flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                    >
                      <Plus className="w-4 h-4" /> Thêm
                    </button>
                  </div>

                  {addMessage && (
                    <div className={`mt-3 p-3 rounded-lg text-xs font-medium ${addMessage.type === 'success' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                      {addMessage.text}
                    </div>
                  )}
                </form>

                {/* CSV Import Modal / Box */}
                {showCsvImport && (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                    <label className="block text-xs font-bold text-slate-700">
                      Dán danh sách Email học sinh (mỗi dòng 1 email):
                    </label>
                    <textarea
                      value={csvContent}
                      onChange={(e) => setCsvContent(e.target.value)}
                      rows={4}
                      placeholder="hocsinh1@gmail.com&#10;hocsinh2@gmail.com"
                      className="w-full p-3 rounded-xl border border-slate-200 text-xs font-mono bg-white"
                    />
                    <div className="flex justify-end">
                      <button
                        onClick={handleImportCsv}
                        className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-md"
                      >
                        Xác Nhận Import Danh Sách
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Members Roster Table */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-sm font-bold text-slate-800">Sĩ Số Học Sinh Thuộc Lớp</h4>
                  <button
                    onClick={exportToCsv}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-4 py-2 rounded-xl border border-emerald-500 shadow-md transition-all flex items-center space-x-1.5 active:scale-95 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>📊 XUẤT FILE DANH SÁCH LỚP (EXCEL/CSV)</span>
                  </button>
                </div>
                {members.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-sm border border-slate-200 rounded-xl">
                    Lớp chưa có học sinh nào. Hãy đưa Mã Join Code cho học sinh hoặc nhập Email để thêm nhé!
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left text-sm text-slate-700">
                      <thead className="bg-slate-50 text-slate-500 uppercase text-xs border-b border-slate-200 font-bold">
                        <tr>
                          <th className="px-4 py-3">STT</th>
                          <th className="px-4 py-3">Họ và tên</th>
                          <th className="px-4 py-3">Email</th>
                          <th className="px-4 py-3">Ngày tham gia</th>
                          <th className="px-4 py-3 text-right">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {members.map((m, idx) => (
                          <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="px-4 py-3 text-slate-400 font-mono text-xs">{idx + 1}</td>
                            <td className="px-4 py-3 font-bold text-slate-900">{m.student?.full_name || 'Học sinh'}</td>
                            <td className="px-4 py-3 text-slate-600 text-xs font-mono">{m.student?.email}</td>
                            <td className="px-4 py-3 text-slate-500 text-xs">
                              {new Date(m.joined_at).toLocaleDateString('vi-VN')}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={() => handleRemoveStudent(m.id)}
                                className="text-rose-600 hover:text-rose-800 p-1.5 hover:bg-rose-50 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="py-16 text-center text-slate-400 text-sm">
              Vui lòng chọn 1 lớp học để quản lý.
            </div>
          )}
        </div>
      </div>

      {/* Modal Create Class */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6">
            <h3 className="text-xl font-bold text-slate-900 font-display">Tạo Lớp Học Mới</h3>

            <form onSubmit={handleCreateClass} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Tên lớp học:</label>
                <input
                  type="text"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  placeholder="Ví dụ: Lớp 2A1 - Toán Học Tương Tác"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Mô tả hoặc môn học:</label>
                <input
                  type="text"
                  value={classDescription}
                  onChange={(e) => setClassDescription(e.target.value)}
                  placeholder="Môn Toán Khối 2"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm shadow-md"
                >
                  Xác Nhận Tạo Lớp
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
