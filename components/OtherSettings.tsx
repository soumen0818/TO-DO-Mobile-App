import { createSettingsStyles } from "@/assets/styles/settings.styles";
import CustomAlert from "@/components/CustomAlert";
import FeedbackModal from "@/components/FeedbackModal";
import { api } from "@/convex/_generated/api";
import useTheme from "@/hooks/useTheme";
import { useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "convex/react";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";

const OtherSettings = () => {
  const { colors } = useTheme();
  const { user } = useUser();
  const settingsStyles = createSettingsStyles(colors);

  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: "",
    message: "",
    buttons: [] as any[],
    type: "info" as "info" | "warning" | "error" | "success",
  });
  const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);

  const clearAllTodos = useMutation(api.todos.clearAllTodos);

  const handleFeedback = () => {
    setFeedbackModalVisible(true);
  };

  const handleTerms = () => {
    setAlertConfig({
      visible: true,
      title: "Terms & Conditions",
      message:
        "By using Zenith Task, you agree to our terms of service. Your data is securely stored and synced across devices. We respect your privacy and never share your information with third parties.",
      buttons: [
        {
          text: "Got it",
          style: "default",
          onPress: () => setAlertConfig((prev) => ({ ...prev, visible: false })),
        },
      ],
      type: "info",
    });
  };

  const handlePrivacy = () => {
    setAlertConfig({
      visible: true,
      title: "Privacy Policy",
      message:
        "Your privacy matters to us. We collect minimal data necessary for app functionality. All your tasks are encrypted and stored securely. You have full control over your data and can delete it anytime.",
      buttons: [
        {
          text: "Understood",
          style: "default",
          onPress: () => setAlertConfig((prev) => ({ ...prev, visible: false })),
        },
      ],
      type: "info",
    });
  };

  const handleResetApp = async () => {
    setAlertConfig({
      visible: true,
      title: "Reset App",
      message:
        "This will permanently delete ALL your todos. This action cannot be undone. Are you sure?",
      buttons: [
        {
          text: "Cancel",
          style: "cancel",
          onPress: () => setAlertConfig((prev) => ({ ...prev, visible: false })),
        },
        {
          text: "Delete All",
          style: "destructive",
          onPress: async () => {
            if (!user) return;
            try {
              const result = await clearAllTodos({ userId: user.id });
              setAlertConfig({
                visible: true,
                title: "App Reset Complete",
                message: `Successfully deleted ${result.deletedCount} todo${result.deletedCount === 1 ? "" : "s"}. Your app has been reset.`,
                buttons: [
                  {
                    text: "OK",
                    style: "default",
                    onPress: () =>
                      setAlertConfig((prev) => ({ ...prev, visible: false })),
                  },
                ],
                type: "success",
              });
            } catch (err) {
              console.error("Error resetting app:", err);
              setAlertConfig({
                visible: true,
                title: "Error",
                message: "Failed to reset app. Please try again.",
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

  const handleAbout = () => {
    setAlertConfig({
      visible: true,
      title: "About Zenith Task",
      message:
        "Version 1.0.0\n\nA modern, feature-rich todo application built with React Native and Expo. Stay organized and boost your productivity.\n\nDeveloped with ❤️ by Soumen",
      buttons: [
        {
          text: "Close",
          style: "default",
          onPress: () => setAlertConfig((prev) => ({ ...prev, visible: false })),
        },
      ],
      type: "info",
    });
  };

  return (
    <>
      <LinearGradient
        colors={colors.gradients.surface}
        style={settingsStyles.section}
      >
        <Text style={settingsStyles.sectionTitle}>More</Text>

        {/* Feedback */}
        <TouchableOpacity
          style={settingsStyles.actionButton}
          onPress={handleFeedback}
          activeOpacity={0.7}
        >
          <View style={settingsStyles.actionLeft}>
            <LinearGradient
              colors={colors.gradients.primary}
              style={settingsStyles.actionIcon}
            >
              <Ionicons name="chatbubble-ellipses" size={18} color="#ffffff" />
            </LinearGradient>
            <Text style={settingsStyles.actionText}>Send Feedback</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </TouchableOpacity>

        {/* Privacy Policy */}
        <TouchableOpacity
          style={settingsStyles.actionButton}
          onPress={handlePrivacy}
          activeOpacity={0.7}
        >
          <View style={settingsStyles.actionLeft}>
            <LinearGradient
              colors={colors.gradients.success}
              style={settingsStyles.actionIcon}
            >
              <Ionicons name="shield-checkmark" size={18} color="#ffffff" />
            </LinearGradient>
            <Text style={settingsStyles.actionText}>Privacy Policy</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </TouchableOpacity>

        {/* Terms & Conditions */}
        <TouchableOpacity
          style={settingsStyles.actionButton}
          onPress={handleTerms}
          activeOpacity={0.7}
        >
          <View style={settingsStyles.actionLeft}>
            <LinearGradient
              colors={colors.gradients.warning}
              style={settingsStyles.actionIcon}
            >
              <Ionicons name="document-text" size={18} color="#ffffff" />
            </LinearGradient>
            <Text style={settingsStyles.actionText}>Terms & Conditions</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </TouchableOpacity>

        {/* About */}
        <TouchableOpacity
          style={settingsStyles.actionButton}
          onPress={handleAbout}
          activeOpacity={0.7}
        >
          <View style={settingsStyles.actionLeft}>
            <LinearGradient
              colors={colors.gradients.primary}
              style={settingsStyles.actionIcon}
            >
              <Ionicons name="information-circle" size={18} color="#ffffff" />
            </LinearGradient>
            <Text style={settingsStyles.actionText}>About</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </TouchableOpacity>

        {/* Reset App (Danger Zone) */}
        <TouchableOpacity
          style={[settingsStyles.actionButton, { borderBottomWidth: 0 }]}
          onPress={handleResetApp}
          activeOpacity={0.7}
        >
          <View style={settingsStyles.actionLeft}>
            <LinearGradient
              colors={colors.gradients.danger}
              style={settingsStyles.actionIcon}
            >
              <Ionicons name="trash" size={18} color="#ffffff" />
            </LinearGradient>
            <Text style={settingsStyles.actionTextDanger}>Reset App</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </TouchableOpacity>
      </LinearGradient>

      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        type={alertConfig.type}
      />

      <FeedbackModal
        visible={feedbackModalVisible}
        onClose={() => setFeedbackModalVisible(false)}
      />
    </>
  );
};

export default OtherSettings;
