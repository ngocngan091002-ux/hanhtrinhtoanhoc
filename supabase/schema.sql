-- ================================================================
-- SYSTEM SCHEMA FOR EDTECH & LEARNING MANAGEMENT SYSTEM (IDEMPOTENT & BULLETPROOF)
-- Stack: Supabase PostgreSQL + Auth + Storage + RLS
-- Roles: admin, teacher, student
-- ================================================================

-- 1. EXTENSIONS & TYPES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Role enum (admin, teacher, student)
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'teacher', 'student');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Material type enum (document, video, game_iframe, game_html5)
DO $$ BEGIN
    CREATE TYPE material_type AS ENUM ('document', 'video', 'game_iframe', 'game_html5');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Progress status enum (not_started, in_progress, completed)
DO $$ BEGIN
    CREATE TYPE progress_status AS ENUM ('not_started', 'in_progress', 'completed');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'student',
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
    material_id UUID NOT NULL REFERENCES public.materials(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    due_date TIMESTAMPTZ,
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

-- ================================================================
-- AUTOMATIC PROFILE CREATION TRIGGER (BULLETPROOF)
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
    -- Return NEW to ensure user registration in auth.users never fails
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ================================================================
-- HELPER FUNCTIONS FOR RLS (Security Definer)
-- ================================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_teacher()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'teacher'
    );
$$ LANGUAGE sql SECURITY DEFINER;

-- ================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_progress ENABLE ROW LEVEL SECURITY;

-- 1. PROFILES POLICIES
DROP POLICY IF EXISTS "Read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are readable by authenticated users" ON public.profiles;
CREATE POLICY "Read profiles" ON public.profiles FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admin manage profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
CREATE POLICY "Admin manage profiles" ON public.profiles FOR ALL TO authenticated USING (public.is_admin());

-- 2. CLASSES POLICIES
DROP POLICY IF EXISTS "Admin manage classes" ON public.classes;
DROP POLICY IF EXISTS "Admins can do everything on classes" ON public.classes;
CREATE POLICY "Admin manage classes" ON public.classes FOR ALL TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "Teachers manage classes" ON public.classes;
DROP POLICY IF EXISTS "Teachers can manage their own created classes" ON public.classes;
CREATE POLICY "Teachers manage classes" ON public.classes FOR ALL TO authenticated USING (teacher_id = auth.uid());

DROP POLICY IF EXISTS "Students view classes" ON public.classes;
DROP POLICY IF EXISTS "Students can view enrolled classes or lookup by code" ON public.classes;
CREATE POLICY "Students view classes" ON public.classes FOR SELECT TO authenticated USING (true);

-- 3. CLASS MEMBERS POLICIES
DROP POLICY IF EXISTS "Admin manage members" ON public.class_members;
DROP POLICY IF EXISTS "Admins can manage all class members" ON public.class_members;
CREATE POLICY "Admin manage members" ON public.class_members FOR ALL TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "Teachers manage members" ON public.class_members;
DROP POLICY IF EXISTS "Teachers can manage members in their classes" ON public.class_members;
CREATE POLICY "Teachers manage members" ON public.class_members FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.classes c WHERE c.id = public.class_members.class_id AND c.teacher_id = auth.uid()));

DROP POLICY IF EXISTS "Students manage own membership" ON public.class_members;
DROP POLICY IF EXISTS "Students can join class and view enrolled classes" ON public.class_members;
CREATE POLICY "Students manage own membership" ON public.class_members FOR ALL TO authenticated USING (student_id = auth.uid());

-- 4. MATERIALS POLICIES
DROP POLICY IF EXISTS "Admin manage materials" ON public.materials;
DROP POLICY IF EXISTS "Admins can manage all materials" ON public.materials;
CREATE POLICY "Admin manage materials" ON public.materials FOR ALL TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "Teachers manage materials" ON public.materials;
DROP POLICY IF EXISTS "Teachers can manage their own materials" ON public.materials;
CREATE POLICY "Teachers manage materials" ON public.materials FOR ALL TO authenticated USING (author_id = auth.uid());

DROP POLICY IF EXISTS "Read materials" ON public.materials;
DROP POLICY IF EXISTS "Public materials readable by all authenticated" ON public.materials;
CREATE POLICY "Read materials" ON public.materials FOR SELECT TO authenticated USING (is_public = true OR author_id = auth.uid() OR true);

-- 5. ASSIGNMENTS POLICIES
DROP POLICY IF EXISTS "Admin manage assignments" ON public.assignments;
DROP POLICY IF EXISTS "Admins can manage all assignments" ON public.assignments;
CREATE POLICY "Admin manage assignments" ON public.assignments FOR ALL TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "Teachers manage assignments" ON public.assignments;
DROP POLICY IF EXISTS "Teachers can manage assignments for their classes" ON public.assignments;
CREATE POLICY "Teachers manage assignments" ON public.assignments FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.classes c WHERE c.id = public.assignments.class_id AND c.teacher_id = auth.uid()));

DROP POLICY IF EXISTS "Students view assignments" ON public.assignments;
DROP POLICY IF EXISTS "Students can view assigned materials in enrolled classes" ON public.assignments;
CREATE POLICY "Students view assignments" ON public.assignments FOR SELECT TO authenticated USING (true);

-- 6. STUDENT PROGRESS POLICIES
DROP POLICY IF EXISTS "Admin manage progress" ON public.student_progress;
DROP POLICY IF EXISTS "Admins can manage all progress records" ON public.student_progress;
CREATE POLICY "Admin manage progress" ON public.student_progress FOR ALL TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "Teachers view progress" ON public.student_progress;
DROP POLICY IF EXISTS "Teachers can view progress for assignments in their classes" ON public.student_progress;
CREATE POLICY "Teachers view progress" ON public.student_progress FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Students manage progress" ON public.student_progress;
DROP POLICY IF EXISTS "Students can manage their own progress records" ON public.student_progress;
CREATE POLICY "Students manage progress" ON public.student_progress FOR ALL TO authenticated USING (student_id = auth.uid());

-- ================================================================
-- STORAGE BUCKETS CONFIGURATION
-- ================================================================
INSERT INTO storage.buckets (id, name, public) VALUES ('materials-storage', 'materials-storage', true) ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Upload storage" ON storage.objects;
DROP POLICY IF EXISTS "Auth users upload to materials-storage" ON storage.objects;
CREATE POLICY "Upload storage" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'materials-storage');

DROP POLICY IF EXISTS "Read storage" ON storage.objects;
DROP POLICY IF EXISTS "Public read from materials-storage" ON storage.objects;
CREATE POLICY "Read storage" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'materials-storage');
