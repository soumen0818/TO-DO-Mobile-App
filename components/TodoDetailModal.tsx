import { Doc } from "@/convex/_generated/dataModel";
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

type Todo = Doc<"todos">;

interface TodoDetailModalProps {
  visible: boolean;
  onClose: () => void;
  todo: Todo | null;
}

const TodoDetailModal: React.FC<TodoDetailModalProps> = ({
  visible,
  onClose,
  todo,
}) => {
  const { colors } = useTheme();

  if (!todo) return null;

  const formatDate = (timestamp: number | undefined) => {
    if (!timestamp) return null;
    return new Date(timestamp).toLocaleDateString("en-US", {
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
      if (todo.dueDate) {
        return formatDate(todo.dueDate);
      }
      return "No date set";
    }

    if (
      todo.category === "weekly" &&
      typeof todo.dueDate === "number" &&
      todo.dueDate < 7
    ) {
      return `Every ${getWeekdayName(todo.dueDate)}`;
    }

    if (
      todo.category === "monthly" &&
      typeof todo.dueDate === "number" &&
      todo.dueDate <= 31
    ) {
      return `Day ${todo.dueDate} of every month`;
    }

    if (
      todo.dueDate &&
      typeof todo.dueDate === "number" &&
      todo.dueDate > 100
    ) {
      return formatDate(todo.dueDate);
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
    return todo.isCompleted ? "checkmark-circle" : "ellipse-outline";
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
                  todo.isCompleted
                    ? colors.gradients.success
                    : [colors.border, colors.border]
                }
                style={styles.statusBadge}
              >
                <Ionicons
                  name={getStatusIcon()}
                  size={16}
                  color={todo.isCompleted ? "#fff" : colors.text}
                />
                <Text
                  style={[
                    styles.badgeText,
                    { color: todo.isCompleted ? "#fff" : colors.text },
                  ]}
                >
                  {todo.isCompleted ? "Completed" : "Pending"}
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
                  {getCategoryDisplay(todo.category)}
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
                  {todo.dueTime || "Not set"}
                </Text>
              </View>
            </View>

            {/* Recurring Badge (if applicable) */}
            {todo.isRecurring && (
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
                    Repeats {todo.recurringPattern?.toUpperCase()}
                  </Text>
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
                  {new Date(todo.createdAt).toLocaleDateString()} at{" "}
                  {new Date(todo.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              </View>
              {todo.completedAt && (
                <View style={styles.timestampRow}>
                  <Ionicons
                    name="checkmark-circle"
                    size={14}
                    color={colors.success}
                  />
                  <Text
                    style={[styles.timestampText, { color: colors.textMuted }]}
                  >
                    {new Date(todo.completedAt).toLocaleDateString()} at{" "}
                    {new Date(todo.completedAt).toLocaleTimeString([], {
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
