import Constants from 'expo-constants';
import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

import { handleClassifierMessage, registerClassifierHost } from '@/services/ai';

/**
 * Native: runs public/classifier.html in an invisible WebView so the trash classifier
 * runs on the phone. The page is served by the Expo dev server, so this only works in
 * development; without a dev server host the classifier stays off and the app falls back.
 */
const hostUri = Constants.expoConfig?.hostUri;
const PAGE_URL = hostUri ? `http://${hostUri}/classifier.html` : null;

export function ClassifierHost() {
  const ref = useRef<WebView>(null);

  useEffect(() => () => registerClassifierHost(null), []);

  if (!PAGE_URL) return null;
  return (
    <View style={styles.hidden} pointerEvents="none">
      <WebView
        ref={ref}
        source={{ uri: PAGE_URL }}
        onLoadStart={() =>
          registerClassifierHost((message) =>
            ref.current?.injectJavaScript(`window.relastClassify && window.relastClassify(${message}); true;`),
          )
        }
        onMessage={(e) => handleClassifierMessage(e.nativeEvent.data)}
        onError={() => registerClassifierHost(null)}
        onHttpError={() => registerClassifierHost(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  hidden: { position: 'absolute', width: 1, height: 1, opacity: 0 },
});
