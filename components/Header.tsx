import { createHomeStyles } from "@/assets/styles/home.styles";
import { Database } from "@/lib/database.types";
import useTheme from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { LinearGradient } from "expo-linear-gradient";
import { Image, Text, View } from "react-native";

type Todo = Database['public']['Tables']['todos']['Row'];

interface HeaderProps {
  selectedCategory?: "daily" | "weekly" | "monthly" | "others";
  categoryTodos?: Todo[];
}

const Header = ({ selectedCategory, categoryTodos }: HeaderProps) => {
  const { colors } = useTheme();
  const { user } = useAuth();

  const homeStyles = createHomeStyles(colors);

  // Use category-specific todos if provided, otherwise show nothing until loaded
  const completedCount = categoryTodos
    ? categoryTodos.filter((todo) => todo.is_completed).length
    : 0;
  const totalCount = categoryTodos ? categoryTodos.length : 0;
  const progressPercentage =
    totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const displayName = user?.user_metadata?.full_name || user?.user_metadata?.name || "User";
  const categoryLabel = selectedCategory
    ? selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)
    : "All";

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
            {categoryLabel}: {completedCount} of {totalCount} completed
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
