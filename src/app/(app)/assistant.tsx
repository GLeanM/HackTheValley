import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CategoryWheel } from '@/components/relast/category-wheel';
import { CircleButton } from '@/components/relast/circle-button';
import { PrimaryButton } from '@/components/relast/primary-button';
import { Palette } from '@/constants/palette';
import { aiProvider, CATEGORIES, CATEGORY_META, type Category } from '@/services/ai';
import { useApp } from '@/state/app-context';

const PLACEHOLDER = 'What is this, and how can I use it sustainably?';

const TITLES: Record<Category, string> = {
  lifecycle: 'Give it a second life',
  sorter: 'Sort it right',
  food: 'Rescue your leftovers',
};
const isCategory = (v: unknown): v is Category => typeof v === 'string' && (CATEGORIES as string[]).includes(v);

export default function AssistantScreen() {
  const { addHistory } = useApp();
  const params = useLocalSearchParams<{ category?: string }>();
  const preset = isCategory(params.category) ? params.category : null;
  const [text, setText] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [category, setCategory] = useState<Category>(preset ?? 'sorter');
  const [auto, setAuto] = useState(!preset);
  const [textMode, setTextMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);

  const canSubmit = (!!imageUri || text.trim().length >= 3) && !loading;

  const goHome = () => (router.canGoBack() ? router.back() : router.replace('/'));

  const pickFromLibrary = async () => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
      if (!res.canceled) setImageUri(res.assets[0].uri);
    } catch {
      Alert.alert('Photo unavailable', 'We could not open your photo library.');
    }
  };

  const takePhoto = async () => {
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) throw new Error('denied');
      const res = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.7 });
      if (!res.canceled) setImageUri(res.assets[0].uri);
    } catch {
      // Camera denied/unavailable (e.g. simulator): offer the library instead.
      Alert.alert('Camera unavailable', 'Choose a photo from your device instead?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Choose photo', onPress: pickFromLibrary },
      ]);
    }
  };

  const submit = async () => {
    if (!canSubmit || inFlight.current) return;
    inFlight.current = true;
    setLoading(true);
    setError(null);
    const request = { text: text.trim(), imageUri, category: auto ? ('auto' as const) : category };
    try {
      const response = await aiProvider.ask(request);
      const entry = addHistory({ ...request, response });
      router.replace({ pathname: '/answer', params: { id: entry.id } });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
    } finally {
      inFlight.current = false;
      setLoading(false);
    }
  };

  const onWheelChange = (c: Category) => {
    setCategory(c);
    setAuto(false);
  };

  const askButton = (
    <PrimaryButton label="Ask Relast" onPress={submit} disabled={!canSubmit} loading={loading} />
  );
  const errorBox = error && (
    <View style={styles.errorBox} accessibilityLiveRegion="polite">
      <Ionicons name="alert-circle-outline" size={18} color={Palette.danger} />
      <Text style={styles.errorText}>{error}</Text>
    </View>
  );

  if (textMode) {
    return (
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.textHeader}>
            <Pressable onPress={() => setTextMode(false)} accessibilityRole="button" accessibilityLabel="Back to assistant" style={styles.textBack}>
              <Ionicons name="chevron-down" size={22} color={Palette.forest} />
              <Text style={styles.textBackLabel}>Back to camera view</Text>
            </Pressable>
            <Text style={styles.catTag}>{auto ? 'Auto-detect' : CATEGORY_META[category].label}</Text>
          </View>
          <TextInput
            autoFocus
            multiline
            style={styles.bigInput}
            placeholder={PLACEHOLDER}
            placeholderTextColor={Palette.muted}
            value={text}
            onChangeText={setText}
            textAlignVertical="top"
            editable={!loading}
          />
          <View style={styles.bottom}>
            {errorBox}
            {askButton}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <Pressable onPress={goHome} accessibilityRole="button" accessibilityLabel="Back" style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={Palette.forestDark} />
          </Pressable>
          <Text style={styles.title}>{auto ? 'Ask Relast' : TITLES[category]}</Text>
          <View style={{ width: 40 }} />
        </View>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.inputCard}>
            <TextInput
              multiline
              style={styles.input}
              placeholder={PLACEHOLDER}
              placeholderTextColor={Palette.muted}
              value={text}
              onChangeText={setText}
              editable={!loading}
              textAlignVertical="top"
            />
            <Pressable onPress={() => setTextMode(true)} accessibilityRole="button" accessibilityLabel="Expand to text-only mode" hitSlop={10}>
              <Ionicons name="expand-outline" size={22} color={Palette.forest} />
            </Pressable>
          </View>

          <View style={styles.frame} accessibilityLabel={imageUri ? 'Selected photo' : 'Camera frame'}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={StyleSheet.absoluteFill} contentFit="cover" />
            ) : (
              <Pressable onPress={takePhoto} accessibilityRole="button" accessibilityLabel="Take a photo" style={styles.framePlaceholder}>
                <Ionicons name="scan-outline" size={44} color={Palette.leaf} />
                <Text style={styles.frameHint}>Center an item in the frame</Text>
              </Pressable>
            )}
            <View pointerEvents="none" style={[styles.corner, styles.tl]} />
            <View pointerEvents="none" style={[styles.corner, styles.tr]} />
            <View pointerEvents="none" style={[styles.corner, styles.bl]} />
            <View pointerEvents="none" style={[styles.corner, styles.br]} />
          </View>
          {imageUri && (
            <View style={styles.previewActions}>
              <Pill icon="camera-outline" label="Retake" onPress={takePhoto} />
              <Pill icon="images-outline" label="Gallery" onPress={pickFromLibrary} />
              <Pill icon="trash-outline" label="Remove" onPress={() => setImageUri(null)} />
            </View>
          )}
          {!imageUri && (
            <View style={styles.previewActions}>
              <Pill icon="images-outline" label="Gallery" onPress={pickFromLibrary} />
            </View>
          )}

          <View style={styles.wheelRow}>
            <CircleButton icon="close" label="Close" onPress={goHome} />
            <CategoryWheel value={category} onChange={onWheelChange} dimmed={auto} />
            <CircleButton icon="camera-outline" label="Photo" onPress={takePhoto} filled />
          </View>

          <Text style={styles.blurb}>{auto ? 'Relast will figure out the category' : CATEGORY_META[category].blurb}</Text>
          <Pressable
            onPress={() => setAuto((a) => !a)}
            accessibilityRole="switch"
            accessibilityState={{ checked: auto }}
            style={[styles.autoChip, auto && styles.autoChipOn]}>
            <Ionicons name="sparkles-outline" size={16} color={auto ? Palette.white : Palette.forest} />
            <Text style={[styles.autoText, auto && { color: Palette.white }]}>Auto-detect</Text>
          </Pressable>
        </ScrollView>

        <View style={styles.bottom}>
          {errorBox}
          {askButton}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Pill({ icon, label, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={styles.pill}>
      <Ionicons name={icon} size={15} color={Palette.forest} />
      <Text style={styles.pillText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Palette.cream },
  scroll: { padding: 20, gap: 14, flexGrow: 1 },
  inputCard: { flexDirection: 'row', gap: 10, backgroundColor: Palette.card, borderRadius: 20, borderWidth: 1, borderColor: Palette.border, padding: 14, alignItems: 'flex-start' },
  input: { flex: 1, minHeight: 56, maxHeight: 110, fontSize: 16, color: Palette.ink },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingTop: 4 },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '700', color: Palette.forestDark },
  frame: { height: 210, borderRadius: 24, overflow: 'hidden', backgroundColor: Palette.sand },
  framePlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  frameHint: { color: Palette.muted, fontSize: 14, fontWeight: '600' },
  corner: { position: 'absolute', width: 30, height: 30, borderColor: Palette.leaf, borderWidth: 0 },
  tl: { top: 14, left: 14, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 10 },
  tr: { top: 14, right: 14, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 10 },
  bl: { bottom: 14, left: 14, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 10 },
  br: { bottom: 14, right: 14, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 10 },
  previewActions: { flexDirection: 'row', gap: 8, justifyContent: 'center' },
  pill: { flexDirection: 'row', gap: 5, alignItems: 'center', backgroundColor: Palette.mint, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  pillText: { color: Palette.forest, fontWeight: '600', fontSize: 13 },
  wheelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  blurb: { textAlign: 'center', color: Palette.muted, fontSize: 15 },
  autoChip: { alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, borderWidth: 1.5, borderColor: Palette.mintDeep, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: Palette.card },
  autoChipOn: { backgroundColor: Palette.forest, borderColor: Palette.forest },
  autoText: { color: Palette.forest, fontWeight: '600', fontSize: 14 },
  bottom: { paddingHorizontal: 20, paddingBottom: 12, paddingTop: 8, gap: 10 },
  errorBox: { flexDirection: 'row', gap: 8, alignItems: 'center', backgroundColor: Palette.dangerBg, borderRadius: 14, padding: 12 },
  errorText: { color: Palette.danger, flex: 1, fontSize: 14 },
  textHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8 },
  textBack: { flexDirection: 'row', alignItems: 'center', gap: 4, padding: 6 },
  textBackLabel: { color: Palette.forest, fontWeight: '600', fontSize: 15 },
  catTag: { color: Palette.muted, fontSize: 13, fontWeight: '600' },
  bigInput: { flex: 1, margin: 20, marginTop: 8, fontSize: 20, lineHeight: 28, color: Palette.ink },
});
