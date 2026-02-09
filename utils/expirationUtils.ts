/**
 * Utility functions for calculating todo expiration times
 * Based on category and creation date
 */

import { Database } from '@/lib/database.types';

type Todo = Database['public']['Tables']['todos']['Row'];

/**
 * Calculate when a todo should be deleted
 * Returns timestamp in milliseconds, or null if never expires (recurring)
 */
export function calculateExpirationTime(
  createdAt: string,
  category: 'daily' | 'weekly' | 'monthly' | null,
  isRecurring: boolean | null,
  dueDate: string | null,
  dueTime: string | null
): number | null {
  // Recurring todos never expire
  if (isRecurring) {
    return null;
  }

  const createdAtTime = new Date(createdAt).getTime();

  // Others category (no category)
  if (category === null) {
    // If has due date + due time, expire 24 hours after that
    if (dueDate && dueTime) {
      // Check if dueDate is a timestamp (large number stored as string)
      const dueDateNum = parseInt(dueDate, 10);
      
      if (!isNaN(dueDateNum) && dueDateNum > 946684800000) {
        // It's a timestamp
        const dueDateObj = new Date(dueDateNum);
        const timeParts = dueTime.trim().split(' ');
        const time = timeParts[0];
        const period = timeParts[1];
        const [hoursStr, minutesStr] = time.split(':');
        let hours = parseInt(hoursStr, 10);
        const minutes = parseInt(minutesStr, 10);

        if (period === 'PM' && hours !== 12) hours += 12;
        if (period === 'AM' && hours === 12) hours = 0;

        dueDateObj.setHours(hours, minutes, 0, 0);
        return dueDateObj.getTime() + 24 * 60 * 60 * 1000; // 24 hours after due time
      } else {
        // dueDate is an ISO string
        const dueDateObj = new Date(dueDate);
        const timeParts = dueTime.trim().split(' ');
        const time = timeParts[0];
        const period = timeParts[1];
        const [hoursStr, minutesStr] = time.split(':');
        let hours = parseInt(hoursStr, 10);
        const minutes = parseInt(minutesStr, 10);

        if (period === 'PM' && hours !== 12) hours += 12;
        if (period === 'AM' && hours === 12) hours = 0;

        dueDateObj.setHours(hours, minutes, 0, 0);
        return dueDateObj.getTime() + 24 * 60 * 60 * 1000; // 24 hours after due time
      }
    }

    // If has only due date (no time), expire 24 hours after end of that day
    if (dueDate) {
      const dueDateNum = parseInt(dueDate, 10);
      
      if (!isNaN(dueDateNum) && dueDateNum > 946684800000) {
        // It's a timestamp
        const dueDateObj = new Date(dueDateNum);
        dueDateObj.setHours(23, 59, 59, 999);
        return dueDateObj.getTime() + 24 * 60 * 60 * 1000;
      } else {
        // It's an ISO string
        const dueDateObj = new Date(dueDate);
        dueDateObj.setHours(23, 59, 59, 999);
        return dueDateObj.getTime() + 24 * 60 * 60 * 1000;
      }
    }

    // No due date/time set: expire 24 hours after creation
    return createdAtTime + 24 * 60 * 60 * 1000;
  }

  // For categorized todos: calculate based on creation day end + grace period
  const createdDate = new Date(createdAt);
  // Set to end of creation day (11:59:59 PM)
  createdDate.setHours(23, 59, 59, 999);
  const endOfCreationDay = createdDate.getTime();

  switch (category) {
    case 'daily':
      // 1 day period + 24 hour grace = 48 hours
      return endOfCreationDay + 48 * 60 * 60 * 1000;
    
    case 'weekly':
      // 7 days period + 24 hour grace = 192 hours (8 days)
      return endOfCreationDay + 192 * 60 * 60 * 1000;
    
    case 'monthly':
      // 30 days period + 24 hour grace = 744 hours (31 days)
      return endOfCreationDay + 744 * 60 * 60 * 1000;
    
    default:
      return null;
  }
}

/**
 * Check if a todo should be deleted now
 */
