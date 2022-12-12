import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { ChakraProvider } from '@chakra-ui/react'
import { useEffect } from 'react'
import { io } from 'socket.io-client'
export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    fetch('/api/ws/socket-io').finally(() => {
      const socket = io()

      socket.on('connect', () => {
        console.log('connect')
        socket.emit('hello')
      })

      socket.on('hello', data => {
        console.log('hello', data)
      })

      socket.on('a user connected', () => {
        console.log('a user connected')
      })

      socket.on('disconnect', () => {
        console.log('disconnect')
      })
    })
  }, []);
  
  return <ChakraProvider><Component {...pageProps} /></ChakraProvider>
}
