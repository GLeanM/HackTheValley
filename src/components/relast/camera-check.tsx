import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { Modal, Platform, StyleSheet, Text, View } from 'react-native';

import { LiveCamera } from '@/components/relast/live-camera';
import { PrimaryButton } from '@/components/relast/primary-button';
import { WebCamera } from '@/components/relast/web-camera';
import { Palette, Radius } from '@/constants/palette';

interface Props {
  visible: boolean;
  onClose: () => void;
}

/** Popup opened by the middle Scan tab: live camera, then a result card confirming the camera works. */
export function CameraCheck({ visible, onClose }: Props) {
  const [photo, setPhoto] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);

  const close = () => {
    setPhoto(null);
    setProblem(null);
    onClose();
  };

  const cameraProps = {
    visible: visible && !photo && !problem,
    onClose: close,
    onCapture: setPhoto,
    onUnavailable: setProblem,
  };

  return (
    <>
      {Platform.OS === 'web' ? <WebCamera {...cameraProps} /> : <LiveCamera {...cameraProps} />}
      <Modal visible={visible && (!!photo || !!problem)} transparent animationType="fade" onRequestClose={close}>
        <View style={styles.backdrop}>
          <View style={styles.card}>
            <Text style={styles.title}>{photo ? 'Camera works ✓' : 'Camera not available'}</Text>
            {photo ? (
              <Image source={{ uri: photo }} style={styles.image} contentFit="cover" />
            ) : (
              <Text style={styles.body}>{problem}</Text>
            )}
            {photo && (
              <PrimaryButton
                label="Use in assistant"
                onPress={() => {
                  close();
                  router.push('/assistant');
                }}
              />
            )}
            <PrimaryButton variant="soft" label={photo ? 'Retake' : 'Try again'} onPress={() => { setPhoto(null); setProblem(null); }} />
            <PrimaryButton variant="soft" label="Close" onPress={close} />
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { width: '100%', backgroundColor: Palette.card, borderRadius: Radius.card, padding: 20, gap: 12 },
  title: { fontSize: 20, fontWeight: '700', color: Palette.ink, textAlign: 'center' },
  body: { color: Palette.muted, textAlign: 'center' },
  image: { width: '100%', height: 280, borderRadius: Radius.input, backgroundColor: Palette.mint },
});
