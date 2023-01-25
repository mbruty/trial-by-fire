import 'styles/globals.css'
import type { AppProps } from 'next/app'
import { ChakraProvider } from '@chakra-ui/react'
import { useEffect, useMemo, useState } from 'react'
import { SocketObservable, WebsocketContext } from 'contexts/websocketContext';
import WebRtcContext, { WebRtcConnection } from 'contexts/WebRtcContext';

export default function App({ Component, pageProps }: AppProps) {
  const [webRtcConnection, setWebRtcConnection] = useState<WebRtcConnection | undefined>();

  const ws = useMemo(() => new SocketObservable(), []);

  useEffect(() => {
    // eslint-disable-next-line
    // @ts-ignore
    if (!window.Cypress) window.Cypress = {}
    // eslint-disable-next-line
    // @ts-ignore
    window.Cypress.ws = ws;
  }, [ws]);

  useEffect(() => {
    // Only setup the webrtc connection on the client side
    setWebRtcConnection(new WebRtcConnection());
    fetch('/api/ws/socket-io');
  }, []);

  return (
    <ChakraProvider>
      <WebsocketContext.Provider value={ws}>
        <WebRtcContext.Provider value={webRtcConnection}>
          <Component {...pageProps} />
        </WebRtcContext.Provider>
      </WebsocketContext.Provider>
    </ChakraProvider >
  );
}
