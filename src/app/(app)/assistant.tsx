import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';

import { useRef, useState } from 'react';
import { Alert, Animated, Easing, Keyboard, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CategoryWheel } from '@/components/relast/category-wheel';
import { CircleButton } from '@/components/relast/circle-button';
import { PrimaryButton } from '@/components/relast/primary-button';
import { WebCamera, type WebCameraHandle } from '@/components/relast/web-camera';
import { Palette } from '@/constants/palette';
import { aiProvider, CATEGORIES, CATEGORY_META, type Category } from '@/services/ai';
import { useApp } from '@/state/app-context';

const PLACEHOLDER = 'Add some text!';

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
  const [auto, setAuto] = useState(false);
  const [focusOverlayMounted, setFocusOverlayMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);
  const cameraBusy = useRef(false);
  const webCameraRef = useRef<WebCameraHandle | null>(null);
  const screenRootRef = useRef<View | null>(null);
  const inputSlotRef = useRef<View | null>(null);
  const inputTextRef = useRef<TextInput | null>(null);
  const inputContentTop = useRef(0);
  const scrollOffset = useRef(0);
  const scrimOpacity = useRef(new Animated.Value(0)).current;
  const isLeavingTextMode = useRef(false);
  const [inputFrame, setInputFrame] = useState({ top: 0, left: 0, width: 0, height: 54 });
  const [cameraDenied, setCameraDenied] = useState(false);

  const canSubmit = (!!imageUri || text.trim().length >= 3) && !loading;

  const goHome = () => (router.canGoBack() ? router.back() : router.replace('/'));

  const onWheelChange = (nextCategory: Category, source: 'swipe' | 'tap') => {
    setCategory(nextCategory);
    if (source === 'tap') setAuto(false);
  };

  const enterTextMode = () => {
    if (focusOverlayMounted) return;
    isLeavingTextMode.current = false;
    scrimOpacity.stopAnimation();
    scrimOpacity.setValue(0);
    setFocusOverlayMounted(true);
    requestAnimationFrame(() => {
      Animated.timing(scrimOpacity, {
        toValue: 0.88,
        duration: 280,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    });
  };

  const leaveTextMode = () => {
    if (!focusOverlayMounted || isLeavingTextMode.current) return;
    isLeavingTextMode.current = true;
    inputTextRef.current?.blur();
    Keyboard.dismiss();
    scrimOpacity.stopAnimation();
    Animated.timing(scrimOpacity, {
      toValue: 0,
      duration: 220,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished) return;
      setFocusOverlayMounted(false);
      isLeavingTextMode.current = false;
    });
  };

  const measureInputSlot = () => {
    const screenRoot = screenRootRef.current;
    const inputSlot = inputSlotRef.current;
    if (!screenRoot || !inputSlot) return;

    screenRoot.measureInWindow((rootX, rootY) => {
      inputSlot.measureInWindow((x, y, width, height) => {
        inputContentTop.current = y - rootY + scrollOffset.current;
        setInputFrame({ top: inputContentTop.current - scrollOffset.current, left: x - rootX, width, height });
      });
    });
  };

  const pickFromLibrary = async () => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
      if (!res.canceled) setImageUri(res.assets[0].uri);
    } catch {
      Alert.alert('Photo unavailable', 'We could not open your photo library.');
    }
  };

  const offerLibrary = (message: string) => {
    // RN-web's Alert.alert is a no-op.
    if (Platform.OS === 'web') {
      if (window.confirm(message)) pickFromLibrary();
      return;
    }
    Alert.alert('Camera unavailable', message, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Choose photo', onPress: pickFromLibrary },
    ]);
  };

  const takePhoto = async () => {
    // Browser (e.g. MacBook webcam): the system camera sheet doesn't exist, so use getUserMedia.
    if (Platform.OS === 'web') {
      webCameraRef.current?.capture();
      return;
    }
    if (cameraBusy.current) return;
    cameraBusy.current = true;
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        setCameraDenied(true);
        return;
      }
      setCameraDenied(false);
      const res = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.5,
        allowsEditing: false,
        exif: false,
        base64: false,
      });
      if (!res.canceled && res.assets?.[0]) setImageUri(res.assets[0].uri);
    } catch {
      // Camera unavailable (e.g. simulator): offer the library instead.
      offerLibrary('We could not open the camera. Choose a photo from your device instead?');
    } finally {
      cameraBusy.current = false;
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

  const askButton = (
    <PrimaryButton label="Ask Relast" onPress={submit} disabled={!canSubmit} loading={loading} />
  );
  const errorBox = error && (
    <View style={styles.errorBox} accessibilityLiveRegion="polite">
      <Ionicons name="alert-circle-outline" size={18} color={Palette.danger} />
      <Text style={styles.errorText}>{error}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View ref={screenRootRef} style={styles.screen}>
        <View style={styles.header}>
          <View style={{ width: 40 }} />
          <Text style={styles.title}>{TITLES[category]}</Text>
          <View style={{ width: 40 }} />
        </View>
        <ScrollView
          contentContainerStyle={styles.scroll}
          bounces={false}
          alwaysBounceVertical={false}
          overScrollMode="never"
          keyboardShouldPersistTaps="handled"
          scrollEventThrottle={16}
          onScroll={(event) => {
            scrollOffset.current = event.nativeEvent.contentOffset.y;
            setInputFrame((frame) => ({ ...frame, top: inputContentTop.current - scrollOffset.current }));
          }}>
          <View ref={inputSlotRef} onLayout={measureInputSlot} style={styles.inputSlot} />
          <View style={styles.frame} accessibilityLabel={imageUri ? 'Selected photo' : 'Camera frame'}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={StyleSheet.absoluteFill} contentFit="cover" />
            ) : Platform.OS === 'web' ? (
              <WebCamera ref={webCameraRef} onCapture={setImageUri} />
            ) : (
              <Pressable onPress={takePhoto} accessibilityRole="button" accessibilityLabel="Take a photo" style={styles.framePlaceholder}>
                <Ionicons name="scan-outline" size={44} color={Palette.leaf} />
                <Text style={styles.frameHint}>{cameraDenied ? 'Please enable camera access in settings' : 'Center an item in the frame'}</Text>
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
              <Pill icon="trash-outline" label="Remove" onPress={() => setImageUri(null)} />
            </View>
          )}

          <View style={styles.wheelRow}>
            <CategoryWheel value={category} onChange={onWheelChange} onSelectedPress={takePhoto} dimmed={auto} />
          </View>

          <Text style={styles.blurb}>{auto ? 'Relast will figure out the category' : CATEGORY_META[category].blurb}</Text>
          <View style={styles.autoRow}>
            <CircleButton icon="close" label="Close" onPress={goHome} size={48} alignIconToCenter />
            <CircleButton icon="images-outline" label="Gallery" onPress={pickFromLibrary} size={48} filled alignIconToCenter />
          </View>
        </ScrollView>

        <View style={styles.bottom}>
          {errorBox}
          {askButton}
        </View>
        {focusOverlayMounted && (
          <View style={styles.focusOverlay}>
            <Animated.View pointerEvents="none" style={[styles.focusScrim, { opacity: scrimOpacity }]} />
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={leaveTextMode}
              accessibilityRole="button"
              accessibilityLabel="Return to assistant"
            />
          </View>
        )}
        <View style={[styles.inputCard, styles.inputLayer, inputFrame]}>
          <TextInput
            ref={inputTextRef}
            multiline
            style={styles.input}
            underlineColorAndroid="transparent"
            placeholder={PLACEHOLDER}
            placeholderTextColor={Palette.muted}
            value={text}
            onChangeText={setText}
            onFocus={enterTextMode}
            editable={!loading}
            textAlignVertical="top"
          />
        </View>
      </View>
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
  screen: { flex: 1, position: 'relative' },
  scroll: { padding: 20, gap: 14, flexGrow: 1 },
  inputSlot: { height: 54 },
  inputCard: { flexDirection: 'row', gap: 10, backgroundColor: Palette.card, borderRadius: 20, borderWidth: 1, borderColor: Palette.border, paddingHorizontal: 14, paddingVertical: 7, alignItems: 'center', minHeight: 54 },
  inputLayer: { position: 'absolute', zIndex: 11 },
  input: { flex: 1, minHeight: 38, maxHeight: 86, fontSize: 16, color: Palette.ink, outlineColor: 'transparent', outlineWidth: 0 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingTop: 4 },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '700', color: Palette.forestDark },
  frame: { flexGrow: 1, minHeight: 210, borderRadius: 24, overflow: 'hidden', backgroundColor: Palette.sand },
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
  wheelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  blurb: { textAlign: 'center', color: Palette.muted, fontSize: 15 },
  autoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  autoChip: { alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, borderWidth: 1.5, borderColor: Palette.mintDeep, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: Palette.card },
  autoChipOn: { backgroundColor: Palette.forest, borderColor: Palette.forest },
  autoText: { color: Palette.forest, fontWeight: '600', fontSize: 14 },
  bottom: { paddingHorizontal: 20, paddingBottom: 12, paddingTop: 8, gap: 10 },
  errorBox: { flexDirection: 'row', gap: 8, alignItems: 'center', backgroundColor: Palette.dangerBg, borderRadius: 14, padding: 12 },
  errorText: { color: Palette.danger, flex: 1, fontSize: 14 },
  focusOverlay: { ...StyleSheet.absoluteFill, zIndex: 10 },
  focusScrim: { ...StyleSheet.absoluteFill, backgroundColor: Palette.ink },
});
