import useTheme from "@/hooks/useTheme";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: "default" | "cancel" | "destructive";
}

interface CustomAlertProps {
  visible: boolean;
  title: string;
  message: string;
  buttons?: AlertButton[];
  icon?: keyof typeof Ionicons.glyphMap;
  type?: "info" | "warning" | "error" | "success";
}

const CustomAlert: React.FC<CustomAlertProps> = ({
  visible,
  title,
  message,
  buttons = [{ text: "OK", style: "default" }],
  icon,
  type = "info",
}) => {
  const { colors } = useTheme();

  const getIconConfig = () => {
    if (icon) return { name: icon, color: colors.primary };

    switch (type) {
      case "warning":
        return { name: "warning" as const, color: "#FFA500" };
      case "error":
        return { name: "close-circle" as const, color: "#FF3B30" };
      case "success":
        return { name: "checkmark-circle" as const, color: "#34C759" };
      default:
        return { name: "information-circle" as const, color: colors.primary };
    }
  };

  const iconConfig = getIconConfig();

  const getButtonGradient = (
    style?: string,
  ): readonly [string, string, ...string[]] => {
    switch (style) {
      case "destructive":
        return colors.gradients.danger as readonly [
          string,
          string,
          ...string[],
        ];
      case "cancel":
        return [colors.border, colors.border] as const;
      default:
        return colors.gradients.primary as readonly [
          string,
          string,
          ...string[],
        ];
    }
  };

  const getButtonTextColor = (style?: string) => {
    return style === "cancel" ? colors.text : "#fff";
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.alertContainer}>
          <LinearGradient
            colors={colors.gradients.surface}
            style={styles.alertContent}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {/* Icon */}
            <View style={styles.iconContainer}>
              <View
                style={[
                  styles.iconCircle,
                  { backgroundColor: `${iconConfig.color}20` },
                ]}
              >
                <Ionicons
                  name={iconConfig.name}
                  size={40}
                  color={iconConfig.color}
                />
              </View>
            </View>

            {/* Title */}
            <Text style={[styles.title, { color: colors.text }]}>{title}</Text>

            {/* Message */}
            <Text style={[styles.message, { color: colors.textMuted }]}>
              {message}
            </Text>

            {/* Buttons */}
            <View style={styles.buttonContainer}>
              {buttons.map((button, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.button}
                  onPress={button.onPress}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={getButtonGradient(button.style)}
                    style={styles.buttonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Text
                      style={[
                        styles.buttonText,
                        { color: getButtonTextColor(button.style) },
                      ]}
                    >
                      {button.text}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  alertContainer: {
    width: "100%",
    maxWidth: 340,
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  alertContent: {
    padding: 28,
    alignItems: "center",
  },
  iconContainer: {
    marginBottom: 20,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 12,
    textAlign: "center",
  },
  message: {
    fontSize: 16,
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 28,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  button: {
    flex: 1,
    borderRadius: 14,
    overflow: "hidden",
  },
  buttonGradient: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});

export default CustomAlert;
