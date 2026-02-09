import { supabase } from './supabase';
import { Database } from './database.types';

type Todo = Database['public']['Tables']['todos']['Row'];
type TodoInsert = Database['public']['Tables']['todos']['Insert'];
type TodoUpdate = Database['public']['Tables']['todos']['Update'];

// Input validation constants
const MAX_TITLE_LENGTH = 200;
const MAX_DESCRIPTION_LENGTH = 1000;
const MIN_TITLE_LENGTH = 1;

// Helper function to validate todo input
function validateTodoInput(title?: string, description?: string) {
  if (title !== undefined) {
    const trimmedTitle = title.trim();
    if (trimmedTitle.length < MIN_TITLE_LENGTH) {
      throw new Error('Title cannot be empty');
    }
    if (trimmedTitle.length > MAX_TITLE_LENGTH) {
      throw new Error(`Title must be less than ${MAX_TITLE_LENGTH} characters`);
    }
  }
  if (description !== undefined && description.length > MAX_DESCRIPTION_LENGTH) {
    throw new Error(`Description must be less than ${MAX_DESCRIPTION_LENGTH} characters`);
  }
}

// Get all todos for a specific user
export async function getTodos(userId: string): Promise<Todo[]> {
  const { data, error } = await supabase
    .from('todos')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

// Get todos by category
export async function getTodosByCategory(
  userId: string,
  category?: 'daily' | 'weekly' | 'monthly'
): Promise<Todo[]> {
  let query = supabase
    .from('todos')
    .select('*')
    .eq('user_id', userId);

  if (category === undefined) {
    query = query.is('category', null);
  } else {
    query = query.eq('category', category);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) throw error;

  // Sort by priority
  const priorityOrder: Record<'high' | 'medium' | 'low', number> = { high: 0, medium: 1, low: 2 };
  return (data || []).sort((a, b) => priorityOrder[a.priority as 'high' | 'medium' | 'low'] - priorityOrder[b.priority as 'high' | 'medium' | 'low']);
}

// Get todos by priority
export async function getTodosByPriority(
  userId: string,
  priority: 'high' | 'medium' | 'low'
): Promise<Todo[]> {
  const { data, error } = await supabase
    .from('todos')
    .select('*')
    .eq('user_id', userId)
    .eq('priority', priority)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

// Add a new todo
export async function addTodo(todo: {
  userId: string;
  title: string;
  description?: string;
  dueDate?: number;
  dueTime?: string;
  priority: 'high' | 'medium' | 'low';
  category?: 'daily' | 'weekly' | 'monthly';
  isRecurring?: boolean;
  recurringPattern?: string;
}): Promise<string> {
  // Validate input lengths
  validateTodoInput(todo.title, todo.description);

  const todoInsert: TodoInsert = {
    user_id: todo.userId,
    title: todo.title,
    description: todo.description,
    is_completed: false,
    due_date: todo.dueDate ? new Date(todo.dueDate).toISOString() : null,
    due_time: todo.dueTime,
    priority: todo.priority,
    category: todo.category,
    is_recurring: todo.isRecurring,
    recurring_pattern: todo.recurringPattern,
  };

  const { data, error } = await supabase
    .from('todos')
    .insert(todoInsert)
    .select()
    .single();

  if (error) throw error;
  return data.id;
}

// Toggle todo completion
export async function toggleTodo(id: string, userId: string): Promise<void> {
  // First, get the current todo
  const { data: todo, error: fetchError } = await supabase
    .from('todos')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError) throw fetchError;
  if (!todo) throw new Error('Todo not found');
  if (todo.user_id !== userId) throw new Error('Unauthorized');

  const { error } = await supabase
    .from('todos')
    .update({
      is_completed: !todo.is_completed,
      completed_at: !todo.is_completed ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) throw error;
}

// Delete todo
export async function deleteTodo(id: string, userId: string): Promise<void> {
  // First, verify ownership
  const { data: todo, error: fetchError } = await supabase
    .from('todos')
    .select('user_id')
    .eq('id', id)
    .single();

  if (fetchError) throw fetchError;
  if (!todo) throw new Error('Todo not found');
  if (todo.user_id !== userId) throw new Error('Unauthorized');

  const { error } = await supabase
    .from('todos')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// Update todo
export async function updateTodo(args: {
  id: string;
  userId: string;
  title?: string;
  description?: string;
  dueDate?: number;
  dueTime?: string;
  priority?: 'high' | 'medium' | 'low';
  category?: 'daily' | 'weekly' | 'monthly';
  isRecurring?: boolean;
  recurringPattern?: string;
  clearCategory?: boolean;
  clearDueDate?: boolean;
  clearDueTime?: boolean;
  clearDescription?: boolean;
  clearRecurringPattern?: boolean;
}): Promise<void> {
  // Validate input lengths
  validateTodoInput(args.title, args.description);

  // First, verify ownership
  const { data: todo, error: fetchError } = await supabase
    .from('todos')
    .select('*')
    .eq('id', args.id)
    .single();

  if (fetchError) throw fetchError;
  if (!todo) throw new Error('Todo not found');
  if (todo.user_id !== args.userId) throw new Error('Unauthorized');

  const updates: TodoUpdate = {
    updated_at: new Date().toISOString(),
  };

  if (args.title !== undefined) updates.title = args.title;
  if (args.priority !== undefined) updates.priority = args.priority;
  if (args.isRecurring !== undefined) updates.is_recurring = args.isRecurring;

  // Handle fields that can be explicitly cleared
  if (args.clearDescription) {
    updates.description = null;
  } else if (args.description !== undefined) {
    updates.description = args.description;
  }

  if (args.clearDueDate) {
    updates.due_date = null;
  } else if (args.dueDate !== undefined) {
    updates.due_date = new Date(args.dueDate).toISOString();
  }

  if (args.clearDueTime) {
    updates.due_time = null;
  } else if (args.dueTime !== undefined) {
    updates.due_time = args.dueTime;
  }

  if (args.clearCategory) {
    updates.category = null;
  } else if (args.category !== undefined) {
    updates.category = args.category;
  }

  if (args.clearRecurringPattern) {
    updates.recurring_pattern = null;
  } else if (args.recurringPattern !== undefined) {
    updates.recurring_pattern = args.recurringPattern;
  }

  // If a completed todo is being changed to recurring, reset it immediately
  if (args.isRecurring === true && !todo.is_recurring && todo.is_completed) {
    updates.is_completed = false;
    updates.completed_at = null;
  }

  const { error } = await supabase
    .from('todos')
    .update(updates)
    .eq('id', args.id);

  if (error) throw error;
}

// Clear all todos for a user
export async function clearAllTodos(userId: string): Promise<{ deletedCount: number }> {
  const { data: todos, error: fetchError } = await supabase
    .from('todos')
    .select('id')
    .eq('user_id', userId);

  if (fetchError) throw fetchError;

  const { error } = await supabase
    .from('todos')
    .delete()
    .eq('user_id', userId);

  if (error) throw error;

  return { deletedCount: todos?.length || 0 };
}

// Get user statistics
export async function getUserStats(userId: string) {
  const todos = await getTodos(userId);

  const total = todos.length;
  const completed = todos.filter((t) => t.is_completed).length;
  const active = total - completed;

  // Get todos by category
  const dailyTodos = todos.filter((t) => t.category === 'daily');
  const weeklyTodos = todos.filter((t) => t.category === 'weekly');
  const monthlyTodos = todos.filter((t) => t.category === 'monthly');
  const othersTodos = todos.filter((t) => t.category === null);

  const byCategory = {
    daily: dailyTodos.length,
    weekly: weeklyTodos.length,
    monthly: monthlyTodos.length,
    others: othersTodos.length,
  };

  // Per-category completion stats
  const byCategoryStats = {
    daily: {
      total: dailyTodos.length,
      completed: dailyTodos.filter((t) => t.is_completed).length,
      completionRate: dailyTodos.length > 0
        ? Math.round((dailyTodos.filter((t) => t.is_completed).length / dailyTodos.length) * 100)
        : 0,
    },
    weekly: {
      total: weeklyTodos.length,
      completed: weeklyTodos.filter((t) => t.is_completed).length,
      completionRate: weeklyTodos.length > 0
        ? Math.round((weeklyTodos.filter((t) => t.is_completed).length / weeklyTodos.length) * 100)
        : 0,
    },
    monthly: {
      total: monthlyTodos.length,
      completed: monthlyTodos.filter((t) => t.is_completed).length,
      completionRate: monthlyTodos.length > 0
        ? Math.round((monthlyTodos.filter((t) => t.is_completed).length / monthlyTodos.length) * 100)
        : 0,
    },
    others: {
      total: othersTodos.length,
      completed: othersTodos.filter((t) => t.is_completed).length,
      completionRate: othersTodos.length > 0
        ? Math.round((othersTodos.filter((t) => t.is_completed).length / othersTodos.length) * 100)
        : 0,
    },
  };

  const byPriority = {
    high: todos.filter((t) => t.priority === 'high').length,
    medium: todos.filter((t) => t.priority === 'medium').length,
    low: todos.filter((t) => t.priority === 'low').length,
  };

  return {
    total,
    completed,
    active,
    byCategory,
    byCategoryStats,
    byPriority,
    completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
  };
}

// Get todos expiring soon (within warning window)
export async function getTodosExpiringSoon(userId: string): Promise<Todo[]> {
  const { data, error } = await supabase
    .from('todos')
    .select('*')
    .eq('user_id', userId)
    .eq('is_completed', false)
    .order('created_at', { ascending: false });

  if (error) throw error;
  
  // Filter on client side using expiration logic
  const { isInWarningWindow } = await import('@/utils/expirationUtils');
  return (data || []).filter(isInWarningWindow);
}

// Delete expired todos for a specific user
export async function deleteExpiredTodos(userId: string): Promise<{ deletedCount: number; deletedIds: string[] }> {
  // Get all todos for the user
  const { data: todos, error: fetchError } = await supabase
    .from('todos')
    .select('*')
    .eq('user_id', userId);

  if (fetchError) throw fetchError;
  if (!todos || todos.length === 0) return { deletedCount: 0, deletedIds: [] };

  // Filter to find expired todos using client-side logic
  const { shouldDeleteTodo } = await import('@/utils/expirationUtils');
  const expiredTodos = todos.filter(shouldDeleteTodo);

  if (expiredTodos.length === 0) {
    return { deletedCount: 0, deletedIds: [] };
  }

  // Delete expired todos
  const expiredIds = expiredTodos.map(t => t.id);
  const { error: deleteError } = await supabase
    .from('todos')
    .delete()
    .in('id', expiredIds);

  if (deleteError) throw deleteError;

  return { deletedCount: expiredTodos.length, deletedIds: expiredIds };
}
