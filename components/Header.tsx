import { createHomeStyles } from "@/assets/styles/home.styles";
import { api } from "@/convex/_generated/api";
import useTheme from "@/hooks/useTheme";
import { useUser } from "@clerk/clerk-expo";
import { useQuery } from "convex/react";
import { LinearGradient } from "expo-linear-gradient";
import { Image, Text, View } from "react-native";

const Header = () => {
  const { colors } = useTheme();
  const { user } = useUser();

  const homeStyles = createHomeStyles(colors);

  // Get user from Convex database
  const convexUser = useQuery(
    api.users.getUserByClerkId,
    user ? { clerkId: user.id } : "skip",
  );

  const todos = useQuery(
    api.todos.getTodos,
    user ? { userId: user.id } : "skip",
  );

  const completedCount = todos
    ? todos.filter((todo) => todo.isCompleted).length
    : 0;
  const totalCount = todos ? todos.length : 0;
  const progressPercentage =
    totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const displayName = convexUser?.name || user?.fullName || "User";

  return (
    <View style={homeStyles.header}>
      <View style={homeStyles.titleContainer}>
        <Image
          source={require("@/assets/images/todo-app-logo.png")}
          style={homeStyles.logoImage}
          resizeMode="cover"
        />

        <View style={homeStyles.titleTextContainer}>
          <Text style={homeStyles.title}>{displayName}</Text>
          <Text style={homeStyles.subtitle}>
            {completedCount} of {totalCount} completed
          </Text>
        </View>
      </View>

      <View style={homeStyles.progressContainer}>
        <View style={homeStyles.progressBarContainer}>
          <View style={homeStyles.progressBar}>
            <LinearGradient
              colors={colors.gradients.success}
              style={[
                homeStyles.progressFill,
                { width: `${progressPercentage}%` },
              ]}
            />
          </View>
          <Text style={homeStyles.progressText}>
            {Math.round(progressPercentage)}%
          </Text>
        </View>
      </View>
    </View>
  );
};

export default Header;
