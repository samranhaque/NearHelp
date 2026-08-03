-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    age INTEGER,
    blood_group VARCHAR(10),
    health_conditions TEXT,
    skills TEXT[], -- Array of skills
    is_physically_disabled BOOLEAN DEFAULT false,
    lat DECIMAL(10, 8) DEFAULT 28.6139,
    lng DECIMAL(11, 8) DEFAULT 77.2090,
    skill_verification_status JSONB DEFAULT '{"Medical": "pending"}'::jsonb,
    guardians UUID[], -- Array of user IDs
    is_active BOOLEAN DEFAULT true,
    is_suspended BOOLEAN DEFAULT false,
    false_alert_count INTEGER DEFAULT 0,
    trust_score DECIMAL(3, 2) DEFAULT 0.0,
    total_ratings INTEGER DEFAULT 0,
    rating_sum INTEGER DEFAULT 0,
    is_online BOOLEAN DEFAULT false,
    last_seen TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create SOS table
CREATE TABLE IF NOT EXISTS public.sos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seeker_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    lat DECIMAL(10, 8) NOT NULL,
    lng DECIMAL(11, 8) NOT NULL,
    address TEXT,
    status VARCHAR(50) DEFAULT 'active',
    type VARCHAR(100),
    description TEXT,
    modal_data JSONB,
    first_response_guidance TEXT,
    call_script TEXT,
    responders UUID[], -- Array of user IDs
    false_alarm BOOLEAN DEFAULT false,
    is_anonymous BOOLEAN DEFAULT false,
    anonymous_name VARCHAR(255),
    anonymous_blood_group VARCHAR(10),
    chat_log JSONB,
    resolution_summary TEXT,
    debrief_prompt TEXT,
    response_time_seconds INTEGER,
    resolved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create welfare_checks table
CREATE TABLE IF NOT EXISTS public.welfare_checks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    guardian_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'pending',
    sent_at TIMESTAMP DEFAULT NOW(),
    responded_at TIMESTAMP,
    response TEXT
);

-- Create ratings table
CREATE TABLE IF NOT EXISTS public.ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sos_id UUID REFERENCES public.sos(id) ON DELETE CASCADE,
    rater_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    ratee_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    feedback TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_is_online ON public.users(is_online);
CREATE INDEX IF NOT EXISTS idx_sos_seeker_id ON public.sos(seeker_id);
CREATE INDEX IF NOT EXISTS idx_sos_status ON public.sos(status);
CREATE INDEX IF NOT EXISTS idx_welfare_checks_user_id ON public.welfare_checks(user_id);
CREATE INDEX IF NOT EXISTS idx_welfare_checks_guardian_id ON public.welfare_checks(guardian_id);
CREATE INDEX IF NOT EXISTS idx_ratings_sos_id ON public.ratings(sos_id);

-- Disable Row Level Security for custom JWT auth
-- Since we're using custom JWT authentication (not Supabase Auth), 
-- we'll handle security in the application layer
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.welfare_checks DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings DISABLE ROW LEVEL SECURITY;
