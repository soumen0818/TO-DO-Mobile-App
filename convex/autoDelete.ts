import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";

// Check if a todo should be deleted based on its category and creation time
function shouldDeleteTodo(
  createdAt: number,
  category: "daily" | "weekly" | "monthly" | undefined,
  isCompleted: boolean,
  isRecurring?: boolean,
  dueDate?: number,
  dueTime?: string,
): boolean {
  // Never delete recurring todos
  if (isRecurring) {
    return false;
  }

  const now = Date.now();
  let expirationTime: number;

  // Handle undefined/null category (Others) - delete after 24 hours from dueDate+dueTime or createdAt
  if (!category) {
    if (dueDate && dueTime) {
      // If date and time are set, delete 24 hours after that time
      const dueDateObj = new Date(dueDate);
      const [time, period] = dueTime.split(" ");
      let [hours, minutes] = time.split(":").map(Number);

      if (period === "PM" && hours !== 12) hours += 12;
      if (period === "AM" && hours === 12) hours = 0;

      dueDateObj.setHours(hours, minutes, 0, 0);
      expirationTime = dueDateObj.getTime() + 24 * 60 * 60 * 1000; // 24 hours after due time
    } else {
      // If no date/time set, delete 24 hours after creation
      expirationTime = createdAt + 24 * 60 * 60 * 1000;
    }
    return now > expirationTime;
  }

  const createdDate = new Date(createdAt);
  // Set time to end of day in UTC for consistent comparison across server/client
  createdDate.setUTCHours(23, 59, 59, 999);

  switch (category) {
    case "daily":
      // Delete after 1 day + 24 hour grace period = 2 days total
      expirationTime = createdDate.getTime() + 2 * 24 * 60 * 60 * 1000;
      break;
    case "weekly":
      // Delete after 7 days + 24 hour grace period = 8 days total
      expirationTime = createdDate.getTime() + 8 * 24 * 60 * 60 * 1000;
      break;
    case "monthly":
      // Delete after 30 days + 24 hour grace period = 31 days total
      expirationTime = createdDate.getTime() + 31 * 24 * 60 * 60 * 1000;
      break;
  }

  return now > expirationTime;
}

// Query to get expired todos for a user
export const getExpiredTodos = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const todos = await ctx.db
      .query("todos")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const expiredTodos = todos.filter((todo) =>
      shouldDeleteTodo(
        todo.createdAt,
        todo.category,
        todo.isCompleted,
        todo.isRecurring,
        todo.dueDate,
        todo.dueTime,
      ),
    );

    return expiredTodos;
  },
});

// Query to get todos expiring soon (within next 24 hours) - for notifications
export const getTodosExpiringSoon = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const todos = await ctx.db
      .query("todos")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const now = Date.now();
    const expiringTodos = todos.filter((todo) => {
      // Never show expiring warning for completed todos - they're done!
      if (todo.isCompleted) {
        return false;
      }
      
      // Never show expiring warning for recurring todos - they don't get deleted
      if (todo.isRecurring === true) {
        return false;
      }

      let expirationTime: number = 0;
      let notificationTime: number = 0;

      // Handle undefined/null category (Others) - use falsy check for consistency
      if (!todo.category) {
        if (todo.dueDate && todo.dueTime) {
          const dueDateObj = new Date(todo.dueDate);
          const [time, period] = todo.dueTime.split(" ");
          let [hours, minutes] = time.split(":").map(Number);

          if (period === "PM" && hours !== 12) hours += 12;
          if (period === "AM" && hours === 12) hours = 0;

          dueDateObj.setHours(hours, minutes, 0, 0);
          expirationTime = dueDateObj.getTime() + 24 * 60 * 60 * 1000;
        } else {
          expirationTime = todo.createdAt + 24 * 60 * 60 * 1000;
        }
        notificationTime = expirationTime - 12 * 60 * 60 * 1000; // 12 hours before
      } else {
        const createdDate = new Date(todo.createdAt);
        createdDate.setUTCHours(23, 59, 59, 999);

        switch (todo.category) {
          case "daily":
            expirationTime = createdDate.getTime() + 2 * 24 * 60 * 60 * 1000;
            notificationTime = expirationTime - 24 * 60 * 60 * 1000;
            break;
          case "weekly":
            expirationTime = createdDate.getTime() + 8 * 24 * 60 * 60 * 1000;
            notificationTime = expirationTime - 24 * 60 * 60 * 1000;
            break;
          case "monthly":
            expirationTime = createdDate.getTime() + 31 * 24 * 60 * 60 * 1000;
            notificationTime = expirationTime - 24 * 60 * 60 * 1000;
            break;
          default:
            // Fallback for any unexpected category value
            expirationTime = createdDate.getTime() + 2 * 24 * 60 * 60 * 1000;
            notificationTime = expirationTime - 24 * 60 * 60 * 1000;
            break;
        }
      }

      // Return todos that are in the notification window (within 24 hours of deletion)
      const isInNotificationWindow = now >= notificationTime && now < expirationTime;
      return isInNotificationWindow;
    });

    return expiringTodos.map((todo) => {
      // Recalculate expirationTime for each todo to get accurate hours
      let expirationTime: number = 0;
      
      if (!todo.category) {
        if (todo.dueDate && todo.dueTime) {
          const dueDateObj = new Date(todo.dueDate);
          const [time, period] = todo.dueTime.split(" ");
          let [hours, minutes] = time.split(":").map(Number);
          if (period === "PM" && hours !== 12) hours += 12;
          if (period === "AM" && hours === 12) hours = 0;
          dueDateObj.setHours(hours, minutes, 0, 0);
          expirationTime = dueDateObj.getTime() + 24 * 60 * 60 * 1000;
        } else {
          expirationTime = todo.createdAt + 24 * 60 * 60 * 1000;
        }
      } else {
        const createdDate = new Date(todo.createdAt);
        createdDate.setUTCHours(23, 59, 59, 999);
        switch (todo.category) {
          case "daily":
            expirationTime = createdDate.getTime() + 2 * 24 * 60 * 60 * 1000;
            break;
          case "weekly":
            expirationTime = createdDate.getTime() + 8 * 24 * 60 * 60 * 1000;
            break;
          case "monthly":
            expirationTime = createdDate.getTime() + 31 * 24 * 60 * 60 * 1000;
            break;
          default:
            expirationTime = createdDate.getTime() + 2 * 24 * 60 * 60 * 1000;
            break;
        }
      }
      
      const hoursUntilDeletion = Math.max(0, Math.ceil((expirationTime - now) / (1000 * 60 * 60)));
      
      return {
        ...todo,
        hoursUntilDeletion,
      };
    });
  },
});

