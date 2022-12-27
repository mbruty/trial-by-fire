import { useContext } from 'react';
import { WebsocketContext } from '../contexts/websocketContext';

export default function() {
    const websocketContext = useContext(WebsocketContext);
    if (!websocketContext) {
        throw 'useSocket called without providing a WebsocketContext.Provider'
    }
    return websocketContext;
}