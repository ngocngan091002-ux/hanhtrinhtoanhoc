import React, { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import { useAuth } from '../auth/AuthContext';
import { LearningMaterial } from '../../types';
import { BookOpen, FileText, Download, ExternalLink } from 'lucide-react';

export const MaterialsView: React.FC = () => {
  const { user } = useAuth();
  const [materials, setMaterials] = useState<LearningMaterial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchStudentMaterials();
  }, [user]);

  const fetchStudentMaterials = async () => {
    setLoading(true);
    try {
      // 1. Get student's class membership
      const { data: memberData } = await supabase
        .from('class_members')
        .select('class_id')
        .eq('student_id', user?.id);

      if (!memberData || memberData.length === 0) {
        setLoading(false);
        return;
      }

      const classIds = memberData.map((m) => m.class_id);

      // 2. Fetch learning materials for those classes
      const { data, error } = await supabase
        .from('learning_materials')
        .select('*')
        .in('class_id', classIds)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMaterials(data || []);
    } catch (err) {
      console.error('Error fetching materials:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <h2 className="text-2xl font-extrabold text-slate-900 flex items-center space-x-2 font-display">
          <BookOpen className="w-7 h-7 text-sky-600" />
          <span>📖 Kho Học Liệu Toán Học</span>
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Xem và tải về các tài liệu lý thuyết, phiếu bài tập do thầy cô đính kèm.
        </p>
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-400">Đang tải học liệu...</div>
      ) : materials.length === 0 ? (
        <div className="bg-white p-12 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-3xl">
          Chưa có học liệu nào được đăng lên.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {materials.map((mat) => (
            <div key={mat.id} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex justify-between items-start space-x-4 hover:shadow-md transition-all">
              <div className="flex items-start space-x-3">
                <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-base shrink-0">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">{mat.title}</h3>
                  {mat.description && <p className="text-xs text-slate-500 mt-1">{mat.description}</p>}
                  <span className="inline-block mt-2 text-[10px] uppercase font-extrabold bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-md border border-slate-200">
                    Định dạng {mat.file_type}
                  </span>
                </div>
              </div>

              <a
                href={mat.file_url}
                target="_blank"
                rel="noreferrer"
                className="bg-sky-600 hover:bg-sky-700 text-white font-bold px-4 py-2.5 rounded-2xl shadow-md transition-all text-xs flex items-center space-x-1 shrink-0 active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span>Tải về</span>
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
