import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { Palette, Radius } from '@/constants/palette';

interface Props {
  visible: boolean;
  onCapture: (uri: string) => void;
  onClose: () => void;
  onUnavailable: (message: string) => void;
}

/** Live in-app camera preview for iOS / Android (works in Expo Go). Web uses WebCamera. */
export function LiveCamera({ visible, onCapture, onClose, onUnavailable }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView | null>(null);
  const [ready, setReady] = useState(false);
  const [capturing, setCapturing] = useState(false);

  useEffect(() => {
    if (!visible) {
      setReady(false);
      return;
    }
    if (permission && !permission.granted) {
      if (permission.canAskAgain) {
        requestPermission().then((res) => {
          if (!res.granted) onUnavailable('Camera access is off. Choose a photo from your device instead?');
        });
      } else {
        onUnavailable('Camera access is off. Choose a photo from your device instead?');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, permission?.granted]);

  const snap = async () => {
    if (!ready || capturing || !cameraRef.current) return;
    setCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.5, exif: false, base64: false });
      onCapture(photo.uri);
    } catch {
      onUnavailable('We could not take the photo. Choose a photo from your device instead?');
    } finally {
      setCapturing(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.root}>
        <View style={styles.preview}>
          {visible && permission?.granted && (
            <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" onCameraReady={() => setReady(true)} />
          )}
          <View pointerEvents="none" style={[styles.corner, styles.tl]} />
          <View pointerEvents="none" style={[styles.corner, styles.tr]} />
          <View pointerEvents="none" style={[styles.corner, styles.bl]} />
          <View pointerEvents="none" style={[styles.corner, styles.br]} />
          {!ready && <Text style={styles.hint}>Starting camera…</Text>}
        </View>
        <View style={styles.controls}>
          <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close camera" style={styles.side}>
            <Ionicons name="close" size={26} color={Palette.white} />
          </Pressable>
          <Pressable
            onPress={snap}
            disabled={!ready || capturing}
            accessibilityRole="button"
            accessibilityLabel="Take photo"
            style={[styles.shutter, (!ready || capturing) && { opacity: 0.4 }]}>
            <View style={styles.shutterInner} />
          </Pressable>
          <View style={styles.side} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Palette.ink },
  preview: { flex: 1, overflow: 'hidden', margin: 16, marginTop: 56, borderRadius: Radius.card, backgroundColor: Palette.forestDark },
  corner: { position: 'absolute', width: 30, height: 30, borderColor: Palette.leaf, borderWidth: 0 },
  tl: { top: 14, left: 14, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 10 },
  tr: { top: 14, right: 14, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 10 },
  bl: { bottom: 14, left: 14, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 10 },
  br: { bottom: 14, right: 14, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 10 },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 32, paddingBottom: 40 },
  side: { width: 52, height: 52, borderRadius: Radius.pill, alignItems: 'center', justifyContent: 'center' },
  shutter: { width: 76, height: 76, borderRadius: Radius.pill, borderWidth: 4, borderColor: Palette.white, alignItems: 'center', justifyContent: 'center' },
  shutterInner: { width: 56, height: 56, borderRadius: Radius.pill, backgroundColor: Palette.white },
  hint: { position: 'absolute', alignSelf: 'center', top: '50%', color: Palette.white },
});
