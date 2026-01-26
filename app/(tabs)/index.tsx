import { createHomeStyles } from "@/assets/styles/home.styles";
import EditTodoModal from "@/components/EditTodoModal";
import EmptyState from "@/components/EmptyState";
import ExpirationNotice from "@/components/ExpirationNotice";
import Header from "@/components/Header";
import LoadingSpinner from "@/components/LoadingSpinner";
import TodoInput from "@/components/Todoinput";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import useTheme from "@/hooks/useTheme";
import { useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "convex/react";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import {
  Alert,
  FlatList,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Todo = Doc<"todos">;

export default function Index() {
  const { colors } = useTheme();
  const { user } = useUser();

  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<
    "daily" | "weekly" | "monthly"
  >("daily");
  const [showAddModal, setShowAddModal] = useState(false);

  const homeStyles = createHomeStyles(colors);

  const todos = useQuery(
    api.todos.getTodosByCategory,
    user ? { userId: user.id, category: selectedCategory } : "skip",
  );
  const toggleTodo = useMutation(api.todos.toggleTodo);
  const deleteTodo = useMutation(api.todos.deleteTodo);

  const isLoading = todos === undefined;

  if (isLoading) return <LoadingSpinner />;

  const handleOpenAddModal = () => {
    const limits = { daily: 10, weekly: 20, monthly: 30 };
    const currentLimit = limits[selectedCategory];
    const currentCount = todos?.length || 0;

    if (currentCount >= currentLimit) {
      Alert.alert(
        "Limit Reached",
        `You have reached the maximum of ${currentLimit} todos for ${selectedCategory} category. Please delete some todos first.`,
        [{ text: "OK" }],
      );
      return;
    }

    setShowAddModal(true);
  };

  const handleToggleTodo = async (id: Id<"todos">) => {
    if (!user) return;
    try {
      await toggleTodo({ id, userId: user.id });
    } catch (error) {
      console.log("Error toggling todo", error);
      Alert.alert("Error", "Failed to toggle todo");
    }
  };

  const handleDeleteTodo = async (id: Id<"todos">) => {
    if (!user) return;
    Alert.alert("Delete Todo", "Are you sure you want to delete this todo?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deleteTodo({ id, userId: user.id }),
      },
    ]);
  };

  const handleEditTodo = (todo: Todo) => {
    setEditingTodo(todo);
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingTodo(null);
  };

  const renderTodoItem = ({ item }: { item: Todo }) => {
    return (
      <View style={homeStyles.todoItemWrapper}>
        <LinearGradient
          colors={colors.gradients.surface}
          style={homeStyles.todoItem}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <TouchableOpacity
            style={homeStyles.checkbox}
            activeOpacity={0.7}
            onPress={() => handleToggleTodo(item._id)}
          >
            {item.isCompleted ? (
              <LinearGradient
                colors={colors.gradients.success}
                style={homeStyles.checkboxInner}
              >
                <Ionicons name="checkmark" size={18} color="#fff" />
              </LinearGradient>
            ) : (
              <View
                style={[
                  homeStyles.checkboxInner,
                  {
                    borderWidth: 2.5,
                    borderColor: colors.textMuted,
                    backgroundColor: colors.surface,
                  },
                ]}
              />
            )}
          </TouchableOpacity>

          <View style={homeStyles.todoContentWrapper}>
            <View style={homeStyles.todoTextContainer}>
              <View style={homeStyles.todoHeader}>
                <Text
                  style={[
                    homeStyles.todoText,
                    item.isCompleted && homeStyles.todoTextCompleted,
                  ]}
                >
                  {item.title}
                </Text>

                {/* Priority Badge */}
                {!item.isCompleted && (
                  <View
                    style={[
                      homeStyles.priorityBadge,
                      item.priority === "high" && homeStyles.priorityHigh,
                      item.priority === "medium" && homeStyles.priorityMedium,
                      item.priority === "low" && homeStyles.priorityLow,
                    ]}
                  >
                    <Text style={homeStyles.priorityText}>
                      {item.priority.toUpperCase()}
                    </Text>
                  </View>
                )}
              </View>

              {/* Completed Badge */}
              {item.isCompleted && (
                <View style={homeStyles.completedBadgeContainer}>
                  <LinearGradient
                    colors={colors.gradients.success}
                    style={homeStyles.completedBadge}
                  >
                    <Ionicons name="checkmark-circle" size={16} color="#fff" />
                    <Text style={homeStyles.completedText}>Completed</Text>
                  </LinearGradient>
                </View>
              )}

              {/* Description */}
              {item.description && (
                <Text
                  style={[
                    homeStyles.todoDescription,
                    item.isCompleted && homeStyles.todoDescriptionCompleted,
                  ]}
                  numberOfLines={2}
                  ellipsizeMode="tail"
                >
                  {item.description}
                </Text>
              )}

              {/* Due Date & Time */}
              {(item.dueDate || item.dueTime) && (
                <View style={homeStyles.todoMetaRow}>
                  {item.dueDate && (
                    <View style={homeStyles.metaItem}>
                      <Ionicons
                        name="calendar-outline"
                        size={14}
                        color={
                          item.isCompleted ? colors.textMuted : colors.primary
                        }
                      />
                      <Text
                        style={[
                          homeStyles.metaText,
                          !item.isCompleted && { color: colors.text },
                        ]}
                      >
                        {new Date(item.dueDate).toLocaleDateString()}
                      </Text>
                    </View>
                  )}
                  {item.dueTime && (
                    <View style={homeStyles.metaItem}>
                      <Ionicons
                        name="time-outline"
                        size={14}
                        color={
                          item.isCompleted ? colors.textMuted : colors.primary
                        }
                      />
                      <Text
                        style={[
                          homeStyles.metaText,
                          !item.isCompleted && { color: colors.text },
                        ]}
                      >
                        {item.dueTime}
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>

            {/* Action Buttons - Column Layout on Right */}
            <View style={homeStyles.todoActionsColumn}>
              <TouchableOpacity
                onPress={() => handleEditTodo(item)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={colors.gradients.warning}
                  style={homeStyles.actionButton}
                >
                  <Ionicons name="pencil" size={16} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleDeleteTodo(item._id)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={colors.gradients.danger}
                  style={homeStyles.actionButton}
                >
                  <Ionicons name="trash" size={16} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      </View>
    );
  };

  return (
    <LinearGradient
      colors={colors.gradients.background}
      style={homeStyles.container}
    >
      <StatusBar barStyle={colors.statusBarStyle} />
      <SafeAreaView style={homeStyles.safeArea}>
        <Header />

        {/* Category Tabs */}
        <View style={homeStyles.categoryContainer}>
          {(["daily", "weekly", "monthly"] as const).map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                homeStyles.categoryTab,
                selectedCategory === category && homeStyles.categoryTabActive,
              ]}
              onPress={() => setSelectedCategory(category)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  homeStyles.categoryTabText,
                  selectedCategory === category &&
                    homeStyles.categoryTabTextActive,
                ]}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Expiration Notice */}
        <ExpirationNotice />

        <FlatList
          data={todos}
          renderItem={renderTodoItem}
          keyExtractor={(item) => item._id}
          style={homeStyles.todoList}
          contentContainerStyle={homeStyles.todoListContent}
          ListEmptyComponent={<EmptyState />}
          // showsVerticalScrollIndicator={false}
        />

        {/* Floating Action Button */}
        <TouchableOpacity
          style={homeStyles.fab}
          onPress={handleOpenAddModal}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={colors.gradients.primary}
            style={homeStyles.fabGradient}
          >
            <Ionicons name="add" size={28} color="#ffffff" />
          </LinearGradient>
        </TouchableOpacity>

        {/* Add Task Modal */}
        {showAddModal && (
          <TodoInput
            visible={showAddModal}
            onClose={() => setShowAddModal(false)}
            defaultCategory={selectedCategory}
            currentCount={todos?.length || 0}
          />
        )}

        {/* Edit Task Modal */}
        <EditTodoModal
          visible={showEditModal}
          onClose={handleCloseEditModal}
          todo={editingTodo}
        />
      </SafeAreaView>
    </LinearGradient>
  );
}
