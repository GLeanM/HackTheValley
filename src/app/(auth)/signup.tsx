import { Link } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Mascot } from '@/components/relast/mascot';
import { PrimaryButton } from '@/components/relast/primary-button';
import { Palette } from '@/constants/palette';
import { useApp } from '@/state/app-context';

export default function SignUpScreen() {
  const { signIn } = useApp();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    if (!name.trim()) return setError('Tell us your name.');
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError('Enter a valid email address.');
    if (password.length < 6) return setError('Password must be at least 6 characters.');
    setError(null);
    signIn({ name: name.trim(), email: email.trim() });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          <Mascot size={80} />
          <Text style={styles.title}>Create your account</Text>
          <View style={styles.form}>
            <TextInput style={styles.input} placeholder="Name" placeholderTextColor={Palette.muted} value={name} onChangeText={setName} />
            <TextInput style={styles.input} placeholder="Email" placeholderTextColor={Palette.muted} autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
            <TextInput style={styles.input} placeholder="Password" placeholderTextColor={Palette.muted} secureTextEntry value={password} onChangeText={setPassword} />
            {error && <Text style={styles.error}>{error}</Text>}
            <PrimaryButton label="Sign up" onPress={submit} />
          </View>
          <Link href="/login" style={styles.link}>
            I already have an account
          </Link>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Palette.cream },
  body: { padding: 24, alignItems: 'center', gap: 8, flexGrow: 1, justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: '800', color: Palette.forestDark, marginBottom: 16 },
  form: { alignSelf: 'stretch', gap: 12 },
  input: { backgroundColor: Palette.card, borderRadius: 16, borderWidth: 1, borderColor: Palette.border, paddingHorizontal: 18, height: 54, fontSize: 16, color: Palette.ink },
  error: { color: Palette.danger, fontSize: 14 },
  link: { marginTop: 16, color: Palette.forest, fontWeight: '600', fontSize: 15 },
});
