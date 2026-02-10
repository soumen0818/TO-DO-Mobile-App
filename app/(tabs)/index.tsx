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
import { useAuth } from "@/contexts/AuthContext";
import { getTodosByCategory, getTodosExpiringSoon, toggleTodo as toggleTodoFn, deleteTodo as deleteTodoFn } from "@/lib/todos";
import { Database } from "@/lib/database.types";
import { useNotifications } from "@/hooks/useNotifications";
import { useAutoDelete } from "@/hooks/useAutoDelete";
import { isInWarningWindow } from "@/utils/expirationUtils";
import useTheme from "@/hooks/useTheme";
import { Ionicons } from "@expo/vector-icons";
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

type Todo = Database['public']['Tables']['todos']['Row'];

export default function Index() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { isAutoSync, hapticsEnabled } = useSettings();
  const { cancelTodoNotifications } = useNotifications();
  
  // Auto-delete expired todos on app load
  useAutoDelete();

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

  const [rawTodos, setRawTodos] = useState<Todo[] | undefined>(undefined);
  const [expiringTodos, setExpiringTodos] = useState<Todo[] | undefined>(undefined);

  // Fetch todos by category with improved performance
  useEffect(() => {
    if (!user) return;

    const fetchTodos = async () => {
      try {
        const category = selectedCategory === "others" ? undefined : selectedCategory;
        const todos = await getTodosByCategory(user.id, category);
        setRawTodos(todos);
        
        // Update cache immediately for instant display
        setCategoryCache((prev) => ({
          ...prev,
          [selectedCategory]: todos,
        }));
      } catch (error) {
        console.error('Error fetching todos:', error);
      }
    };

    fetchTodos();
  }, [user, selectedCategory]);

  // Fetch expiring todos
  useEffect(() => {
    if (!user) return;

    const fetchExpiringTodos = async () => {
      try {
        const todos = await getTodosExpiringSoon(user.id);
        setExpiringTodos(todos);
      } catch (error) {
        console.error('Error fetching expiring todos:', error);
      }
    };

    fetchExpiringTodos();
  }, [user]);

  // Prefetch adjacent categories for instant switching
  useEffect(() => {
    if (!user || !isAutoSync) return;

    const categories: ("daily" | "weekly" | "monthly" | "others")[] = [
      "daily",
      "weekly",
      "monthly",
      "others",
    ];
    const currentIndex = categories.indexOf(selectedCategory);

    // Prefetch next and previous categories
    const prefetchCategories = [
      categories[currentIndex - 1],
      categories[currentIndex + 1],
    ].filter(Boolean);

    prefetchCategories.forEach(async (cat) => {
      // Only prefetch if not already cached and different from current
      if (!categoryCache[cat] && cat !== selectedCategory) {
        try {
          const category = cat === "others" ? undefined : cat;
          const todos = await getTodosByCategory(user.id, category);
          setCategoryCache((prev) => ({
            ...prev,
            [cat]: todos,
          }));
        } catch (error) {
          // Silent fail for prefetching
          console.debug(`Prefetch ${cat} skipped:`, error);
        }
      }
    });
  }, [user, selectedCategory, isAutoSync, categoryCache]);

  // Memoized set of expiring todo IDs for quick lookup
  const expiringTodoIds = useMemo(() => {
    if (!expiringTodos) return new Set<string>();
    return new Set(expiringTodos.map((todo) => todo.id));
  }, [expiringTodos]);

  // Also check todos directly for expiring status (in case expiring list is stale)
  const isExpiring = useCallback((todo: Todo) => {
    return expiringTodoIds.has(todo.id) || isInWarningWindow(todo);
  }, [expiringTodoIds]);

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

  const isLoading =
    rawTodos === undefined && !user && !categoryCache[selectedCategory];

  // Detect when category is loading (has cache but waiting for fresh data)
  const isLoadingFreshData =
    rawTodos === undefined && categoryCache[selectedCategory] !== undefined;

  // Update per-category cache when data arrives (minimal delay)
  useEffect(() => {
    if (rawTodos !== undefined) {
      // Quick fade-in when data arrives
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 80,
        useNativeDriver: true,
      }).start();
    }
  }, [rawTodos, fadeAnim]);

  // Handle category change with instant transition
  const handleCategoryChange = useCallback(
    (category: typeof selectedCategory) => {
      if (category === selectedCategory) return;

      if (hapticsEnabled)
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Instant category switch - no animation delay
      setSelectedCategory(category);
      
      // If we have cached data, set opacity immediately
      if (categoryCache[category]) {
        fadeAnim.setValue(1);
      } else {
        // Only fade if loading fresh data
        fadeAnim.setValue(0.6);
      }
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

    // Check limits for all categories
    const limits = { daily: 30, weekly: 20, monthly: 30, others: 50 };
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

    setShowAddModal(true);
  };

  const handleToggleTodo = async (id: string) => {
    if (!user || !rawTodos) return;

    // Find the todo to check if it's being completed
    const todo = rawTodos.find((t) => t.id === id);
    const isBeingCompleted = todo && !todo.is_completed;

    // Optimistic update: immediately update local state
    const updatedTodos = rawTodos.map((todo) =>
      todo.id === id
        ? { ...todo, is_completed: !todo.is_completed, completed_at: todo.completed_at ? null : new Date().toISOString() }
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
      await toggleTodoFn(id, user.id);

      // If todo is being completed, cancel its notifications
      if (isBeingCompleted) {
        await cancelTodoNotifications(id);
      }

      // Refetch to get updated data from server
      const category = selectedCategory === "others" ? undefined : selectedCategory;
      const todos = await getTodosByCategory(user.id, category);
      setRawTodos(todos);
      
      // Update cache immediately
      setCategoryCache((prev) => ({
        ...prev,
        [selectedCategory]: todos,
      }));

      // Reset optimistic state now that we have fresh data
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

  const handleDeleteTodo = async (id: string) => {
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
              setCachedTodos(cachedTodos.filter((todo) => todo.id !== id));
            }
            try {
              await deleteTodoFn(id, user.id);

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
    const isExpiringSoon = isExpiring(item);

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
            onPress={() => handleToggleTodo(item.id)}
          >
            {item.is_completed ? (
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
                  item.is_completed && homeStyles.todoTextCompleted,
                ]}
                numberOfLines={2}
              >
                {item.title}
              </Text>

              {/* Completed Badge */}
              {item.is_completed && (
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
              {isExpiringSoon && !item.is_completed && (
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
                    item.is_completed && homeStyles.todoDescriptionCompleted,
                  ]}
                  numberOfLines={2}
                  ellipsizeMode="tail"
                >
                  {item.description}
                </Text>
              )}

              {/* Due Date & Time */}
              {(item.due_date || item.due_time) && (
                <View style={homeStyles.todoMetaRow}>
                  {item.due_date && (
                    <View style={homeStyles.metaItem}>
                      <Ionicons
                        name="calendar-outline"
                        size={14}
                        color={
                          item.is_completed ? colors.textMuted : colors.primary
                        }
                      />
                      <Text
                        style={[
                          homeStyles.metaText,
                          !item.is_completed && { color: colors.text },
                        ]}
                      >
                        {new Date(item.due_date).toLocaleDateString()}
                      </Text>
                    </View>
                  )}
                  {item.due_time && (
                    <View style={homeStyles.metaItem}>
                      <Ionicons
                        name="time-outline"
                        size={14}
                        color={
                          item.is_completed ? colors.textMuted : colors.primary
                        }
                      />
                      <Text
                        style={[
                          homeStyles.metaText,
                          !item.is_completed && { color: colors.text },
                        ]}
                      >
                        {item.due_time}
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          </TouchableOpacity>

          {/* Priority Badge - Top Right */}
          {!item.is_completed && item.priority && (
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
              onPress={() => handleDeleteTodo(item.id)}
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
            keyExtractor={(item) => item.id}
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
              // Immediate cache update - no delay
              if (!isAutoSync && rawTodos) {
                setCachedTodos(rawTodos);
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
            // Show success toast
            if (hapticsEnabled)
              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success,
              );
            setToastConfig({
              visible: true,
              message: "Todo updated successfully",
              type: "success",
            });
            // Immediate cache update - no delay
            if (!isAutoSync && rawTodos) {
              setCachedTodos(rawTodos);
            }
            // Reset optimistic state to force refetch
            setOptimisticTodos(undefined);
            setRawTodos(undefined);
          }}
        />

        {/* Todo Detail Modal */}
        <TodoDetailModal
          visible={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          todo={detailTodo}
          isExpiringSoon={detailTodo ? isExpiring(detailTodo) : false}
          hoursUntilDeletion={undefined}
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
