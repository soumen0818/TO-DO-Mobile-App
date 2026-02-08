import { createHomeStyles } from "@/assets/styles/home.styles";
import CustomAlert from "@/components/CustomAlert";
import EditTodoModal from "@/components/EditTodoModal";
import EmptyState from "@/components/EmptyState";
import ExpirationNotice from "@/components/ExpirationNotice";
import Header from "@/components/Header";
import LoadingSpinner from "@/components/LoadingSpinner";
import Toast from "@/components/Toast";
import TodoDetailModal from "@/components/TodoDetailModal";
import TodoInput from "@/components/Todoinput";
import { useSettings } from "@/contexts/SettingsContext";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { useNotifications } from "@/hooks/useNotifications";
import useTheme from "@/hooks/useTheme";
import { useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "convex/react";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    Animated,
    FlatList,
    RefreshControl,
    StatusBar,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Type for category cache
type CategoryCache = {
  daily: Todo[] | undefined;
  weekly: Todo[] | undefined;
  monthly: Todo[] | undefined;
  others: Todo[] | undefined;
};

type Todo = Doc<"todos">;

export default function Index() {
  const { colors } = useTheme();
  const { user } = useUser();
  const { isAutoSync, hapticsEnabled } = useSettings();
  const { cancelTodoNotifications } = useNotifications();

  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<
    "daily" | "weekly" | "monthly" | "others"
  >("daily");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailTodo, setDetailTodo] = useState<Todo | null>(null);
  const [toastConfig, setToastConfig] = useState({
    visible: false,
    message: "",
    type: "success" as "success" | "error" | "info" | "warning",
  });
  const [optimisticTodos, setOptimisticTodos] = useState<Todo[] | undefined>(
    undefined,
  );
  const [cachedTodos, setCachedTodos] = useState<Todo[] | undefined>(undefined);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const lastSyncRef = useRef<boolean>(true);
  const lastCategoryRef = useRef<string>(selectedCategory);

  // Per-category cache for instant switching
  const [categoryCache, setCategoryCache] = useState<CategoryCache>({
    daily: undefined,
    weekly: undefined,
    monthly: undefined,
    others: undefined,
  });

  // Animation for smooth transitions
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    buttons: {
      text: string;
      onPress?: () => void;
      style?: "default" | "cancel" | "destructive";
    }[];
    type?: "info" | "warning" | "error" | "success";
  }>({
    visible: false,
    title: "",
    message: "",
    buttons: [],
  });

  const homeStyles = createHomeStyles(colors);

  const rawTodos = useQuery(
    api.todos.getTodosByCategory,
    user
      ? {
          userId: user.id,
          category:
            selectedCategory === "others" ? undefined : selectedCategory,
        }
      : "skip",
  );

  // Query for todos expiring soon (within 24 hours)
  const expiringTodos = useQuery(
    api.autoDelete.getTodosExpiringSoon,
    user ? { userId: user.id } : "skip",
  );

  // Memoized set of expiring todo IDs for quick lookup
  const expiringTodoIds = useMemo(() => {
    if (!expiringTodos) return new Set<string>();
    return new Set(expiringTodos.map((todo) => todo._id));
  }, [expiringTodos]);

  // Use per-category cache for instant switching, then update with fresh data
  // Priority: optimistic > raw data > category cache
  const displayTodos = useMemo(() => {
    if (optimisticTodos) return optimisticTodos;
    if (rawTodos !== undefined) return rawTodos;
    // While loading, show cached data for this category if available
    return categoryCache[selectedCategory];
  }, [optimisticTodos, rawTodos, categoryCache, selectedCategory]);

  // For autoSync OFF mode, use cachedTodos
  const todos = isAutoSync ? displayTodos : (cachedTodos ?? displayTodos);

  const toggleTodo = useMutation(api.todos.toggleTodo);
  const deleteTodo = useMutation(api.todos.deleteTodo);

  const isLoading =
    rawTodos === undefined && !user && !categoryCache[selectedCategory];

  // Detect when category is loading (has cache but waiting for fresh data)
  const isLoadingFreshData =
    rawTodos === undefined && categoryCache[selectedCategory] !== undefined;

  // Update per-category cache when data arrives
  useEffect(() => {
    if (rawTodos !== undefined) {
      setCategoryCache((prev) => ({
        ...prev,
        [selectedCategory]: rawTodos,
      }));
      // Fade-in when data arrives
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start();
    }
  }, [rawTodos, selectedCategory, fadeAnim]);

  // Handle category change with smooth transition
  const handleCategoryChange = useCallback(
    (category: typeof selectedCategory) => {
      if (category === selectedCategory) return;

      if (hapticsEnabled)
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Quick fade out
      Animated.timing(fadeAnim, {
        toValue: 0.6,
        duration: 100,
        useNativeDriver: true,
      }).start(() => {
        setSelectedCategory(category);

        // If we have cached data, fade back in quickly
        if (categoryCache[category]) {
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }).start();
        }
      });
    },
    [selectedCategory, hapticsEnabled, categoryCache, fadeAnim],
  );

  // Cache todos when autoSync is turned OFF
  useEffect(() => {
    if (!isAutoSync && lastSyncRef.current && rawTodos) {
      // Just turned off auto sync - cache current data
      setCachedTodos(rawTodos);
    }
    if (isAutoSync && !lastSyncRef.current) {
      // Just turned on auto sync - clear cache to use real-time data
      setCachedTodos(undefined);
    }
    lastSyncRef.current = isAutoSync;
  }, [isAutoSync, rawTodos]);

  // Update cache when category changes and autoSync is OFF
  useEffect(() => {
    const categoryChanged = lastCategoryRef.current !== selectedCategory;
    if (categoryChanged && !isAutoSync && rawTodos) {
      setCachedTodos(rawTodos);
    }
    lastCategoryRef.current = selectedCategory;
  }, [selectedCategory, isAutoSync, rawTodos]);

  // Reset optimistic state when data changes or category changes
  useEffect(() => {
    setOptimisticTodos(undefined);
  }, [rawTodos, selectedCategory]);

  // Pull to refresh handler
  const onRefresh = useCallback(async () => {
    if (isAutoSync) return; // No need to refresh when auto sync is ON

    setIsRefreshing(true);
    if (hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Wait a moment for new data to come through
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Update cache with latest data
    if (rawTodos) {
      setCachedTodos(rawTodos);
    }

    setIsRefreshing(false);
    setToastConfig({
      visible: true,
      message: "Synced successfully",
      type: "success",
    });
  }, [isAutoSync, rawTodos, hapticsEnabled]);

  if (isLoading) return <LoadingSpinner />;

  const handleOpenAddModal = () => {
    if (hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // No limits for "others" category
    if (selectedCategory !== "others") {
      const limits = { daily: 10, weekly: 20, monthly: 30 };
      const currentLimit = limits[selectedCategory];
      const currentCount = todos?.length || 0;

      if (currentCount >= currentLimit) {
        setAlertConfig({
          visible: true,
          title: "Limit Reached",
          message: `You have reached the maximum of ${currentLimit} todos for ${selectedCategory} category. Please delete some todos first.`,
          buttons: [
            {
              text: "OK",
              onPress: () => setAlertConfig({ ...alertConfig, visible: false }),
            },
          ],
          type: "warning",
        });
        return;
      }
    }

    setShowAddModal(true);
  };

  const handleToggleTodo = async (id: Id<"todos">) => {
    if (!user || !rawTodos) return;

    // Find the todo to check if it's being completed
    const todo = rawTodos.find((t) => t._id === id);
    const isBeingCompleted = todo && !todo.isCompleted;

    // Optimistic update: immediately update local state
    const updatedTodos = rawTodos.map((todo) =>
      todo._id === id
        ? { ...todo, completedAt: todo.completedAt ? undefined : Date.now() }
        : todo,
    );
    setOptimisticTodos(updatedTodos);

    // Also update cache if autoSync is OFF so changes persist
    if (!isAutoSync) {
      setCachedTodos(updatedTodos);
    }

    // Haptic feedback
    if (hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      await toggleTodo({ id, userId: user.id });

      // Cancel notifications when todo is completed
      if (isBeingCompleted) {
        await cancelTodoNotifications(id);
      }

      // Reset optimistic state to show actual server data
      setOptimisticTodos(undefined);
    } catch {
      // Revert optimistic update on error
      setOptimisticTodos(undefined);
      // Revert cache if autoSync is OFF
      if (!isAutoSync) {
        setCachedTodos(rawTodos);
      }
      if (hapticsEnabled)
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setToastConfig({
        visible: true,
        message: "Failed to update todo",
        type: "error",
      });
    }
  };

  const handleDeleteTodo = async (id: Id<"todos">) => {
    if (!user) return;

    // Haptic feedback for warning
    if (hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    setAlertConfig({
      visible: true,
      title: "Delete Todo",
      message: "Are you sure you want to delete this todo?",
      buttons: [
        {
          text: "Cancel",
          style: "cancel",
          onPress: () => setAlertConfig({ ...alertConfig, visible: false }),
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            // Optimistically update cache if autoSync is OFF
            if (!isAutoSync && cachedTodos) {
              setCachedTodos(cachedTodos.filter((todo) => todo._id !== id));
            }
            try {
              await deleteTodo({ id, userId: user.id });

              // Cancel all notifications for this todo
              await cancelTodoNotifications(id);

              if (hapticsEnabled)
                Haptics.notificationAsync(
                  Haptics.NotificationFeedbackType.Success,
                );
              setToastConfig({
                visible: true,
                message: "Todo deleted successfully",
                type: "success",
              });
            } catch {
              // Revert cache on error
              if (!isAutoSync && rawTodos) {
                setCachedTodos(rawTodos);
              }
              if (hapticsEnabled)
                Haptics.notificationAsync(
                  Haptics.NotificationFeedbackType.Error,
                );
              setToastConfig({
                visible: true,
                message: "Failed to delete todo",
                type: "error",
              });
            }
            setAlertConfig({ ...alertConfig, visible: false });
          },
        },
      ],
      type: "warning",
    });
  };

  const handleViewDetails = (todo: Todo) => {
    if (hapticsEnabled) Haptics.selectionAsync();
    setDetailTodo(todo);
    setShowDetailModal(true);
  };

  const handleEditTodo = (todo: Todo) => {
    if (hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditingTodo(todo);
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingTodo(null);
  };

  const renderTodoItem = ({ item }: { item: Todo }) => {
    const isExpiringSoon = expiringTodoIds.has(item._id);

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

          <TouchableOpacity
            style={homeStyles.todoContentWrapper}
            onPress={() => handleViewDetails(item)}
            activeOpacity={0.7}
          >
            <View style={homeStyles.todoTextContainer}>
              <Text
                style={[
                  homeStyles.todoText,
                  item.isCompleted && homeStyles.todoTextCompleted,
                ]}
                numberOfLines={2}
              >
                {item.title}
              </Text>

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

              {/* Expiring Soon Badge */}
              {isExpiringSoon && !item.isCompleted && (
                <View style={homeStyles.expiringBadgeContainer}>
                  <LinearGradient
                    colors={colors.gradients.warning}
                    style={homeStyles.expiringBadge}
                  >
                    <Ionicons name="time" size={14} color="#fff" />
                    <Text style={homeStyles.expiringText}>Expiring Soon</Text>
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
          </TouchableOpacity>

          {/* Priority Badge - Top Right */}
          {!item.isCompleted && item.priority && (
            <View style={homeStyles.todoRightSection}>
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
            </View>
          )}

          {/* Action Buttons - Bottom Right */}
          <View style={homeStyles.todoActionsRow}>
            <TouchableOpacity
              onPress={() => handleEditTodo(item)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={colors.gradients.warning}
                style={homeStyles.actionButton}
              >
                <Ionicons name="pencil" size={14} color="#fff" />
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
                <Ionicons name="trash" size={14} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
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
      <SafeAreaView style={homeStyles.safeArea} edges={["top"]}>
        <Header selectedCategory={selectedCategory} categoryTodos={todos} />

        {/* Category Tabs */}
        <View style={homeStyles.categoryContainer}>
          {(["daily", "weekly", "monthly", "others"] as const).map(
            (category) => (
              <TouchableOpacity
                key={category}
                style={[
                  homeStyles.categoryTab,
                  selectedCategory === category && homeStyles.categoryTabActive,
                ]}
                onPress={() => handleCategoryChange(category)}
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
            ),
          )}
        </View>

        {/* Expiration Notice */}
        <ExpirationNotice />

        {/* Loading indicator for fresh data */}
        {isLoadingFreshData && (
          <View style={{ alignItems: "center", paddingVertical: 4 }}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        )}

        <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
          <FlatList
            data={todos}
            renderItem={renderTodoItem}
            keyExtractor={(item) => item._id}
            style={homeStyles.todoList}
            contentContainerStyle={homeStyles.todoListContent}
            ListEmptyComponent={<EmptyState category={selectedCategory} />}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={onRefresh}
                colors={[colors.primary]}
                tintColor={colors.primary}
                enabled={!isAutoSync}
              />
            }
          />
        </Animated.View>

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
            defaultCategory={
              selectedCategory === "others" ? undefined : selectedCategory
            }
            currentCount={todos?.length || 0}
            onSuccess={() => {
              if (hapticsEnabled)
                Haptics.notificationAsync(
                  Haptics.NotificationFeedbackType.Success,
                );
              setToastConfig({
                visible: true,
                message: "Todo created successfully",
                type: "success",
              });
              // Update cache if autoSync is OFF
              if (!isAutoSync) {
                // Small delay to allow Convex to update rawTodos
                setTimeout(() => {
                  if (rawTodos) {
                    setCachedTodos(rawTodos);
                  }
                }, 300);
              }
            }}
          />
        )}

        {/* Edit Task Modal */}
        <EditTodoModal
          visible={showEditModal}
          onClose={handleCloseEditModal}
          todo={editingTodo}
          onSuccess={() => {
            // Update cache if autoSync is OFF
            if (!isAutoSync) {
              setTimeout(() => {
                if (rawTodos) {
                  setCachedTodos(rawTodos);
                }
              }, 300);
            }
          }}
        />

        {/* Todo Detail Modal */}
        <TodoDetailModal
          visible={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          todo={detailTodo}
          isExpiringSoon={detailTodo ? expiringTodoIds.has(detailTodo._id) : false}
          hoursUntilDeletion={detailTodo ? expiringTodos?.find(t => t._id === detailTodo._id)?.hoursUntilDeletion : undefined}
        />

        {/* Custom Alert */}
        <CustomAlert
          visible={alertConfig.visible}
          title={alertConfig.title}
          message={alertConfig.message}
          buttons={alertConfig.buttons}
          type={alertConfig.type}
        />

        {/* Toast Notifications */}
        <Toast
          visible={toastConfig.visible}
          message={toastConfig.message}
          type={toastConfig.type}
          onHide={() => setToastConfig({ ...toastConfig, visible: false })}
        />
      </SafeAreaView>
    </LinearGradient>
  );
}
