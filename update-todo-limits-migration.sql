-- Migration script to update todo limits
-- Run this in your Supabase SQL Editor to update the database limits

-- Drop the old trigger and function
DROP TRIGGER IF EXISTS enforce_todo_limits ON public.todos;

DROP FUNCTION IF EXISTS check_todo_limits ();

-- Recreate the function with new limits
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
        -- For 'others' category (NULL category)
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

-- Recreate the trigger
CREATE TRIGGER enforce_todo_limits
    BEFORE INSERT ON public.todos
    FOR EACH ROW EXECUTE FUNCTION check_todo_limits();

-- Verify the function exists
SELECT
    proname as function_name,
    prosrc as function_source
FROM pg_proc
WHERE
    proname = 'check_todo_limits';

COMMENT ON FUNCTION check_todo_limits () IS 'Enforces todo creation limits per category: daily=30, weekly=20, monthly=30, others=50';