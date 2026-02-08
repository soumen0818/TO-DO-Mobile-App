import { useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, Text, View, useColorScheme } from "react-native";

/**
 * Catch-all route that handles any unmatched URLs.
 * This prevents 404 pages from showing during OAuth redirects.
 */
export default function UnmatchedRoute() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  useEffect(() => {
    // Redirect to sign-in after a brief moment
    const timer = setTimeout(() => {
      router.replace("/sign-in");
    }, 1000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <View style={[styles.container, { backgroundColor: isDark ? "#000" : "#fff" }]}>
      <ActivityIndicator size="large" color="#007AFF" />
      <Text style={[styles.text, { color: isDark ? "#fff" : "#000" }]}>
        Completing sign in...
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: "500",
  },
});
