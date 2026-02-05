import useTheme from "@/hooks/useTheme";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

interface ToastProps {
  visible: boolean;
  message: string;
  type?: "success" | "error" | "info" | "warning";
  duration?: number;
  onHide?: () => void;
}

const Toast: React.FC<ToastProps> = ({
  visible,
  message,
  type = "success",
  duration = 3000,
  onHide,
}) => {
  const { colors } = useTheme();
  const translateY = React.useRef(new Animated.Value(-100)).current;
  const opacity = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 80,
          friction: 8,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(() => {
        hideToast();
      }, duration);

      return () => clearTimeout(timer);
    } else {
      hideToast();
    }
  }, [visible]);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (onHide) onHide();
    });
  };

  const getGradient = () => {
    switch (type) {
      case "success":
        return colors.gradients.success;
      case "error":
        return colors.gradients.danger;
      case "warning":
        return colors.gradients.warning;
      default:
        return colors.gradients.primary;
    }
  };

  const getIcon = () => {
    switch (type) {
      case "success":
        return "checkmark-circle";
      case "error":
        return "close-circle";
      case "warning":
        return "warning";
      default:
        return "information-circle";
    }
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <LinearGradient
        colors={getGradient() as readonly [string, string, ...string[]]}
        style={styles.toast}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.iconContainer}>
          <Ionicons name={getIcon()} size={24} color="#fff" />
        </View>
        <Text style={styles.message} numberOfLines={2}>
          {message}
        </Text>
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 60,
    left: 20,
    right: 20,
    zIndex: 9999,
  },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  iconContainer: {
    marginRight: 12,
  },
  message: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
    lineHeight: 20,
  },
});

export default Toast;
