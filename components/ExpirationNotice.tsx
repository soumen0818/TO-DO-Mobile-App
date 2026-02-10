import { useAuth } from "@/contexts/AuthContext";
import useTheme from "@/hooks/useTheme";
import { getTodosExpiringSoon } from "@/lib/todos";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import {
  Dimensions,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Database } from "@/lib/database.types";

const EXPIRATION_NOTICE_KEY = "lastExpirationNoticeShown";
const { width: SCREEN_WIDTH } = Dimensions.get("window");

type Todo = Database['public']['Tables']['todos']['Row'];

const ExpirationNotice = () => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [visible, setVisible] = useState(false);
  const [hasCheckedStorage, setHasCheckedStorage] = useState(false);
  const [expiringTodos, setExpiringTodos] = useState<Todo[]>([]);

  // Fetch expiring todos
  useEffect(() => {
    if (!user) return;

    getTodosExpiringSoon(user.id)
      .then(setExpiringTodos)
      .catch(console.error);
  }, [user]);

  // Check if we should show the notice (once per day)
  useEffect(() => {
    const checkLastShown = async () => {
      try {
        const lastShown = await AsyncStorage.getItem(EXPIRATION_NOTICE_KEY);
        const today = new Date().toDateString();

        if (lastShown !== today) {
          // Haven't shown today, allow showing
          setHasCheckedStorage(true);
        } else {
          // Already shown today, don't show
          setHasCheckedStorage(true);
          setVisible(false);
        }
      } catch {
        setHasCheckedStorage(true);
      }
    };

    checkLastShown();
  }, []);

  // Show modal when we have expiring todos and haven't shown today
  useEffect(() => {
    const showIfNeeded = async () => {
      if (!hasCheckedStorage) return;
      if (!expiringTodos || expiringTodos.length === 0) return;

      const lastShown = await AsyncStorage.getItem(EXPIRATION_NOTICE_KEY);
      const today = new Date().toDateString();

      if (lastShown !== today) {
        setVisible(true);
        // Mark as shown for today
        await AsyncStorage.setItem(EXPIRATION_NOTICE_KEY, today);
      }
    };

    showIfNeeded();
  }, [expiringTodos, hasCheckedStorage]);

  const handleDismiss = () => {
    setVisible(false);
  };

  if (!expiringTodos || expiringTodos.length === 0) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleDismiss}
    >
      <View style={styles.overlay}>
        <View style={[styles.modalContainer, { backgroundColor: colors.surface }]}>
          {/* Close button */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleDismiss}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={24} color={colors.textMuted} />
          </TouchableOpacity>

          {/* Alert Icon */}
          <LinearGradient
            colors={[colors.warning, colors.danger]}
            style={styles.iconContainer}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="alert-circle" size={40} color="#fff" />
          </LinearGradient>

          {/* Content */}
          <Text style={[styles.title, { color: colors.text }]}>
            ⚠️ Todos Expiring Soon
          </Text>

          <Text style={[styles.message, { color: colors.danger }]}>
            {expiringTodos.length} todo{expiringTodos.length > 1 ? "s" : ""}{" "}
            will be automatically deleted within 24 hours
          </Text>

          <Text style={[styles.subMessage, { color: colors.textMuted }]}>
            Complete or save important todos before they&apos;re removed
          </Text>

          {/* Todo list preview */}
          <View style={[styles.todoPreview, { backgroundColor: colors.bg }]}>
            {expiringTodos.slice(0, 3).map((todo, index) => (
              <View key={todo.id} style={styles.todoItem}>
                <Ionicons name="time-outline" size={16} color={colors.warning} />
                <Text
                  style={[styles.todoText, { color: colors.text }]}
                  numberOfLines={1}
                >
                  {todo.title}
                </Text>
              </View>
            ))}
            {expiringTodos.length > 3 && (
              <Text style={[styles.moreText, { color: colors.textMuted }]}>
                +{expiringTodos.length - 3} more...
              </Text>
            )}
          </View>

          {/* Dismiss button */}
          <TouchableOpacity
            style={styles.dismissButton}
            onPress={handleDismiss}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={colors.gradients.primary}
              style={styles.dismissGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.dismissText}>Got it</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContainer: {
    width: SCREEN_WIDTH - 48,
    maxWidth: 360,
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  closeButton: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 12,
    textAlign: "center",
  },
  message: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 8,
  },
  subMessage: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
  },
  todoPreview: {
    width: "100%",
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    gap: 8,
  },
  todoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  todoText: {
    fontSize: 14,
    flex: 1,
  },
  moreText: {
    fontSize: 12,
    fontStyle: "italic",
    textAlign: "center",
    marginTop: 4,
  },
  dismissButton: {
    width: "100%",
    borderRadius: 12,
    overflow: "hidden",
  },
  dismissGradient: {
    paddingVertical: 14,
    alignItems: "center",
  },
  dismissText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default ExpirationNotice;
