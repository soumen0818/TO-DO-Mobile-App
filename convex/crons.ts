import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Run auto-deletion every day at midnight UTC
crons.interval(
  "delete expired todos",
  { hours: 24 }, // Run every 24 hours
  internal.autoDelete.deleteExpiredTodos,
);

export default crons;
