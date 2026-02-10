import useTheme from "@/hooks/useTheme";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
    Linking,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { Database } from "@/lib/database.types";
import { isInWarningWindow, getHoursUntilDeletion, calculateExpirationTime } from "@/utils/expirationUtils";

type Todo = Database['public']['Tables']['todos']['Row'];

interface TodoDetailModalProps {
  visible: boolean;
  onClose: () => void;
  todo: Todo | null;
  isExpiringSoon?: boolean;
  hoursUntilDeletion?: number;
}

// Calculate expiration info for a todo using centralized utilities
const getExpirationInfo = (todo: Todo): { isExpiringSoon: boolean; hoursUntilDeletion: number; expirationDate: Date } | null => {
  // Check if in warning window
  if (!isInWarningWindow(todo)) {
    return null;
  }

  const hours = getHoursUntilDeletion(todo);
  if (hours === null) {
    return null;
  }

  const expirationTime = calculateExpirationTime(
    todo.created_at,
    todo.category,
    todo.is_recurring,
    todo.due_date,
    todo.due_time
  );

  if (expirationTime === null) {
    return null;
  }

  return {
    isExpiringSoon: true,
    hoursUntilDeletion: hours,
    expirationDate: new Date(expirationTime),
  };
};

const TodoDetailModal: React.FC<TodoDetailModalProps> = ({
  visible,
  onClose,
  todo,
  isExpiringSoon: isExpiringSoonProp,
  hoursUntilDeletion: hoursUntilDeletionProp,
}) => {
  const { colors } = useTheme();

  // Use props if provided, otherwise calculate locally
  const localExpirationInfo = todo ? getExpirationInfo(todo) : null;
  
  // Calculate proper expiration date when local info is not available
  const calculateExpirationDate = (t: Todo): Date => {
    let expirationTime: number;
    if (!t.category) {
      if (t.due_date && t.due_time) {
        const dueDateObj = new Date(t.due_date);
        const [time, period] = t.due_time.split(" ");
        const timeParts = time.split(":").map(Number);
        let hours = timeParts[0];
        const minutes = timeParts[1];
        if (period === "PM" && hours !== 12) hours += 12;
        if (period === "AM" && hours === 12) hours = 0;
        dueDateObj.setHours(hours, minutes, 0, 0);
        expirationTime = dueDateObj.getTime() + 24 * 60 * 60 * 1000;
      } else {
        expirationTime = new Date(t.created_at).getTime() + 24 * 60 * 60 * 1000;
      }
    } else {
      const createdDate = new Date(t.created_at);
      createdDate.setUTCHours(23, 59, 59, 999);
      switch (t.category) {
        case "daily":
          expirationTime = createdDate.getTime() + 2 * 24 * 60 * 60 * 1000;
          break;
        case "weekly":
          expirationTime = createdDate.getTime() + 8 * 24 * 60 * 60 * 1000;
          break;
        case "monthly":
          expirationTime = createdDate.getTime() + 31 * 24 * 60 * 60 * 1000;
          break;
        default:
          expirationTime = createdDate.getTime() + 2 * 24 * 60 * 60 * 1000;
      }
    }
    return new Date(expirationTime);
  };
  
  // Determine expiration info - prefer props from parent (server-side) if available
  const expirationInfo = isExpiringSoonProp !== undefined
    ? (isExpiringSoonProp ? {
        isExpiringSoon: true,
        hoursUntilDeletion: hoursUntilDeletionProp ?? localExpirationInfo?.hoursUntilDeletion ?? 0,
        expirationDate: localExpirationInfo?.expirationDate ?? (todo ? calculateExpirationDate(todo) : new Date()),
      } : null)
    : localExpirationInfo;

  if (!todo) return null;

  const formatDate = (timestamp: number | string | undefined) => {
    if (!timestamp) return null;
    const date = typeof timestamp === 'string' ? new Date(timestamp) : new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getCategoryDisplay = (category: string | undefined) => {
    if (!category) return "Others";
    return category.charAt(0).toUpperCase() + category.slice(1);
  };

  const getWeekdayName = (day: number) => {
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    return days[day];
  };

  const renderDueDateInfo = () => {
    if (!todo.category) {
      // Others category - show regular date
      if (todo.due_date) {
        return formatDate(todo.due_date);
      }
      return "No date set";
    }

    if (
      todo.category === "weekly" &&
      typeof todo.due_date === "number" &&
      todo.due_date < 7
    ) {
      return `Every ${getWeekdayName(todo.due_date)}`;
    }

    if (
      todo.category === "monthly" &&
      typeof todo.due_date === "number" &&
      todo.due_date <= 31
    ) {
      return `Day ${todo.due_date} of every month`;
    }

    if (
      todo.due_date &&
      typeof todo.due_date === "number" &&
      todo.due_date > 100
    ) {
      return formatDate(todo.due_date);
    }

    return "No date set";
  };

  // Function to detect and make links clickable
  const renderDescriptionWithLinks = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);

    return (
      <Text style={[styles.detailValue, { color: colors.text }]}>
        {parts.map((part, index) => {
          if (part.match(urlRegex)) {
            return (
              <Text
                key={index}
                style={[styles.link, { color: colors.primary }]}
                onPress={() => Linking.openURL(part)}
              >
                {part}
              </Text>
            );
          }
          return <Text key={index}>{part}</Text>;
        })}
      </Text>
    );
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "#FF3B30";
      case "medium":
        return "#FFA500";
      case "low":
        return "#34C759";
      default:
        return colors.textMuted;
    }
  };

  const getStatusIcon = () => {
    return todo.is_completed ? "checkmark-circle" : "ellipse-outline";
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <LinearGradient
            colors={colors.gradients.surface}
            style={styles.modalContent}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {/* Header with Close Button */}
            <View style={styles.modalHeader}>
              <View style={styles.headerLeft}>
                <Ionicons
                  name="information-circle"
                  size={28}
                  color={colors.primary}
                />
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  Todo Details
                </Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons
                  name="close-circle"
                  size={28}
                  color={colors.textMuted}
                />
              </TouchableOpacity>
            </View>

            {/* Status & Priority Row */}
            <View style={styles.statusPriorityRow}>
              <LinearGradient
                colors={
                  todo.is_completed
                    ? colors.gradients.success
                    : [colors.border, colors.border]
                }
                style={styles.statusBadge}
              >
                <Ionicons
                  name={getStatusIcon()}
                  size={16}
                  color={todo.is_completed ? "#fff" : colors.text}
                />
                <Text
                  style={[
                    styles.badgeText,
                    { color: todo.is_completed ? "#fff" : colors.text },
                  ]}
                >
                  {todo.is_completed ? "Completed" : "Pending"}
                </Text>
              </LinearGradient>

              <View
                style={[
                  styles.priorityBadge,
                  { backgroundColor: `${getPriorityColor(todo.priority)}20` },
                ]}
              >
                <View
                  style={[
                    styles.priorityDot,
                    { backgroundColor: getPriorityColor(todo.priority) },
                  ]}
                />
                <Text
                  style={[
                    styles.badgeText,
                    { color: getPriorityColor(todo.priority) },
                  ]}
                >
                  {todo.priority.toUpperCase()}
                </Text>
              </View>

              <View
                style={[
                  styles.categoryBadge,
                  { backgroundColor: `${colors.primary}15` },
                ]}
              >
                <Ionicons name="folder" size={14} color={colors.primary} />
                <Text style={[styles.badgeText, { color: colors.primary }]}>
                  {getCategoryDisplay(todo.category || undefined)}
                </Text>
              </View>
            </View>

            {/* Title */}
            <View style={styles.contentSection}>
              <Text style={[styles.titleText, { color: colors.text }]}>
                {todo.title}
              </Text>
            </View>

            {/* Description with Links */}
            {todo.description && (
              <View style={styles.contentSection}>
                <View style={styles.infoRow}>
                  <Ionicons
                    name="document-text"
                    size={18}
                    color={colors.textMuted}
                  />
                  <View style={styles.infoContent}>
                    {renderDescriptionWithLinks(todo.description)}
                  </View>
                </View>
              </View>
            )}

            {/* Info Grid - 2 columns */}
            <View style={styles.infoGrid}>
              {/* Due Date */}
              <View style={styles.infoCard}>
                <Ionicons
                  name="calendar-outline"
                  size={18}
                  color={colors.primary}
                />
                <Text style={[styles.infoLabel, { color: colors.textMuted }]}>
                  Due Date
                </Text>
                <Text
                  style={[styles.infoValue, { color: colors.text }]}
                  numberOfLines={2}
                >
                  {renderDueDateInfo()}
                </Text>
              </View>

              {/* Due Time */}
              <View style={styles.infoCard}>
                <Ionicons
                  name="time-outline"
                  size={18}
                  color={colors.primary}
                />
                <Text style={[styles.infoLabel, { color: colors.textMuted }]}>
                  Due Time
                </Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {todo.due_time || "Not set"}
                </Text>
              </View>
            </View>

            {/* Recurring Badge (if applicable) */}
            {todo.is_recurring && (
              <View style={styles.recurringSection}>
                <LinearGradient
                  colors={[`${colors.primary}20`, `${colors.primary}10`]}
                  style={styles.recurringBadge}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Ionicons name="repeat" size={18} color={colors.primary} />
                  <Text
                    style={[styles.recurringText, { color: colors.primary }]}
                  >
                    Repeats {todo.recurring_pattern?.toUpperCase()}
                  </Text>
                </LinearGradient>
              </View>
            )}

            {/* Expiration Warning (if expiring soon) */}
            {expirationInfo && (
              <View style={styles.expirationSection}>
                <LinearGradient
                  colors={colors.gradients.warning}
                  style={styles.expirationBadge}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Ionicons name="alert-circle" size={20} color="#fff" />
                  <View style={styles.expirationContent}>
                    <Text style={styles.expirationTitle}>
                      ⚠️ Expiring Soon
                    </Text>
                    <Text style={styles.expirationText}>
                      This todo will be auto-deleted in {expirationInfo.hoursUntilDeletion} hour
                      {expirationInfo.hoursUntilDeletion !== 1 ? "s" : ""}
                    </Text>
                    <Text style={styles.expirationSubtext}>
                      {expirationInfo.expirationDate.toLocaleDateString()} at{" "}
                      {expirationInfo.expirationDate.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                  </View>
                </LinearGradient>
              </View>
            )}

            {/* Timestamps Footer */}
            <View
              style={[
                styles.timestampSection,
                { borderTopColor: colors.border },
              ]}
            >
              <View style={styles.timestampRow}>
                <Ionicons
                  name="add-circle-outline"
                  size={14}
                  color={colors.textMuted}
                />
                <Text
                  style={[styles.timestampText, { color: colors.textMuted }]}
                >
                  {new Date(todo.created_at).toLocaleDateString()} at{" "}
                  {new Date(todo.created_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              </View>
              {todo.completed_at && (
                <View style={styles.timestampRow}>
                  <Ionicons
                    name="checkmark-circle"
                    size={14}
                    color={colors.success}
                  />
                  <Text
                    style={[styles.timestampText, { color: colors.textMuted }]}
                  >
                    {new Date(todo.completed_at).toLocaleDateString()} at{" "}
                    {new Date(todo.completed_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                </View>
              )}
            </View>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContainer: {
    width: "100%",
    maxWidth: 500,
    maxHeight: "80%",
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  modalContent: {
    padding: 24,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "700",
  },
  closeButton: {
    padding: 4,
  },
  statusPriorityRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 20,
    flexWrap: "wrap",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  priorityBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: "600",
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  contentSection: {
    marginBottom: 16,
  },
  titleText: {
    fontSize: 20,
    fontWeight: "700",
    lineHeight: 28,
  },
  infoRow: {
    flexDirection: "row",
    gap: 10,
  },
  infoContent: {
    flex: 1,
  },
  detailValue: {
    fontSize: 15,
    lineHeight: 22,
  },
  link: {
    textDecorationLine: "underline",
  },
  infoGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  infoCard: {
    flex: 1,
    padding: 14,
    borderRadius: 14,
    backgroundColor: "rgba(128, 128, 128, 0.05)",
    gap: 6,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  recurringSection: {
    marginBottom: 16,
  },
  recurringBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  recurringText: {
    fontSize: 14,
    fontWeight: "600",
  },
  expirationSection: {
    marginBottom: 16,
  },
  expirationBadge: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
  },
  expirationContent: {
    flex: 1,
    gap: 4,
  },
  expirationTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
  },
  expirationText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  expirationSubtext: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.85)",
  },
  timestampSection: {
    paddingTop: 16,
    borderTopWidth: 1,
    gap: 8,
  },
  timestampRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  timestampText: {
    fontSize: 12,
  },
});

export default TodoDetailModal;
