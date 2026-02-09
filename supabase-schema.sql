-- Supabase Database Schema for Zenith Task App
-- Run this SQL in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    name TEXT,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Todos table
CREATE TABLE IF NOT EXISTS public.todos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    user_id UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    is_completed BOOLEAN DEFAULT FALSE,
    due_date TIMESTAMPTZ,
    due_time TEXT,
    priority TEXT NOT NULL CHECK (
        priority IN ('high', 'medium', 'low')
    ),
    category TEXT CHECK (
        category IN ('daily', 'weekly', 'monthly')
    ),
    is_recurring BOOLEAN DEFAULT FALSE,
    recurring_pattern TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Feedback table
CREATE TABLE IF NOT EXISTS public.feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    user_id UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
    user_email TEXT NOT NULL,
    user_name TEXT,
    type TEXT NOT NULL CHECK (type IN ('feature', 'bug')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (
        status IN (
            'pending',
            'reviewed',
            'resolved'
        )
    ),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_todos_user_id ON public.todos (user_id);

CREATE INDEX IF NOT EXISTS idx_todos_category ON public.todos (user_id, category);

CREATE INDEX IF NOT EXISTS idx_todos_priority ON public.todos (user_id, priority);

CREATE INDEX IF NOT EXISTS idx_todos_due_date ON public.todos (due_date);

CREATE INDEX IF NOT EXISTS idx_todos_completed ON public.todos (user_id, is_completed);

CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON public.feedback (user_id);

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own profile" ON public.users FOR
SELECT USING (auth.uid () = id);

CREATE POLICY "Users can update their own profile" ON public.users FOR
UPDATE USING (auth.uid () = id);

CREATE POLICY "Users can insert their own profile" ON public.users FOR
INSERT
WITH
    CHECK (auth.uid () = id);

-- Todos policies
CREATE POLICY "Users can view their own todos" ON public.todos FOR
SELECT USING (auth.uid () = user_id);

CREATE POLICY "Users can insert their own todos" ON public.todos FOR
INSERT
WITH
    CHECK (auth.uid () = user_id);

CREATE POLICY "Users can update their own todos" ON public.todos FOR
UPDATE USING (auth.uid () = user_id);

CREATE POLICY "Users can delete their own todos" ON public.todos FOR DELETE USING (auth.uid () = user_id);

-- Feedback policies
CREATE POLICY "Users can view their own feedback" ON public.feedback FOR
SELECT USING (auth.uid () = user_id);

CREATE POLICY "Users can insert their own feedback" ON public.feedback FOR
INSERT
WITH
    CHECK (auth.uid () = user_id);

-- Server-side rate limiting function for feedback
-- Prevents users from submitting more than 2 feedback per day
CREATE OR REPLACE FUNCTION check_feedback_rate_limit()
RETURNS TRIGGER AS $$
DECLARE
    feedback_count INTEGER;
BEGIN
    -- Count feedback submitted today by this user
    SELECT COUNT(*) INTO feedback_count
    FROM public.feedback
    WHERE user_id = NEW.user_id
    AND created_at >= CURRENT_DATE;
    
    -- If user has already submitted 2 or more feedback today, reject
    IF feedback_count >= 2 THEN
        RAISE EXCEPTION 'Rate limit exceeded: You can only submit 2 feedback per day';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for feedback rate limiting
CREATE TRIGGER enforce_feedback_rate_limit
    BEFORE INSERT ON public.feedback
    FOR EACH ROW EXECUTE FUNCTION check_feedback_rate_limit();

-- Server-side TODO limit enforcement
-- Prevents users from creating unlimited todos per category
CREATE OR REPLACE FUNCTION check_todo_limits()
RETURNS TRIGGER AS $$
DECLARE
    todo_count INTEGER;
    max_limit INTEGER;
BEGIN
    -- Define limits per category
    -- daily: 30, weekly: 20, monthly: 30, others: 50
    IF NEW.category = 'daily' THEN
        max_limit := 30;
    ELSIF NEW.category = 'weekly' THEN
        max_limit := 20;
    ELSIF NEW.category = 'monthly' THEN
        max_limit := 30;
    ELSE
        -- For 'others' category (NULL category), set a reasonable limit
        max_limit := 50;
    END IF;
    
    -- Count existing todos in this category for this user
    IF NEW.category IS NULL THEN
        SELECT COUNT(*) INTO todo_count
        FROM public.todos
        WHERE user_id = NEW.user_id
        AND category IS NULL;
    ELSE
        SELECT COUNT(*) INTO todo_count
        FROM public.todos
        WHERE user_id = NEW.user_id
        AND category = NEW.category;
    END IF;
    
    -- Check if limit exceeded
    IF todo_count >= max_limit THEN
        RAISE EXCEPTION 'Todo limit exceeded: You can only have % todos in % category', 
            max_limit, 
            COALESCE(NEW.category, 'others');
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for TODO limit enforcement
CREATE TRIGGER enforce_todo_limits
    BEFORE INSERT ON public.todos
    FOR EACH ROW EXECUTE FUNCTION check_todo_limits();

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_todos_updated_at BEFORE UPDATE ON public.todos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create a user profile on sign up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, name, image_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile on sign up
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- IMPORTANT: Configure Google OAuth in Supabase Dashboard
-- 1. Go to Authentication > Providers
-- 2. Enable Google provider
-- 3. Add your Google OAuth credentials (Client ID and Client Secret)
-- 4. Add authorized redirect URIs:
--    - For development: http://localhost:19006
--    - For production: your-app-scheme://google-callback

-- IMPORTANT: Update your .env file with:
-- EXPO_PUBLIC_SUPABASE_URL=your-supabase-project-url
-- EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key