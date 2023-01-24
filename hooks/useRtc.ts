import WebRtcContext from 'contexts/WebRtcContext';
import { useContext } from 'react';

function useRtc() {
    const rtcCtx = useContext(WebRtcContext);
    if (!rtcCtx) {
        throw 'useRtc called without providing a WebsocketContext.Provider'
    }
    return rtcCtx;
}

export default useRtc;