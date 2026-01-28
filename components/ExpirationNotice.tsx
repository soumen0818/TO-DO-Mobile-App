import { api } from "@/convex/_generated/api";
import useTheme from "@/hooks/useTheme";
import { useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, Text, View } from "react-native";

const ExpirationNotice = () => {
  const { colors } = useTheme();
  const { user } = useUser();

  const expiringTodos = useQuery(
    api.autoDelete.getTodosExpiringSoon,
    user ? { userId: user.id } : "skip",
  );

  if (!expiringTodos || expiringTodos.length === 0) return null;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.warning, colors.danger]}
        style={styles.banner}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <Ionicons name="alert-circle" size={24} color="#fff" />
        <View style={styles.textContainer}>
          <Text style={styles.title}>⚠️ Todos Expiring Soon</Text>
          <Text style={styles.message}>
            {expiringTodos.length} todo{expiringTodos.length > 1 ? "s" : ""}{" "}
            will be automatically deleted within 24 hours
          </Text>
          <Text style={styles.subMessage}>
            Complete or save important todos before they&apos;re removed
          </Text>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 4,
  },
  subMessage: {
    fontSize: 12,
    color: "#fff",
    opacity: 0.9,
  },
});

export default ExpirationNotice;
