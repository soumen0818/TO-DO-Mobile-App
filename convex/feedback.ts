import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Constants for rate limiting and validation
const MAX_FEEDBACK_PER_DAY = 2;
const MAX_TITLE_LENGTH = 200;
const MAX_DESCRIPTION_LENGTH = 2000;
const MIN_TITLE_LENGTH = 3;
const MIN_DESCRIPTION_LENGTH = 10;

// Helper to get start of today in UTC
function getStartOfTodayUTC(): number {
  const now = new Date();
  now.setUTCHours(0, 0, 0, 0);
  return now.getTime();
}

// Save feedback to database with rate limiting
export const submitFeedback = mutation({
  args: {
    userId: v.string(),
    userEmail: v.string(),
    userName: v.optional(v.string()),
    type: v.union(v.literal("feature"), v.literal("bug")),
    title: v.string(),
    description: v.string(),
  },
  handler: async (ctx, args) => {
    // Input validation - length checks
    const trimmedTitle = args.title.trim();
    const trimmedDescription = args.description.trim();

    if (trimmedTitle.length < MIN_TITLE_LENGTH) {
      throw new ConvexError(`Title must be at least ${MIN_TITLE_LENGTH} characters`);
    }
    if (trimmedTitle.length > MAX_TITLE_LENGTH) {
      throw new ConvexError(`Title must be less than ${MAX_TITLE_LENGTH} characters`);
    }
    if (trimmedDescription.length < MIN_DESCRIPTION_LENGTH) {
      throw new ConvexError(`Description must be at least ${MIN_DESCRIPTION_LENGTH} characters`);
    }
    if (trimmedDescription.length > MAX_DESCRIPTION_LENGTH) {
      throw new ConvexError(`Description must be less than ${MAX_DESCRIPTION_LENGTH} characters`);
    }

    // Rate limiting - check how many feedbacks user submitted today
    const startOfToday = getStartOfTodayUTC();
    const userFeedbackToday = await ctx.db
      .query("feedback")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.gte(q.field("createdAt"), startOfToday))
      .collect();

    if (userFeedbackToday.length >= MAX_FEEDBACK_PER_DAY) {
      throw new ConvexError(
        `You can only submit ${MAX_FEEDBACK_PER_DAY} feedback per day. Please try again tomorrow.`
      );
    }

    const feedbackId = await ctx.db.insert("feedback", {
      userId: args.userId,
      userEmail: args.userEmail,
      userName: args.userName,
      type: args.type,
      title: trimmedTitle,
      description: trimmedDescription,
      status: "pending",
      createdAt: Date.now(),
    });
    return feedbackId;
  },
});

// Get all feedback - ADMIN ONLY
// TODO: In production, add proper admin role verification
// Currently disabled for security - uncomment when admin auth is implemented
// export const getAllFeedback = query({
//   args: { adminSecret: v.string() },
//   handler: async (ctx, args) => {
//     // Verify admin - in production use proper role-based auth
//     if (args.adminSecret !== process.env.ADMIN_SECRET) {
//       throw new ConvexError("Unauthorized");
//     }
//     const feedback = await ctx.db.query("feedback").order("desc").collect();
//     return feedback;
//   },
// });

// Get user's own feedback history only
export const getUserFeedback = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    // Users can only view their own feedback
    const feedback = await ctx.db
      .query("feedback")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
    return feedback;
  },
});
