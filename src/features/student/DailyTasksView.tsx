import React, { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import { useAuth } from '../auth/AuthContext';
import { DailyTask, DailyTaskItem } from '../../types';
import { CalendarCheck, CheckCircle, AlertCircle, Sparkles, CheckSquare, Square } from 'lucide-react';

export const DailyTasksView: React.FC = () => {
  const { user } = useAuth();
  const [dailyTasks, setDailyTasks] = useState<DailyTask[]>([]);
  const [completions, setCompletions] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchStudentDailyTasks();
  }, [user]);

  const fetchStudentDailyTasks = async () => {
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

      // 2. Fetch daily tasks for those classes
      const { data: tasksData, error: taskErr } = await supabase
        .from('daily_tasks')
        .select('*, items:daily_task_items(*)')
        .in('class_id', classIds)
        .eq('status', 'published')
        .order('task_date', { ascending: false });

      if (taskErr) throw taskErr;

      // 3. Fetch completions by student
      const { data: compData } = await supabase
        .from('student_task_completions')
        .select('task_item_id')
        .eq('student_id', user?.id);

      const compMap: Record<string, boolean> = {};
      (compData || []).forEach((c) => {
        compMap[c.task_item_id] = true;
      });

      setCompletions(compMap);
      setDailyTasks(tasksData || []);
    } catch (err) {
      console.error('Error fetching student daily tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleItemCompletion = async (itemId: string) => {
    if (!user) return;
    const isCompleted = completions[itemId];

    try {
      if (isCompleted) {
        // Delete completion
        await supabase
          .from('student_task_completions')
          .delete()
          .eq('task_item_id', itemId)
          .eq('student_id', user.id);

        setCompletions((prev) => ({ ...prev, [itemId]: false }));
      } else {
        // Insert completion
        await supabase
          .from('student_task_completions')
          .insert({
            task_item_id: itemId,
            student_id: user.id,
          });

        setCompletions((prev) => ({ ...prev, [itemId]: true }));
      }
    } catch (err: any) {
      console.error('Error toggling completion:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 flex items-center space-x-2 font-display">
            <CalendarCheck className="w-7 h-7 text-emerald-500" />
            <span>📚 Nhiệm Vụ Hôm Nay</span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Mỗi nhiệm vụ hoàn thành sẽ giúp bạn rèn luyện tư duy toán học vững chắc!
          </p>
        </div>

        <div className="bg-emerald-50 text-emerald-700 font-bold px-4 py-2 rounded-2xl border border-emerald-200 text-sm flex items-center space-x-1.5">
          <Sparkles className="w-4 h-4 text-emerald-500" />
          <span>Tự động đồng bộ</span>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-400">Đang tải nhiệm vụ...</div>
      ) : dailyTasks.length === 0 ? (
        <div className="bg-white p-12 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-3xl">
          Hôm nay chưa có nhiệm vụ nào do thầy cô giao. Hãy nghỉ ngơi hoặc làm các trò chơi toán học nhé!
        </div>
      ) : (
        <div className="space-y-6">
          {dailyTasks.map((task) => (
            <div key={task.id} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <h3 className="text-xl font-extrabold text-slate-900 font-display flex items-center space-x-2">
                  <span>{task.title}</span>
                </h3>
                <span className="text-xs font-bold text-sky-700 bg-sky-50 px-3 py-1 rounded-full border border-sky-100">
                  Ngày: {task.task_date}
                </span>
              </div>

              {/* Task Checklist Items */}
              <div className="space-y-3">
                {task.items && task.items.length > 0 ? (
                  task.items.map((item) => {
                    const isDone = completions[item.id];
                    return (
                      <div
                        key={item.id}
                        onClick={() => toggleItemCompletion(item.id)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                          isDone
                            ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950 font-semibold'
                            : 'bg-rose-50/80 border-rose-200 text-rose-950 hover:bg-rose-100/60'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          {isDone ? (
                            <CheckSquare className="w-6 h-6 text-emerald-600 shrink-0" />
                          ) : (
                            <Square className="w-6 h-6 text-rose-500 shrink-0" />
                          )}
                          <span className={isDone ? 'line-through opacity-80' : 'font-bold'}>
                            {item.title}
                          </span>
                        </div>

                        <div>
                          {isDone ? (
                            <span className="bg-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-xs">
                              ✓ Đã hoàn thành
                            </span>
                          ) : (
                            <span className="bg-rose-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-xs">
                              Chưa hoàn thành
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-xs text-slate-400 italic">Chưa có mục danh mục nào.</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
