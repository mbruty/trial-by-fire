import WebRtcContext from 'contexts/WebRtcContext';
import { useContext } from 'react';

function useRtc() {
    const rtcCtx = useContext(WebRtcContext);
    if (!rtcCtx) {
        return null;
    }
    return rtcCtx;
}

export default useRtc;