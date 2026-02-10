import { AuthProvider } from "@/contexts/AuthContext";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { ThemeProvider } from "@/hooks/useTheme";
// Import to ensure notification handler is set at app start
import "@/utils/notificationUtils";
import { useFonts } from "expo-font";
import { Slot } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Text, View } from "react-native";

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

// Get environment variables with fallback and logging
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

console.log("[_layout] Supabase URL exists:", !!SUPABASE_URL);
console.log("[_layout] Supabase Anon Key exists:", !!SUPABASE_ANON_KEY);

if (!SUPABASE_URL) {
  console.error("[_layout] ERROR: EXPO_PUBLIC_SUPABASE_URL is not set!");
}
if (!SUPABASE_ANON_KEY) {
  console.error("[_layout] ERROR: EXPO_PUBLIC_SUPABASE_ANON_KEY is not set!");
}

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
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20 }}>
        <Text style={{ color: "red", fontSize: 18, fontWeight: "bold", marginBottom: 10 }}>Configuration Error</Text>
        <Text style={{ color: "#333", textAlign: "center" }}>
          Missing environment variables. Please rebuild the app with proper configuration.
        </Text>
        <Text style={{ color: "#666", marginTop: 10, fontSize: 12 }}>
          Supabase URL: {SUPABASE_URL ? "✓" : "✗"}
        </Text>
        <Text style={{ color: "#666", fontSize: 12 }}>
          Supabase Anon Key: {SUPABASE_ANON_KEY ? "✓" : "✗"}
        </Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <SettingsProvider>
          <ThemeProvider>
            <Slot />
          </ThemeProvider>
        </SettingsProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
