import CustomAlert from "@/components/CustomAlert";
import { api } from "@/convex/_generated/api";
import useTheme from "@/hooks/useTheme";
import { useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "convex/react";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

interface FeedbackModalProps {
  visible: boolean;
  onClose: () => void;
}

type FeedbackType = "feature" | "bug";

const FeedbackModal = ({ visible, onClose }: FeedbackModalProps) => {
  const { colors } = useTheme();
  const { user } = useUser();

  const [feedbackType, setFeedbackType] = useState<FeedbackType>("feature");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: "",
    message: "",
    buttons: [] as {
      text: string;
      onPress?: () => void;
      style?: "default" | "cancel" | "destructive";
    }[],
    type: "info" as "info" | "warning" | "error" | "success",
  });

  const submitFeedback = useMutation(api.feedback.submitFeedback);

  const handleSubmit = async () => {
    if (!title.trim()) {
      setAlertConfig({
        visible: true,
        title: "Title Required",
        message: "Please enter a title for your feedback.",
        buttons: [
          {
            text: "OK",
            style: "default",
            onPress: () =>
              setAlertConfig((prev) => ({ ...prev, visible: false })),
          },
        ],
        type: "warning",
      });
      return;
    }

    if (!description.trim()) {
      setAlertConfig({
        visible: true,
        title: "Description Required",
        message: "Please provide a description for your feedback.",
        buttons: [
          {
            text: "OK",
            style: "default",
            onPress: () =>
              setAlertConfig((prev) => ({ ...prev, visible: false })),
          },
        ],
        type: "warning",
      });
      return;
    }

    if (!user) return;

    setIsLoading(true);
    try {
      // Submit feedback to database (email is automatically captured from Clerk)
      await submitFeedback({
        userId: user.id,
        userEmail: user.primaryEmailAddress?.emailAddress || "",
        userName: user.fullName || user.firstName || undefined,
        type: feedbackType,
        title: title.trim(),
        description: description.trim(),
      });

      // Reset form
      setTitle("");
      setDescription("");
      setFeedbackType("feature");

      // Show success message
      setAlertConfig({
        visible: true,
        title: "Thank You! 🎉",
        message: "Your feedback has been submitted successfully. We appreciate you taking the time to help us improve Zenith Task!",
        buttons: [
          {
            text: "Done",
            style: "default",
            onPress: () => {
              setAlertConfig((prev) => ({ ...prev, visible: false }));
              onClose();
            },
          },
        ],
        type: "success",
      });
    } catch (error) {
      console.error("Error submitting feedback:", error);
      setAlertConfig({
        visible: true,
        title: "Error",
        message: "Failed to submit feedback. Please try again.",
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
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    Keyboard.dismiss();
    setTitle("");
    setDescription("");
    setFeedbackType("feature");
    onClose();
  };

  const styles = createStyles(colors);

  return (
    <>
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={handleClose}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.keyboardView}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.overlay}>
              <View style={styles.modalContainer}>
                <LinearGradient
                  colors={colors.gradients.surface}
                  style={styles.modalContent}
                >
                  {/* Header */}
                  <View style={styles.header}>
                    <View style={styles.headerLeft}>
                      <LinearGradient
                        colors={colors.gradients.primary}
                        style={styles.headerIcon}
                      >
                        <Ionicons
                          name="chatbubble-ellipses"
                          size={20}
                          color="#fff"
                        />
                      </LinearGradient>
                      <Text style={styles.headerTitle}>Send Feedback</Text>
                    </View>
                    <TouchableOpacity
                      onPress={handleClose}
                      style={styles.closeButton}
                    >
                      <Ionicons name="close" size={24} color={colors.textMuted} />
                    </TouchableOpacity>
                  </View>

                  <ScrollView
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                  >
                    {/* Feedback Type Toggle */}
                    <View style={styles.typeContainer}>
                      <Text style={styles.label}>What type of feedback?</Text>
                      <View style={styles.toggleContainer}>
                        <TouchableOpacity
                        style={[
                          styles.toggleButton,
                          feedbackType === "feature" &&
                            styles.toggleButtonActive,
                        ]}
                        onPress={() => setFeedbackType("feature")}
                        activeOpacity={0.8}
                      >
                        {feedbackType === "feature" ? (
                          <LinearGradient
                            colors={colors.gradients.primary}
                            style={styles.toggleGradient}
                          >
                            <Ionicons name="bulb" size={22} color="#fff" />
                            <Text style={styles.toggleTextActive}>
                              Feature Request
                            </Text>
                          </LinearGradient>
                        ) : (
                          <View style={styles.toggleInner}>
                            <Ionicons
                              name="bulb-outline"
                              size={22}
                              color={colors.textMuted}
                            />
                            <Text style={styles.toggleText}>
                              Feature Request
                            </Text>
                          </View>
                        )}
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.toggleButton,
                          feedbackType === "bug" && styles.toggleButtonActive,
                        ]}
                        onPress={() => setFeedbackType("bug")}
                        activeOpacity={0.8}
                      >
                        {feedbackType === "bug" ? (
                          <LinearGradient
                            colors={colors.gradients.danger}
                            style={styles.toggleGradient}
                          >
                            <Ionicons name="bug" size={22} color="#fff" />
                            <Text style={styles.toggleTextActive}>
                              Bug Report
                            </Text>
                          </LinearGradient>
                        ) : (
                          <View style={styles.toggleInner}>
                            <Ionicons
                              name="bug-outline"
                              size={22}
                              color={colors.textMuted}
                            />
                            <Text style={styles.toggleText}>Bug Report</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Title Input */}
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>
                      Title <Text style={styles.requiredStar}>*</Text>
                    </Text>
                    <TextInput
                      style={styles.input}
                      placeholder={
                        feedbackType === "feature"
                          ? "Brief description of your feature idea..."
                          : "Brief description of the bug..."
                      }
                      placeholderTextColor={colors.textMuted}
                      value={title}
                      onChangeText={setTitle}
                      maxLength={100}
                    />
                    <Text style={styles.charCount}>{title.length}/100</Text>
                  </View>

                  {/* Description Input */}
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>
                      Description <Text style={styles.requiredStar}>*</Text>
                    </Text>
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      placeholder={
                        feedbackType === "feature"
                          ? "Tell us more about your feature request. How would it help you be more productive?"
                          : "Please describe what happened, steps to reproduce, and what you expected to happen..."
                      }
                      placeholderTextColor={colors.textMuted}
                      value={description}
                      onChangeText={setDescription}
                      multiline
                      numberOfLines={5}
                      textAlignVertical="top"
                      maxLength={1000}
                    />
                    <Text style={styles.charCount}>
                      {description.length}/1000
                    </Text>
                  </View>

                  {/* Info Banner */}
                  <View style={styles.infoBanner}>
                    <Ionicons
                      name="person-circle-outline"
                      size={18}
                      color={colors.primary}
                    />
                    <Text style={styles.infoText}>
                      Submitting as {user?.primaryEmailAddress?.emailAddress || "user"}
                    </Text>
                  </View>

                  {/* Submit Button */}
                  <TouchableOpacity
                    style={styles.submitButton}
                    onPress={handleSubmit}
                    disabled={isLoading}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={
                        isLoading
                          ? [colors.border, colors.border]
                          : colors.gradients.primary
                      }
                      style={styles.submitGradient}
                    >
                      {isLoading ? (
                        <>
                          <ActivityIndicator color="#fff" size="small" />
                          <Text style={styles.submitText}>Sending...</Text>
                        </>
                      ) : (
                        <>
                          <Ionicons name="send" size={20} color="#fff" />
                          <Text style={styles.submitText}>Send Feedback</Text>
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                  </ScrollView>
                </LinearGradient>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>

      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        type={alertConfig.type}
      />
    </>
  );
};

const createStyles = (colors: any) =>
  StyleSheet.create({
    keyboardView: {
      flex: 1,
    },
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.6)",
      justifyContent: "flex-end",
    },
    modalContainer: {
      maxHeight: "90%",
    },
    modalContent: {
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      padding: 24,
      paddingBottom: 40,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 28,
    },
    headerLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    headerIcon: {
      width: 40,
      height: 40,
      borderRadius: 12,
      justifyContent: "center",
      alignItems: "center",
    },
    headerTitle: {
      fontSize: 22,
      fontWeight: "700",
      color: colors.text,
      letterSpacing: -0.5,
    },
    closeButton: {
      padding: 8,
      marginRight: -8,
    },
    typeContainer: {
      marginBottom: 24,
    },
    label: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 12,
    },
    requiredStar: {
      color: colors.danger || "#FF3B30",
      fontWeight: "700",
    },
    toggleContainer: {
      flexDirection: "row",
      gap: 12,
    },
    toggleButton: {
      flex: 1,
      borderRadius: 14,
      overflow: "hidden",
      borderWidth: 1.5,
      borderColor: colors.border,
    },
    toggleButtonActive: {
      borderColor: "transparent",
    },
    toggleGradient: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 16,
      gap: 8,
    },
    toggleInner: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 16,
      gap: 8,
      backgroundColor: colors.surfaceLight,
    },
    toggleText: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.textMuted,
    },
    toggleTextActive: {
      fontSize: 14,
      fontWeight: "700",
      color: "#fff",
    },
    inputContainer: {
      marginBottom: 20,
    },
    input: {
      backgroundColor: colors.surfaceLight,
      borderRadius: 14,
      paddingHorizontal: 16,
      paddingVertical: 14,
      fontSize: 16,
      color: colors.text,
      borderWidth: 1.5,
      borderColor: colors.border,
    },
    textArea: {
      minHeight: 140,
      paddingTop: 14,
    },
    charCount: {
      fontSize: 12,
      color: colors.textMuted,
      textAlign: "right",
      marginTop: 8,
    },
    infoBanner: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: `${colors.primary}15`,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 12,
      gap: 10,
      marginBottom: 24,
    },
    infoText: {
      flex: 1,
      fontSize: 13,
      color: colors.primary,
      fontWeight: "500",
    },
    submitButton: {
      marginTop: 4,
      borderRadius: 16,
      overflow: "hidden",
      shadowColor: colors.primary,
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    submitGradient: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 18,
      gap: 10,
    },
    submitText: {
      fontSize: 17,
      fontWeight: "700",
      color: "#fff",
      letterSpacing: 0.5,
    },
  });

export default FeedbackModal;
