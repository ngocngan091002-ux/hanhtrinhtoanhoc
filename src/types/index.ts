export type UserRole = 'admin' | 'teacher' | 'student';
export type MaterialType = 'document' | 'video' | 'game_iframe' | 'game_html5';
export type ProgressStatus = 'not_started' | 'in_progress' | 'completed';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  grade_level?: number;
  avatar_url?: string;
  created_at: string;
}

export interface MathClass {
  id: string;
  name: string;
  description?: string;
  grade?: number;
  code: string;
  teacher_id: string;
  created_at: string;
  member_count?: number;
  student_count?: number;
  teacher?: UserProfile;
}

export interface ClassMember {
  id: string;
  class_id: string;
  student_id: string;
  joined_at: string;
  student?: UserProfile;
  class?: MathClass;
}

export interface Material {
  id: string;
  title: string;
  description?: string;
  file_url: string;
  type: MaterialType;
  subject?: string;
  grade_level?: number;
  tags?: string[];
  author_id: string;
  is_public: boolean;
  created_at: string;
  author?: UserProfile;
}

export interface LearningMaterial {
  id: string;
  class_id: string;
  teacher_id: string;
  title: string;
  description?: string;
  file_url: string;
  file_type: string;
  created_at: string;
}

export interface Question {
  id: string;
  prompt: string;
  image_url?: string;
  options?: string[];
  correct_answer: string;
  explanation?: string;
}

export interface Assignment {
  id: string;
  material_id?: string;
  class_id: string;
  teacher_id?: string;
  type?: 'homework' | 'weekly_test';
  title?: string;
  description?: string;
  questions_json?: Question[];
  duration_minutes?: number;
  due_date?: string;
  status?: 'draft' | 'published';
  created_at: string;
  material?: Material;
  class?: MathClass;
  progress?: StudentProgress;
}

export interface Submission {
  id: string;
  assignment_id: string;
  student_id: string;
  answers_json: Record<string, string>;
  question_times_json?: Record<string, number | string>;
  submitted_at: string;
  ai_suggested_score?: number;
  ai_suggested_feedback?: string;
  final_score?: number;
  final_feedback?: string;
  final_feedback_image?: string;
  is_finalized: boolean;
  finalized_at?: string;
  finalized_by?: string;
  student_name?: string;
  assignment_title?: string;
}

export interface DailyTask {
  id: string;
  class_id: string;
  teacher_id: string;
  title: string;
  description?: string;
  task_date: string;
  status: 'draft' | 'published';
  created_at: string;
  items?: DailyTaskItem[];
}

export interface DailyTaskItem {
  id: string;
  task_id: string;
  item_type: 'assignment' | 'quiz' | 'game' | 'material' | 'custom';
  item_ref_id?: string;
  title: string;
  order_index: number;
  is_completed?: boolean;
}

export interface LeaderboardEntry {
  student_id: string;
  student_name: string;
  avatar_url?: string;
  completed_tasks_count: number;
  total_score: number;
  total_assignments_done: number;
}

export interface StudentAnalytics {
  id: string;
  class_id: string;
  student_id: string;
  weak_topics: string[];
  recommendations: string;
  accuracy_rate?: string;
  completion_speed?: string;
  updated_at: string;
}

export interface StudentProgress {
  id: string;
  assignment_id: string;
  student_id: string;
  status: ProgressStatus;
  score?: number;
  completion_time_seconds?: number;
  completed_at?: string;
  student?: UserProfile;
}

export interface MathGame {
  id: string;
  class_id: string;
  teacher_id: string;
  title: string;
  topic: string;
  game_type: 'math_race' | 'flashcard' | 'quick_calc';
  config_json?: Record<string, any>;
  created_at: string;
}
