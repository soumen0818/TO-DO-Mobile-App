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

  // Handle undefined category (Others) - delete after 24 hours from dueDate+dueTime or createdAt
  if (category === undefined) {
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
  // Set time to end of day for fair comparison
  createdDate.setHours(23, 59, 59, 999);

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
      let expirationTime: number;
      let notificationTime: number;

      // Handle undefined category
      if (todo.category === undefined) {
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
        createdDate.setHours(23, 59, 59, 999);

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
        }
      }

      // Return todos that are in the notification window
      return now >= notificationTime && now < expirationTime;
    });

    return expiringTodos.map((todo) => ({
      ...todo,
      hoursUntilDeletion: Math.ceil(
        (Date.now() - todo.createdAt) / (1000 * 60 * 60),
      ),
    }));
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
