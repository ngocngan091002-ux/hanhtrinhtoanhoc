import React, { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import { useAuth } from '../auth/AuthContext';
import { Material } from '../../types';
import { BookOpen, FileText, Video, Gamepad2, ExternalLink, Play, Download, X } from 'lucide-react';

export const MaterialsView: React.FC = () => {
  const { user } = useAuth();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeMedia, setActiveMedia] = useState<Material | null>(null);

  useEffect(() => {
    fetchStudentMaterials();
  }, [user]);

  const fetchStudentMaterials = async () => {
    setLoading(true);
    try {
      // 1. Fetch materials from Supabase DB
      const { data: mats, error } = await supabase
        .from('materials')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) console.error('Error fetching materials:', error);

      // 2. Fetch shared assignments from localStorage
      const sharedAssKey = `hanhtrinhtoanhoc_shared_assignments`;
      let sharedAssData: any[] = [];
      try {
        sharedAssData = JSON.parse(localStorage.getItem(sharedAssKey) || '[]');
      } catch {}

      const sharedMats = sharedAssData.map((a: any) => a.material).filter(Boolean);
      const combined = [...(mats || []), ...sharedMats];

      // Deduplicate by ID
      const matMap = new Map<string, Material>();
      combined.forEach((m) => {
        if (m && m.id && !matMap.has(m.id)) {
          matMap.set(m.id, m);
        }
      });

      setMaterials(Array.from(matMap.values()));
    } catch (err) {
      console.error('Error fetching student materials:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseMedia = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    setActiveMedia(null);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <h2 className="text-2xl font-extrabold text-slate-900 flex items-center space-x-2 font-display">
          <BookOpen className="w-7 h-7 text-sky-600" />
          <span>📖 Kho Học Liệu & Game Giáo Dục</span>
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Xem và trải nghiệm trực tiếp các video bài giảng, game giáo dục tương tác do Thầy Cô giao cho lớp!
        </p>
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-400 font-bold">Đang tải kho học liệu...</div>
      ) : materials.length === 0 ? (
        <div className="bg-white p-12 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-3xl font-bold">
          Chưa có học liệu nào được tải lên.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {materials.map((mat) => (
            <div
              key={mat.id}
              className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between space-y-4 hover:shadow-md transition-all"
            >
              <div className="flex items-start space-x-3">
                <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-base shrink-0">
                  {mat.type === 'video' && <Video className="w-6 h-6 text-sky-600" />}
                  {mat.type === 'document' && <FileText className="w-6 h-6 text-sky-600" />}
                  {(mat.type === 'game_iframe' || mat.type === 'game_html5') && <Gamepad2 className="w-6 h-6 text-amber-500" />}
                </div>
                <div>
                  <span className="text-[10px] uppercase font-black bg-sky-50 text-sky-800 px-2.5 py-0.5 rounded-md border border-sky-100">
                    {mat.type === 'game_iframe' ? 'GAME TRỰC TUYẾN' : mat.type === 'video' ? 'VIDEO BÀI GIẢNG' : mat.type}
                  </span>
                  <h3 className="font-extrabold text-slate-900 text-base mt-1 font-display">{mat.title}</h3>
                  {mat.description && <p className="text-xs text-slate-500 mt-1">{mat.description}</p>}
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setActiveMedia(mat)}
                  className="bg-sky-600 hover:bg-sky-700 text-white font-extrabold px-5 py-2.5 rounded-2xl shadow-md transition-all text-xs flex items-center space-x-1.5 active:scale-95 cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>{mat.type === 'video' ? 'XEM VIDEO BÀI HỌC' : mat.type === 'game_iframe' ? 'MỞ TRẢI NGHIỆM GAME' : 'XEM HỌC LIỆU'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 🌟 MEDIA & VIDEO PLAYER MODAL WITH PROMINENT FLOATING RED EXIT BUTTON */}
      {activeMedia && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-md z-[9999] flex flex-col items-center justify-center p-2 sm:p-4">
          {/* FLOATING RED EXIT BUTTON STICKY TOP-RIGHT */}
          <button
            onClick={handleCloseMedia}
            className="fixed top-4 right-4 z-[10000] bg-rose-600 hover:bg-rose-700 text-white font-black text-xs sm:text-sm px-5 py-3 rounded-full shadow-2xl border-4 border-white flex items-center space-x-2 transition-all transform hover:scale-105 active:scale-95 cursor-pointer uppercase tracking-wide"
          >
            <X className="w-6 h-6 text-white" />
            <span>QUAY TRỞ LẠI HỌC LIỆU</span>
          </button>

          <div className="bg-slate-900 rounded-3xl max-w-5xl w-full h-[88vh] flex flex-col overflow-hidden shadow-2xl border-2 border-slate-700 relative">
            <div className="p-4 bg-slate-900 text-white flex justify-between items-center pr-56">
              <div>
                <span className="text-xs font-black text-amber-400 uppercase">{activeMedia.type}</span>
                <h3 className="font-extrabold text-base text-slate-100">{activeMedia.title}</h3>
              </div>
            </div>

            <div className="flex-1 bg-black flex items-center justify-center relative overflow-hidden">
              {activeMedia.type === 'video' ? (
                <video
                  src={activeMedia.file_url}
                  controls
                  autoPlay
                  className="max-h-full max-w-full rounded-xl shadow-2xl"
                />
              ) : activeMedia.type === 'game_iframe' ? (
                <iframe
                  src={activeMedia.file_url}
                  title={activeMedia.title}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <iframe
                  src={activeMedia.file_url}
                  title={activeMedia.title}
                  className="w-full h-full border-0 bg-white"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
