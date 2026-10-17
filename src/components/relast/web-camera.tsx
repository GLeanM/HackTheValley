import { Ionicons } from '@expo/vector-icons';
import { createElement, useEffect, useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { Palette, Radius } from '@/constants/palette';

interface Props {
  visible: boolean;
  onCapture: (uri: string) => void;
  onClose: () => void;
  onUnavailable: (message: string) => void;
}

/** Browser webcam (e.g. a MacBook camera) via getUserMedia. Web only — native uses expo-image-picker. */
export function WebCamera({ visible, onCapture, onClose, onUnavailable }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    setReady(false);
    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: 'environment' }, audio: false })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          video.play().catch(() => {});
          setReady(true);
        }
      })
      .catch(() => {
        if (cancelled) return;
        onUnavailable('Camera access was blocked or no camera was found. Allow camera access in your browser, or choose a photo instead.');
      });
    if (!navigator.mediaDevices) onUnavailable('This browser cannot open the camera. Choose a photo instead.');
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const snap = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    onCapture(canvas.toDataURL('image/jpeg', 0.7));
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.root}>
        <View style={styles.videoWrap}>
          {createElement('video', {
            ref: videoRef,
            playsInline: true,
            muted: true,
            autoPlay: true,
            // Mirrored like a selfie view; the captured frame is not mirrored.
            style: { width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' },
          })}
        </View>
        <View style={styles.controls}>
          <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close camera" style={styles.side}>
            <Ionicons name="close" size={26} color={Palette.white} />
          </Pressable>
          <Pressable
            onPress={snap}
            disabled={!ready}
            accessibilityRole="button"
            accessibilityLabel="Take photo"
            style={[styles.shutter, !ready && { opacity: 0.4 }]}>
            <View style={styles.shutterInner} />
          </Pressable>
          <View style={styles.side} />
        </View>
        {!ready && <Text style={styles.hint}>Starting camera…</Text>}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Palette.ink },
  videoWrap: { flex: 1, overflow: 'hidden', margin: 16, borderRadius: Radius.card, backgroundColor: Palette.forestDark },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 32, paddingBottom: 32 },
  side: { width: 52, height: 52, borderRadius: Radius.pill, alignItems: 'center', justifyContent: 'center' },
  shutter: { width: 76, height: 76, borderRadius: Radius.pill, borderWidth: 4, borderColor: Palette.white, alignItems: 'center', justifyContent: 'center' },
  shutterInner: { width: 56, height: 56, borderRadius: Radius.pill, backgroundColor: Palette.white },
  hint: { position: 'absolute', alignSelf: 'center', top: '50%', color: Palette.white },
});
