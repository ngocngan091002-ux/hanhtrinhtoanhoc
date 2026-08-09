-- ================================================================
-- SYSTEM SCHEMA FOR EDTECH & LEARNING MANAGEMENT SYSTEM (COMPLETE & IDEMPOTENT)
-- Website: Hành Trình Toán Học
-- Stack: Supabase PostgreSQL + Auth + Storage + RLS
-- Roles: admin, teacher, student
-- ================================================================

-- 1. EXTENSIONS & TYPES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'teacher', 'student');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE material_type AS ENUM ('document', 'video', 'game_iframe', 'game_html5');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE progress_status AS ENUM ('not_started', 'in_progress', 'completed');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'student',
    grade_level INT DEFAULT 3,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CLASSES TABLE
CREATE TABLE IF NOT EXISTS public.classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    code TEXT UNIQUE NOT NULL,
    teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. CLASS MEMBERS TABLE
CREATE TABLE IF NOT EXISTS public.class_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_class_student UNIQUE (class_id, student_id)
);

-- 5. MATERIALS & GAME HUB TABLE
CREATE TABLE IF NOT EXISTS public.materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    file_url TEXT NOT NULL,
    type material_type NOT NULL DEFAULT 'document',
    subject TEXT DEFAULT 'Toán Học',
    grade_level INT DEFAULT 3,
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    is_public BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. ASSIGNMENTS TABLE
CREATE TABLE IF NOT EXISTS public.assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    material_id UUID REFERENCES public.materials(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT DEFAULT 'homework',
    title TEXT DEFAULT 'Bài Kiểm Tra / Bài Tập',
    description TEXT,
    questions_json JSONB DEFAULT '[]'::jsonb,
    duration_minutes INT DEFAULT 30,
    due_date TIMESTAMPTZ,
    status TEXT DEFAULT 'published',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. STUDENT PROGRESS TABLE
CREATE TABLE IF NOT EXISTS public.student_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status progress_status NOT NULL DEFAULT 'not_started',
    score NUMERIC(5, 2) DEFAULT 0,
    completion_time_seconds INT DEFAULT 0,
    completed_at TIMESTAMPTZ,
    CONSTRAINT unique_assignment_student_progress UNIQUE (assignment_id, student_id)
);

-- 8. DAILY TASKS TABLE
CREATE TABLE IF NOT EXISTS public.daily_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'NHIỆM VỤ HÔM NAY',
    description TEXT,
    task_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status TEXT DEFAULT 'published',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. DAILY TASK ITEMS TABLE
CREATE TABLE IF NOT EXISTS public.daily_task_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES public.daily_tasks(id) ON DELETE CASCADE,
    item_type TEXT DEFAULT 'custom',
    item_ref_id UUID,
    title TEXT NOT NULL,
    order_index INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. STUDENT DAILY TASK COMPLETIONS TABLE
CREATE TABLE IF NOT EXISTS public.student_daily_task_completions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID NOT NULL REFERENCES public.daily_task_items(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    completed BOOLEAN DEFAULT TRUE,
    completed_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_student_task_item UNIQUE (item_id, student_id)
);

-- 11. SUBMISSIONS TABLE (STUDENT ASSIGNMENT SUBMISSIONS & AI GRADING)
CREATE TABLE IF NOT EXISTS public.submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    answers_json JSONB DEFAULT '{}'::jsonb,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    ai_suggested_score NUMERIC(5, 2),
    ai_suggested_feedback TEXT,
    final_score NUMERIC(5, 2),
    final_feedback TEXT,
    is_finalized BOOLEAN DEFAULT FALSE,
    finalized_at TIMESTAMPTZ,
    finalized_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- 12. AI STUDENT ANALYTICS TABLE
CREATE TABLE IF NOT EXISTS public.ai_student_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    weak_topics TEXT[] DEFAULT ARRAY[]::TEXT[],
    recommendations TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_class_student_analytics UNIQUE (class_id, student_id)
);

