# 🎯 Zenith Task

<div align="center">
  <img src="./assets/images/todo-app-logo.png" alt="Zenith Task Logo" width="120" height="120">
  
  ### A Modern Task Management Application for Productive People
  
  [![React Native](https://img.shields.io/badge/React%20Native-0.81-blue.svg)](https://reactnative.dev/)
  [![Expo](https://img.shields.io/badge/Expo-54.0-000020.svg)](https://expo.dev/)
  [![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green.svg)](https://supabase.com/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
  [![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
  
  <p align="center">
    <strong>A feature-rich, cross-platform task management application built with React Native, Expo, and Supabase, featuring secure authentication, smart notifications, and automatic cleanup.</strong>
  </p>
</div>

---

## 📱 Overview

**Zenith Task** is a production-ready, cross-platform mobile application designed to help users manage their tasks efficiently across daily, weekly, and monthly categories. Built with modern technologies and best practices, the app offers a seamless experience with intelligent features like auto-delete, recurring tasks, smart notifications, and real-time cloud synchronization.

### Why Zenith Task?

- **🎨 Beautiful UI**: Modern gradient designs with smooth animations and polished interactions
- **🌓 Dark Mode**: Automatic theme switching based on system preferences with manual override
- **☁️ Cloud Sync**: Real-time PostgreSQL database synchronization via Supabase
- **⚡ Smart Performance**: Optimized with category caching and optimistic updates
- **🔒 Secure**: Row-level security (RLS) policies and Google OAuth authentication
- **📊 Intelligent Tracking**: Progress stats, expiration warnings, and auto-delete system
- **🔔 Smart Notifications**: Due date reminders, auto-delete warnings, and completion reminders
- **♻️ Recurring Tasks**: Support for daily, weekly, and monthly recurring tasks

---

## ✨ Features

### 🎯 Smart Task Management

| Feature                  | Description                                                      |
| ------------------------ | ---------------------------------------------------------------- |
| **Category-Based Tasks** | Organize tasks into Daily, Weekly, Monthly, or Others categories |
| **Priority Levels**      | High, Medium, Low priority with visual indicators                |
| **Recurring Tasks**      | Set tasks to repeat automatically (daily/weekly/monthly)         |
| **Auto-Delete System**   | Expired tasks automatically cleaned up every 6 hours             |
| **Expiration Warnings**  | Visual badges and notifications before task deletion             |
| **Complete Task System** | Title, description, due date, due time, and category support     |

### 🔔 Intelligent Notifications

| Feature                  | Description                                              |
| ------------------------ | -------------------------------------------------------- |
| **Due Date Reminders**   | Get notified before tasks are due                        |
| **Auto-Delete Warnings** | Warning notifications before tasks expire                |
| **Completion Reminders** | Reminders for incomplete tasks (configurable)            |
| **Multiple Channels**    | Separate notification channels for different alert types |
| **Smart Scheduling**     | Recurring tasks exempt from auto-delete                  |

### 🔐 Authentication & Security

| Feature                | Description                                        |
| ---------------------- | -------------------------------------------------- |
| **Google OAuth**       | One-tap sign in with Google account                |
| **Email/Password**     | Traditional authentication with email verification |
| **Secure Storage**     | AsyncStorage for session persistence               |
| **Row-Level Security** | Database policies ensure users only see their data |
| **Auto User Profiles** | Automatic profile creation on first sign-in        |

### 🎨 User Interface

| Feature                | Description                                          |
| ---------------------- | ---------------------------------------------------- |
| **Adaptive Theming**   | Light and dark mode with system preference detection |
| **Gradient Designs**   | Beautiful gradient backgrounds and components        |
| **Smooth Animations**  | Polished transitions and haptic feedback             |
| **Empty States**       | Friendly messages when no tasks exist                |
| **Responsive Layout**  | Optimized for different screen sizes                 |
| **Category Badges**    | Visual category indicators with colors               |
| **Expiring Soon Tags** | Yellow badges for tasks approaching deletion         |

### ⚙️ Settings & Preferences

| Feature                   | Description                                   |
| ------------------------- | --------------------------------------------- |
| **Theme Toggle**          | Switch between light and dark mode manually   |
| **Statistics Dashboard**  | View total, completed, and active task counts |
| **Auto-Sync Toggle**      | Enable/disable real-time synchronization      |
| **Notifications Control** | Enable/disable all notifications              |
| **Haptic Feedback**       | Toggle vibration feedback for interactions    |
| **Sound Effects**         | Enable/disable sound effects                  |
| **User Feedback System**  | Submit bug reports and feature requests       |
| **Danger Zone**           | Clear all todos with confirmation             |

---

## 🛠️ Tech Stack

<table>
  <tr>
    <td align="center" width="25%">
      <strong>Frontend</strong><br><br>
      React Native 0.81<br>
      Expo SDK 54<br>
      TypeScript 5.9<br>
      React Hooks<br>
      Expo Router
    </td>
    <td align="center" width="25%">
      <strong>Backend</strong><br><br>
      Supabase<br>
      PostgreSQL Database<br>
      Row-Level Security<br>
      Real-time Subscriptions<br>
      RESTful API
    </td>
    <td align="center" width="25%">
      <strong>Authentication</strong><br><br>
      Supabase Auth<br>
      Google OAuth 2.0<br>
      Email/Password<br>
      AsyncStorage<br>
      Secure Sessions
    </td>
    <td align="center" width="25%">
      <strong>Features</strong><br><br>
      Expo Notifications<br>
      Haptic Feedback<br>
      Linear Gradients<br>
      Date/Time Pickers<br>
      Modal Dialogs
    </td>
  </tr>
</table>

### Key Dependencies

```json
{
  "react-native": "0.81.5",
  "expo": "~54.0.33",
  "@supabase/supabase-js": "^2.95.3",
  "expo-router": "~6.0.23",
  "expo-notifications": "^0.32.16",
  "expo-linear-gradient": "^15.0.8",
  "@react-native-async-storage/async-storage": "^2.2.0",
  "@expo/vector-icons": "^15.0.3",
  "expo-haptics": "~15.0.8"
}
```

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

| Tool         | Version | Purpose                  |
| ------------ | ------- | ------------------------ |
| **Node.js**  | v18+    | JavaScript runtime       |
| **npm/yarn** | Latest  | Package manager          |
| **Expo CLI** | Latest  | Expo development tools   |
| **EAS CLI**  | Latest  | Building production apps |
| **Git**      | Latest  | Version control          |

### Optional

- **Android Studio** (for Android development)
- **Xcode** (for iOS development - macOS only)
- **VS Code** (recommended IDE)

---

## ⏬ Installation

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/soumen0818/TO-DO-Mobile-App.git
cd TO-DO_APP
```

### 2️⃣ Install Dependencies

```bash
npm install
# or
yarn install
```

### 3️⃣ Environment Configuration

The Supabase configuration is pre-configured in `eas.json` for building:

```json
{
  "build": {
    "production": {
      "env": {
        "EXPO_PUBLIC_SUPABASE_URL": "https://your-project.supabase.co",
        "EXPO_PUBLIC_SUPABASE_ANON_KEY": "your-anon-key"
      }
    }
  }
}
```

**For local development**, create a `.env` file:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4️⃣ Supabase Setup

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Run the SQL schema in Supabase SQL Editor:
   - Copy contents from `supabase-schema.sql`
   - Execute in your Supabase project
3. Run the limits migration:
   - Copy contents from `update-todo-limits-migration.sql`
   - Execute in your Supabase project
4. Configure Google OAuth:
   - Go to Authentication > Providers in Supabase Dashboard
   - Enable Google provider
   - Add your OAuth credentials
   - Add redirect URLs for your app scheme

---

## 💻 Development

### Start Development Server

```bash
npm start
# or
expo start
```

### Run on Specific Platforms

```bash
# Android
npm run android
# or
expo start --android

# iOS
npm run ios
# or
expo start --ios

# Web
npm run web
# or
expo start --web
```

### Development Tips

- Press `r` to reload the app
- Press `d` to open developer menu
- Press `j` to open debugger
- Use Expo Go app for quick testing on physical devices

---

## 📂 Project Structure

```
TO-DO_APP/
│
├── 📱 app/                          # Application screens & routing
│   ├── (tabs)/                      # Tab-based navigation
│   │   ├── index.tsx               # 🏠 Home screen (Task list with categories)
│   │   ├── profile.tsx             # 👤 User profile screen
│   │   ├── setting.tsx             # ⚙️ Settings screen
│   │   └── _layout.tsx             # Tab layout configuration
│   ├── _layout.tsx                 # Root layout with providers
│   ├── index.tsx                   # Splash/redirect screen
│   ├── sign-in.tsx                 # 🔐 Authentication screen
│   └── [...unmatched].tsx          # 404 handler
│
├── 🎨 assets/                       # Static assets
│   ├── images/                     # App icons and images
│   │   ├── app-logo-padded.png      # App icon with padding
│   │   ├── todo-app-logo.png        # Main app logo
│   │   └── google-icon.png          # Google OAuth icon
│   └── styles/                     # StyleSheet definitions
│       ├── home.styles.ts          # Home screen styles
│       └── settings.styles.ts      # Settings screen styles
│
├── 🧩 components/                   # Reusable React components
│   ├── Header.tsx                  # App header with branding
│   ├── Todoinput.tsx               # Task creation modal
│   ├── EditTodoModal.tsx           # Task editing modal
│   ├── TodoDetailModal.tsx         # Task details view
│   ├── EmptyState.tsx              # Empty list placeholder
│   ├── LoadingSpinner.tsx          # Loading indicator
│   ├── ProgressStats.tsx           # Statistics cards
│   ├── ExpirationNotice.tsx        # Expiring tasks banner
│   ├── Toast.tsx                   # Toast notifications
│   ├── CustomAlert.tsx             # Custom alert dialogs
│   ├── FeedbackModal.tsx           # User feedback form
│   ├── Preferences.tsx             # Settings preferences
│   ├── OtherSettings.tsx           # Other settings options
│   └── DangerZone.tsx              # Dangerous actions (clear all)
│
├── 🔐 contexts/                     # React Context providers
│   ├── AuthContext.tsx             # Authentication state & functions
│   └── SettingsContext.tsx         # App settings & preferences
│
├── 🎯 hooks/                        # Custom React hooks
│   ├── useTheme.tsx                # Theme management
│   ├── useNotifications.tsx        # Notification scheduling
│   ├── useAutoDelete.tsx           # Auto-delete cleanup
│   └── useSupabase.tsx             # Supabase data fetching
│
├── 📦 lib/                         # Core library functions
│   ├── supabase.ts                 # Supabase client configuration
│   ├── database.types.ts           # TypeScript types from Supabase
│   ├── todos.ts                    # Task CRUD operations
│   ├── users.ts                    # User operations
│   ├── feedback.ts                 # Feedback system
│   └── logger.ts                   # Logging utility
│
├── 🔧 utils/                       # Utility functions
│   ├── expirationUtils.ts          # Auto-delete calculation logic
│   └── notificationUtils.ts        # Notification setup & permissions
│
├── 📝 docs/                        # Documentation
│   ├── PRODUCTION_READINESS.md     # Production checklist
│   ├── MIGRATION_SUMMARY.md        # Migration notes
│   ├── SECURITY_AUDIT_SUMMARY.md   # Security review
│   └── AUTO_DELETE_README.md       # Auto-delete documentation
│
├── 🛡️ android/                      # Android native code
│   └── app/                        # Android app configuration
│
└── 📄 Configuration Files
    ├── app.json                    # Expo app configuration
    ├── eas.json                    # EAS Build configuration
    ├── package.json                # Dependencies & scripts
    ├── tsconfig.json               # TypeScript configuration
    ├── supabase-schema.sql         # Database schema
    └── update-todo-limits-migration.sql  # Database migration
```

---

## 🏗️ Building for Production

### Android APK

#### Preview Build (Internal Testing)

```bash
eas build --profile preview --platform android
```

This creates an APK file suitable for internal testing.

#### Production Build (Release)

```bash
eas build --profile production --platform android
```

This creates an optimized APK for production release.

### iOS (Requires Apple Developer Account)

```bash
eas build --profile production --platform ios
```

**Note**: You need an active Apple Developer account ($99/year) to build iOS apps.

### Build Configuration

All build configurations are in `eas.json`:

```json
{
  "build": {
    "preview": {
      "distribution": "internal",
      "android": { "buildType": "apk" },
      "env": {
        "EXPO_PUBLIC_SUPABASE_URL": "https://your-project.supabase.co",
        "EXPO_PUBLIC_SUPABASE_ANON_KEY": "your-anon-key"
      }
    },
    "production": {
      "autoIncrement": true,
      "channel": "production",
      "android": { "buildType": "apk" },
      "env": {
        "EXPO_PUBLIC_SUPABASE_URL": "https://your-project.supabase.co",
        "EXPO_PUBLIC_SUPABASE_ANON_KEY": "your-anon-key"
      }
    }
  }
}
```

---

## ⚙️ Configuration

### App Details

| Property            | Value                     |
| ------------------- | ------------------------- |
| **App Name**        | Zenith Task               |
| **Package ID**      | com.soumen0818.zenithtask |
| **Version**         | 1.0.0                     |
| **Bundle ID (iOS)** | com.soumen0818.zenithtask |
| **Scheme**          | zenith-task               |

### Icons & Splash Screen

- **App Icon**: `./assets/images/todo-app-logo.png`
- **Adaptive Icon**: Custom foreground with #E6F4FE background
- **Splash Screen**: Custom logo with white/black background based on theme
- **Favicon**: todo-app-logo.png

---

## 🔌 Backend (Supabase)

### Database Overview

Zenith Task uses **Supabase** for backend services, providing:

- **PostgreSQL Database** with Row-Level Security (RLS)
- **Authentication** with Google OAuth and Email/Password
- **Real-time subscriptions** for live updates
- **Auto-generated TypeScript types**
- **Server-side functions** and triggers

### Database Tables

#### **todos** Table

| Column              | Type        | Description                                 |
| ------------------- | ----------- | ------------------------------------------- |
| `id`                | UUID        | Primary key                                 |
| `user_id`           | UUID        | Foreign key to users table                  |
| `title`             | TEXT        | Task title (required, max 200 chars)        |
| `description`       | TEXT        | Task description (optional, max 1000 chars) |
| `is_completed`      | BOOLEAN     | Completion status                           |
| `due_date`          | TIMESTAMPTZ | Due date (timestamp or day number)          |
| `due_time`          | TEXT        | Due time in "HH:MM AM/PM" format            |
| `priority`          | TEXT        | high \| medium \| low                       |
| `category`          | TEXT        | daily \| weekly \| monthly \| null (others) |
| `is_recurring`      | BOOLEAN     | Whether task repeats                        |
| `recurring_pattern` | TEXT        | Recurrence pattern                          |
| `created_at`        | TIMESTAMPTZ | Creation timestamp                          |
| `updated_at`        | TIMESTAMPTZ | Last update timestamp                       |
| `completed_at`      | TIMESTAMPTZ | Completion timestamp                        |

#### **users** Table

| Column       | Type        | Description            |
| ------------ | ----------- | ---------------------- |
| `id`         | UUID        | Primary key (auth.uid) |
| `email`      | TEXT        | User email             |
| `name`       | TEXT        | Display name           |
| `image_url`  | TEXT        | Profile picture URL    |
| `created_at` | TIMESTAMPTZ | Sign-up date           |
| `updated_at` | TIMESTAMPTZ | Last update            |

#### **feedback** Table

| Column        | Type        | Description          |
| ------------- | ----------- | -------------------- |
| `id`          | UUID        | Primary key          |
| `user_id`     | UUID        | Foreign key to users |
| `type`        | TEXT        | feature \| bug       |
| `title`       | TEXT        | Feedback title       |
| `description` | TEXT        | Optional details     |
| `status`      | TEXT        | pending \| resolved  |
| `created_at`  | TIMESTAMPTZ | Submission date      |

### Available Functions (lib/todos.ts)

| Function                               | Description                             |
| -------------------------------------- | --------------------------------------- |
| `getTodos(userId)`                     | Fetch all todos for user                |
| `getTodosByCategory(userId, category)` | Fetch todos by category                 |
| `getTodosExpiringSoon(userId)`         | Fetch tasks approaching deletion        |
| `addTodo(todo)`                        | Create new todo with validation         |
| `updateTodo(args)`                     | Update todo with field clearing support |
| `toggleTodo(id, userId)`               | Toggle completion status                |
| `deleteTodo(id, userId)`               | Delete specific todo                    |
| `deleteExpiredTodos(userId)`           | Delete all expired todos (auto-cleanup) |
| `clearAllTodos(userId)`                | Delete all user todos                   |
| `getUserStats(userId)`                 | Get task statistics                     |

### Security Features

#### Row-Level Security (RLS) Policies

```sql
-- Users can only view their own todos
CREATE POLICY "Users can view their own todos"
  ON public.todos FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only insert their own todos
CREATE POLICY "Users can insert their own todos"
  ON public.todos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can only update their own todos
CREATE POLICY "Users can update their own todos"
  ON public.todos FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can only delete their own todos
CREATE POLICY "Users can delete their own todos"
  ON public.todos FOR DELETE
  USING (auth.uid() = user_id);
```

#### Server-Side Triggers

1. **Todo Limits Enforcement**: Prevents users from exceeding category limits
   - Daily: 30 todos
   - Weekly: 20 todos
   - Monthly: 30 todos
   - Others: 50 todos

2. **Feedback Rate Limiting**: Maximum 2 feedback submissions per day

3. **Auto Profile Creation**: Automatically creates user profile on sign-up

4. **Updated Timestamp**: Auto-updates `updated_at` on every modification

### Example Usage

```typescript
import { supabase } from "@/lib/supabase";
import { getTodos, addTodo, updateTodo } from "@/lib/todos";

// Fetch todos
const todos = await getTodos(userId);

// Create a todo
await addTodo({
  userId: user.id,
  title: "Buy groceries",
  description: "Milk, eggs, bread",
  priority: "high",
  category: "daily",
  dueDate: Date.now(),
  dueTime: "02:30 PM",
});

// Toggle completion
await toggleTodo(todoId, userId);

// Update todo
await updateTodo({
  id: todoId,
  userId: user.id,
  title: "Updated title",
  clearDescription: true, // Removes description
});
```

---

## 🎨 Features in Detail

### 🗑️ Auto-Delete System

Zenith Task includes an intelligent auto-delete system that automatically removes expired tasks to keep your task list clean and focused.

#### How It Works

1. **Client-Side Cleanup**: Runs every 6 hours via `useAutoDelete` hook
2. **Expiration Rules** (based on category):
   - **Daily**: Expires 48 hours after end of the creation day
   - **Weekly**: Expires 8 days after end of creation day
   - **Monthly**: Expires 31 days after end of creation day
   - **Others (with due date)**: Expires 24 hours after due date/time
   - **Others (no due date)**: Expires 24 hours after creation
3. **Recurring Protection**: Recurring tasks never expire
4. **Warning System**: Shows "Expiring Soon" badge and sends notifications

#### Implementation

```typescript
// Auto-delete runs on app launch and every 6 hours
useAutoDelete(); // in app/(tabs)/index.tsx

// Expiration calculation (utils/expirationUtils.ts)
calculateExpirationTime(createdAt, category, isRecurring, dueDate, dueTime);
shouldDeleteTodo(todo); // Check if should be deleted now
isInWarningWindow(todo); // Check if expiring soon
```

### 📁 Category System

Tasks are organized into four categories:

| Category    | Description               | Due Date Format      | Limit |
| ----------- | ------------------------- | -------------------- | ----- |
| **Daily**   | Daily recurring tasks     | Timestamp            | 30    |
| **Weekly**  | Weekly tasks (by weekday) | 0-6 (Sun-Sat)        | 20    |
| **Monthly** | Monthly tasks (by day)    | 1-31 (day of month)  | 30    |
| **Others**  | Uncat egorized tasks      | Timestamp (optional) | 50    |

### 🔔 Notification System

Three types of notifications keep you on track:

#### 1. Due Date Reminders

- Scheduled 30 minutes before task due time
- Only for tasks with specific due dates
- Skipped for weekly/monthly categories

#### 2. Auto-Delete Warnings

- Scheduled 12 hours before task deletion
- For tasks with due dates: Warning shows AFTER due date passes
- For tasks without due dates: Warning shows 12 hours before deletion
- Recurring tasks never receive warnings

#### 3. Completion Reminders

- Configurable reminders for incomplete tasks
- Can be toggled in settings

#### Notification Channels (Android)

- **Reminders**: Due date and completion reminders
- **Auto-Delete Warnings**: Expiration notices
- **System**: App updates and general notifications

### ♻️ Recurring Tasks

Tasks can be set to recur automatically:

```typescript
{
  isRecurring: true,
  recurringPattern: "daily" | "weekly" | "monthly",
  category: "daily" | "weekly" | "monthly"  // Must match pattern
}
```

**Features:**

- Pattern must match category
- Cannot be deleted by auto-delete system
- Completion resets automatically
- Visual indicator in task list

### Theme System

The app includes a comprehensive theme system with persistent storage:

```typescript
interface ColorScheme {
  // Base colors
  primary: string;
  secondary: string;
  background: string;
  surface: string;

  // Text colors
  text: string;
  textMuted: string;

  // Status colors
  success: string;
  warning: string;
  danger: string;

  // UI elements
  border: string;

  // Gradients
  gradients: {
    primary: string[];
    background: string[];
    surface: string[];
    success: string[];
    warning: string[];
    danger: string[];
  };
}
```

**Features:**

- Automatic detection of system theme preference
- Manual theme toggle in settings
- Persistent theme selection using AsyncStorage
- Smooth theme transitions
- Context-based theme provider

### Task Management

#### Creating Tasks

- Multi-line text input support
- Add button with gradient styling
- Auto-focus on input field
- Empty input validation

#### Editing Tasks

- Inline editing mode
- Save/Cancel actions
- Real-time preview
- Multi-line support

#### Deleting Tasks

- Confirmation dialog
- Animated removal
- Undo capability (future)

#### Progress Tracking

- Real-time progress bar
- Completion percentage
- Task count statistics
- Visual feedback

### Settings Screen

#### Statistics Dashboard

- **Total Todos**: Overall task count
- **Completed**: Finished tasks
- **Active**: Pending tasks
- Color-coded cards with icons

#### Preferences

- Dark mode toggle
- Notifications (UI ready)
- Auto-sync (UI ready)

#### Danger Zone

- Clear all todos option
- Confirmation required
- Deletion count feedback

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

### 1. Fork the Repository

Click the "Fork" button at the top right of this page.

### 2. Clone Your Fork

```bash
git clone https://github.com/YOUR_USERNAME/TO-DO-Mobile-App.git
cd TO-DO_APP
```

### 3. Create a Branch

```bash
git checkout -b feature/amazing-feature
```

### 4. Make Your Changes

- Write clean, documented code
- Follow the existing code style
- Test your changes thoroughly

### 5. Commit Your Changes

```bash
git add .
git commit -m "Add: amazing feature description"
```

### 6. Push to Your Fork

```bash
git push origin feature/amazing-feature
```

### 7. Create a Pull Request

Go to your fork on GitHub and click "New Pull Request".

### Code Style Guidelines

- Use TypeScript for type safety
- Follow functional component patterns
- Use React Hooks appropriately
- Add comments for complex logic
- Keep components small and focused

---

## 📜 License

This project is licensed under the **MIT License**. See [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2026 Soumen Das

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction...
```

---

## 👨‍💻 Author

**Soumen Das**

- GitHub: [@soumen0818](https://github.com/soumen0818)
- Email: dassoumen0818@gmail.com

---

## 🙏 Acknowledgments

### Technologies

- **[React Native](https://reactnative.dev/)** - Mobile app framework
- **[Expo](https://expo.dev/)** - Development platform and deployment
- **[Supabase](https://supabase.com/)** - Backend platform with PostgreSQL
- **[TypeScript](https://www.typescriptlang.org/)** - Type safety and developer experience
- **[Expo Notifications](https://docs.expo.dev/versions/latest/sdk/notifications/)** - Push notification system
- **[AsyncStorage](https://react-native-async-storage.github.io/async-storage/)** - Local data persistence

### Inspiration

- Modern mobile design patterns
- Material Design guidelines
- iOS Human Interface Guidelines
- Community feedback and user suggestions
- Real-world task management workflows

### Special Thanks

- **Expo team** for incredible development tools and EAS Build
- **Supabase team** for powerful open-source backend infrastructure
- **React Native community** for continuous support and innovations
- **Open source contributors** who make amazing tools freely available
- All users and contributors of Zenith Task

---

## 📞 Support

### Get Help

- **Issues**: [GitHub Issues](https://github.com/soumen0818/TO-DO-Mobile-App/issues)
- **Discussions**: [GitHub Discussions](https://github.com/soumen0818/TO-DO-Mobile-App/discussions)
- **Email**: dassoumen0818@gmail.com

### Reporting Bugs

When reporting bugs, please include:

1. **Device Information**: Model and OS version (e.g., Samsung Galaxy S21, Android 13)
2. **App Version**: Check in Settings screen
3. **Steps to Reproduce**: Detailed steps that trigger the bug
4. **Expected Behavior**: What should happen
5. **Actual Behavior**: What actually happens
6. **Screenshots/Videos**: Visual evidence if applicable
7. **Error Messages**: Any error messages or logs

### Feature Requests

Have an idea to improve Zenith Task? We'd love to hear it!

1. Check existing issues to avoid duplicates
2. Open a new issue with the "Feature Request" label
3. Describe the feature and its benefits
4. Include mockups or examples if possible

---

<div align="center">
  
  ### ⭐ Star this repository if you find it helpful!
  
  **Zenith Task** - Smart Task Management for Modern Life
  
  Made with ❤️ by [Soumen Das](https://github.com/soumen0818)
  
  © 2026 Zenith Task. All rights reserved.
  
</div>
