import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";
import useTheme from "@/hooks/useTheme";
import { useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useMutation } from "convex/react";
import { useEffect, useState } from "react";
import {
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

type Todo = Doc<"todos">;

interface EditTodoModalProps {
  visible: boolean;
  onClose: () => void;
  todo: Todo | null;
}

const EditTodoModal = ({ visible, onClose, todo }: EditTodoModalProps) => {
  const { colors } = useTheme();
  const { user } = useUser();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"high" | "medium" | "low">("medium");
  const [category, setCategory] = useState<
    "daily" | "weekly" | "monthly" | undefined
  >("daily");
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [dueTime, setDueTime] = useState<Date | undefined>(undefined);
  const [weekDay, setWeekDay] = useState<number | undefined>(undefined);
  const [dayOfMonth, setDayOfMonth] = useState<number | undefined>(undefined);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringPattern, setRecurringPattern] = useState<
    "daily" | "weekly" | "monthly"
  >("daily");

  const updateTodo = useMutation(api.todos.updateTodo);

  useEffect(() => {
    if (todo) {
      setTitle(todo.title);
      setDescription(todo.description || "");
      setPriority(todo.priority);
      setCategory(todo.category);
      setIsRecurring(todo.isRecurring || false);
      setRecurringPattern(
        (todo.recurringPattern as "daily" | "weekly" | "monthly") || "daily",
      );

      // Handle dueDate based on category
      if (
        todo.category === "weekly" &&
        typeof todo.dueDate === "number" &&
        todo.dueDate < 7
      ) {
        // It's a weekday (0-6)
        setWeekDay(todo.dueDate);
        setDueDate(undefined);
      } else if (
        todo.category === "monthly" &&
        typeof todo.dueDate === "number" &&
        todo.dueDate <= 31
      ) {
        // It's a day of month (1-31)
        setDayOfMonth(todo.dueDate);
        setDueDate(undefined);
      } else if (todo.dueDate) {
        // It's a timestamp for daily or no category
        setDueDate(new Date(todo.dueDate));
        setWeekDay(undefined);
        setDayOfMonth(undefined);
      }

      setDueTime(todo.dueTime ? parseTimeString(todo.dueTime) : undefined);
    }
  }, [todo]);

  // Update recurring pattern when category changes
  useEffect(() => {
    if (category && isRecurring) {
      setRecurringPattern(category);
    }
  }, [category, isRecurring]);

  const parseTimeString = (timeStr: string): Date => {
    const date = new Date();
    const [time, period] = timeStr.split(" ");
    let [hours, minutes] = time.split(":").map(Number);
    if (period === "PM" && hours !== 12) hours += 12;
    if (period === "AM" && hours === 12) hours = 0;
    date.setHours(hours, minutes, 0, 0);
    return date;
  };

  const handleUpdate = async () => {
    if (title.trim() && user && todo) {
      // Validate category-specific requirements
      if (category === "weekly" && weekDay === undefined) {
        Alert.alert(
          "Required Field",
          "Please select a weekday for weekly tasks.",
        );
        return;
      }
      if (category === "monthly" && dayOfMonth === undefined) {
        Alert.alert("Required Field", "Please select a day for monthly tasks.");
        return;
      }

      // Validate recurring pattern matches category
      if (isRecurring && recurringPattern !== category) {
        Alert.alert(
          "Invalid Configuration",
          `Recurring pattern must match the category. Please set recurring pattern to "${category}".`,
        );
        return;
      }

      try {
        // Prepare date/time based on category
        let finalDueDate: number | undefined;
        let finalDueTime: string | undefined;

        if (category === "daily") {
          finalDueDate = dueDate ? dueDate.getTime() : undefined;
          finalDueTime = dueTime
            ? dueTime.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
              })
            : undefined;
        } else if (category === "weekly") {
          if (weekDay !== undefined) {
            finalDueDate = weekDay;
          }
          finalDueTime = dueTime
            ? dueTime.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
              })
            : undefined;
        } else if (category === "monthly") {
          if (dayOfMonth !== undefined) {
            finalDueDate = dayOfMonth;
          }
          finalDueTime = dueTime
            ? dueTime.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
              })
            : undefined;
        }

        await updateTodo({
          id: todo._id,
          userId: user.id,
          title: title.trim(),
          description: description.trim() || undefined,
          priority,
          category,
          dueDate: finalDueDate,
          dueTime: finalDueTime,
          isRecurring: isRecurring,
          recurringPattern: isRecurring ? recurringPattern : undefined,
        });
        onClose();
      } catch (error) {
        console.log("Error updating todo", error);
        Alert.alert("Error", "Failed to update todo");
      }
    }
  };

  if (!todo) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View
          style={[styles.modalContent, { backgroundColor: colors.surface }]}
        >
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Edit Task
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalBody}
            showsVerticalScrollIndicator={false}
          >
            {/* Title */}
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.backgrounds.input,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              placeholder="Task Title *"
              value={title}
              onChangeText={setTitle}
              placeholderTextColor={colors.textMuted}
            />

            {/* Description */}
            <View>
              <TextInput
                style={[
                  styles.textArea,
                  {
                    backgroundColor: colors.backgrounds.input,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
                placeholder="Description (optional)"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                maxLength={200}
                placeholderTextColor={colors.textMuted}
              />
              <Text style={[styles.charCount, { color: colors.textMuted }]}>
                {description.length}/200
              </Text>
            </View>

            {/* Priority */}
            <Text style={[styles.label, { color: colors.text }]}>Priority</Text>
            <View style={styles.optionsRow}>
              {(["high", "medium", "low"] as const).map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[
                    styles.optionButton,
                    { borderColor: colors.border },
                    priority === p && { backgroundColor: colors.primary },
                  ]}
                  onPress={() => setPriority(p)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      { color: priority === p ? "#fff" : colors.text },
                    ]}
                  >
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Category */}
            <Text style={[styles.label, { color: colors.text }]}>Category</Text>
            <View style={styles.optionsRow}>
              {(["daily", "weekly", "monthly"] as const).map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[
                    styles.optionButton,
                    { borderColor: colors.border },
                    category === c && { backgroundColor: colors.primary },
                  ]}
                  onPress={() => setCategory(c)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      { color: category === c ? "#fff" : colors.text },
                    ]}
                  >
                    {c.charAt(0).toUpperCase() + c.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Recurring - Only visible when category is selected */}
            {category && (
              <View style={styles.recurringSection}>
                <View style={styles.recurringHeader}>
                  <Text style={[styles.label, { color: colors.text }]}>
                    Recurring Task
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.toggleSwitch,
                      {
                        backgroundColor: isRecurring
                          ? colors.primary
                          : colors.border,
                      },
                    ]}
                    onPress={() => setIsRecurring(!isRecurring)}
                  >
                    <View
                      style={[
                        styles.toggleThumb,
                        {
                          backgroundColor: "#fff",
                          transform: [{ translateX: isRecurring ? 20 : 0 }],
                        },
                      ]}
                    />
                  </TouchableOpacity>
                </View>

                {isRecurring && (
                  <View style={styles.recurringInfo}>
                    <Ionicons
                      name="information-circle"
                      size={16}
                      color={colors.primary}
                    />
                    <Text
                      style={[
                        styles.recurringInfoText,
                        { color: colors.textMuted },
                      ]}
                    >
                      Recurring pattern will be set to &quot;{category}&quot; to
                      match your selected category.
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Date & Time - Category Based */}
            <View style={styles.labelWithClear}>
              <Text style={[styles.label, { color: colors.text }]}>
                {category === "daily" && "Due Time (optional)"}
                {category === "weekly" && "Weekday & Time"}
                {category === "monthly" && "Day & Time"}
              </Text>
              {((category === "daily" && dueTime) ||
                (category === "weekly" && (weekDay !== undefined || dueTime)) ||
                (category === "monthly" &&
                  (dayOfMonth !== undefined || dueTime))) && (
                <TouchableOpacity
                  onPress={() => {
                    setDueDate(undefined);
                    setDueTime(undefined);
                    setWeekDay(undefined);
                    setDayOfMonth(undefined);
                  }}
                >
                  <Text style={[styles.clearButton, { color: colors.primary }]}>
                    Clear
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Daily Category: Show only Time */}
            {category === "daily" && (
              <TouchableOpacity
                style={[
                  styles.timeButtonFull,
                  {
                    backgroundColor: colors.backgrounds.input,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => setShowTimePicker(true)}
              >
                <Ionicons name="time-outline" size={20} color={colors.text} />
                <Text style={[styles.dateText, { color: colors.text }]}>
                  {dueTime
                    ? dueTime.toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "Select Time"}
                </Text>
              </TouchableOpacity>
            )}

            {/* Weekly Category: Weekday Selector + Time */}
            {category === "weekly" && (
              <>
                <View style={styles.weekdayGrid}>
                  {[
                    "Sunday",
                    "Monday",
                    "Tuesday",
                    "Wednesday",
                    "Thursday",
                    "Friday",
                    "Saturday",
                  ].map((day, index) => (
                    <TouchableOpacity
                      key={day}
                      style={[
                        styles.weekdayButton,
                        { borderColor: colors.border },
                        weekDay === index && {
                          backgroundColor: colors.primary,
                        },
                      ]}
                      onPress={() => setWeekDay(index)}
                    >
                      <Text
                        style={[
                          styles.weekdayText,
                          {
                            color: weekDay === index ? "#fff" : colors.text,
                          },
                        ]}
                      >
                        {day}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TouchableOpacity
                  style={[
                    styles.timeButtonFull,
                    {
                      backgroundColor: colors.backgrounds.input,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => setShowTimePicker(true)}
                >
                  <Ionicons name="time-outline" size={20} color={colors.text} />
                  <Text style={[styles.dateText, { color: colors.text }]}>
                    {dueTime
                      ? dueTime.toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "Time (optional)"}
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {/* Monthly Category: Day of Month Selector + Time */}
            {category === "monthly" && (
              <>
                <View style={styles.dayGrid}>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                    <TouchableOpacity
                      key={day}
                      style={[
                        styles.dayButton,
                        { borderColor: colors.border },
                        dayOfMonth === day && {
                          backgroundColor: colors.primary,
                        },
                      ]}
                      onPress={() => setDayOfMonth(day)}
                    >
                      <Text
                        style={[
                          styles.dayText,
                          {
                            color: dayOfMonth === day ? "#fff" : colors.text,
                          },
                        ]}
                      >
                        {day}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TouchableOpacity
                  style={[
                    styles.timeButtonFull,
                    {
                      backgroundColor: colors.backgrounds.input,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => setShowTimePicker(true)}
                >
                  <Ionicons name="time-outline" size={20} color={colors.text} />
                  <Text style={[styles.dateText, { color: colors.text }]}>
                    {dueTime
                      ? dueTime.toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "Time (optional)"}
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {showDatePicker && (
              <DateTimePicker
                value={dueDate || new Date()}
                mode="date"
                onChange={(event, date) => {
                  setShowDatePicker(false);
                  if (date) setDueDate(date);
                }}
              />
            )}

            {showTimePicker && (
              <DateTimePicker
                value={dueTime || new Date()}
                mode="time"
                onChange={(event, time) => {
                  setShowTimePicker(false);
                  if (time) setDueTime(time);
                }}
              />
            )}
          </ScrollView>

          <TouchableOpacity
            style={[
              styles.updateButton,
              {
                backgroundColor: title.trim() ? colors.primary : colors.border,
              },
            ]}
            onPress={handleUpdate}
            disabled={!title.trim()}
          >
            <Text style={styles.updateButtonText}>Update Task</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
  },
  modalBody: {
    paddingHorizontal: 20,
  },
  input: {
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  textArea: {
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    marginBottom: 4,
    minHeight: 80,
    textAlignVertical: "top",
  },
  charCount: {
    fontSize: 12,
    textAlign: "right",
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  optionsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  optionButton: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
  },
  optionText: {
    fontSize: 14,
    fontWeight: "500",
  },
  dateTimeRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  dateButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
  },
  dateText: {
    fontSize: 14,
  },
  recurringSection: {
    marginBottom: 20,
  },
  recurringHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  toggleSwitch: {
    width: 48,
    height: 28,
    borderRadius: 14,
    padding: 2,
    justifyContent: "center",
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  recurringInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "rgba(0, 122, 255, 0.1)",
  },
  recurringInfoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  labelWithClear: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  clearButton: {
    fontSize: 14,
    fontWeight: "500",
  },
  weekdayGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  weekdayButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
  },
  weekdayText: {
    fontSize: 13,
    fontWeight: "500",
  },
  dayGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  dayButton: {
    width: 42,
    height: 42,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  dayText: {
    fontSize: 13,
    fontWeight: "500",
  },
  timeButtonFull: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 20,
  },
  updateButton: {
    margin: 20,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  updateButtonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "600",
  },
});

export default EditTodoModal;
