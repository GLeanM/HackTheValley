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

function validateEmail(val: string): boolean {
  if (!val) return false;
  const trimmed = val.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}

function validatePassword(val: string): boolean {
  if (!val) return false;
  if (val.length < 8) return false;
  if (!/[A-Z]/.test(val)) return false;
  if (!/[a-z]/.test(val)) return false;
  if (!/[0-9]/.test(val)) return false;
  if (!/[^A-Za-z0-9]/.test(val)) return false;
  return true;
}

export default function LoginScreen() {
  const { signIn } = useApp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [hasViolation, setHasViolation] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);

    if (!isEmailValid || !isPasswordValid) {
      setHasViolation(true);
      setError("Please enter a valid email and password.");
      return;
    }

    const result = await signIn(email, password);

    if (!result.success) {
      setHasViolation(true);
      setError("Invalid email or password. Please try again.");
      return;
    }

    setHasViolation(false);
    setError(null);
    router.replace("/(app)/(tabs)");
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
          <Mascot size={96} />
          <Text style={styles.brand}>Relast</Text>
          <Text style={styles.tag}>Make it last. Waste less.</Text>

          <View style={styles.form}>
            {error && <Text style={styles.error}>{error}</Text>}

            <TextInput
              style={[styles.input, hasViolation && styles.inputError]}
              placeholder="Email"
              placeholderTextColor={Palette.muted}
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (hasViolation) setHasViolation(false);
                if (error) setError(null);
              }}
            />
            <TextInput
              style={[styles.input, hasViolation && styles.inputError]}
              placeholder="Password"
              placeholderTextColor={Palette.muted}
              secureTextEntry
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (hasViolation) setHasViolation(false);
                if (error) setError(null);
              }}
            />

            <PrimaryButton label="Log in" onPress={submit} />
          </View>

          <Link href="/(auth)/signup" style={styles.link}>
            New here? Create an account
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
  brand: { fontSize: 40, fontWeight: "800", color: Palette.forestDark },
  tag: { fontSize: 16, color: Palette.muted, marginBottom: 16 },
  form: { alignSelf: "stretch", gap: 12 },
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
  error: {
    color: Palette.danger,
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 4,
  },
  link: {
    marginTop: 16,
    color: Palette.forest,
    fontWeight: "600",
    fontSize: 15,
  },
});
