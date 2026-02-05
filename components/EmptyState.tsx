import { createHomeStyles } from "@/assets/styles/home.styles";
import useTheme from "@/hooks/useTheme";
import { LinearGradient } from "expo-linear-gradient";
import { Image, Text, View } from "react-native";

interface EmptyStateProps {
  category?: "daily" | "weekly" | "monthly" | "others";
}

const EmptyState = ({ category = "others" }: EmptyStateProps) => {
  const { colors } = useTheme();

  const homeStyles = createHomeStyles(colors);

  const getContextualMessage = () => {
    switch (category) {
      case "daily":
        return {
          title: "No daily tasks yet!",
          subtitle: "Add tasks you need to complete today",
          tips: "💡 Tip: Daily tasks are perfect for routines and habits",
        };
      case "weekly":
        return {
          title: "No weekly tasks yet!",
          subtitle: "Plan tasks for specific days of the week",
          tips: "💡 Tip: Great for recurring weekly activities",
        };
      case "monthly":
        return {
          title: "No monthly tasks yet!",
          subtitle: "Schedule tasks for specific days of the month",
          tips: "💡 Tip: Perfect for bills, appointments, and reminders",
        };
      case "others":
      default:
        return {
          title: "No other tasks yet!",
          subtitle: "Add one-time tasks or special reminders",
          tips: "💡 Tip: Tasks without category auto-delete after 24hrs if no date is set",
        };
    }
  };

  const message = getContextualMessage();

  return (
    <View style={homeStyles.emptyContainer}>
      <LinearGradient
        colors={colors.gradients.empty}
        style={homeStyles.emptyIconContainer}
      >
        <Image
          source={require("@/assets/images/todo-app-logo.png")}
          style={homeStyles.emptyLogoImage}
          resizeMode="contain"
        />
      </LinearGradient>
      <Text style={homeStyles.emptyText}>{message.title}</Text>
      <Text style={homeStyles.emptySubtext}>{message.subtitle}</Text>
      <Text style={[homeStyles.emptySubtext, { marginTop: 12, opacity: 0.7, fontSize: 13 }]}>
        {message.tips}
      </Text>
    </View>
  );
};
export default EmptyState;
