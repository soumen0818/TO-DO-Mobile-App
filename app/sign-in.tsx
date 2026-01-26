import { api } from "@/convex/_generated/api";
import { useOAuth, useSignIn, useSignUp, useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "convex/react";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

WebBrowser.maybeCompleteAuthSession();

export default function SignInScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" });
  const { signIn, setActive: setSignInActive } = useSignIn();
  const { signUp, setActive: setSignUpActive } = useSignUp();
  const { user } = useUser();
  const router = useRouter();
  const syncUser = useMutation(api.users.syncUser);

  // Redirect to tabs if already authenticated
  useEffect(() => {
    if (user) {
      router.replace("/(tabs)");
    }
  }, [user, router]);

  // Sync user data to Convex when authenticated
  useEffect(() => {
    if (user) {
      syncUser({
        clerkId: user.id,
        email: user.primaryEmailAddress?.emailAddress || "",
        name: user.fullName || "",
        imageUrl: user.imageUrl,
      }).catch(console.error);
    }
  }, [user, syncUser]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const colors = {
    background: isDark ? "#000000" : "#FFFFFF",
    text: isDark ? "#FFFFFF" : "#000000",
    textSecondary: isDark ? "#8E8E93" : "#6C6C70",
    border: isDark ? "#38383A" : "#E5E5EA",
    inputBackground: isDark ? "#1C1C1E" : "#F2F2F7",
    buttonBackground: isDark ? "#0A84FF" : "#007AFF",
    buttonText: "#FFFFFF",
    googleButton: isDark ? "#1C1C1E" : "#FFFFFF",
    googleBorder: isDark ? "#38383A" : "#D1D1D6",
  };

  const onGoogleSignIn = useCallback(async () => {
    try {
      const { createdSessionId, setActive } = await startOAuthFlow();

      if (createdSessionId) {
        setActive!({ session: createdSessionId });
        router.replace("/(tabs)");
      }
    } catch (err) {
      console.error("OAuth error", err);
      Alert.alert("Error", "Failed to sign in with Google. Please try again.");
    }
  }, [startOAuthFlow, router]);

  const onEmailAuth = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter email and password");
      return;
    }

    if (isSignUp && !fullName) {
      Alert.alert("Error", "Please enter your full name");
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        // Create signup - Clerk will automatically check if email exists
        try {
          await signUp!.create({
            emailAddress: email,
            password,
            firstName: fullName.split(" ")[0],
            lastName:
              fullName.split(" ").slice(1).join(" ") || fullName.split(" ")[0],
          });

          await signUp!.prepareEmailAddressVerification({
            strategy: "email_code",
          });

          setPendingVerification(true);
        } catch (signUpError: any) {
          // Check if error is about existing account
          const errorMsg =
            signUpError.errors?.[0]?.message || signUpError.message || "";
          if (
            errorMsg.toLowerCase().includes("email") &&
            (errorMsg.toLowerCase().includes("exists") ||
              errorMsg.toLowerCase().includes("already") ||
              errorMsg.toLowerCase().includes("taken"))
          ) {
            Alert.alert(
              "Account Exists",
              "An account with this email already exists. Please sign in instead.",
              [
                {
                  text: "Switch to Sign In",
                  onPress: () => setIsSignUp(false),
                },
                { text: "Cancel", style: "cancel" },
              ],
            );
          } else {
            throw signUpError;
          }
        }
      } else {
        // Sign in
        try {
          const result = await signIn!.create({
            identifier: email,
            password,
          });

          if (result.status === "complete") {
            if (result.createdSessionId) {
              await setSignInActive!({ session: result.createdSessionId });
            }
            router.replace("/(tabs)");
          } else if (result.status === "needs_second_factor") {
            // 2FA is enabled on this account - must be disabled from Clerk dashboard
            Alert.alert(
              "Two-Factor Authentication Required",
              "This account has 2FA enabled. Please disable it from your Clerk dashboard:\n\n1. Go to dashboard.clerk.com\n2. Select your project\n3. Click 'Users'\n4. Click on this user\n5. Scroll to 'Multi-factor' section\n6. Remove the authenticator",
              [{ text: "OK" }],
            );
          } else {
            console.log("Sign in status:", result.status);
            Alert.alert("Error", "Sign in incomplete. Please try again.");
          }
        } catch (signInError: any) {
          console.error("Sign in error:", signInError);
          // Handle sign-in errors
          const errorMsg =
            signInError.errors?.[0]?.message || signInError.message || "";
          if (
            errorMsg.toLowerCase().includes("identifier") ||
            errorMsg.toLowerCase().includes("password") ||
            errorMsg.toLowerCase().includes("incorrect")
          ) {
            Alert.alert(
              "Error",
              "Invalid email or password. Please try again.",
            );
          } else {
            throw signInError;
          }
        }
      }
    } catch (err: any) {
      console.error("Email auth error", err);
      const errorMessage =
        err.errors?.[0]?.message || err.message || "Authentication failed";
      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const onVerifyCode = async () => {
    if (!verificationCode) {
      Alert.alert("Error", "Please enter the verification code");
      return;
    }

    setLoading(true);
    try {
      const result = await signUp!.attemptEmailAddressVerification({
        code: verificationCode,
      });

      if (result.createdSessionId) {
        await setSignUpActive!({ session: result.createdSessionId });

        // Sync user to Convex database after successful signup
        try {
          await syncUser({
            clerkId: result.createdUserId || "",
            email: email,
            name: fullName,
            imageUrl: undefined,
          });
        } catch (syncError) {
          console.error("Error syncing user to database:", syncError);
        }

        router.replace("/(tabs)");
      }
    } catch (err: any) {
      console.error("Verification error", err);
      Alert.alert("Error", err.errors?.[0]?.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Top: App Icon and Name */}
          <View style={styles.header}>
            <Image
              source={require("../assets/images/todo-app-logo.png")}
              style={styles.appLogo}
              resizeMode="contain"
            />
            <Text style={[styles.appName, { color: colors.text }]}>
              Zenith Task
            </Text>
          </View>

          {/* Auth Form */}
          <View style={styles.formSection}>
            {pendingVerification ? (
              <>
                <Text style={[styles.welcomeText, { color: colors.text }]}>
                  Verify Your Email
                </Text>
                <Text
                  style={[
                    styles.verificationSubtext,
                    { color: colors.textSecondary },
                  ]}
                >
                  We sent a code to {email}
                </Text>

                <View style={styles.inputGroup}>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.inputBackground,
                        color: colors.text,
                        borderColor: colors.border,
                      },
                    ]}
                    placeholder="Enter 6-digit code"
                    value={verificationCode}
                    onChangeText={setVerificationCode}
                    keyboardType="number-pad"
                    maxLength={6}
                    placeholderTextColor={colors.textSecondary}
                  />

                  <TouchableOpacity
                    onPress={onVerifyCode}
                    activeOpacity={0.7}
                    disabled={loading}
                    style={[
                      styles.primaryButton,
                      { backgroundColor: colors.buttonBackground },
                    ]}
                  >
                    <Text
                      style={[
                        styles.primaryButtonText,
                        { color: colors.buttonText },
                      ]}
                    >
                      {loading ? "Verifying..." : "Verify Email"}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setPendingVerification(false)}
                    style={styles.switchContainer}
                  >
                    <Text
                      style={[
                        styles.switchText,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Wrong email?{" "}
                      <Text
                        style={[
                          styles.switchTextBold,
                          { color: colors.buttonBackground },
                        ]}
                      >
                        Go back
                      </Text>
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <Text style={[styles.welcomeText, { color: colors.text }]}>
                  {isSignUp ? "Create Account" : "Welcome Back"}
                </Text>

                <View style={styles.inputGroup}>
                  {isSignUp && (
                    <TextInput
                      style={[
                        styles.input,
                        {
                          backgroundColor: colors.inputBackground,
                          color: colors.text,
                          borderColor: colors.border,
                        },
                      ]}
                      placeholder="Full Name"
                      value={fullName}
                      onChangeText={setFullName}
                      autoCapitalize="words"
                      placeholderTextColor={colors.textSecondary}
                    />
                  )}

                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.inputBackground,
                        color: colors.text,
                        borderColor: colors.border,
                      },
                    ]}
                    placeholder="Email"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    placeholderTextColor={colors.textSecondary}
                  />

                  <View style={styles.passwordContainer}>
                    <TextInput
                      style={[
                        styles.passwordInput,
                        {
                          backgroundColor: colors.inputBackground,
                          color: colors.text,
                          borderColor: colors.border,
                        },
                      ]}
                      placeholder="Password"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                      placeholderTextColor={colors.textSecondary}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      style={styles.eyeIcon}
                    >
                      <Ionicons
                        name={showPassword ? "eye-off-outline" : "eye-outline"}
                        size={22}
                        color={colors.textSecondary}
                      />
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    onPress={onEmailAuth}
                    activeOpacity={0.7}
                    disabled={loading}
                    style={[
                      styles.primaryButton,
                      { backgroundColor: colors.buttonBackground },
                    ]}
                  >
                    <Text
                      style={[
                        styles.primaryButtonText,
                        { color: colors.buttonText },
                      ]}
                    >
                      {loading
                        ? "Loading..."
                        : isSignUp
                          ? "Sign Up"
                          : "Sign In"}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.dividerContainer}>
                  <View
                    style={[
                      styles.dividerLine,
                      { backgroundColor: colors.border },
                    ]}
                  />
                  <Text
                    style={[
                      styles.dividerText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    OR
                  </Text>
                  <View
                    style={[
                      styles.dividerLine,
                      { backgroundColor: colors.border },
                    ]}
                  />
                </View>

                <TouchableOpacity
                  onPress={onGoogleSignIn}
                  activeOpacity={0.7}
                  style={[
                    styles.googleButton,
                    {
                      backgroundColor: colors.googleButton,
                      borderColor: colors.googleBorder,
                    },
                  ]}
                >
                  <Image
                    source={require("../assets/images/google-icon.png")}
                    style={styles.googleIconImage}
                    resizeMode="contain"
                  />
                  <Text
                    style={[styles.googleButtonText, { color: colors.text }]}
                  >
                    Continue with Google
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setIsSignUp(!isSignUp)}
                  style={styles.switchContainer}
                >
                  <Text
                    style={[styles.switchText, { color: colors.textSecondary }]}
                  >
                    {isSignUp
                      ? "Already have an account? "
                      : "Don't have an account? "}
                    <Text
                      style={[
                        styles.switchTextBold,
                        { color: colors.buttonBackground },
                      ]}
                    >
                      {isSignUp ? "Sign In" : "Sign Up"}
                    </Text>
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 30,
    paddingBottom: 24,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  appLogo: {
    width: 90,
    height: 90,
    marginBottom: 14,
    borderRadius: 14,
  },
  appName: {
    fontSize: 28,
    fontWeight: "bold",
    letterSpacing: 0.5,
    fontFamily: "SpaceMono",
  },
  formSection: {
    gap: 18,
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 6,
  },
  verificationSubtext: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 14,
  },
  inputGroup: {
    gap: 11,
  },
  input: {
    borderRadius: 11,
    padding: 14,
    fontSize: 15,
    borderWidth: 1,
  },
  passwordContainer: {
    position: "relative",
  },
  passwordInput: {
    borderRadius: 11,
    padding: 14,
    paddingRight: 48,
    fontSize: 15,
    borderWidth: 1,
  },
  eyeIcon: {
    position: "absolute",
    right: 14,
    top: 14,
    padding: 4,
  },
  primaryButton: {
    borderRadius: 11,
    padding: 14,
    alignItems: "center",
    marginTop: 4,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 7,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 14,
    fontSize: 13,
    fontWeight: "500",
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 11,
    padding: 14,
    borderWidth: 1,
    gap: 9,
  },
  googleIconImage: {
    width: 19,
    height: 19,
  },
  googleButtonText: {
    fontSize: 15,
    fontWeight: "600",
  },
  switchContainer: {
    alignItems: "center",
    marginTop: 14,
    paddingVertical: 6,
  },
  switchText: {
    fontSize: 14,
  },
  switchTextBold: {
    fontWeight: "700",
  },
});
