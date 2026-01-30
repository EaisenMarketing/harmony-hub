-- Create instructor_profiles table to manage instructor authorizations
CREATE TABLE public.instructor_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    instrument public.instrument_type NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
    bio TEXT,
    specialization TEXT,
    years_experience INTEGER DEFAULT 0,
    approved_by UUID,
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create instructor_activity_logs table to track instructor actions
CREATE TABLE public.instructor_activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instructor_id UUID NOT NULL REFERENCES public.instructor_profiles(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL CHECK (action_type IN ('course_created', 'lesson_added', 'class_scheduled', 'student_enrolled', 'video_uploaded', 'module_created', 'class_completed')),
    entity_type TEXT,
    entity_id UUID,
    description TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create instructor_students table to track student-instructor relationships
CREATE TABLE public.instructor_students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instructor_id UUID NOT NULL REFERENCES public.instructor_profiles(id) ON DELETE CASCADE,
    student_id UUID NOT NULL,
    instrument public.instrument_type NOT NULL,
    enrolled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'completed')),
    UNIQUE(instructor_id, student_id, instrument)
);

-- Enable RLS on all new tables
ALTER TABLE public.instructor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instructor_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instructor_students ENABLE ROW LEVEL SECURITY;

-- RLS Policies for instructor_profiles
CREATE POLICY "Admins can manage all instructor profiles"
ON public.instructor_profiles
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Instructors can view own profile"
ON public.instructor_profiles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Instructors can update own profile"
ON public.instructor_profiles
FOR UPDATE
USING (auth.uid() = user_id AND status = 'approved');

CREATE POLICY "Anyone can request to become instructor"
ON public.instructor_profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for instructor_activity_logs
CREATE POLICY "Admins can view all activity logs"
ON public.instructor_activity_logs
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Instructors can view own activity logs"
ON public.instructor_activity_logs
FOR SELECT
USING (EXISTS (
    SELECT 1 FROM public.instructor_profiles
    WHERE id = instructor_activity_logs.instructor_id
    AND user_id = auth.uid()
));

CREATE POLICY "Instructors can create own activity logs"
ON public.instructor_activity_logs
FOR INSERT
WITH CHECK (EXISTS (
    SELECT 1 FROM public.instructor_profiles
    WHERE id = instructor_activity_logs.instructor_id
    AND user_id = auth.uid()
    AND status = 'approved'
));

-- RLS Policies for instructor_students
CREATE POLICY "Admins can manage all instructor students"
ON public.instructor_students
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Instructors can view own students"
ON public.instructor_students
FOR SELECT
USING (EXISTS (
    SELECT 1 FROM public.instructor_profiles
    WHERE id = instructor_students.instructor_id
    AND user_id = auth.uid()
    AND status = 'approved'
));

CREATE POLICY "Instructors can manage own students"
ON public.instructor_students
FOR ALL
USING (EXISTS (
    SELECT 1 FROM public.instructor_profiles
    WHERE id = instructor_students.instructor_id
    AND user_id = auth.uid()
    AND status = 'approved'
));

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_instructor_profile_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_instructor_profiles_updated_at
BEFORE UPDATE ON public.instructor_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_instructor_profile_updated_at();

-- Create indexes for better performance
CREATE INDEX idx_instructor_profiles_user_id ON public.instructor_profiles(user_id);
CREATE INDEX idx_instructor_profiles_status ON public.instructor_profiles(status);
CREATE INDEX idx_instructor_profiles_instrument ON public.instructor_profiles(instrument);
CREATE INDEX idx_instructor_activity_logs_instructor_id ON public.instructor_activity_logs(instructor_id);
CREATE INDEX idx_instructor_activity_logs_created_at ON public.instructor_activity_logs(created_at DESC);
CREATE INDEX idx_instructor_students_instructor_id ON public.instructor_students(instructor_id);
CREATE INDEX idx_instructor_students_student_id ON public.instructor_students(student_id);