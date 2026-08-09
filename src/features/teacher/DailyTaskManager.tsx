import React, { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import { useAuth } from '../auth/AuthContext';
import { DailyTask, MathClass } from '../../types';
import { CalendarCheck, Plus, Trash2, CheckCircle2, ListPlus } from 'lucide-react';

interface DailyTaskManagerProps {
  currentClass?: MathClass | null;
}

export const DailyTaskManager: React.FC<DailyTaskManagerProps> = ({ currentClass }) => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [taskTitle, setTaskTitle] = useState('NHIỆM VỤ HÔM NAY');
  const [taskDate, setTaskDate] = useState(new Date().toISOString().split('T')[0]);
  const [items, setItems] = useState<string[]>([
    'Ôn phép cộng có nhớ',
    'Bài tập 1: Phép tính cơ bản',
    'Bài tập 2: Luyện giải bài toán có lời văn',
    'Trò chơi toán học nhanh 5 phút',
  ]);

  useEffect(() => {
    if (currentClass) fetchDailyTasks();
  }, [currentClass]);

  const fetchDailyTasks = async () => {
    if (!currentClass) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('daily_tasks')
        .select('*, items:daily_task_items(*)')
        .eq('class_id', currentClass.id)
        .order('task_date', { ascending: false });

      if (error) throw error;
      setTasks(data || []);
    } catch (err) {
      console.error('Error fetching daily tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItemInput = () => {
    setItems([...items, '']);
  };

  const handleItemChange = (index: number, val: string) => {
    const updated = [...items];
    updated[index] = val;
    setItems(updated);
  };

  const handleRemoveItemInput = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim() || !currentClass || !user) return;

    try {
      // 1. Insert daily_tasks
      const { data: createdTask, error: taskErr } = await supabase
        .from('daily_tasks')
        .insert({
          class_id: currentClass.id,
          teacher_id: user.id,
          title: taskTitle.trim(),
          task_date: taskDate,
          status: 'published',
        })
        .select()
        .single();

      if (taskErr) throw taskErr;

      // 2. Insert items
      const validItems = items.filter((it) => it.trim() !== '');
      if (validItems.length > 0) {
        const itemRows = validItems.map((title, order_index) => ({
          task_id: createdTask.id,
          title: title.trim(),
          item_type: 'custom',
          order_index: order_index,
        }));

        const { error: itemsErr } = await supabase
          .from('daily_task_items')
          .insert(itemRows);

        if (itemsErr) throw itemsErr;
      }

      setShowModal(false);
      fetchDailyTasks();
    } catch (err: any) {
      alert('Không thể tạo nhiệm vụ hằng ngày: ' + err.message);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Bạn có chắc muốn xóa nhiệm vụ ngày này?')) return;
    try {
      const { error } = await supabase.from('daily_tasks').delete().eq('id', taskId);
      if (error) throw error;
      fetchDailyTasks();
    } catch (err: any) {
      alert('Không thể xóa nhiệm vụ: ' + err.message);
    }
  };

  if (!currentClass) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-slate-100 text-center text-slate-500">
        Vui lòng chọn 1 lớp học để giao nhiệm vụ hằng ngày.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center space-x-2 font-display">
            <CalendarCheck className="w-7 h-7 text-sky-600" />
            <span>Nhiệm Vụ Hằng Ngày Cho Lớp {currentClass.name}</span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Giao nhiệm vụ rèn luyện mỗi ngày. Trạng thái tô đỏ (chưa hoàn thành) và xanh (đã hoàn thành) tự động đồng bộ trên giao diện Học sinh.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="bg-sky-600 hover:bg-sky-700 text-white font-bold px-4 py-2.5 rounded-xl shadow-md transition-all text-sm flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Giao Nhiệm Vụ Mới</span>
        </button>
      </div>

      {loading ? (
        <div className="py-8 text-center text-slate-400 text-sm">Đang tải danh sách nhiệm vụ...</div>
      ) : tasks.length === 0 ? (
        <div className="bg-white p-12 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
          Chưa giao nhiệm vụ nào cho lớp này. Hãy bấm "Giao Nhiệm Vụ Mới" để tạo checklist hằng ngày cho học sinh!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tasks.map((task) => (
            <div key={task.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-bold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-md border border-sky-100">
                    Ngày: {task.task_date}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 mt-2 font-display">{task.title}</h3>
                </div>

                <button
                  onClick={() => handleDeleteTask(task.id)}
                  className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Xóa nhiệm vụ"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Items List */}
              <div className="space-y-2 border-t border-slate-100 pt-3">
                {task.items && task.items.length > 0 ? (
                  task.items.map((item, idx) => (
                    <div key={item.id || idx} className="flex items-center space-x-2 text-sm text-slate-700">
                      <div className="w-4 h-4 border-2 border-slate-300 rounded shrink-0 flex items-center justify-center">
                        <span className="text-[10px] text-slate-400 font-bold">{idx + 1}</span>
                      </div>
                      <span>{item.title}</span>
                    </div>
                  ))
                ) : (
                  <span className="text-xs text-slate-400 italic">Không có mục con</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Add Task */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-slate-900 font-display">Tạo Nhiệm Vụ Hằng Ngày Mới</h3>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Tên danh sách nhiệm vụ:</label>
                <input
                  type="text"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="NHIỆM VỤ HÔM NAY"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Ngày áp dụng:</label>
                <input
                  type="date"
                  value={taskDate}
                  onChange={(e) => setTaskDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-bold text-slate-700">Danh sách các việc học sinh phải làm:</label>
                  <button
                    type="button"
                    onClick={handleAddItemInput}
                    className="text-xs font-bold text-sky-600 hover:text-sky-800 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Thêm Dòng
                  </button>
                </div>

                <div className="space-y-2">
                  {items.map((it, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={it}
                        onChange={(e) => handleItemChange(idx, e.target.value)}
                        placeholder={`Mục ${idx + 1}...`}
                        className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                      />
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItemInput(idx)}
                          className="text-rose-500 p-2 hover:bg-rose-50 rounded-lg text-xs"
                        >
                          Xóa
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm shadow-md"
                >
                  Giao Cho Lớp
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
