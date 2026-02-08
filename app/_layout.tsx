import { AuthProvider } from "@/contexts/AuthContext";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { ThemeProvider } from "@/hooks/useTheme";
// Import to ensure notification handler is set at app start
import "@/utils/notificationUtils";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { useFonts } from "expo-font";
import { Slot } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Text, View } from "react-native";

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

// Get environment variables with fallback and logging
const CONVEX_URL = process.env.EXPO_PUBLIC_CONVEX_URL;
console.log("[_layout] Convex URL:", CONVEX_URL);
console.log("[_layout] Clerk Key exists:", !!process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY);

if (!CONVEX_URL) {
  console.error("[_layout] ERROR: EXPO_PUBLIC_CONVEX_URL is not set!");
}

const convex = new ConvexReactClient(CONVEX_URL || "https://festive-seahorse-929.convex.cloud", {
  unsavedChangesWarning: false,
});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    // Hide splash screen after fonts load OR if there's an error OR after 3 seconds timeout
    const timeoutId = setTimeout(() => {
      console.log("Force hiding splash screen after timeout");
      SplashScreen.hideAsync();
    }, 3000);

    if (fontsLoaded || fontError) {
      clearTimeout(timeoutId);
      SplashScreen.hideAsync();
    }

    return () => clearTimeout(timeoutId);
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  // Show error if environment variables are missing
  if (!process.env.EXPO_PUBLIC_CONVEX_URL || !process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20 }}>
        <Text style={{ color: "red", fontSize: 18, fontWeight: "bold", marginBottom: 10 }}>Configuration Error</Text>
        <Text style={{ color: "#333", textAlign: "center" }}>
          Missing environment variables. Please rebuild the app with proper configuration.
        </Text>
        <Text style={{ color: "#666", marginTop: 10, fontSize: 12 }}>
          Convex URL: {process.env.EXPO_PUBLIC_CONVEX_URL ? "✓" : "✗"}
        </Text>
        <Text style={{ color: "#666", fontSize: 12 }}>
          Clerk Key: {process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ? "✓" : "✗"}
        </Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <ConvexProvider client={convex}>
          <SettingsProvider>
            <ThemeProvider>
              <Slot />
            </ThemeProvider>
          </SettingsProvider>
        </ConvexProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
