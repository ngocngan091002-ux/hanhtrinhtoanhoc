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
    const cleanEmail = studentEmail.trim().toLowerCase();
    if (!cleanEmail || !selectedClass) return;

    setAddMessage(null);
    try {
      // 1. Search for existing student profile
      let { data: studentProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', cleanEmail)
        .maybeSingle();

      // 2. If student profile does not exist, automatically create new student profile!
      if (!studentProfile) {
        const newStudentId = crypto.randomUUID ? crypto.randomUUID() : `std_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const nameFromEmail = cleanEmail.split('@')[0];
        const defaultName = nameFromEmail.charAt(0).toUpperCase() + nameFromEmail.slice(1);

        const newProfileData = {
          id: newStudentId,
          full_name: `Học sinh ${defaultName}`,
          email: cleanEmail,
          role: 'student' as const,
          grade_level: 2,
        };

        const { data: newProf, error: profErr } = await supabase
          .from('profiles')
          .upsert(newProfileData)
          .select()
          .single();

        if (!profErr && newProf) {
          studentProfile = newProf;
        } else {
          studentProfile = newProfileData as any;
        }
      }

      // 3. Add student to class_members
      if (studentProfile && studentProfile.id) {
        const { data: existingMember } = await supabase
          .from('class_members')
          .select('id')
          .eq('class_id', selectedClass.id)
          .eq('student_id', studentProfile.id)
          .maybeSingle();

        if (existingMember) {
          setAddMessage({ type: 'error', text: `Học sinh với email ${cleanEmail} đã có mặt trong lớp rồi!` });
          return;
        }

        const { error: insertErr } = await supabase.from('class_members').insert({
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

        setAddMessage({
          type: 'success',
          text: `🎉 Đã tự động tạo tài khoản & thêm thành công học sinh (${studentProfile.full_name} - ${cleanEmail}) vào lớp!`,
        });
        setStudentEmail('');
        fetchMembers(selectedClass.id);
        fetchClasses();
      }
    } catch (err: any) {
      setAddMessage({ type: 'error', text: err.message || 'Lỗi khi thêm học sinh' });
    }
  };

  const removeVietnameseAccents = (str: string): string => {
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .replace(/[^a-zA-Z0-9]/g, '')
      .toLowerCase();
  };

  const parseStudentLine = (line: string, classCode: string, lineIndex: number) => {
    const cleanLine = line.replace(/^\uFEFF/, '').trim();
    if (!cleanLine || cleanLine.toLowerCase().startsWith('sep=')) return null;

    // Split by comma, semicolon, tab, or 2+ consecutive spaces (from Excel paste)
    const parts = cleanLine
      .split(/[,;\t]|\s{2,}/)
      .map((p) => p.trim().replace(/^["']|["']$/g, ''))
      .filter(Boolean);

    if (parts.length === 0) return null;

    const combined = parts.join(' ').toLowerCase();
    if (
      combined.includes('họ và tên') ||
      combined.includes('họ tên') ||
      combined.includes('stt') ||
      combined.includes('tên học sinh') ||
      combined.includes('email học sinh')
    ) {
      return null;
    }

    let email = '';
    let fullName = '';
    let password = '123456';

    const emailIdx = parts.findIndex((p) => p.includes('@'));
    if (emailIdx !== -1) {
      email = parts[emailIdx].toLowerCase();
      const nameCandidates = parts.filter(
        (p, idx) => idx !== emailIdx && !/^\d+$/.test(p) && p !== '123456'
      );
      if (nameCandidates.length > 0) {
        fullName = nameCandidates.join(' ');
      } else {
        fullName = email.split('@')[0];
      }
    } else {
      const nameCandidates = parts.filter((p) => !/^\d+$/.test(p));
      if (nameCandidates.length > 0) {
        fullName = nameCandidates.join(' ');
      } else {
        fullName = `Học sinh ${lineIndex + 1}`;
      }
      const slugName = removeVietnameseAccents(fullName) || `hocsinh_${lineIndex + 1}`;
      const randomCode = Math.floor(1000 + Math.random() * 9000);
      email = `hs_${slugName}_${randomCode}@hanhtrinhtoanhoc.edu.vn`;
    }

    return { fullName, email, password };
  };

  const handleImportCsv = async () => {
    if (!csvContent.trim() || !selectedClass) return;

    // Detect binary content from .xlsx file uploaded directly
    if (csvContent.startsWith('PK') || csvContent.includes('xl/')) {
      alert(
        '⚠️ NỘI DUNG ĐANG LÀ FILE EXCEL NGUYÊN BẢN (.xlsx):\n\n' +
        'Vui lòng mở file Excel đó, chọn File -> Save As -> lưu dạng "CSV (UTF-8)" HOẶC bôi đen copy toàn bộ cột danh sách và dán vào ô bên dưới nhé!'
      );
      return;
    }

    const rawLines = csvContent.split('\n');
    let createdCount = 0;
    let addedCount = 0;
    let alreadyInClassCount = 0;
    let totalValidLines = 0;
    let questionMarkNamesCount = 0;

    for (let i = 0; i < rawLines.length; i++) {
      const parsed = parseStudentLine(rawLines[i], selectedClass.code, i);
      if (!parsed) continue;

      totalValidLines++;
      const { fullName, email } = parsed;

      if (fullName.includes('?')) {
        questionMarkNamesCount++;
      }

      try {
        let { data: studentProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', email)
          .maybeSingle();

        if (!studentProfile) {
          const newStudentId = crypto.randomUUID ? crypto.randomUUID() : `std_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

          const newProfileData = {
            id: newStudentId,
            full_name: fullName || `Học sinh ${email.split('@')[0]}`,
            email: email,
            role: 'student' as const,
            grade_level: 2,
          };

          const { data: newProf, error: profErr } = await supabase
            .from('profiles')
            .upsert(newProfileData)
            .select()
            .single();

          if (!profErr && newProf) {
            studentProfile = newProf;
            createdCount++;
          } else {
            studentProfile = newProfileData as any;
            createdCount++;
          }
        }

        if (studentProfile && studentProfile.id) {
          const { data: existingMember } = await supabase
            .from('class_members')
            .select('id')
            .eq('class_id', selectedClass.id)
            .eq('student_id', studentProfile.id)
            .maybeSingle();

          if (existingMember) {
            alreadyInClassCount++;
          } else {
            const { error: joinErr } = await supabase.from('class_members').insert({
              class_id: selectedClass.id,
              student_id: studentProfile.id,
            });

            if (!joinErr) {
              addedCount++;
            } else if (joinErr.code === '23505') {
              alreadyInClassCount++;
            } else {
              console.error('Lỗi khi thêm vào class_members:', joinErr);
            }
          }
        }
      } catch (err) {
        console.error('Error importing student row:', err);
      }
    }

    if (questionMarkNamesCount > 0) {
      alert(
        `⚠️ CẢNH BÁO MẤT DẤU TIẾNG VIỆT TỪ EXCEL:\n\n` +
        `Có ${questionMarkNamesCount} tên học sinh bị phần mềm Excel tự chuyển thành dấu '?' (Ví dụ: Ph?m Minh T?i).\n` +
        `Nguyên nhân: Do khi dùng "Save As CSV", phần mềm Excel trên Windows tự mã hóa mất dấu tiếng Việt.\n\n` +
        `💡 CÁCH SỬA SIÊU NHANH TRONG 5 GIÂY (100% GIỮ ĐỦ DẤU TIẾNG VIỆT):\n` +
        `1. Mở file Excel gốc của bạn trên máy tính (file gốc vẫn giữ nguyên tên có dấu đầy đủ).\n` +
        `2. Bôi đen copy các cột danh sách (Ctrl + C).\n` +
        `3. Trên trang web này, bấm nút "Dán Mã CSV" -> Dán (Ctrl + V) vào ô văn bản -> Bấm XÁC NHẬN là xong!`
      );
    } else if (addedCount > 0) {
      alert(`🎉 THÀNH CÔNG! Đã thêm thành công ${addedCount}/${totalValidLines} học sinh vào lớp "${selectedClass.name}"!\n(${createdCount} tài khoản mới được tự động tạo)`);
    } else if (alreadyInClassCount > 0) {
      alert(`ℹ️ THÔNG BÁO: Tất cả ${alreadyInClassCount} học sinh trong danh sách đã có tên trong lớp "${selectedClass.name}" từ trước rồi!`);
    } else {
      alert(`⚠️ CHÚ Ý: Không thêm được học sinh nào vào lớp. Vui lòng kiểm tra lại nội dung file! (Hỗ trợ dạng: "STT, Họ và Tên, Email" HOẶC chỉ cần "Họ và Tên")`);
    }

    setCsvContent('');
    setShowCsvImport(false);
    fetchMembers(selectedClass.id);
    fetchClasses();
  };

  const downloadTemplateCsv = () => {
    let template = '\uFEFF'; // UTF-8 BOM for Windows Excel compatibility
    template += 'STT,Họ và Tên,Email,Mật Khẩu Mặc Định\n';
    template += '1,Nguyễn Văn An,an.lop2a1@gmail.com,123456\n';
    template += '2,Lê Thị Bình,binh.lop2a1@gmail.com,123456\n';
    template += '3,Trần Hoàng Cường,cuong.lop2a1@gmail.com,123456\n';

    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Mau_Danh_Sach_Hoc_Sinh_CSV_Excel.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      alert(
        '⚠️ BẠN ĐANG CHỌN FILE EXCEL (.xlsx / .xls):\n\n' +
        'Trình duyệt đọc file này dưới dạng dữ liệu nén. Để nhập thành công 100%, thầy/Cô hãy chọn 1 trong 2 cách siêu nhanh sau:\n\n' +
        '1️⃣ Cách 1 (Nhanh nhất): Mở file Excel, bôi đen copy toàn bộ cột danh sách, sau đó bấm nút "Dán Mã CSV" trên web và dán vào ô văn bản!\n' +
        '2️⃣ Cách 2: Trong phần mềm Excel, chọn File -> Save As -> chọn định dạng "CSV UTF-8 (Comma delimited)" rồi tải file CSV đó lên web.'
      );
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const buffer = event.target?.result as ArrayBuffer;
      if (!buffer) return;

      const uint8 = new Uint8Array(buffer);

      let text = '';
      if (uint8[0] === 0xFF && uint8[1] === 0xFE) {
        text = new TextDecoder('utf-16le').decode(uint8);
      } else if (uint8[0] === 0xFE && uint8[1] === 0xFF) {
        text = new TextDecoder('utf-16be').decode(uint8);
      } else {
        try {
          const decoderUtf8 = new TextDecoder('utf-8', { fatal: true });
          text = decoderUtf8.decode(uint8);
        } catch (err) {
          try {
            text = new TextDecoder('windows-1258').decode(uint8);
          } catch (e2) {
            text = new TextDecoder('utf-8').decode(uint8);
          }
        }
      }

      if (text) {
        setCsvContent(text);
        setShowCsvImport(true);
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
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
                        accept=".csv,.txt,.tsv,.xlsx,.xls"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-xs font-bold bg-sky-100 hover:bg-sky-200 text-sky-800 px-3 py-1.5 rounded-lg border border-sky-300 transition-all flex items-center gap-1 shadow-2xs"
                        title="Chọn file CSV / Excel / TXT chứa danh sách từ máy tính"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>📂 Chọn File Danh Sách (CSV/Excel)</span>
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
                  <div className="p-5 rounded-2xl bg-sky-50/70 border border-sky-200 space-y-4 shadow-sm">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-2 border-b border-sky-200/80">
                      <div>
                        <span className="font-extrabold text-sm text-sky-950 flex items-center gap-1.5 font-display">
                          <FileSpreadsheet className="w-4 h-4 text-sky-600" />
                          <span>Tự Động Tạo Tài Khoản & Nhập Lớp Hàng Loạt Từ CSV / Excel</span>
                        </span>
                        <p className="text-xs text-slate-500 mt-0.5">
                          💡 Hỗ trợ: Dán trực tiếp từ Excel (dấu Tab không cần phẩy), dấu phẩy (,), hoặc chỉ cần Họ và Tên
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={downloadTemplateCsv}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-3.5 py-2 rounded-xl shadow-md transition-all flex items-center space-x-1.5 shrink-0 active:scale-95 cursor-pointer"
                      >
                        <Download className="w-4 h-4" />
                        <span>📥 TẢI FILE MẪU (CSV / EXCEL)</span>
                      </button>
                    </div>

                    <textarea
                      value={csvContent}
                      onChange={(e) => setCsvContent(e.target.value)}
                      rows={5}
                      placeholder="1, Nguyễn Văn An, an.lop2a1@gmail.com, 123456&#10;2, Lê Thị Bình, binh.lop2a1@gmail.com, 123456&#10;3, Trần Hoàng Cường, cuong.lop2a1@gmail.com, 123456"
                      className="w-full p-3 rounded-xl border border-sky-200 text-xs font-mono bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />

                    <div className="flex justify-between items-center pt-1">
                      <span className="text-[11px] text-slate-500 italic">
                        💡 Hệ thống sẽ tự tạo mới tài khoản học sinh nếu chưa có và tự động vào lớp {selectedClass.name}!
                      </span>
                      <button
                        onClick={handleImportCsv}
                        className="bg-sky-600 hover:bg-sky-700 text-white font-extrabold px-5 py-2.5 rounded-xl text-xs shadow-md active:scale-95 transition-all cursor-pointer"
                      >
                        ⚡ XÁC NHẬN TẠO TÀI KHOẢN & NHẬP LỚP
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
