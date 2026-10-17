import { useEffect, useRef } from 'react';

import { handleClassifierMessage, registerClassifierHost } from '@/services/ai';

/** Web: runs public/classifier.html in a hidden iframe so the trash classifier runs in the browser. */
export function ClassifierHost() {
  const ref = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.source === ref.current?.contentWindow) handleClassifierMessage(e.data);
    };
    window.addEventListener('message', onMessage);
    registerClassifierHost((message) => ref.current?.contentWindow?.postMessage(message, window.location.origin));
    return () => {
      window.removeEventListener('message', onMessage);
      registerClassifierHost(null);
    };
  }, []);

  return <iframe ref={ref} src="/classifier.html" title="Relast classifier" style={{ display: 'none' }} />;
}
