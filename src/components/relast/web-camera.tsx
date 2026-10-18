import { createElement, forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Palette } from '@/constants/palette';

interface Props {
  onCapture: (uri: string) => void;
}

export interface WebCameraHandle {
  capture: () => void;
}

/** Inline browser camera preview via getUserMedia. Web only — native uses expo-image-picker. */
export const WebCamera = forwardRef<WebCameraHandle, Props>(function WebCamera({ onCapture }, ref) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [ready, setReady] = useState(false);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const mediaDevices = navigator.mediaDevices;
    if (!mediaDevices?.getUserMedia) {
      setUnavailable(true);
      return;
    }

    mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          video.play().then(() => {
            if (!cancelled) setReady(true);
          }).catch(() => {
            stream.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
            if (!cancelled) setUnavailable(true);
          });
        }
      })
      .catch(() => {
        if (!cancelled) setUnavailable(true);
      });

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, []);

  const snap = () => {
    if (!ready) return;
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    if (!context) return;
    context.translate(canvas.width, 0);
    context.scale(-1, 1);
    context.drawImage(video, 0, 0);
    onCapture(canvas.toDataURL('image/jpeg', 0.7));
  };

  useImperativeHandle(ref, () => ({ capture: snap }), [ready]);

  return (
    <View style={styles.root}>
      {unavailable ? (
        <Text style={styles.hint}>Please enable camera access in settings</Text>
      ) : (
        <>
          {createElement('video', {
            ref: videoRef,
            playsInline: true,
            muted: true,
            autoPlay: true,
            style: { width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' },
          })}
          {!ready && <Text style={styles.hint}>Starting camera…</Text>}
        </>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Palette.sand, alignItems: 'center', justifyContent: 'center' },
  hint: { color: Palette.muted, fontSize: 14, fontWeight: '600', textAlign: 'center', paddingHorizontal: 16 },
});
