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
import { Palette } from "@/constants/palette";
import { useApp } from "@/state/app-context";

function getNameError(val: string): string | null {
  const trimmed = val.trim();
  if (!trimmed) return "Username is required.";
  if (trimmed.length >= 80) return "Username must be less than 80 characters.";
  return null;
}

function getEmailError(val: string): string | null {
  const trimmed = val.trim();
  if (!trimmed) return "Email is required.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed))
    return "Please enter a valid email address.";
  return null;
}

function getPasswordError(val: string): string | null {
  if (!val) return "Password is required.";
  if (val.length < 8) return "Password must be at least 8 characters.";
  if (!/[A-Z]/.test(val))
    return "Password must contain at least 1 uppercase letter.";
  if (!/[a-z]/.test(val))
    return "Password must contain at least 1 lowercase letter.";
  if (!/[0-9]/.test(val)) return "Password must contain at least 1 number.";
  if (!/[^A-Za-z0-9]/.test(val))
    return "Password must contain at least 1 special character.";
  return null;
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

  const nameError = getNameError(name);
  const emailError = getEmailError(email);
  const passwordError = getPasswordError(password);

  const showNameError = (touched.name || submitted) && nameError;
  const showEmailError = (touched.email || submitted) && emailError;
  const showPasswordError = (touched.password || submitted) && passwordError;

  const submit = async () => {
    setSubmitted(true);
    setTouched({ name: true, email: true, password: true });

    if (nameError || emailError || passwordError) {
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
            <View style={styles.fieldContainer}>
              <TextInput
                style={[styles.input, showNameError ? styles.inputError : null]}
                placeholder="Name"
                placeholderTextColor={Palette.muted}
                value={name}
                onChangeText={(text) => {
                  setName(text);
                  setTouched((prev) => ({ ...prev, name: true }));
                  if (toast) setToast(null);
                }}
              />
              {showNameError && <Text style={styles.error}>{nameError}</Text>}
            </View>

            <View style={styles.fieldContainer}>
              <TextInput
                style={[
                  styles.input,
                  showEmailError ? styles.inputError : null,
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
              {showEmailError && <Text style={styles.error}>{emailError}</Text>}
            </View>

            <View style={styles.fieldContainer}>
              <TextInput
                style={[
                  styles.input,
                  showPasswordError ? styles.inputError : null,
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
              {showPasswordError && (
                <Text style={styles.error}>{passwordError}</Text>
              )}
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
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Palette.border,
    paddingHorizontal: 18,
    height: 54,
    fontSize: 16,
    color: Palette.ink,
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
