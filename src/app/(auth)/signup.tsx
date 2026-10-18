import { Link, router } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Mascot } from "@/components/relast/mascot";
import { PrimaryButton } from "@/components/relast/primary-button";
import { Palette, Shadow } from "@/constants/palette";
import { useApp } from "@/state/app-context";

function getNameErrors(val: string): string[] {
  const errors: string[] = [];
  const trimmed = val.trim();
  if (!trimmed) {
    errors.push("Username is required.");
  } else if (trimmed.length >= 80) {
    errors.push("Username must be less than 80 characters.");
  }
  return errors;
}

function getEmailErrors(val: string): string[] {
  const errors: string[] = [];
  const trimmed = val.trim();
  if (!trimmed) {
    errors.push("Email is required.");
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    errors.push("Please enter a valid email address.");
  }
  return errors;
}

// Checks ALL password rules simultaneously with updated error messages
function getPasswordErrors(val: string): string[] {
  const errors: string[] = [];
  if (!val) {
    errors.push("Password is required.");
    return errors;
  }
  if (val.length < 8) {
    errors.push("• Password must be at least 8 characters long.");
  }
  if (!/[A-Z]/.test(val)) {
    errors.push("• Password must contain at least 1 uppercase letter.");
  }
  if (!/[a-z]/.test(val)) {
    errors.push("• Password must contain at least 1 lowercase letter.");
  }
  if (!/[0-9]/.test(val)) {
    errors.push("• Password must contain at least 1 number.");
  }
  if (!/[^A-Za-z0-9]/.test(val)) {
    errors.push("• Password must contain at least 1 special character.");
  }
  return errors;
}

export default function SignUpScreen() {
  const { signUp } = useApp();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [touched, setTouched] = useState({
    name: false,
    email: false,
    password: false,
  });
  const [submitted, setSubmitted] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    isError: boolean;
  } | null>(null);

  // Compute all violation messages dynamically
  const nameErrors = getNameErrors(name);
  const emailErrors = getEmailErrors(email);
  const passwordErrors = getPasswordErrors(password);

  // Real-time visibility triggers
  const showNameErrors =
    (name.length > 0 || touched.name || submitted) && nameErrors.length > 0;
  const showEmailErrors =
    (email.length > 0 || touched.email || submitted) && emailErrors.length > 0;
  const showPasswordErrors =
    (password.length > 0 || touched.password || submitted) &&
    passwordErrors.length > 0;

  const submit = async () => {
    setSubmitted(true);
    setTouched({ name: true, email: true, password: true });

    if (
      nameErrors.length > 0 ||
      emailErrors.length > 0 ||
      passwordErrors.length > 0
    ) {
      return;
    }

    const result = await signUp(name, email, password);

    if (result.success) {
      setToast({
        message: "Account created successfully! Redirecting to log in...",
        isError: false,
      });
      setTimeout(() => {
        router.replace("/(auth)/login");
      }, 1500);
    } else {
      setToast({
        message: result.error || "User is already registered or signup failed.",
        isError: true,
      });
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.body}
          keyboardShouldPersistTaps="handled"
        >
          <Mascot size={80} />
          <Text style={styles.title}>Create your account</Text>

          {toast && (
            <View
              style={[
                styles.toast,
                toast.isError ? styles.toastError : styles.toastSuccess,
              ]}
            >
              <Text
                style={[
                  styles.toastText,
                  toast.isError
                    ? styles.toastTextError
                    : styles.toastTextSuccess,
                ]}
              >
                {toast.message}
              </Text>
            </View>
          )}

          <View style={styles.form}>
            {/* Username / Name Field */}
            <View style={styles.fieldContainer}>
              <TextInput
                style={[
                  styles.input,
                  showNameErrors ? styles.inputError : null,
                ]}
                placeholder="Name"
                placeholderTextColor={Palette.muted}
                value={name}
                onChangeText={(text) => {
                  setName(text);
                  setTouched((prev) => ({ ...prev, name: true }));
                  if (toast) setToast(null);
                }}
              />
              {showNameErrors &&
                nameErrors.map((err, idx) => (
                  <Text key={idx} style={styles.error}>
                    {err}
                  </Text>
                ))}
            </View>

            {/* Email Field */}
            <View style={styles.fieldContainer}>
              <TextInput
                style={[
                  styles.input,
                  showEmailErrors ? styles.inputError : null,
                ]}
                placeholder="Email"
                placeholderTextColor={Palette.muted}
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setTouched((prev) => ({ ...prev, email: true }));
                  if (toast) setToast(null);
                }}
              />
              {showEmailErrors &&
                emailErrors.map((err, idx) => (
                  <Text key={idx} style={styles.error}>
                    {err}
                  </Text>
                ))}
            </View>

            {/* Password Field */}
            <View style={styles.fieldContainer}>
              <TextInput
                style={[
                  styles.input,
                  showPasswordErrors ? styles.inputError : null,
                ]}
                placeholder="Password"
                placeholderTextColor={Palette.muted}
                secureTextEntry
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  setTouched((prev) => ({ ...prev, password: true }));
                  if (toast) setToast(null);
                }}
              />
              {showPasswordErrors &&
                passwordErrors.map((err, idx) => (
                  <Text key={idx} style={styles.error}>
                    {err}
                  </Text>
                ))}
            </View>

            <PrimaryButton label="Sign up" onPress={submit} />
          </View>

          <Link href="/(auth)/login" style={styles.link}>
            I already have an account
          </Link>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Palette.cream },
  body: {
    padding: 24,
    alignItems: "center",
    gap: 8,
    flexGrow: 1,
    justifyContent: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: Palette.forestDark,
    marginBottom: 16,
  },
  form: { alignSelf: "stretch", gap: 12 },
  fieldContainer: { gap: 4 },
  input: {
    backgroundColor: Palette.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Palette.border,
    paddingHorizontal: 18,
    height: 56,
    fontSize: 16,
    color: Palette.ink,
    ...Shadow.card,
  },
  inputError: {
    borderColor: Palette.danger,
    backgroundColor: Palette.dangerBg,
  },
  error: { color: Palette.danger, fontSize: 13, paddingLeft: 4 },
  toast: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 8,
    alignSelf: "stretch",
    alignItems: "center",
    borderWidth: 1,
  },
  toastSuccess: {
    backgroundColor: Palette.mintDeep,
    borderColor: Palette.leaf,
  },
  toastError: {
    backgroundColor: Palette.dangerBg,
    borderColor: Palette.danger,
  },
  toastText: {
    fontWeight: "600",
    fontSize: 14,
    textAlign: "center",
  },
  toastTextSuccess: {
    color: Palette.forestDark,
  },
  toastTextError: {
    color: Palette.danger,
  },
  link: {
    marginTop: 16,
    color: Palette.forest,
    fontWeight: "600",
    fontSize: 15,
  },
});
