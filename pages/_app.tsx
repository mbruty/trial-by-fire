import 'styles/globals.css'
import type { AppProps } from 'next/app'
import { ChakraProvider } from '@chakra-ui/react'
import { useEffect } from 'react'
import { SocketObservable, WebsocketContext } from 'contexts/websocketContext';

export default function App({ Component, pageProps }: AppProps) {

  useEffect(() => {
    fetch('/api/ws/socket-io');
  }, []);

  return (
    <ChakraProvider>
      <WebsocketContext.Provider value={new SocketObservable()}>
        <Component {...pageProps} />
      </WebsocketContext.Provider>
    </ChakraProvider>
  );
}
