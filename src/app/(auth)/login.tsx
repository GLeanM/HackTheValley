import { Link } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Mascot } from '@/components/relast/mascot';
import { PrimaryButton } from '@/components/relast/primary-button';
import { Palette } from '@/constants/palette';
import { useApp } from '@/state/app-context';

export default function LoginScreen() {
  const { signIn } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError('Enter a valid email address.');
    if (password.length < 6) return setError('Password must be at least 6 characters.');
    setError(null);
    // Mock auth: derive a display name from the email until Supabase is connected.
    const e = email.trim();
    signIn({ name: e.split('@')[0].replace(/^./, (c) => c.toUpperCase()), email: e });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          <Mascot size={96} />
          <Text style={styles.brand}>Relast</Text>
          <Text style={styles.tag}>Make it last. Do it fast.</Text>

          <View style={styles.form}>
            <TextInput style={styles.input} placeholder="Email" placeholderTextColor={Palette.muted} autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
            <TextInput style={styles.input} placeholder="Password" placeholderTextColor={Palette.muted} secureTextEntry value={password} onChangeText={setPassword} />
            {error && <Text style={styles.error}>{error}</Text>}
            <PrimaryButton label="Log in" onPress={submit} />
          </View>
          <Link href="/signup" style={styles.link}>
            New here? Create an account
          </Link>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Palette.cream },
  body: { padding: 24, alignItems: 'center', gap: 8, flexGrow: 1, justifyContent: 'center' },
  brand: { fontSize: 40, fontWeight: '800', color: Palette.forestDark },
  tag: { fontSize: 16, color: Palette.muted, marginBottom: 16 },
  form: { alignSelf: 'stretch', gap: 12 },
  input: { backgroundColor: Palette.card, borderRadius: 16, borderWidth: 1, borderColor: Palette.border, paddingHorizontal: 18, height: 54, fontSize: 16, color: Palette.ink },
  error: { color: Palette.danger, fontSize: 14 },
  link: { marginTop: 16, color: Palette.forest, fontWeight: '600', fontSize: 15 },
});
