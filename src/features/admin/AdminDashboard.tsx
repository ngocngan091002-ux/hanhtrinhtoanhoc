import React, { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import { UserProfile, MathClass, Material, UserRole } from '../../types';
import { ShieldCheck, Users, School, BookOpen, Activity, Trash2, Edit, CheckCircle } from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'classes' | 'materials' | 'logs'>('users');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [classes, setClasses] = useState<ActiveClassWithTeacher[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(false);

  type ActiveClassWithTeacher = MathClass & { teacher?: UserProfile };

  useEffect(() => {
    fetchAdminData();
  }, [activeTab]);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'users') {
        const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
        setUsers(data || []);
      } else if (activeTab === 'classes') {
        const { data } = await supabase.from('classes').select('*, teacher:profiles(*)').order('created_at', { ascending: false });
        setClasses(data || []);
      } else if (activeTab === 'materials') {
        const { data } = await supabase.from('materials').select('*, author:profiles(*)').order('created_at', { ascending: false });
        setMaterials(data || []);
      }
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: UserRole) => {
    try {
      const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
      if (error) throw error;
      fetchAdminData();
    } catch (err: any) {
      alert('Không thể đổi quyền: ' + err.message);
    }
  };

  const handleDeleteMaterial = async (materialId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa học liệu này?')) return;
    try {
      const { error } = await supabase.from('materials').delete().eq('id', materialId);
      if (error) throw error;
      fetchAdminData();
    } catch (err: any) {
      alert('Lỗi xóa học liệu: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 p-6 sm:p-8 rounded-3xl text-white shadow-xl flex justify-between items-center">
        <div>
          <span className="bg-emerald-500/20 text-emerald-400 text-xs font-bold px-3 py-1 rounded-full uppercase border border-emerald-400/30">
            Cổng Quản Trị Hệ Thống (Admin)
          </span>
          <h1 className="text-3xl font-extrabold font-display mt-2">
            Hành Trình Toán Học - Admin Panel 🛡️
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Toàn quyền quản lý Người dùng, Lớp học, Học liệu & Nhật ký hệ thống.
          </p>
        </div>
      </div>

      {/* Admin Tabs */}
      <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-100 flex items-center overflow-x-auto gap-2 scrollbar-none">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all shrink-0 ${
            activeTab === 'users' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Quản Lý Người Dùng</span>
        </button>

        <button
          onClick={() => setActiveTab('classes')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all shrink-0 ${
            activeTab === 'classes' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <School className="w-4 h-4" />
          <span>Quản Lý Lớp Học</span>
        </button>

        <button
          onClick={() => setActiveTab('materials')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all shrink-0 ${
            activeTab === 'materials' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Quản Lý Kho Học Liệu & Games</span>
        </button>
      </div>

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-800">Danh Sách Tài Khoản Hệ Thống ({users.length})</h3>

          {loading ? (
            <div className="py-8 text-center text-slate-400">Đang tải danh sách người dùng...</div>
          ) : (
            <>
              {/* 📱 Mobile Card View (< 640px) */}
              <div className="block sm:hidden space-y-3">
                {users.map((u) => (
                  <div key={u.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3 shadow-2xs">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-extrabold text-slate-900 text-sm font-display">{u.full_name}</div>
                        <div className="text-xs font-mono text-slate-500 break-all">{u.email}</div>
                      </div>
                      <span
                        className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase shrink-0 ${
                          u.role === 'admin'
                            ? 'bg-purple-100 text-purple-800 border border-purple-200'
                            : u.role === 'teacher'
                            ? 'bg-sky-100 text-sky-800 border border-sky-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {u.role}
                      </span>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-slate-200/60 text-xs">
                      <span className="text-slate-400 text-[11px]">
                        Ngày tạo: {new Date(u.created_at).toLocaleDateString('vi-VN')}
                      </span>
                      <div className="flex items-center space-x-1">
                        <span className="text-[11px] font-bold text-slate-600">Đổi quyền:</span>
                        <select
                          value={u.role}
                          onChange={(e) => handleUpdateRole(u.id, e.target.value as UserRole)}
                          className="px-2 py-1 text-xs border border-slate-300 rounded-lg bg-white font-bold"
                        >
                          <option value="student">student</option>
                          <option value="teacher">teacher</option>
                          <option value="admin">admin</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* 💻 Desktop Table View (>= 640px) */}
              <div className="hidden sm:block overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-sm text-slate-700 min-w-[650px] whitespace-nowrap">
                  <thead className="bg-slate-50 uppercase text-xs text-slate-500 font-bold border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">Họ và tên</th>
                      <th className="px-4 py-3">Email</th>
                      <th className="px-4 py-3">Vai trò (Role)</th>
                      <th className="px-4 py-3">Ngày tạo</th>
                      <th className="px-4 py-3 text-right">Đổi quyền</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-bold text-slate-900">{u.full_name}</td>
                        <td className="px-4 py-3 text-xs font-mono text-slate-600">{u.email}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full uppercase ${
                              u.role === 'admin'
                                ? 'bg-purple-100 text-purple-800'
                                : u.role === 'teacher'
                                ? 'bg-sky-100 text-sky-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500">{new Date(u.created_at).toLocaleDateString('vi-VN')}</td>
                        <td className="px-4 py-3 text-right space-x-1">
                          <select
                            value={u.role}
                            onChange={(e) => handleUpdateRole(u.id, e.target.value as UserRole)}
                            className="px-2 py-1 text-xs border border-slate-200 rounded-lg bg-white font-bold"
                          >
                            <option value="student">student</option>
                            <option value="teacher">teacher</option>
                            <option value="admin">admin</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* Classes Tab */}
      {activeTab === 'classes' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-800">Toàn Bộ Lớp Học Trên Nền Tảng ({classes.length})</h3>

          {loading ? (
            <div className="py-8 text-center text-slate-400">Đang tải lớp học...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {classes.map((cls) => (
                <div key={cls.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-slate-900 text-base">{cls.name}</h4>
                    <span className="font-mono text-xs font-bold text-sky-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                      Mã: {cls.code}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">Giáo viên phụ trách: <span className="font-bold text-slate-800">{cls.teacher?.full_name || 'N/A'}</span></p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Materials Tab */}
      {activeTab === 'materials' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-800">Tất Cả Học Liệu & Games Nhúng ({materials.length})</h3>

          {loading ? (
            <div className="py-8 text-center text-slate-400">Đang tải kho học liệu...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {materials.map((mat) => (
                <div key={mat.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-bold uppercase bg-slate-200 text-slate-700 px-2 py-0.5 rounded">
                      {mat.type}
                    </span>
                    <h4 className="font-bold text-slate-900 text-sm mt-1">{mat.title}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Tác giả: {mat.author?.full_name || 'N/A'}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteMaterial(mat.id)}
                    className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