export function shouldDeleteTodo(todo: Todo): boolean {
  const expirationTime = calculateExpirationTime(
    todo.created_at,
    todo.category,
    todo.is_recurring,
    todo.due_date,
    todo.due_time
  );

  // If no expiration time, never delete (recurring)
  if (expirationTime === null) {
    return false;
  }

  // Check if current time has passed expiration
  return Date.now() > expirationTime;
}

/**
 * Calculate when to show expiration warning
 * Returns timestamp in milliseconds, or null if no warning needed
 * 
 * For todos WITH due date: Warning shows AFTER due date passes
 * For todos WITHOUT due date: Warning shows 12 hours before expiration
 */
export function calculateWarningTime(
  createdAt: string,
  category: 'daily' | 'weekly' | 'monthly' | null,
  isRecurring: boolean | null,
  dueDate: string | null,
  dueTime: string | null
): number | null {
  const expirationTime = calculateExpirationTime(
    createdAt,
    category,
    isRecurring,
    dueDate,
    dueTime
  );

  if (expirationTime === null) {
    return null;
  }

  // For todos with due date in "Others" category: warning starts AFTER due date
  if (category === null && dueDate) {
    // Parse the due date/time to get when it's due
    const dueDateNum = parseInt(dueDate, 10);
    let dueDateTime: number;
    
    if (!isNaN(dueDateNum) && dueDateNum > 946684800000) {
      // It's a timestamp
      dueDateTime = dueDateNum;
      
      if (dueTime) {
        const dueDateObj = new Date(dueDateNum);
        const timeParts = dueTime.trim().split(' ');
        const time = timeParts[0];
        const period = timeParts[1];
        const [hoursStr, minutesStr] = time.split(':');
        let hours = parseInt(hoursStr, 10);
        const minutes = parseInt(minutesStr, 10);

        if (period === 'PM' && hours !== 12) hours += 12;
        if (period === 'AM' && hours === 12) hours = 0;

        dueDateObj.setHours(hours, minutes, 0, 0);
        dueDateTime = dueDateObj.getTime();
      }
    } else {
      // It's an ISO string
      const dueDateObj = new Date(dueDate);
      
      if (dueTime) {
        const timeParts = dueTime.trim().split(' ');
        const time = timeParts[0];
        const period = timeParts[1];
        const [hoursStr, minutesStr] = time.split(':');
        let hours = parseInt(hoursStr, 10);
        const minutes = parseInt(minutesStr, 10);

        if (period === 'PM' && hours !== 12) hours += 12;
        if (period === 'AM' && hours === 12) hours = 0;

        dueDateObj.setHours(hours, minutes, 0, 0);
        dueDateTime = dueDateObj.getTime();
      } else {
        // No time, use end of day
        dueDateObj.setHours(23, 59, 59, 999);
        dueDateTime = dueDateObj.getTime();
      }
    }

    // Warning starts right AFTER the due date passes
    return dueDateTime;
  }

  // For todos WITHOUT due date: Warning shows 12 hours before expiration
  if (category === null) {
    const warningTime = expirationTime - 12 * 60 * 60 * 1000;
    return warningTime;
  }

  // For categorized todos (daily/weekly/monthly): 24 hours before expiration
  const warningTime = expirationTime - 24 * 60 * 60 * 1000;
  return warningTime;
}

/**
 * Check if a todo is in the warning window (should show "expiring soon")
 */
export function isInWarningWindow(todo: Todo): boolean {
  const warningTime = calculateWarningTime(
    todo.created_at,
    todo.category,
    todo.is_recurring,
    todo.due_date,
    todo.due_time
  );

  if (warningTime === null) {
    return false;
  }

  const expirationTime = calculateExpirationTime(
    todo.created_at,
    todo.category,
    todo.is_recurring,
    todo.due_date,
    todo.due_time
  );

  if (expirationTime === null) {
    return false;
  }

  const now = Date.now();
  return now >= warningTime && now < expirationTime;
}

/**
 * Get hours until deletion
 */
export function getHoursUntilDeletion(todo: Todo): number | null {
  const expirationTime = calculateExpirationTime(
    todo.created_at,
    todo.category,
    todo.is_recurring,
    todo.due_date,
    todo.due_time
  );

  if (expirationTime === null) {
    return null;
  }

  const hoursRemaining = (expirationTime - Date.now()) / (1000 * 60 * 60);
  return Math.max(0, Math.ceil(hoursRemaining));
}
