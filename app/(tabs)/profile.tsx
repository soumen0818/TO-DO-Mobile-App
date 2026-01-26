import { createSettingsStyles } from "@/assets/styles/settings.styles";
import { api } from "@/convex/_generated/api";
import useTheme from "@/hooks/useTheme";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
    Alert,
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

  const stats = useQuery(
    api.todos.getUserStats,
    user ? { userId: user.id } : "skip",
  );

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          try {
            await signOut();
            router.replace("/sign-in");
          } catch (error) {
            console.error("Error signing out:", error);
            Alert.alert("Error", "Failed to sign out. Please try again.");
          }
        },
      },
    ]);
  };

  return (
    <LinearGradient
      colors={colors.gradients.background}
      style={settingsStyles.container}
    >
      <SafeAreaView style={settingsStyles.safeArea}>
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
          {/* User Info Card */}
          <LinearGradient
            colors={colors.gradients.surface}
            style={settingsStyles.section}
          >
            <View style={{ alignItems: "center", paddingVertical: 20 }}>
              {user?.imageUrl ? (
                <Image
                  source={{ uri: user.imageUrl }}
                  style={{
                    width: 100,
                    height: 100,
                    borderRadius: 50,
                    marginBottom: 16,
                    borderWidth: 3,
                    borderColor: colors.primary,
                  }}
                />
              ) : (
                <LinearGradient
                  colors={colors.gradients.primary}
                  style={{
                    width: 100,
                    height: 100,
                    borderRadius: 50,
                    marginBottom: 16,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Ionicons name="person" size={50} color="#ffffff" />
                </LinearGradient>
              )}

              <Text
                style={{
                  fontSize: 24,
                  fontWeight: "bold",
                  color: colors.text,
                  marginBottom: 4,
                }}
              >
                {user?.fullName || user?.firstName || "User"}
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: colors.textMuted,
                }}
              >
                {user?.primaryEmailAddress?.emailAddress}
              </Text>
            </View>
          </LinearGradient>

          {/* Statistics */}
          <LinearGradient
            colors={colors.gradients.surface}
            style={settingsStyles.section}
          >
            <Text style={settingsStyles.sectionTitle}>Your Statistics</Text>

            <View style={settingsStyles.statsContainer}>
              <LinearGradient
                colors={colors.gradients.background}
                style={[
                  settingsStyles.statCard,
                  { borderLeftColor: colors.primary },
                ]}
              >
                <View style={settingsStyles.statIconContainer}>
                  <LinearGradient
                    colors={colors.gradients.primary}
                    style={settingsStyles.statIcon}
                  >
                    <Ionicons name="list" size={20} color="#fff" />
                  </LinearGradient>
                </View>
                <View>
                  <Text style={settingsStyles.statNumber}>
                    {stats?.total || 0}
                  </Text>
                  <Text style={settingsStyles.statLabel}>Total Tasks</Text>
                </View>
              </LinearGradient>

              <LinearGradient
                colors={colors.gradients.background}
                style={[
                  settingsStyles.statCard,
                  { borderLeftColor: colors.success },
                ]}
              >
                <View style={settingsStyles.statIconContainer}>
                  <LinearGradient
                    colors={colors.gradients.success}
                    style={settingsStyles.statIcon}
                  >
                    <Ionicons name="checkmark-circle" size={20} color="#fff" />
                  </LinearGradient>
                </View>
                <View>
                  <Text style={settingsStyles.statNumber}>
                    {stats?.completed || 0}
                  </Text>
                  <Text style={settingsStyles.statLabel}>Completed</Text>
                </View>
              </LinearGradient>

              <LinearGradient
                colors={colors.gradients.background}
                style={[
                  settingsStyles.statCard,
                  { borderLeftColor: colors.warning },
                ]}
              >
                <View style={settingsStyles.statIconContainer}>
                  <LinearGradient
                    colors={colors.gradients.warning}
                    style={settingsStyles.statIcon}
                  >
                    <Ionicons name="flame" size={20} color="#fff" />
                  </LinearGradient>
                </View>
                <View>
                  <Text style={settingsStyles.statNumber}>
                    {stats?.completionRate || 0}%
                  </Text>
                  <Text style={settingsStyles.statLabel}>Completion Rate</Text>
                </View>
              </LinearGradient>
            </View>
          </LinearGradient>

          {/* Category Breakdown */}
          {stats && (
            <LinearGradient
              colors={colors.gradients.surface}
              style={settingsStyles.section}
            >
              <Text style={settingsStyles.sectionTitle}>By Category</Text>
              <View style={{ gap: 12 }}>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: 12,
                    backgroundColor: colors.backgrounds.input,
                    borderRadius: 8,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <Ionicons name="today" size={20} color={colors.primary} />
                    <Text style={{ fontSize: 16, color: colors.text }}>
                      Daily
                    </Text>
                  </View>
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "bold",
                      color: colors.text,
                    }}
                  >
                    {stats.byCategory.daily}
                  </Text>
                </View>

                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: 12,
                    backgroundColor: colors.backgrounds.input,
                    borderRadius: 8,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <Ionicons
                      name="calendar"
                      size={20}
                      color={colors.success}
                    />
                    <Text style={{ fontSize: 16, color: colors.text }}>
                      Weekly
                    </Text>
                  </View>
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "bold",
                      color: colors.text,
                    }}
                  >
                    {stats.byCategory.weekly}
                  </Text>
                </View>

                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: 12,
                    backgroundColor: colors.backgrounds.input,
                    borderRadius: 8,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <Ionicons
                      name="calendar-outline"
                      size={20}
                      color={colors.warning}
                    />
                    <Text style={{ fontSize: 16, color: colors.text }}>
                      Monthly
                    </Text>
                  </View>
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "bold",
                      color: colors.text,
                    }}
                  >
                    {stats.byCategory.monthly}
                  </Text>
                </View>
              </View>
            </LinearGradient>
          )}

          {/* Actions */}
          <LinearGradient
            colors={colors.gradients.surface}
            style={settingsStyles.section}
          >
            <Text style={settingsStyles.sectionTitle}>Account</Text>

            <TouchableOpacity
              onPress={handleSignOut}
              activeOpacity={0.8}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                padding: 16,
                backgroundColor: "rgba(239, 68, 68, 0.1)",
                borderRadius: 12,
              }}
            >
              <Ionicons name="log-out" size={24} color={colors.danger} />
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
    </LinearGradient>
  );
};

export default ProfileScreen;
