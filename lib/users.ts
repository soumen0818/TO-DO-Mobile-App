import { supabase } from './supabase';
import { Database } from './database.types';

type User = Database['public']['Tables']['users']['Row'];
type UserInsert = Database['public']['Tables']['users']['Insert'];

// Create or update user (sync with auth)
export async function syncUser(args: {
  id: string;
  email: string;
  name?: string;
  imageUrl?: string;
}): Promise<string> {
  // Check if user exists
  const { data: existingUser, error: fetchError } = await supabase
    .from('users')
    .select('*')
    .eq('id', args.id)
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') {
    // PGRST116 is "not found" error
    throw fetchError;
  }

  if (existingUser) {
    // Update existing user
    const { error } = await supabase
      .from('users')
      .update({
        email: args.email,
        name: args.name,
        image_url: args.imageUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', args.id);

    if (error) throw error;
    return existingUser.id;
  } else {
    // Create new user
    const userInsert: UserInsert = {
      id: args.id,
      email: args.email,
      name: args.name,
      image_url: args.imageUrl,
    };

    const { data, error } = await supabase
      .from('users')
      .insert(userInsert)
      .select()
      .single();

    if (error) throw error;
    return data.id;
  }
}

// Get user by ID
export async function getUserById(id: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

// Check if email already exists (for signup validation)
export async function checkEmailExists(email: string): Promise<{ exists: boolean }> {
  const { data, error } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return { exists: !!data };
}

// Update user profile
export async function updateUserProfile(args: {
  id: string;
  name?: string;
  imageUrl?: string;
}): Promise<string> {
  const { data: user, error: fetchError } = await supabase
    .from('users')
    .select('id')
    .eq('id', args.id)
    .single();

  if (fetchError) throw fetchError;
  if (!user) throw new Error('User not found');

  const updates: any = {
    updated_at: new Date().toISOString(),
  };
  if (args.name !== undefined) updates.name = args.name;
  if (args.imageUrl !== undefined) updates.image_url = args.imageUrl;

  const { error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', args.id);

  if (error) throw error;
  return user.id;
}

// Delete user and all their data
export async function deleteUser(id: string): Promise<void> {
  const { data: user, error: fetchError } = await supabase
    .from('users')
    .select('id')
    .eq('id', id)
    .single();

  if (fetchError) throw fetchError;
  if (!user) throw new Error('User not found');

  // Delete all user's todos
  await supabase
    .from('todos')
    .delete()
    .eq('user_id', id);

  // Delete all user's feedback
  await supabase
    .from('feedback')
    .delete()
    .eq('user_id', id);

  // Delete user
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