// Internal mutation to delete expired todos (called by scheduled function)
export const deleteExpiredTodos = internalMutation({
  handler: async (ctx) => {
    const todos = await ctx.db.query("todos").collect();

    let deletedCount = 0;

    for (const todo of todos) {
      if (
        shouldDeleteTodo(
          todo.createdAt,
          todo.category,
          todo.isCompleted,
          todo.isRecurring,
          todo.dueDate,
          todo.dueTime,
        )
      ) {
        await ctx.db.delete(todo._id);
        deletedCount++;
      }
    }

    console.log(`Auto-deleted ${deletedCount} expired todos`);
    return { deletedCount };
  },
});

// Manual deletion of expired todos for a specific user
export const deleteMyExpiredTodos = mutation({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const todos = await ctx.db
      .query("todos")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    let deletedCount = 0;

    for (const todo of todos) {
      if (
        shouldDeleteTodo(
          todo.createdAt,
          todo.category,
          todo.isCompleted,
          todo.isRecurring,
          todo.dueDate,
          todo.dueTime,
        )
      ) {
        await ctx.db.delete(todo._id);
        deletedCount++;
      }
    }

    return { deletedCount, message: `Deleted ${deletedCount} expired todos` };
  },
});

// Check if a recurring todo should be reset based on its pattern
function shouldResetRecurringTodo(
  todo: {
    isCompleted: boolean;
    isRecurring?: boolean;
    recurringPattern?: string;
    category?: "daily" | "weekly" | "monthly";
    completedAt?: number;
    dueDate?: number; // For weekly: weekday (0-6), for monthly: day of month (1-31)
  },
): boolean {
  // Only reset completed recurring todos
  if (!todo.isRecurring || !todo.isCompleted || !todo.completedAt) {
    return false;
  }

  const now = new Date();
  const completedAt = new Date(todo.completedAt);
  const pattern = todo.recurringPattern || todo.category || "daily";

  switch (pattern) {
    case "daily": {
      // Reset if completed on a previous day
      const isNewDay =
        completedAt.getDate() !== now.getDate() ||
        completedAt.getMonth() !== now.getMonth() ||
        completedAt.getFullYear() !== now.getFullYear();
      return isNewDay;
    }

    case "weekly": {
      // Reset if it's a new week occurrence
      // If dueDate is set (weekday 0-6), reset when that weekday arrives after completion
      if (todo.dueDate !== undefined && todo.dueDate <= 6) {
        const targetWeekday = todo.dueDate;
        const currentWeekday = now.getDay();

        // Check if we're on or past the target weekday in a new week
        if (currentWeekday === targetWeekday) {
          // It's the target day - reset if completed before today
          return (
            completedAt.getDate() !== now.getDate() ||
            completedAt.getMonth() !== now.getMonth() ||
            completedAt.getFullYear() !== now.getFullYear()
          );
        }
      } else {
        // No specific weekday set - reset every 7 days
        const daysSinceCompletion = Math.floor(
          (now.getTime() - completedAt.getTime()) / (24 * 60 * 60 * 1000),
        );
        return daysSinceCompletion >= 7;
      }
      return false;
    }

    case "monthly": {
      // Reset if it's a new month occurrence
      // If dueDate is set (day 1-31), reset when that day arrives in a new month
      if (todo.dueDate !== undefined && todo.dueDate >= 1 && todo.dueDate <= 31) {
        const targetDay = todo.dueDate;
        const currentDay = now.getDate();

        if (currentDay === targetDay) {
          // It's the target day - reset if completed in a previous month (or earlier)
          return (
            completedAt.getMonth() !== now.getMonth() ||
            completedAt.getFullYear() !== now.getFullYear()
          );
        }
      } else {
        // No specific day set - reset every 30 days
        const daysSinceCompletion = Math.floor(
          (now.getTime() - completedAt.getTime()) / (24 * 60 * 60 * 1000),
        );
        return daysSinceCompletion >= 30;
      }
      return false;
    }

    default:
      return false;
  }
}

// Internal mutation to reset completed recurring todos (called by cron)
export const resetRecurringTodos = internalMutation({
  handler: async (ctx) => {
    const todos = await ctx.db.query("todos").collect();

    let resetCount = 0;

    for (const todo of todos) {
      if (shouldResetRecurringTodo(todo)) {
        await ctx.db.patch(todo._id, {
          isCompleted: false,
          completedAt: undefined,
          updatedAt: Date.now(),
        });
        resetCount++;
      }
    }

    console.log(`Reset ${resetCount} recurring todos for new cycle`);
    return { resetCount };
  },
});
