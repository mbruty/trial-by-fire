import { useContext } from 'react';
import { WebsocketContext } from 'contexts/websocketContext';

function useSocket() {
    const websocketContext = useContext(WebsocketContext);
    if (!websocketContext) {
        throw 'useSocket called without providing a WebsocketContext.Provider'
    }
    return websocketContext;
}

export default useSocket;