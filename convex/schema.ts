import { defineSchema, defineTable } from "convex/server";

import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_clerk_id", ["clerkId"]),

  todos: defineTable({
    userId: v.string(), // Clerk user ID
    title: v.string(),
    description: v.optional(v.string()),
    isCompleted: v.boolean(),

    // Time management
    dueDate: v.optional(v.number()), // Timestamp
    dueTime: v.optional(v.string()), // "14:30" format

    // Priority & categorization
    priority: v.union(v.literal("high"), v.literal("medium"), v.literal("low")),
    category: v.optional(
      v.union(v.literal("daily"), v.literal("weekly"), v.literal("monthly")),
    ),

    // Recurring tasks
    isRecurring: v.optional(v.boolean()),
    recurringPattern: v.optional(v.string()), // "daily", "weekly", "monthly", "custom"

    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
    completedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_user_category", ["userId", "category"])
    .index("by_user_priority", ["userId", "priority"])
    .index("by_due_date", ["dueDate"]),
});
