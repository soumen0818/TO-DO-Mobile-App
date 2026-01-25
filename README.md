# 🤖 Zenith Task
<div align="center">
  <img src="./assets/images/todo-app-logo.png" alt="Zenith Task Logo" width="120" height="120">
  
  
  ### A Modern Todo Application for Productive People
  
  [![React Native](https://img.shields.io/badge/React%20Native-0.81-blue.svg)](https://reactnative.dev/)
  [![Expo](https://img.shields.io/badge/Expo-54.0-000020.svg)](https://expo.dev/)
  [![Convex](https://img.shields.io/badge/Convex-Real--time-orange.svg)](https://convex.dev/)
  [![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
  
  <p align="center">
    <strong>A feature-rich, cross-platform todo application built with React Native and Expo, featuring real-time synchronization powered by Convex.</strong>
  </p>
</div>

---

## 📱 Overview

Zenith Task is a cross-platform mobile application designed to help users manage their daily tasks efficiently. The app features a clean, professional UI with dark mode support, gradient designs, and smooth animations. Built with modern technologies and best practices, it provides a seamless experience across Android, iOS, and web platforms.

### Why Zenith Task?

- **🎨 Beautiful UI**: Modern gradient designs with smooth animations
- **🌓 Dark Mode**: Automatic theme switching based on system preferences
- **☁️ Cloud Sync**: Real-time data synchronization across all devices
- **⚡ Fast & Responsive**: Optimized performance with React Native
- **🔒 Secure**: Data stored securely in Convex cloud
- **📊 Progress Tracking**: Visual indicators to track your productivity

---

## ✨ Features

### Core Functionality

| Feature               | Description                                        |
| --------------------- | -------------------------------------------------- |
| **Task Management**   | Create, edit, delete, and organize tasks with ease |
| **Real-time Sync**    | Instant synchronization powered by Convex backend  |
| **Smart Editing**     | Inline task editing with multi-line support        |
| **Progress Tracking** | Visual progress bars and completion statistics     |
| **Bulk Actions**      | Clear all tasks with confirmation (danger zone)    |

### User Interface

| Feature               | Description                                          |
| --------------------- | ---------------------------------------------------- |
| **Adaptive Theming**  | Light and dark mode with system preference detection |
| **Gradient Designs**  | Beautiful gradient backgrounds and components        |
| **Smooth Animations** | Polished transitions and micro-interactions          |
| **Empty States**      | Friendly messages when no tasks exist                |
| **Responsive Layout** | Optimized for different screen sizes                 |

### Settings & Preferences

| Feature                   | Description                                         |
| ------------------------- | --------------------------------------------------- |
| **Theme Toggle**          | Switch between light and dark mode manually         |
| **Statistics Dashboard**  | View total, completed, and active task counts       |
| **Notification Settings** | Configure app notifications (UI ready)              |
| **Auto-sync Toggle**      | Enable/disable automatic synchronization (UI ready) |

---

## 🛠️ Tech Stack

<table>
  <tr>
    <td align="center" width="25%">
      <strong>Frontend</strong><br><br>
      React Native<br>
      Expo SDK 54<br>
      TypeScript<br>
      React Hooks
    </td>
    <td align="center" width="25%">
      <strong>Backend</strong><br><br>
      Convex<br>
      Real-time Database<br>
      Cloud Functions<br>
      API Generation
    </td>
    <td align="center" width="25%">
      <strong>Routing</strong><br><br>
      Expo Router<br>
      File-based Routing<br>
      Tab Navigation<br>
      Stack Navigation
    </td>
    <td align="center" width="25%">
      <strong>Styling</strong><br><br>
      StyleSheet<br>
      Linear Gradient<br>
      Dynamic Theming<br>
      Custom Components
    </td>
  </tr>
</table>

### Key Dependencies

```json
{
  "react-native": "0.81.5",
  "expo": "~54.0.29",
  "convex": "^1.31.0",
  "expo-router": "~6.0.19",
  "expo-linear-gradient": "^15.0.8",
  "@expo/vector-icons": "^15.0.3"
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
git clone https://github.com/soumen0818/zenith-task.git
cd TO-DO_APP
```

### 2️⃣ Install Dependencies

```bash
npm install
# or
yarn install
```

### 3️⃣ Environment Configuration

The Convex URL is pre-configured in `app.json` and `eas.json`:

```json
{
  "extra": {
    "EXPO_PUBLIC_CONVEX_URL": "https://festive-seahorse-929.convex.cloud"
  }
}
```

**Note**: If you want to use your own Convex deployment:

1. Create a new Convex project at [convex.dev](https://convex.dev)
2. Update the `EXPO_PUBLIC_CONVEX_URL` in both `app.json` and `eas.json`

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
│   │   ├── index.tsx               # 🏠 Home screen (Todos list)
│   │   ├── setting.tsx             # ⚙️ Settings screen
│   │   └── _layout.tsx             # Tab layout configuration
│   └── _layout.tsx                 # Root layout with providers
│
├── 🎨 assets/                       # Static assets
│   ├── images/                     # App icons and images
│   │   └── todo-app-logo.png      # Main app logo
│   └── styles/                     # StyleSheet definitions
│       ├── home.styles.ts          # Home screen styles
│       └── settings.styles.ts      # Settings screen styles
│
├── 🧩 components/                   # Reusable React components
│   ├── Header.tsx                  # App header with branding
│   ├── TodoInput.tsx               # Todo creation input
│   ├── EmptyState.tsx              # Empty list placeholder
│   ├── LoadingSpinner.tsx          # Loading indicator
│   ├── ProgressStats.tsx           # Statistics cards
│   ├── Preferences.tsx             # Settings preferences
│   └── DangerZone.tsx              # Dangerous actions
│
├── ☁️ convex/                       # Backend (Convex)
│   ├── schema.ts                   # Database schema definition
│   ├── todos.ts                    # Todo CRUD operations
│   ├── _generated/                 # Auto-generated API
│   └── README.md                   # Convex documentation
│
├── 🎣 hooks/                        # Custom React hooks
│   └── useTheme.tsx                # Theme management hook
│
├── 📄 Configuration Files
│   ├── app.json                    # Expo app configuration
│   ├── eas.json                    # EAS Build configuration
│   ├── package.json                # Dependencies & scripts
│   ├── tsconfig.json               # TypeScript configuration
│   └── eslint.config.js            # ESLint configuration
│
└── 📚 Documentation
    ├── README.md                   # This file
    ├── BUILD_INSTRUCTIONS.md       # Build guide
    └── PRE_BUILD_CHECKLIST.md      # Pre-build checklist
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
      "android": { "buildType": "apk" },
      "env": { "EXPO_PUBLIC_CONVEX_URL": "..." }
    },
    "production": {
      "android": { "buildType": "apk" },
      "env": { "EXPO_PUBLIC_CONVEX_URL": "..." }
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
| **Scheme**          | todoapp                   |

### Icons & Splash Screen

- **App Icon**: `./assets/images/todo-app-logo.png`
- **Adaptive Icon**: Custom foreground with #E6F4FE background
- **Splash Screen**: Custom logo with white/black background based on theme
- **Favicon**: todo-app-logo.png

---

## 🔌 Backend (Convex)

### API Overview

Convex provides real-time backend functionality with automatic API generation.

#### Available Functions

| Function        | Type     | Description                             |
| --------------- | -------- | --------------------------------------- |
| `getTodos`      | Query    | Fetch all todos sorted by creation date |
| `createTodo`    | Mutation | Create a new todo item                  |
| `updateTodo`    | Mutation | Update todo text                        |
| `toggleTodo`    | Mutation | Toggle completion status                |
| `deleteTodo`    | Mutation | Delete a specific todo                  |
| `clearAllTodos` | Mutation | Delete all todos (returns count)        |

### Database Schema

```typescript
// convex/schema.ts
export default defineSchema({
  todos: defineTable({
    text: v.string(),
    isCompleted: v.boolean(),
    createdAt: v.number(),
  }),
});
```

### Example Usage

```typescript
// Fetching todos
const todos = useQuery(api.todos.getTodos);

// Creating a todo
const createTodo = useMutation(api.todos.createTodo);
await createTodo({ text: "Buy groceries" });

// Toggling completion
const toggleTodo = useMutation(api.todos.toggleTodo);
await toggleTodo({ id: todoId });
```

---

## 🎨 Features in Detail

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
git clone https://github.com/YOUR_USERNAME/zenith-task.git
cd zenith-task
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
- **[Expo](https://expo.dev/)** - Development platform
- **[Convex](https://convex.dev/)** - Backend platform
- **[TypeScript](https://www.typescriptlang.org/)** - Type safety

### Inspiration

- Modern mobile design patterns
- Material Design guidelines
- iOS Human Interface Guidelines
- Community feedback and suggestions

### Special Thanks

- Expo team for amazing development tools
- Convex team for powerful backend infrastructure
- React Native community for continuous support
- All contributors and users of Zenith Task

---

## 📞 Support

### Get Help

- **Issues**: [GitHub Issues](https://github.com/soumen0818/zenith-task/issues)
- **Discussions**: [GitHub Discussions](https://github.com/soumen0818/zenith-task/discussions)

### Reporting Bugs

When reporting bugs, please include:

1. Device and OS version
2. App version
3. Steps to reproduce
4. Expected vs actual behavior
5. Screenshots (if applicable)

---

## 🗺️ Roadmap

### Version 1.1 (Planned)

- [ ] Task categories/tags
- [ ] Due dates and reminders
- [ ] Search functionality
- [ ] Task filtering and sorting
- [ ] Recurring tasks

### Version 1.2 (Planned)

- [ ] User authentication
- [ ] Multi-user support
- [ ] Task sharing
- [ ] Collaboration features
- [ ] Activity history

### Version 2.0 (Future)

- [ ] Subtasks support
- [ ] File attachments
- [ ] Voice input
- [ ] AI-powered task suggestions
- [ ] Analytics dashboard

---

<div align="center">
  
  ### ⭐ Star this repository if you find it helpful!
  
  Made with ❤️ by [Soumen Das](https://github.com/soumen0818)
  
  © 2026 Zenith Task. All rights reserved.
  
</div>
