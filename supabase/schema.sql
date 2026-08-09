-- ================================================================
-- SYSTEM SCHEMA FOR EDTECH & LEARNING MANAGEMENT SYSTEM
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
-- AUTOMATIC PROFILE CREATION TRIGGER
-- ================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
        COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'student'::user_role)
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        avatar_url = EXCLUDED.avatar_url;
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
CREATE POLICY "Profiles are readable by authenticated users" ON public.profiles
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "Admins can manage all profiles" ON public.profiles
    FOR ALL TO authenticated USING (public.is_admin());

-- 2. CLASSES POLICIES
CREATE POLICY "Admins can do everything on classes" ON public.classes
    FOR ALL TO authenticated USING (public.is_admin());

CREATE POLICY "Teachers can manage their own created classes" ON public.classes
    FOR ALL TO authenticated USING (teacher_id = auth.uid());

CREATE POLICY "Students can view enrolled classes or lookup by code" ON public.classes
    FOR SELECT TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.class_members cm
            WHERE cm.class_id = public.classes.id AND cm.student_id = auth.uid()
        )
        OR true -- Allows finding class by code for joining
    );

-- 3. CLASS MEMBERS POLICIES
CREATE POLICY "Admins can manage all class members" ON public.class_members
    FOR ALL TO authenticated USING (public.is_admin());

CREATE POLICY "Teachers can manage members in their classes" ON public.class_members
    FOR ALL TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.classes c
            WHERE c.id = public.class_members.class_id AND c.teacher_id = auth.uid()
        )
    );

CREATE POLICY "Students can join class and view enrolled classes" ON public.class_members
    FOR ALL TO authenticated USING (student_id = auth.uid());

-- 4. MATERIALS POLICIES
CREATE POLICY "Admins can manage all materials" ON public.materials
    FOR ALL TO authenticated USING (public.is_admin());

CREATE POLICY "Teachers can manage their own materials" ON public.materials
    FOR ALL TO authenticated USING (author_id = auth.uid());

CREATE POLICY "Public materials readable by all authenticated" ON public.materials
    FOR SELECT TO authenticated USING (
        is_public = true OR
        author_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.assignments a
            JOIN public.class_members cm ON cm.class_id = a.class_id
            WHERE a.material_id = public.materials.id AND cm.student_id = auth.uid()
        )
    );

-- 5. ASSIGNMENTS POLICIES
CREATE POLICY "Admins can manage all assignments" ON public.assignments
    FOR ALL TO authenticated USING (public.is_admin());

CREATE POLICY "Teachers can manage assignments for their classes" ON public.assignments
    FOR ALL TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.classes c
            WHERE c.id = public.assignments.class_id AND c.teacher_id = auth.uid()
        )
    );

CREATE POLICY "Students can view assigned materials in enrolled classes" ON public.assignments
    FOR SELECT TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.class_members cm
            WHERE cm.class_id = public.assignments.class_id AND cm.student_id = auth.uid()
        )
    );

-- 6. STUDENT PROGRESS POLICIES
CREATE POLICY "Admins can manage all progress records" ON public.student_progress
    FOR ALL TO authenticated USING (public.is_admin());

CREATE POLICY "Teachers can view progress for assignments in their classes" ON public.student_progress
    FOR SELECT TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.assignments a
            JOIN public.classes c ON c.id = a.class_id
            WHERE a.id = public.student_progress.assignment_id AND c.teacher_id = auth.uid()
        )
    );

CREATE POLICY "Students can manage their own progress records" ON public.student_progress
    FOR ALL TO authenticated USING (student_id = auth.uid());

-- ================================================================
-- STORAGE BUCKETS CONFIGURATION
-- ================================================================
INSERT INTO storage.buckets (id, name, public) VALUES ('materials-storage', 'materials-storage', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Auth users upload to materials-storage" ON storage.objects
    FOR INSERT TO authenticated WITH CHECK (bucket_id = 'materials-storage');

CREATE POLICY "Public read from materials-storage" ON storage.objects
    FOR SELECT TO authenticated USING (bucket_id = 'materials-storage');
