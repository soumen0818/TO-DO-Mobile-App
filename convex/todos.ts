import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get all todos for a specific user
export const getTodos = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const todos = await ctx.db
      .query("todos")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
    return todos;
  },
});

// Get todos by category
export const getTodosByCategory = query({
  args: {
    userId: v.string(),
    category: v.optional(
      v.union(v.literal("daily"), v.literal("weekly"), v.literal("monthly")),
    ),
  },
  handler: async (ctx, args) => {
    if (args.category === undefined) {
      // Get todos without category ("others")
      const allTodos = await ctx.db
        .query("todos")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .order("desc")
        .collect();

      // Filter for todos without category and sort by priority
      return allTodos
        .filter((todo) => todo.category === undefined)
        .sort((a, b) => {
          const priorityOrder = { high: 0, medium: 1, low: 2 };
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        });
    }

    // Get todos with specific category and sort by priority
    const todos = await ctx.db
      .query("todos")
      .withIndex("by_user_category", (q) =>
        q.eq("userId", args.userId).eq("category", args.category),
      )
      .order("desc")
      .collect();

    return todos.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  },
});

// Get todos by priority
export const getTodosByPriority = query({
  args: {
    userId: v.string(),
    priority: v.union(v.literal("high"), v.literal("medium"), v.literal("low")),
  },
  handler: async (ctx, args) => {
    const todos = await ctx.db
      .query("todos")
      .withIndex("by_user_priority", (q) =>
        q.eq("userId", args.userId).eq("priority", args.priority),
      )
      .order("desc")
      .collect();
    return todos;
  },
});

// Add a new todo
export const addTodo = mutation({
  args: {
    userId: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    dueDate: v.optional(v.number()),
    dueTime: v.optional(v.string()),
    priority: v.union(v.literal("high"), v.literal("medium"), v.literal("low")),
    category: v.optional(
      v.union(v.literal("daily"), v.literal("weekly"), v.literal("monthly")),
    ),
    isRecurring: v.optional(v.boolean()),
    recurringPattern: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const todoId = await ctx.db.insert("todos", {
      userId: args.userId,
      title: args.title,
      description: args.description,
      isCompleted: false,
      dueDate: args.dueDate,
      dueTime: args.dueTime,
      priority: args.priority,
      category: args.category,
      isRecurring: args.isRecurring,
      recurringPattern: args.recurringPattern,
      createdAt: now,
      updatedAt: now,
    });

    return todoId;
  },
});

// Toggle todo completion
export const toggleTodo = mutation({
  args: {
    id: v.id("todos"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const todo = await ctx.db.get(args.id);
    if (!todo) throw new ConvexError("Todo not found");
    if (todo.userId !== args.userId) throw new ConvexError("Unauthorized");

    await ctx.db.patch(args.id, {
      isCompleted: !todo.isCompleted,
      completedAt: !todo.isCompleted ? Date.now() : undefined,
      updatedAt: Date.now(),
    });
  },
});

// Delete todo
export const deleteTodo = mutation({
  args: {
    id: v.id("todos"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const todo = await ctx.db.get(args.id);
    if (!todo) throw new ConvexError("Todo not found");
    if (todo.userId !== args.userId) throw new ConvexError("Unauthorized");

    await ctx.db.delete(args.id);
  },
});

// Update todo
export const updateTodo = mutation({
  args: {
    id: v.id("todos"),
    userId: v.string(),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    dueDate: v.optional(v.number()),
    dueTime: v.optional(v.string()),
    priority: v.optional(
      v.union(v.literal("high"), v.literal("medium"), v.literal("low")),
    ),
    category: v.optional(
      v.union(v.literal("daily"), v.literal("weekly"), v.literal("monthly")),
    ),
    isRecurring: v.optional(v.boolean()),
    recurringPattern: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const todo = await ctx.db.get(args.id);
    if (!todo) throw new ConvexError("Todo not found");
    if (todo.userId !== args.userId) throw new ConvexError("Unauthorized");

    const updates: any = {
      updatedAt: Date.now(),
    };

    if (args.title !== undefined) updates.title = args.title;
    if (args.description !== undefined) updates.description = args.description;
    if (args.dueDate !== undefined) updates.dueDate = args.dueDate;
    if (args.dueTime !== undefined) updates.dueTime = args.dueTime;
    if (args.priority !== undefined) updates.priority = args.priority;
    if (args.category !== undefined) updates.category = args.category;
    if (args.isRecurring !== undefined) updates.isRecurring = args.isRecurring;
    if (args.recurringPattern !== undefined)
      updates.recurringPattern = args.recurringPattern;

    await ctx.db.patch(args.id, updates);
  },
});

// Clear all todos for a user
export const clearAllTodos = mutation({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const todos = await ctx.db
      .query("todos")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    // Delete all todos
    for (const todo of todos) {
      await ctx.db.delete(todo._id);
    }

    return { deletedCount: todos.length };
  },
});

// Get user statistics
export const getUserStats = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const todos = await ctx.db
      .query("todos")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const total = todos.length;
    const completed = todos.filter((t) => t.isCompleted).length;
    const active = total - completed;

    const byCategory = {
      daily: todos.filter((t) => t.category === "daily").length,
      weekly: todos.filter((t) => t.category === "weekly").length,
      monthly: todos.filter((t) => t.category === "monthly").length,
    };

    const byPriority = {
      high: todos.filter((t) => t.priority === "high").length,
      medium: todos.filter((t) => t.priority === "medium").length,
      low: todos.filter((t) => t.priority === "low").length,
    };

    return {
      total,
      completed,
      active,
      byCategory,
      byPriority,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  },
});
