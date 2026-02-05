import AsyncStorage from "@react-native-async-storage/async-storage";
import { sendWelcomeNotification } from "@/utils/notificationUtils";
import * as Notifications from "expo-notifications";
import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { Alert, Linking, Platform } from "react-native";

interface SettingsContextType {
  isAutoSync: boolean;
  toggleAutoSync: () => void;
  soundEnabled: boolean;
  toggleSound: () => void;
  notificationsEnabled: boolean;
  toggleNotifications: () => void;
  hapticsEnabled: boolean;
  toggleHaptics: () => void;
  isLoading: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [isAutoSync, setIsAutoSync] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  // Load settings from AsyncStorage on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const [autoSyncValue, soundValue, notificationsValue, hapticsValue] = await Promise.all([
          AsyncStorage.getItem("autoSync"),
          AsyncStorage.getItem("soundEnabled"),
          AsyncStorage.getItem("notificationsEnabled"),
          AsyncStorage.getItem("hapticsEnabled"),
        ]);

        if (autoSyncValue !== null) setIsAutoSync(JSON.parse(autoSyncValue));
        if (soundValue !== null) setSoundEnabled(JSON.parse(soundValue));
        if (notificationsValue !== null) setNotificationsEnabled(JSON.parse(notificationsValue));
        if (hapticsValue !== null) setHapticsEnabled(JSON.parse(hapticsValue));
      } catch (error) {
        console.error("Error loading settings:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  const toggleAutoSync = async () => {
    const newValue = !isAutoSync;
    setIsAutoSync(newValue);
    await AsyncStorage.setItem("autoSync", JSON.stringify(newValue));
  };

  const toggleSound = async () => {
    const newValue = !soundEnabled;
    setSoundEnabled(newValue);
    await AsyncStorage.setItem("soundEnabled", JSON.stringify(newValue));
  };

  const toggleNotifications = async () => {
    // If turning ON, check permission first
    if (!notificationsEnabled) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      
      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        
        if (status !== "granted") {
          // Permission denied - show alert to open settings
          Alert.alert(
            "Notifications Disabled",
            "To receive task reminders, please enable notifications in your device settings.",
            [
              { text: "Cancel", style: "cancel" },
              { 
                text: "Open Settings", 
                onPress: () => {
                  if (Platform.OS === "ios") {
                    Linking.openURL("app-settings:");
                  } else {
                    Linking.openSettings();
                  }
                }
              },
            ]
          );
          return; // Don't enable if permission not granted
        }
      }

      // Send welcome notification only once (first time enabling)
      const hasShownWelcome = await AsyncStorage.getItem("welcomeNotificationSent");
      if (!hasShownWelcome) {
        await sendWelcomeNotification();
        await AsyncStorage.setItem("welcomeNotificationSent", "true");
      }
    }
    
    const newValue = !notificationsEnabled;
    setNotificationsEnabled(newValue);
    await AsyncStorage.setItem("notificationsEnabled", JSON.stringify(newValue));
  };

  const toggleHaptics = async () => {
    const newValue = !hapticsEnabled;
    setHapticsEnabled(newValue);
    await AsyncStorage.setItem("hapticsEnabled", JSON.stringify(newValue));
  };

  return (
    <SettingsContext.Provider
      value={{
        isAutoSync,
        toggleAutoSync,
        soundEnabled,
        toggleSound,
        notificationsEnabled,
        toggleNotifications,
        hapticsEnabled,
        toggleHaptics,
        isLoading,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
};
