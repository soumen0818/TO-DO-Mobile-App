import { createSettingsStyles } from "@/assets/styles/settings.styles";
import CustomAlert from "@/components/CustomAlert";
import { api } from "@/convex/_generated/api";
import useTheme from "@/hooks/useTheme";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
    Image,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const ProfileScreen = () => {
  const { colors } = useTheme();
  const { user } = useUser();
  const { signOut } = useAuth();
  const router = useRouter();
  const settingsStyles = createSettingsStyles(colors);

  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: "",
    message: "",
    buttons: [] as any[],
    type: "info" as "info" | "warning" | "error" | "success",
  });

  const stats = useQuery(
    api.todos.getUserStats,
    user ? { userId: user.id } : "skip",
  );

  const handleSignOut = () => {
    setAlertConfig({
      visible: true,
      title: "Sign Out",
      message: "Are you sure you want to sign out?",
      buttons: [
        {
          text: "Cancel",
          style: "cancel",
          onPress: () => setAlertConfig((prev) => ({ ...prev, visible: false })),
        },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            setAlertConfig((prev) => ({ ...prev, visible: false }));
            try {
              await signOut();
              router.replace("/sign-in");
            } catch (error) {
              console.error("Error signing out:", error);
              setAlertConfig({
                visible: true,
                title: "Error",
                message: "Failed to sign out. Please try again.",
                buttons: [
                  {
                    text: "OK",
                    style: "default",
                    onPress: () =>
                      setAlertConfig((prev) => ({ ...prev, visible: false })),
                  },
                ],
                type: "error",
              });
            }
          },
        },
      ],
      type: "warning",
    });
  };

  return (
    <LinearGradient
      colors={colors.gradients.background}
      style={settingsStyles.container}
    >
      <SafeAreaView style={settingsStyles.safeArea} edges={["top"]}>
        {/* HEADER */}
        <View style={settingsStyles.header}>
          <View style={settingsStyles.titleContainer}>
            <LinearGradient
              colors={colors.gradients.primary}
              style={settingsStyles.iconContainer}
            >
              <Ionicons name="person" size={28} color="#ffffff" />
            </LinearGradient>
            <Text style={settingsStyles.title}>Profile</Text>
          </View>
        </View>

        <ScrollView
          style={settingsStyles.scrollView}
          contentContainerStyle={settingsStyles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* User Info Card - Compact */}
          <LinearGradient
            colors={colors.gradients.surface}
            style={settingsStyles.section}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 16,
                gap: 16,
              }}
            >
              {user?.imageUrl ? (
                <Image
                  source={{ uri: user.imageUrl }}
                  style={{
                    width: 70,
                    height: 70,
                    borderRadius: 35,
                    borderWidth: 3,
                    borderColor: colors.primary,
                  }}
                />
              ) : (
                <LinearGradient
                  colors={colors.gradients.primary}
                  style={{
                    width: 70,
                    height: 70,
                    borderRadius: 35,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Ionicons name="person" size={35} color="#ffffff" />
                </LinearGradient>
              )}

              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 20,
                    fontWeight: "bold",
                    color: colors.text,
                    marginBottom: 4,
                  }}
                >
                  {user?.fullName || user?.firstName || "User"}
                </Text>
                <Text
                  style={{
                    fontSize: 13,
                    color: colors.textMuted,
                  }}
                  numberOfLines={1}
                >
                  {user?.primaryEmailAddress?.emailAddress}
                </Text>
              </View>
            </View>
          </LinearGradient>

          {/* Statistics - Professional Cards */}
          <LinearGradient
            colors={colors.gradients.surface}
            style={settingsStyles.section}
          >
            <Text style={settingsStyles.sectionTitle}>Statistics Overview</Text>

            <View style={{ gap: 12 }}>
              {/* Total Tasks */}
              <LinearGradient
                colors={colors.gradients.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  borderRadius: 16,
                  padding: 18,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
                  <View
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 24,
                      backgroundColor: "rgba(255, 255, 255, 0.25)",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Ionicons name="list" size={24} color="#fff" />
                  </View>
                  <View>
                    <Text
                      style={{
                        fontSize: 14,
                        color: "rgba(255, 255, 255, 0.9)",
                        marginBottom: 2,
                      }}
                    >
                      Total Tasks
                    </Text>
                    <Text
                      style={{
                        fontSize: 26,
                        fontWeight: "bold",
                        color: "#fff",
                      }}
                    >
                      {stats?.total || 0}
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={24} color="rgba(255, 255, 255, 0.6)" />
              </LinearGradient>

              {/* Row with Completed and Active */}
              <View style={{ flexDirection: "row", gap: 12 }}>
                {/* Completed */}
                <LinearGradient
                  colors={colors.gradients.success}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    flex: 1,
                    borderRadius: 16,
                    padding: 16,
                  }}
                >
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: "rgba(255, 255, 255, 0.25)",
                      justifyContent: "center",
                      alignItems: "center",
                      marginBottom: 12,
                    }}
                  >
                    <Ionicons name="checkmark-circle" size={22} color="#fff" />
                  </View>
                  <Text
                    style={{
                      fontSize: 24,
                      fontWeight: "bold",
                      color: "#fff",
                      marginBottom: 4,
                    }}
                  >
                    {stats?.completed || 0}
                  </Text>
                  <Text
                    style={{
                      fontSize: 13,
                      color: "rgba(255, 255, 255, 0.9)",
                    }}
                  >
                    Completed
                  </Text>
                </LinearGradient>

                {/* Active */}
                <LinearGradient
                  colors={colors.gradients.warning}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    flex: 1,
                    borderRadius: 16,
                    padding: 16,
                  }}
                >
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: "rgba(255, 255, 255, 0.25)",
                      justifyContent: "center",
                      alignItems: "center",
                      marginBottom: 12,
                    }}
                  >
                    <Ionicons name="time" size={22} color="#fff" />
                  </View>
                  <Text
                    style={{
                      fontSize: 24,
                      fontWeight: "bold",
                      color: "#fff",
                      marginBottom: 4,
                    }}
                  >
                    {stats?.active || 0}
                  </Text>
                  <Text
                    style={{
                      fontSize: 13,
                      color: "rgba(255, 255, 255, 0.9)",
                    }}
                  >
                    Active
                  </Text>
                </LinearGradient>
              </View>

              {/* Completion Rate */}
              <View
                style={{
                  backgroundColor: colors.backgrounds.input,
                  borderRadius: 16,
                  padding: 18,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 12,
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                    <LinearGradient
                      colors={["#FF6B6B", "#FF8E53"]}
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <Ionicons name="flame" size={22} color="#fff" />
                    </LinearGradient>
                    <Text
                      style={{
                        fontSize: 15,
                        fontWeight: "600",
                        color: colors.text,
                      }}
                    >
                      Completion Rate
                    </Text>
                  </View>
                  <Text
                    style={{
                      fontSize: 24,
                      fontWeight: "bold",
                      color: colors.text,
                    }}
                  >
                    {stats?.completionRate || 0}%
                  </Text>
                </View>
                <View
                  style={{
                    height: 8,
                    backgroundColor: colors.border,
                    borderRadius: 4,
                    overflow: "hidden",
                  }}
                >
                  <LinearGradient
                    colors={["#FF6B6B", "#FF8E53"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{
                      height: "100%",
                      width: `${stats?.completionRate || 0}%`,
                    }}
                  />
                </View>
              </View>
            </View>
          </LinearGradient>

          {/* Category Breakdown with Completion Rates */}
          {stats && (
            <LinearGradient
              colors={colors.gradients.surface}
              style={settingsStyles.section}
            >
              <Text style={settingsStyles.sectionTitle}>Category Progress</Text>
              <View style={{ gap: 14 }}>
                {/* Daily */}
                <View
                  style={{
                    paddingVertical: 14,
                    paddingHorizontal: 14,
                    backgroundColor: colors.backgrounds.input,
                    borderRadius: 12,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 8,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 10,
                      }}
                    >
                      <LinearGradient
                        colors={colors.gradients.primary}
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 16,
                          justifyContent: "center",
                          alignItems: "center",
                        }}
                      >
                        <Ionicons name="today" size={16} color="#fff" />
                      </LinearGradient>
                      <Text style={{ fontSize: 15, fontWeight: "600", color: colors.text }}>
                        Daily
                      </Text>
                    </View>
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "bold",
                        color: colors.primary,
                      }}
                    >
                      {stats.byCategoryStats.daily.completed}/{stats.byCategoryStats.daily.total} ({stats.byCategoryStats.daily.completionRate}%)
                    </Text>
                  </View>
                  <View
                    style={{
                      height: 6,
                      backgroundColor: colors.border,
                      borderRadius: 3,
                      overflow: "hidden",
                    }}
                  >
                    <LinearGradient
                      colors={colors.gradients.primary}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{
                        height: "100%",
                        width: `${stats.byCategoryStats.daily.completionRate}%`,
                      }}
                    />
                  </View>
                </View>

                {/* Weekly */}
                <View
                  style={{
                    paddingVertical: 14,
                    paddingHorizontal: 14,
                    backgroundColor: colors.backgrounds.input,
                    borderRadius: 12,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 8,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 10,
                      }}
                    >
                      <LinearGradient
                        colors={colors.gradients.success}
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 16,
                          justifyContent: "center",
                          alignItems: "center",
                        }}
                      >
                        <Ionicons name="calendar" size={16} color="#fff" />
                      </LinearGradient>
                      <Text style={{ fontSize: 15, fontWeight: "600", color: colors.text }}>
                        Weekly
                      </Text>
                    </View>
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "bold",
                        color: colors.success,
                      }}
                    >
                      {stats.byCategoryStats.weekly.completed}/{stats.byCategoryStats.weekly.total} ({stats.byCategoryStats.weekly.completionRate}%)
                    </Text>
                  </View>
                  <View
                    style={{
                      height: 6,
                      backgroundColor: colors.border,
                      borderRadius: 3,
                      overflow: "hidden",
                    }}
                  >
                    <LinearGradient
                      colors={colors.gradients.success}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{
                        height: "100%",
                        width: `${stats.byCategoryStats.weekly.completionRate}%`,
                      }}
                    />
                  </View>
                </View>

                {/* Monthly */}
                <View
                  style={{
                    paddingVertical: 14,
                    paddingHorizontal: 14,
                    backgroundColor: colors.backgrounds.input,
                    borderRadius: 12,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 8,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 10,
                      }}
                    >
                      <LinearGradient
                        colors={colors.gradients.warning}
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 16,
                          justifyContent: "center",
                          alignItems: "center",
                        }}
                      >
                        <Ionicons name="calendar-outline" size={16} color="#fff" />
                      </LinearGradient>
                      <Text style={{ fontSize: 15, fontWeight: "600", color: colors.text }}>
                        Monthly
                      </Text>
                    </View>
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "bold",
                        color: colors.warning,
                      }}
                    >
                      {stats.byCategoryStats.monthly.completed}/{stats.byCategoryStats.monthly.total} ({stats.byCategoryStats.monthly.completionRate}%)
                    </Text>
                  </View>
                  <View
                    style={{
                      height: 6,
                      backgroundColor: colors.border,
                      borderRadius: 3,
                      overflow: "hidden",
                    }}
                  >
                    <LinearGradient
                      colors={colors.gradients.warning}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{
                        height: "100%",
                        width: `${stats.byCategoryStats.monthly.completionRate}%`,
                      }}
                    />
                  </View>
                </View>

                {/* Others */}
                <View
                  style={{
                    paddingVertical: 14,
                    paddingHorizontal: 14,
                    backgroundColor: colors.backgrounds.input,
                    borderRadius: 12,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 8,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 10,
                      }}
                    >
                      <LinearGradient
                        colors={["#9CA3AF", "#6B7280"]}
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 16,
                          justifyContent: "center",
                          alignItems: "center",
                        }}
                      >
                        <Ionicons name="ellipsis-horizontal" size={16} color="#fff" />
                      </LinearGradient>
                      <Text style={{ fontSize: 15, fontWeight: "600", color: colors.text }}>
                        Others
                      </Text>
                    </View>
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "bold",
                        color: colors.textMuted,
                      }}
                    >
                      {stats.byCategoryStats.others.completed}/{stats.byCategoryStats.others.total} ({stats.byCategoryStats.others.completionRate}%)
                    </Text>
                  </View>
                  <View
                    style={{
                      height: 6,
                      backgroundColor: colors.border,
                      borderRadius: 3,
                      overflow: "hidden",
                    }}
                  >
                    <LinearGradient
                      colors={["#9CA3AF", "#6B7280"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{
                        height: "100%",
                        width: `${stats.byCategoryStats.others.completionRate}%`,
                      }}
                    />
                  </View>
                </View>
              </View>
            </LinearGradient>
          )}

          {/* Sign Out */}
          <LinearGradient
            colors={colors.gradients.surface}
            style={settingsStyles.section}
          >
            <TouchableOpacity
              onPress={handleSignOut}
              activeOpacity={0.7}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
                paddingVertical: 14,
                backgroundColor: "rgba(239, 68, 68, 0.1)",
                borderRadius: 12,
              }}
            >
              <Ionicons name="log-out" size={22} color={colors.danger} />
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: colors.danger,
                }}
              >
                Sign Out
              </Text>
            </TouchableOpacity>
          </LinearGradient>
        </ScrollView>
      </SafeAreaView>

      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        type={alertConfig.type}
      />
    </LinearGradient>
  );
};

export default ProfileScreen;
