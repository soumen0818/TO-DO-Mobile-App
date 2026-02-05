import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Run auto-deletion every day at midnight UTC
crons.interval(
  "delete expired todos",
  { hours: 24 }, // Run every 24 hours
  internal.autoDelete.deleteExpiredTodos,
);

// Reset completed recurring todos - runs every hour to catch all patterns
// - Daily todos: Reset when it's a new day
// - Weekly todos: Reset when the target weekday arrives
// - Monthly todos: Reset when the target day of month arrives
crons.interval(
  "reset recurring todos",
  { hours: 1 }, // Run every hour to ensure timely resets
  internal.autoDelete.resetRecurringTodos,
);

export default crons;