-- ================================================================
-- PERFORMANCE INDEXES
-- ================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_classes_code ON public.classes(code);
CREATE INDEX IF NOT EXISTS idx_classes_teacher ON public.classes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_class_members_student ON public.class_members(student_id);
CREATE INDEX IF NOT EXISTS idx_class_members_class ON public.class_members(class_id);
CREATE INDEX IF NOT EXISTS idx_materials_author ON public.materials(author_id);
CREATE INDEX IF NOT EXISTS idx_materials_type ON public.materials(type);
CREATE INDEX IF NOT EXISTS idx_assignments_class ON public.assignments(class_id);
CREATE INDEX IF NOT EXISTS idx_student_progress_student ON public.student_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_daily_tasks_class ON public.daily_tasks(class_id);
CREATE INDEX IF NOT EXISTS idx_daily_task_items_task ON public.daily_task_items(task_id);
CREATE INDEX IF NOT EXISTS idx_submissions_assignment ON public.submissions(assignment_id);

-- ================================================================
-- AUTO-CONFIRM EMAIL TRIGGER
-- ================================================================
CREATE OR REPLACE FUNCTION public.auto_confirm_user_email()
RETURNS TRIGGER AS $$
BEGIN
    NEW.email_confirmed_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created_auto_confirm ON auth.users;
CREATE TRIGGER on_auth_user_created_auto_confirm
    BEFORE INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.auto_confirm_user_email();

UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;

-- ================================================================
-- AUTOMATIC PROFILE CREATION TRIGGER
-- ================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_role_val public.user_role;
    raw_role text;
BEGIN
    raw_role := LOWER(COALESCE(NEW.raw_user_meta_data->>'role', 'student'));
    
    IF raw_role = 'admin' THEN
        user_role_val := 'admin'::public.user_role;
    ELSIF raw_role = 'teacher' THEN
        user_role_val := 'teacher'::public.user_role;
    ELSE
        user_role_val := 'student'::public.user_role;
    END IF;

    INSERT INTO public.profiles (id, email, full_name, avatar_url, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.email, ''),
        COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1), 'Người dùng'),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
        user_role_val
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        avatar_url = EXCLUDED.avatar_url;
        
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_task_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_daily_task_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_student_analytics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Full profiles access" ON public.profiles;
CREATE POLICY "Full profiles access" ON public.profiles FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Full classes access" ON public.classes;
CREATE POLICY "Full classes access" ON public.classes FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Full class_members access" ON public.class_members;
CREATE POLICY "Full class_members access" ON public.class_members FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Full materials access" ON public.materials;
CREATE POLICY "Full materials access" ON public.materials FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Full assignments access" ON public.assignments;
CREATE POLICY "Full assignments access" ON public.assignments FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Full student_progress access" ON public.student_progress;
CREATE POLICY "Full student_progress access" ON public.student_progress FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Full daily_tasks access" ON public.daily_tasks;
CREATE POLICY "Full daily_tasks access" ON public.daily_tasks FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Full daily_task_items access" ON public.daily_task_items;
CREATE POLICY "Full daily_task_items access" ON public.daily_task_items FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Full completions access" ON public.student_daily_task_completions;
CREATE POLICY "Full completions access" ON public.student_daily_task_completions FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Full submissions access" ON public.submissions;
CREATE POLICY "Full submissions access" ON public.submissions FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Full analytics access" ON public.ai_student_analytics;
CREATE POLICY "Full analytics access" ON public.ai_student_analytics FOR ALL TO authenticated USING (true);

-- ================================================================
-- STORAGE BUCKETS CONFIGURATION
-- ================================================================
INSERT INTO storage.buckets (id, name, public) VALUES ('materials-storage', 'materials-storage', true) ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Upload storage" ON storage.objects;
CREATE POLICY "Upload storage" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'materials-storage');

DROP POLICY IF EXISTS "Read storage" ON storage.objects;
CREATE POLICY "Read storage" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'materials-storage');
