import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create or update user
export const syncUser = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if user exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (existingUser) {
      // Update existing user
      await ctx.db.patch(existingUser._id, {
        email: args.email,
        name: args.name,
        imageUrl: args.imageUrl,
      });
      return existingUser._id;
    } else {
      // Create new user
      const userId = await ctx.db.insert("users", {
        clerkId: args.clerkId,
        email: args.email,
        name: args.name,
        imageUrl: args.imageUrl,
        createdAt: Date.now(),
      });
      return userId;
    }
  },
});

// Get user by Clerk ID
export const getUserByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    return user;
  },
});

// Check if email already exists (for signup validation)
export const checkEmailExists = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), args.email))
      .first();

    return { exists: !!user };
  },
});

// Update user profile
export const updateUserProfile = mutation({
  args: {
    clerkId: v.string(),
    name: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) throw new ConvexError("User not found");

    const updates: any = {};
    if (args.name !== undefined) updates.name = args.name;
    if (args.imageUrl !== undefined) updates.imageUrl = args.imageUrl;

    await ctx.db.patch(user._id, updates);
    return user._id;
  },
});

// Delete user and all their data
export const deleteUser = mutation({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) throw new ConvexError("User not found");

    // Delete all user's todos
    const todos = await ctx.db
      .query("todos")
      .withIndex("by_user", (q) => q.eq("userId", args.clerkId))
      .collect();

    for (const todo of todos) {
      await ctx.db.delete(todo._id);
    }

    // Delete user
    await ctx.db.delete(user._id);

    return { success: true, deletedTodos: todos.length };
  },
});
