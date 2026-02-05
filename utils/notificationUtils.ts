import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

// Configure notification handler at module level (required for notifications to show)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Send welcome notification (standalone function)
export async function sendWelcomeNotification(): Promise<void> {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "🎉 Welcome to Zenith Task!",
        body: "You'll now receive reminders for your tasks. Stay productive!",
        sound: true,
      },
      trigger: null, // Send immediately
    });
  } catch (error) {
    console.log("Welcome notification error:", error);
  }
}

// Setup local notifications (request permissions and configure channels)
export async function setupLocalNotifications(): Promise<boolean> {
  try {
    // Check and request permissions
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log("Failed to get notification permissions");
      return false;
    }

    // Set up Android notification channel
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "Default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#3B82F6",
      });

      await Notifications.setNotificationChannelAsync("reminders", {
        name: "Task Reminders",
        description: "Notifications for task due dates and reminders",
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#10B981",
      });

      await Notifications.setNotificationChannelAsync("auto-delete", {
        name: "Auto-delete Warnings",
        description: "Warnings before tasks are automatically deleted",
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250],
        lightColor: "#F59E0B",
      });
    }

    return true;
  } catch (error) {
    console.log("Local notifications setup error:", error);
    return false;
  }
}
