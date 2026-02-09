import { supabase } from './supabase';
import { Database } from './database.types';

type Feedback = Database['public']['Tables']['feedback']['Row'];
type FeedbackInsert = Database['public']['Tables']['feedback']['Insert'];

// Constants for rate limiting and validation
const MAX_FEEDBACK_PER_DAY = 2;
const MAX_TITLE_LENGTH = 200;
const MAX_DESCRIPTION_LENGTH = 2000;
const MIN_TITLE_LENGTH = 3;

// Helper to get start of today in UTC
function getStartOfTodayUTC(): string {
  const now = new Date();
  now.setUTCHours(0, 0, 0, 0);
  return now.toISOString();
}

// Save feedback to database with rate limiting
export async function submitFeedback(args: {
  userId: string;
  userEmail: string;
  userName?: string;
  type: 'feature' | 'bug';
  title: string;
  description?: string;
}): Promise<string> {
  // Input validation - length checks
  const trimmedTitle = args.title.trim();
  const trimmedDescription = args.description?.trim() || '';

  if (trimmedTitle.length < MIN_TITLE_LENGTH) {
    throw new Error(`Title must be at least ${MIN_TITLE_LENGTH} characters`);
  }
  if (trimmedTitle.length > MAX_TITLE_LENGTH) {
    throw new Error(`Title must be less than ${MAX_TITLE_LENGTH} characters`);
  }
  if (trimmedDescription && trimmedDescription.length > MAX_DESCRIPTION_LENGTH) {
    throw new Error(`Description must be less than ${MAX_DESCRIPTION_LENGTH} characters`);
  }

  // Rate limiting - check how many feedbacks user submitted today
  const startOfToday = getStartOfTodayUTC();
  const { data: userFeedbackToday, error: fetchError } = await supabase
    .from('feedback')
    .select('id')
    .eq('user_id', args.userId)
    .gte('created_at', startOfToday);

  if (fetchError) throw fetchError;

  if ((userFeedbackToday?.length || 0) >= MAX_FEEDBACK_PER_DAY) {
    throw new Error(
      `You can only submit ${MAX_FEEDBACK_PER_DAY} feedback per day. Please try again tomorrow.`
    );
  }

  const feedbackInsert: FeedbackInsert = {
    user_id: args.userId,
    user_email: args.userEmail,
    user_name: args.userName,
    type: args.type,
    title: trimmedTitle,
    description: trimmedDescription || null,
    status: 'pending',
  };

  const { data, error } = await supabase
    .from('feedback')
    .insert(feedbackInsert)
    .select()
    .single();

  if (error) throw error;
  return data.id;
}

// Get user's own feedback history only
export async function getUserFeedback(userId: string): Promise<Feedback[]> {
  const { data, error } = await supabase
    .from('feedback')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}
