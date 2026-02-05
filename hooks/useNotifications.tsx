import { useSettings } from "@/contexts/SettingsContext";
import { setupLocalNotifications } from "@/utils/notificationUtils";
import * as Notifications from "expo-notifications";
import { useEffect, useRef, useState } from "react";

export interface ScheduleNotificationParams {
  title: string;
  body: string;
  data?: Record<string, unknown>;
  trigger: Notifications.NotificationTriggerInput;
  identifier?: string;
}

export const useNotifications = () => {
  const { notificationsEnabled } = useSettings();
  const [notification, setNotification] = useState<Notifications.Notification | undefined>();
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    // Setup local notifications (permissions + channels)
    setupLocalNotifications();

    // Listen for incoming notifications
    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      setNotification(notification);
    });

    // Listen for user interaction with notifications
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      console.log("Notification tapped:", data);
      // Handle navigation or actions based on notification data
    });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  // Schedule a local notification
  const scheduleNotification = async ({
    title,
    body,
    data,
    trigger,
    identifier,
    channelId,
  }: ScheduleNotificationParams & { channelId?: string }): Promise<string | null> => {
    if (!notificationsEnabled) {
      console.log("Notifications are disabled");
      return null;
    }

    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: true,
          ...(channelId && { channelId }),
        },
        trigger,
        identifier,
      });
      return id;
    } catch (error) {
      console.error("Error scheduling notification:", error);
      return null;
    }
  };

  // Schedule a due date reminder
  const scheduleDueDateReminder = async (
    todoId: string,
    todoTitle: string,
    dueDate: number,
    dueTime?: string,
    category?: "daily" | "weekly" | "monthly" | undefined,
    reminderMinutesBefore: number = 30
  ): Promise<string | null> => {
    if (!notificationsEnabled) return null;

    // Skip for weekly/monthly - dueDate is day number, not timestamp
    if (category === "weekly" || category === "monthly") {
      console.log("Skipping due date reminder for recurring tasks");
      return null;
    }

    // Validate dueDate is a valid timestamp (should be > year 2000)
    if (dueDate < 946684800000) {
      console.log("Invalid dueDate (not a timestamp):", dueDate);
      return null;
    }

    let triggerDate = new Date(dueDate);

    // Parse dueTime if provided (format: "2:30 PM" or "02:30 AM")
    if (dueTime) {
      const timeParts = dueTime.split(" ");
      const time = timeParts[0];
      const period = timeParts[1];
      const [hoursStr, minutesStr] = time.split(":");
      let hours = parseInt(hoursStr, 10);
      const minutes = parseInt(minutesStr, 10);

      if (period === "PM" && hours !== 12) hours += 12;
      if (period === "AM" && hours === 12) hours = 0;

      triggerDate.setHours(hours, minutes, 0, 0);
    } else {
      // Default to 9 AM if no time specified
      triggerDate.setHours(9, 0, 0, 0);
    }

    // Subtract reminder time (reminder fires X minutes before due time)
    let reminderTime = new Date(triggerDate.getTime() - reminderMinutesBefore * 60 * 1000);

    // For daily tasks: if reminder time is in the past, schedule for tomorrow
    if (category === "daily" && reminderTime.getTime() <= Date.now()) {
      console.log("Reminder time passed for today, scheduling for tomorrow");
      reminderTime = new Date(reminderTime.getTime() + 24 * 60 * 60 * 1000);
    }

    // Final check: don't schedule if still in the past
    if (reminderTime.getTime() <= Date.now()) {
      console.log("Reminder time is in the past, skipping");
      return null;
    }

    const identifier = `due-reminder-${todoId}`;

    // Cancel any existing reminder for this todo
    await cancelNotification(identifier);

    // Calculate seconds until trigger for logging
    const secondsUntilTrigger = Math.floor((reminderTime.getTime() - Date.now()) / 1000);
    const minutesUntil = Math.floor(secondsUntilTrigger / 60);
    
    console.log(`Scheduling notification in ${minutesUntil} minutes for: ${todoTitle}`);

    return scheduleNotification({
      title: "⏰ Task Due Soon",
      body: `"${todoTitle}" is due in ${reminderMinutesBefore} minutes`,
      data: { todoId, type: "due-reminder" },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: reminderTime },
      identifier,
      channelId: "reminders",
    });
  };

  // Schedule auto-delete warning notification
  const scheduleAutoDeleteWarning = async (
    todoId: string,
    todoTitle: string,
    category: "daily" | "weekly" | "monthly" | undefined,
    createdAt: number,
    dueDate?: number,
    dueTime?: string
  ): Promise<string | null> => {
    if (!notificationsEnabled) return null;

    let expirationTime: number;
    let warningHoursBefore: number;

    if (category === undefined) {
      // Others category
      if (dueDate && dueTime) {
        // Validate dueDate is a timestamp
        if (dueDate > 946684800000) {
          const dueDateObj = new Date(dueDate);
          const timeParts = dueTime.split(" ");
          const time = timeParts[0];
          const period = timeParts[1];
          const [hoursStr, minutesStr] = time.split(":");
          let hours = parseInt(hoursStr, 10);
          const minutes = parseInt(minutesStr, 10);

          if (period === "PM" && hours !== 12) hours += 12;
          if (period === "AM" && hours === 12) hours = 0;

          dueDateObj.setHours(hours, minutes, 0, 0);
          expirationTime = dueDateObj.getTime() + 24 * 60 * 60 * 1000;
        } else {
          expirationTime = createdAt + 24 * 60 * 60 * 1000;
        }
      } else if (dueDate && dueDate > 946684800000) {
        // dueDate set but no time - use end of that day
        const dueDateObj = new Date(dueDate);
        dueDateObj.setHours(23, 59, 59, 999);
        expirationTime = dueDateObj.getTime() + 24 * 60 * 60 * 1000;
      } else {
        expirationTime = createdAt + 24 * 60 * 60 * 1000;
      }
      warningHoursBefore = 6; // 6 hours before for others
    } else {
      const createdDate = new Date(createdAt);
      createdDate.setHours(23, 59, 59, 999);

      switch (category) {
        case "daily":
          expirationTime = createdDate.getTime() + 2 * 24 * 60 * 60 * 1000;
          warningHoursBefore = 12; // 12 hours before
          break;
        case "weekly":
          expirationTime = createdDate.getTime() + 8 * 24 * 60 * 60 * 1000;
          warningHoursBefore = 24; // 24 hours before
          break;
        case "monthly":
          expirationTime = createdDate.getTime() + 31 * 24 * 60 * 60 * 1000;
          warningHoursBefore = 48; // 48 hours before
          break;
      }
    }

    const notificationTime = new Date(expirationTime - warningHoursBefore * 60 * 60 * 1000);

    // Don't schedule if notification time is in the past
    if (notificationTime.getTime() <= Date.now()) {
      return null;
    }

    const identifier = `auto-delete-warning-${todoId}`;

    // Cancel any existing warning for this todo
    await cancelNotification(identifier);

    const categoryLabel = category ? category : "others";
    const hoursText = warningHoursBefore >= 24 
      ? `${Math.floor(warningHoursBefore / 24)} day(s)` 
      : `${warningHoursBefore} hours`;

    // Calculate seconds until trigger
    const secondsUntilTrigger = Math.floor((notificationTime.getTime() - Date.now()) / 1000);
    
    if (secondsUntilTrigger < 1) return null;

    return scheduleNotification({
      title: "🗑️ Task Expiring Soon",
      body: `"${todoTitle}" (${categoryLabel}) will be auto-deleted in ${hoursText}`,
      data: { todoId, type: "auto-delete-warning" },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: notificationTime },
      identifier,
      channelId: "auto-delete",
    });
  };

  // Schedule task completion reminder (end of day)
  const scheduleCompletionReminder = async (
    todoId: string,
    todoTitle: string,
    category: "daily" | "weekly" | "monthly" | undefined
  ): Promise<string | null> => {
    if (!notificationsEnabled || !category) return null;

    // Only for daily tasks - remind at 8 PM
    if (category !== "daily") return null;

    const today = new Date();
    today.setHours(20, 0, 0, 0); // 8 PM

    // If it's already past 8 PM, skip
    if (today.getTime() <= Date.now()) {
      return null;
    }

    const identifier = `completion-reminder-${todoId}`;
    await cancelNotification(identifier);

    return scheduleNotification({
      title: "📝 Don't Forget!",
      body: `You still have "${todoTitle}" to complete today`,
      data: { todoId, type: "completion-reminder" },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: today },
      identifier,
      channelId: "reminders",
    });
  };

  // Cancel a specific notification
  const cancelNotification = async (identifier: string): Promise<void> => {
    try {
      await Notifications.cancelScheduledNotificationAsync(identifier);
    } catch (error) {
      console.error("Error cancelling notification:", error);
    }
  };

  // Cancel all notifications for a specific todo
  const cancelTodoNotifications = async (todoId: string): Promise<void> => {
    const identifiers = [
      `due-reminder-${todoId}`,
      `auto-delete-warning-${todoId}`,
      `completion-reminder-${todoId}`,
    ];

    for (const id of identifiers) {
      await cancelNotification(id);
    }
  };

  // Cancel all scheduled notifications
  const cancelAllNotifications = async (): Promise<void> => {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error("Error cancelling all notifications:", error);
    }
  };

  // Get all scheduled notifications
  const getScheduledNotifications = async (): Promise<Notifications.NotificationRequest[]> => {
    return await Notifications.getAllScheduledNotificationsAsync();
  };

  // Schedule all notifications for a new todo
  const scheduleAllTodoNotifications = async (
    todoId: string,
    todoTitle: string,
    category: "daily" | "weekly" | "monthly" | undefined,
    createdAt: number,
    dueDate?: number,
    dueTime?: string,
    isCompleted?: boolean
  ): Promise<void> => {
    if (!notificationsEnabled || isCompleted) return;

    // Schedule due date reminder based on category and available data
    if (category === "daily") {
      // Daily: time is main input, date is optional
      if (dueTime) {
        const dateToUse = dueDate && dueDate > 946684800000 ? dueDate : Date.now();
        await scheduleDueDateReminder(todoId, todoTitle, dateToUse, dueTime, category);
      }
    } else if (category === "weekly" || category === "monthly") {
      // Weekly/Monthly: dueDate is day number, not timestamp - skip reminder
      // These are recurring tasks and don't have a specific notification date
      console.log(`Skipping due reminder for ${category} task (recurring)`);
    } else if (!category) {
      // Others: can have date, time, or both
      if (dueDate && dueDate > 946684800000) {
        // Has valid date timestamp
        await scheduleDueDateReminder(todoId, todoTitle, dueDate, dueTime, category);
      } else if (dueTime && !dueDate) {
        // Has time but no date - use today
        const todayTimestamp = Date.now();
        await scheduleDueDateReminder(todoId, todoTitle, todayTimestamp, dueTime, category);
      }
    }

    // Schedule auto-delete warning
    await scheduleAutoDeleteWarning(todoId, todoTitle, category, createdAt, dueDate, dueTime);

    // Schedule completion reminder for daily tasks
    await scheduleCompletionReminder(todoId, todoTitle, category);
  };

  return {
    notification,
    scheduleNotification,
    scheduleDueDateReminder,
    scheduleAutoDeleteWarning,
    scheduleCompletionReminder,
    cancelNotification,
    cancelTodoNotifications,
    cancelAllNotifications,
    getScheduledNotifications,
    scheduleAllTodoNotifications,
  };
};
