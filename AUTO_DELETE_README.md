# Auto-Delete Feature Setup

## Overview

Todos are automatically deleted after their time period ends to keep the app organized and performant.

## Deletion Schedule

### Time Periods:

- **Daily todos**: Deleted 2 days after creation (1 day period + 24hr grace)
- **Weekly todos**: Deleted 8 days after creation (7 day period + 24hr grace)
- **Monthly todos**: Deleted 31 days after creation (30 day period + 24hr grace)

### Grace Period:

Users get a **24-hour notification** before deletion, giving them time to:

- Complete important todos
- Save data they want to keep
- Upgrade to premium (future feature)

## How It Works

### 1. Convex Cron Job

File: `convex/crons.ts`

- Runs automatically every 24 hours
- Checks all todos across all users
- Deletes expired todos based on creation date + category time period

### 2. Auto-Delete Logic

File: `convex/autoDelete.ts`

**Functions:**

- `getExpiredTodos`: Get list of expired todos for a user
- `getTodosExpiringSoon`: Get todos expiring in next 24 hours (for notifications)
- `deleteExpiredTodos`: Internal function called by cron job
- `deleteMyExpiredTodos`: Manual deletion by user

### 3. User Notification

File: `components/ExpirationNotice.tsx`

- Shows warning banner when todos are expiring soon
- Displays count of expiring todos
- Appears on home screen above todo list

## Setup Instructions

### Step 1: Deploy Convex Functions

```bash
npx convex deploy
```

This will:

- Deploy the auto-delete functions
- Set up the cron job
- Generate API types

### Step 2: Enable Component

In `components/ExpirationNotice.tsx`, uncomment these lines:

```typescript
// Change from:
// import { api } from "@/convex/_generated/api";
// import { useUser } from "@clerk/clerk-expo";
// import { useQuery } from "convex/react";

// To:
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/clerk-expo";
import { useQuery } from "convex/react";

// And replace:
const expiringTodos: any[] = [];

// With:
const { user } = useUser();
const expiringTodos = useQuery(
  api.autoDelete.getTodosExpiringSoon,
  user ? { userId: user.id } : "skip",
);
```

### Step 3: Test

1. Create some todos in different categories
2. Manually adjust `createdAt` dates in Convex dashboard to test
3. Wait for notification to appear
4. Check cron job execution in Convex logs

## Future Enhancements

### Premium Features (To Implement Later):

1. **Paid Storage**: Users can pay to keep todos indefinitely
2. **Export Data**: Export todos before deletion
3. **Archive**: Move to archive instead of deleting
4. **Custom Retention**: Choose own deletion periods
5. **Notifications**: Push notifications 24 hours before deletion

### Database Schema for Premium:

```typescript
users: {
  isPremium: v.boolean(),
  premiumExpiry: v.optional(v.number()),
}

todos: {
  isPinned: v.optional(v.boolean()), // Premium users can pin to prevent deletion
  isArchived: v.optional(v.boolean()), // Move to archive instead of delete
}
```

## Monitoring

### Check Cron Job Status:

1. Go to Convex Dashboard
2. Navigate to "Functions" > "Crons"
3. View execution history and logs

### Manual Testing:

Call `deleteMyExpiredTodos` from the app:

```typescript
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

const deleteExpired = useMutation(api.autoDelete.deleteMyExpiredTodos);
await deleteExpired({ userId: user.id });
```

## Notes

- Deletion is **permanent** and cannot be undone
- Completed todos are also subject to deletion
- Grace period ensures users aren't surprised by deletions
- Cron job runs even when app is closed
- Free tier = auto-delete, Premium = optional retention
