import Toast from "@/components/Toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { syncUser } from "@/lib/users";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Linking from "expo-linking";
import { useCallback, useEffect, useRef, useState } from "react";
import {
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

export default function SignInScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const { user } = useAuth();
  const router = useRouter();

  // State declarations
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Forgot password states
  const [forgotPassword, setForgotPassword] = useState(false);
  const [showForgotPasswordOTP, setShowForgotPasswordOTP] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false); // Flag to prevent redirect during reset
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Rate limiting states
  const [authAttempts, setAuthAttempts] = useState(0);
  const [lastAttemptTime, setLastAttemptTime] = useState(0);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [rateLimitCooldown, setRateLimitCooldown] = useState(0);
  
  // OTP verification states
  const [showOTPVerification, setShowOTPVerification] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [verificationEmail, setVerificationEmail] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  
  // OTP input refs for 6 individual boxes
  const otpInputRefs = useRef<(TextInput | null)[]>([]);
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);

  // Toast state
  const [toastConfig, setToastConfig] = useState({
    visible: false,
    message: "",
    type: "success" as "success" | "error" | "info" | "warning",
  });

  const showToast = useCallback((message: string, type: "success" | "error" | "info" | "warning" = "info") => {
    setToastConfig({ visible: true, message, type });
  }, []);

  const hideToast = useCallback(() => {
    setToastConfig((prev) => ({ ...prev, visible: false }));
  }, []);

  // Handle OTP digit change
  const handleOtpChange = (text: string, index: number) => {
    // Only allow single digit
    const digit = text.replace(/[^0-9]/g, '').slice(-1);
    
    const newDigits = [...otpDigits];
    newDigits[index] = digit;
    setOtpDigits(newDigits);
    
    // Update combined OTP code
    setOtpCode(newDigits.join(''));
    
    // Auto-focus next input
    if (digit && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  // Handle OTP backspace
  const handleOtpKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  // Clear OTP inputs
  const clearOtpInputs = () => {
    setOtpDigits(["", "", "", "", "", ""]);
    setOtpCode("");
    otpInputRefs.current[0]?.focus();
  };

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

  // Redirect to tabs if already authenticated AND verified
  useEffect(() => {
    if (user && !isResettingPassword) {
      // Only redirect verified users AND not during password reset flow
      const isEmailVerified = user.email_confirmed_at !== null;
      const isOAuthUser = user.app_metadata?.provider !== 'email';
      
      if (isEmailVerified || isOAuthUser) {
        router.replace("/(tabs)");
      }
    }
  }, [user, router, isResettingPassword]);

  // Sync user data to database when authenticated AND verified
  // Skip during password reset flow to avoid RLS issues
  useEffect(() => {
    if (user && !isResettingPassword) {
      // Only sync verified users to database
      // Email users must have confirmed their email via OTP
      // OAuth users (Google) are auto-verified
      const isEmailVerified = user.email_confirmed_at !== null;
      const isOAuthUser = user.app_metadata?.provider !== 'email';
      
      if (isEmailVerified || isOAuthUser) {
        syncUser({
          id: user.id,
          email: user.email || "",
          name: user.user_metadata?.full_name || user.user_metadata?.name || "",
          imageUrl: user.user_metadata?.avatar_url || user.user_metadata?.picture,
        }).catch(console.error);
      }
    }
  }, [user, isResettingPassword]);

  // Resend OTP cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Rate limit cooldown timer
  useEffect(() => {
    if (rateLimitCooldown > 0) {
      const timer = setTimeout(() => {
        setRateLimitCooldown(rateLimitCooldown - 1);
        if (rateLimitCooldown === 1) {
          setIsRateLimited(false);
          setAuthAttempts(0);
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [rateLimitCooldown]);

  // Check and enforce rate limiting
  const checkRateLimit = useCallback((): boolean => {
    const now = Date.now();
    const timeSinceLastAttempt = now - lastAttemptTime;
    
    // Reset attempts if more than 15 minutes passed
    if (timeSinceLastAttempt > 15 * 60 * 1000) {
      setAuthAttempts(0);
      setIsRateLimited(false);
      return true;
    }
    
    // Check if rate limited (max 5 attempts per 15 minutes)
    if (authAttempts >= 5) {
      if (!isRateLimited) {
        setIsRateLimited(true);
        setRateLimitCooldown(300); // 5 minutes cooldown
        showToast("Too many attempts. Please wait 5 minutes before trying again.", "error");
      }
      return false;
    }
    
    // Increment attempts
    setAuthAttempts(prev => prev + 1);
    setLastAttemptTime(now);
    return true;
  }, [lastAttemptTime, authAttempts, isRateLimited, showToast]);

  const onGoogleSignIn = useCallback(async () => {
    // Check rate limiting
    if (isRateLimited) {
      showToast(`Too many attempts. Please wait ${rateLimitCooldown}s before trying again.`, "warning");
      return;
    }
    
    if (!checkRateLimit()) {
      return;
    }

    try {
      console.log('[Google OAuth] Starting sign in...');
      
      // Use makeRedirectUri for proper deep linking in both Expo Go and production
      const redirectUri = Linking.createURL('google-callback');
      console.log('[Google OAuth] Redirect URI:', redirectUri);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUri,
          skipBrowserRedirect: false,
        },
      });

      if (error) {
        console.error('[Google OAuth] Supabase error:', error);
        throw error;
      }

      console.log('[Google OAuth] OAuth URL:', data?.url);

      // Open OAuth URL in browser - will redirect back via deep link
      if (data?.url) {
        const supported = await Linking.canOpenURL(data.url);
        console.log('[Google OAuth] Can open URL:', supported);
        
        if (supported) {
          console.log('[Google OAuth] Opening browser...');
          await Linking.openURL(data.url);
        } else {
          throw new Error('Unable to open browser for authentication');
        }
      }
    } catch (err: any) {
      console.error("[Google OAuth] Error:", err);
      if (!err?.message?.includes('cancelled') && !err?.message?.includes('canceled')) {
        showToast("Failed to sign in with Google. Please try again.", "error");
      }
    }
  }, [isRateLimited, rateLimitCooldown, checkRateLimit, showToast]);

  const onEmailAuth = async () => {
    // Check rate limiting
    if (isRateLimited) {
      showToast(`Too many attempts. Please wait ${rateLimitCooldown}s before trying again.`, "warning");
      return;
    }
    
    if (!checkRateLimit()) {
      return;
    }

    if (!email || !password) {
      showToast("Please enter email and password", "error");
      return;
    }

    if (isSignUp && !fullName) {
      showToast("Please enter your full name", "error");
      return;
    }

    if (password.length < 6) {
      showToast("Password must be at least 6 characters", "error");
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        // Sign up with OTP verification
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              name: fullName,
            },
            // No emailRedirectTo - this will trigger OTP email instead of magic link
          },
        });

        if (error) throw error;

        if (data?.user) {
          // Check if email confirmation is required
          if (data.user.identities && data.user.identities.length === 0) {
            showToast("This email is already registered. Please sign in instead.", "info");
            setIsSignUp(false);
          } else {
            // Important: Sign out immediately to prevent session creation for unverified users
            // Session will be created after OTP verification
            await supabase.auth.signOut();
            
            // Show OTP verification screen
            setVerificationEmail(email);
            setShowOTPVerification(true);
            setResendCooldown(60); // 60 seconds cooldown
            showToast(
              "Verification code sent! Please check your email.",
              "success"
            );
          }
        }
      } else {
        // Sign in
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            showToast("Invalid email or password. Please try again.", "error");
          } else if (error.message.includes('Email not confirmed')) {
            showToast("Please verify your email before signing in.", "warning");
          } else {
            throw error;
          }
          return;
        }

        if (data?.user) {
          // Sync user to database
          await syncUser({
            id: data.user.id,
            email: data.user.email || "",
            name: data.user.user_metadata?.full_name || data.user.user_metadata?.name || "",
            imageUrl: data.user.user_metadata?.avatar_url,
          });

          showToast("Signed in successfully!", "success");
          router.replace("/(tabs)");
        }
      }
    } catch (err: any) {
      console.error("Email auth error", err);
      showToast(err.message || "Authentication failed", "error");
    } finally {
      setLoading(false);
    }
  };

  // Forgot password - send OTP
  const onForgotPassword = async () => {
    if (!email) {
      showToast("Please enter your email address", "warning");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);

      if (error) throw error;

      // Show OTP verification screen for forgot password
      setVerificationEmail(email);
      setShowForgotPasswordOTP(true);
      setForgotPassword(false);
      setResendCooldown(60);
      showToast("Verification code sent! Check your email.", "success");
    } catch (err: any) {
      console.error("Forgot password error", err);
      showToast(err.message || "Failed to send reset code", "error");
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP for forgot password
  const onVerifyForgotPasswordOTP = async () => {
    if (!otpCode || otpCode.length !== 6) {
      showToast("Please enter a valid 6-digit code", "error");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: verificationEmail,
        token: otpCode,
        type: 'recovery',
      });

      if (error) throw error;

      showToast("Code verified! Now set your new password.", "success");
      
      // Set flag to prevent redirect during password reset
      setIsResettingPassword(true);
      
      // Move to reset password screen
      setShowForgotPasswordOTP(false);
      setShowResetPassword(true);
      clearOtpInputs();
    } catch (err: any) {
      console.error("OTP verification error", err);
      if (err.message.includes('expired')) {
        showToast("Verification code expired. Please request a new one.", "error");
      } else if (err.message.includes('invalid')) {
        showToast("Invalid verification code. Please try again.", "error");
      } else {
        showToast(err.message || "Verification failed", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  // Resend forgot password OTP
  const onResendForgotPasswordOTP = async () => {
    if (resendCooldown > 0) {
      showToast(`Please wait ${resendCooldown}s before resending`, "warning");
      return;
    }

    setLoading(true);
    try {
      // For password recovery, call resetPasswordForEmail again to send new OTP
      const { error } = await supabase.auth.resetPasswordForEmail(verificationEmail);

      if (error) throw error;

      showToast("New verification code sent!", "success");
      clearOtpInputs();
      setResendCooldown(60);
    } catch (err: any) {
      console.error("Resend OTP error", err);
      showToast(err.message || "Failed to resend code", "error");
    } finally {
      setLoading(false);
    }
  };

  // Reset password after OTP verification
  const onResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      showToast("Please enter both password fields", "error");
      return;
    }

    if (newPassword.length < 6) {
      showToast("Password must be at least 6 characters", "error");
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast("Passwords do not match", "error");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      showToast("Password reset successful! You can now sign in.", "success");
      
      // Reset all states
      setShowResetPassword(false);
      setIsResettingPassword(false); // Clear flag
      setVerificationEmail("");
      setNewPassword("");
      setConfirmPassword("");
      setEmail("");
      setPassword("");
      setIsSignUp(false);
      
      // Sign out to allow fresh login
      await supabase.auth.signOut();
    } catch (err: any) {
      console.error("Reset password error", err);
      showToast(err.message || "Failed to reset password", "error");
    } finally {
      setLoading(false);
    }
  };

  // Cancel forgot password flow
  const onCancelForgotPasswordFlow = () => {
    setShowForgotPasswordOTP(false);
    setShowResetPassword(false);
    setIsResettingPassword(false); // Clear flag
    clearOtpInputs();
    setVerificationEmail("");
    setNewPassword("");
    setConfirmPassword("");
    setResendCooldown(0);
  };

  // Verify OTP code
  const onVerifyOTP = async () => {
    if (!otpCode || otpCode.length !== 6) {
      showToast("Please enter a valid 6-digit code", "error");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: verificationEmail,
        token: otpCode,
        type: 'email',
      });

      if (error) throw error;

      if (data?.user) {
        // Sync user to database
        await syncUser({
          id: data.user.id,
          email: data.user.email || "",
          name: data.user.user_metadata?.full_name || data.user.user_metadata?.name || "",
          imageUrl: data.user.user_metadata?.avatar_url,
        });

        showToast("Email verified successfully!", "success");
        
        // Reset states
        setShowOTPVerification(false);
        clearOtpInputs();
        setVerificationEmail("");
        setEmail("");
        setPassword("");
        setFullName("");
        setIsSignUp(false);
        
        // Navigate to tabs
        router.replace("/(tabs)");
      }
    } catch (err: any) {
      console.error("OTP verification error", err);
      if (err.message.includes('expired')) {
        showToast("Verification code expired. Please request a new one.", "error");
      } else if (err.message.includes('invalid')) {
        showToast("Invalid verification code. Please try again.", "error");
      } else {
        showToast(err.message || "Verification failed", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP code
  const onResendOTP = async () => {
    if (resendCooldown > 0) {
      showToast(`Please wait ${resendCooldown}s before resending`, "warning");
      return;
    }

    setLoading(true);
    try {
      // Use Supabase resend() method for signup OTP
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: verificationEmail,
      });

      if (error) throw error;

      showToast("New verification code sent!", "success");
      clearOtpInputs(); // Clear previous code
      setResendCooldown(60); // Reset cooldown
    } catch (err: any) {
      console.error("Resend OTP error", err);
      showToast(err.message || "Failed to resend code", "error");
    } finally {
      setLoading(false);
    }
  };

  // Cancel OTP verification
  const onCancelOTPVerification = () => {
    setShowOTPVerification(false);
    clearOtpInputs();
    setVerificationEmail("");
    setResendCooldown(0);
  };

  return (
    <>
      <Toast
        visible={toastConfig.visible}
        message={toastConfig.message}
        type={toastConfig.type}
        onHide={hideToast}
        duration={3500}
      />
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
              {showOTPVerification ? (
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
                    Enter the 6-digit code sent to
                  </Text>
                  <Text
                    style={[
                      styles.verificationEmail,
                      { color: colors.text },
                    ]}
                  >
                    {verificationEmail}
                  </Text>

                  <View style={styles.inputGroup}>
                    {/* 6-Digit OTP Input Boxes */}
                    <View style={styles.otpContainer}>
                      {otpDigits.map((digit, index) => (
                        <TextInput
                          key={index}
                          ref={(ref) => {
                            otpInputRefs.current[index] = ref;
                          }}
                          style={[
                            styles.otpBox,
                            {
                              backgroundColor: colors.inputBackground,
                              color: colors.text,
                              borderColor: digit ? colors.buttonBackground : colors.border,
                              borderWidth: digit ? 2 : 1,
                            },
                          ]}
                          value={digit}
                          onChangeText={(text) => handleOtpChange(text, index)}
                          onKeyPress={(e) => handleOtpKeyPress(e, index)}
                          keyboardType="number-pad"
                          maxLength={1}
                          selectTextOnFocus
                          autoFocus={index === 0}
                        />
                      ))}
                    </View>

                    <TouchableOpacity
                      onPress={onVerifyOTP}
                      activeOpacity={0.7}
                      disabled={loading || otpCode.length !== 6}
                      style={[
                        styles.primaryButton,
                        { 
                          backgroundColor: colors.buttonBackground,
                          opacity: (loading || otpCode.length !== 6) ? 0.5 : 1,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.primaryButtonText,
                          { color: colors.buttonText },
                        ]}
                      >
                        {loading ? "Verifying..." : "Verify Code"}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={onResendOTP}
                      disabled={resendCooldown > 0}
                      style={[
                        styles.resendButton,
                        { opacity: resendCooldown > 0 ? 0.5 : 1 },
                      ]}
                    >
                      <Text
                        style={[
                          styles.resendText,
                          { color: colors.buttonBackground },
                        ]}
                      >
                        {resendCooldown > 0 
                          ? `Resend code in ${resendCooldown}s` 
                          : "Resend code"}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={onCancelOTPVerification}
                      style={styles.switchContainer}
                    >
                      <Text
                        style={[styles.switchText, { color: colors.textSecondary }]}
                      >
                        <Text
                          style={[
                            styles.switchTextBold,
                            { color: colors.buttonBackground },
                          ]}
                        >
                          ← Back to sign in
                        </Text>
                      </Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : showForgotPasswordOTP ? (
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
                    Enter the 6-digit code sent to
                  </Text>
                  <Text
                    style={[
                      styles.verificationEmail,
                      { color: colors.text },
                    ]}
                  >
                    {verificationEmail}
                  </Text>

                  <View style={styles.inputGroup}>
                    {/* 6-Digit OTP Input Boxes */}
                    <View style={styles.otpContainer}>
                      {otpDigits.map((digit, index) => (
                        <TextInput
                          key={index}
                          ref={(ref) => {
                            otpInputRefs.current[index] = ref;
                          }}
                          style={[
                            styles.otpBox,
                            {
                              backgroundColor: colors.inputBackground,
                              color: colors.text,
                              borderColor: digit ? colors.buttonBackground : colors.border,
                              borderWidth: digit ? 2 : 1,
                            },
                          ]}
                          value={digit}
                          onChangeText={(text) => handleOtpChange(text, index)}
                          onKeyPress={(e) => handleOtpKeyPress(e, index)}
                          keyboardType="number-pad"
                          maxLength={1}
                          selectTextOnFocus
                          autoFocus={index === 0}
                        />
                      ))}
                    </View>

                    <TouchableOpacity
                      onPress={onVerifyForgotPasswordOTP}
                      activeOpacity={0.7}
                      disabled={loading || otpCode.length !== 6}
                      style={[
                        styles.primaryButton,
                        { 
                          backgroundColor: colors.buttonBackground,
                          opacity: (loading || otpCode.length !== 6) ? 0.5 : 1,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.primaryButtonText,
                          { color: colors.buttonText },
                        ]}
                      >
                        {loading ? "Verifying..." : "Verify Code"}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={onResendForgotPasswordOTP}
                      disabled={resendCooldown > 0}
                      style={[
                        styles.resendButton,
                        { opacity: resendCooldown > 0 ? 0.5 : 1 },
                      ]}
                    >
                      <Text
                        style={[
                          styles.resendText,
                          { color: colors.buttonBackground },
                        ]}
                      >
                        {resendCooldown > 0 
                          ? `Resend code in ${resendCooldown}s` 
                          : "Resend code"}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={onCancelForgotPasswordFlow}
                      style={styles.switchContainer}
                    >
                      <Text
                        style={[styles.switchText, { color: colors.textSecondary }]}
                      >
                        <Text
                          style={[
                            styles.switchTextBold,
                            { color: colors.buttonBackground },
                          ]}
                        >
                          ← Back to sign in
                        </Text>
                      </Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : showResetPassword ? (
                <>
                  <Text style={[styles.welcomeText, { color: colors.text }]}>
                    Reset Password
                  </Text>
                  <Text
                    style={[
                      styles.verificationSubtext,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Create a strong new password for your account
                  </Text>

                  <View style={styles.inputGroup}>
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
                        placeholder="New Password"
                        value={newPassword}
                        onChangeText={setNewPassword}
                        secureTextEntry={!showNewPassword}
                        placeholderTextColor={colors.textSecondary}
                        autoFocus
                      />
                      <TouchableOpacity
                        onPress={() => setShowNewPassword(!showNewPassword)}
                        style={styles.eyeIcon}
                      >
                        <Ionicons
                          name={showNewPassword ? "eye-off-outline" : "eye-outline"}
                          size={22}
                          color={colors.textSecondary}
                        />
                      </TouchableOpacity>
                    </View>

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
                        placeholder="Confirm New Password"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        secureTextEntry={!showConfirmPassword}
                        placeholderTextColor={colors.textSecondary}
                      />
                      <TouchableOpacity
                        onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                        style={styles.eyeIcon}
                      >
                        <Ionicons
                          name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                          size={22}
                          color={colors.textSecondary}
                        />
                      </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                      onPress={onResetPassword}
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
                        {loading ? "Resetting..." : "Reset Password"}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={onCancelForgotPasswordFlow}
                      style={styles.switchContainer}
                    >
                      <Text
                        style={[styles.switchText, { color: colors.textSecondary }]}
                      >
                        <Text
                          style={[
                            styles.switchTextBold,
                            { color: colors.buttonBackground },
                          ]}
                        >
                          ← Back to sign in
                        </Text>
                      </Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : forgotPassword ? (
                <>
                  <Text style={[styles.welcomeText, { color: colors.text }]}>
                    Forgot Password
                  </Text>
                  <Text
                    style={[
                      styles.verificationSubtext,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Enter your email to receive a verification code
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
                      placeholder="Email"
                      value={email}
                      onChangeText={setEmail}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      placeholderTextColor={colors.textSecondary}
                    />

                    <TouchableOpacity
                      onPress={onForgotPassword}
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
                        {loading ? "Sending..." : "Send Verification Code"}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => setForgotPassword(false)}
                      style={styles.switchContainer}
                    >
                      <Text
                        style={[styles.switchText, { color: colors.textSecondary }]}
                      >
                        Remember your password?{" "}
                        <Text
                          style={[
                            styles.switchTextBold,
                            { color: colors.buttonBackground },
                          ]}
                        >
                          Sign In
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

                    {/* Forgot Password Link - only show on sign in */}
                    {!isSignUp && (
                      <TouchableOpacity
                        onPress={() => setForgotPassword(true)}
                        style={styles.forgotPasswordContainer}
                      >
                        <Text
                          style={[
                            styles.forgotPasswordText,
                            { color: colors.buttonBackground },
                          ]}
                        >
                          Forgot Password?
                        </Text>
                      </TouchableOpacity>
                    )}

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
    </>
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
  forgotPasswordContainer: {
    alignSelf: "flex-end",
    marginTop: 4,
    marginBottom: 8,
    paddingVertical: 4,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: "600",
  },
  // OTP Verification styles
  verificationEmail: {
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 4,
    marginBottom: 20,
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginBottom: 12,
  },
  otpBox: {
    width: 48,
    height: 56,
    borderRadius: 12,
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
  },
  resendButton: {
    alignItems: "center",
    paddingVertical: 10,
    marginTop: 4,
  },
  resendText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
