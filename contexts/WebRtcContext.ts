import { createContext } from 'react';

const servers = {
    iceServers: [
        {
            urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
        },
    ],
    iceCandidatePoolSize: 10,
};


export class WebRtcConnection {
    private peerConnection: RTCPeerConnection;
    public localStream: MediaStream | null = null
    public remoteStream: MediaStream | null = null;

    constructor() {
        this.peerConnection = new RTCPeerConnection(servers);
        this.ontrack = this.ontrack.bind(this);
        this.onicecandidate = this.onicecandidate.bind(this);

        this.peerConnection.ontrack = this.ontrack;
        this.peerConnection.onicecandidate = this.onicecandidate;
    }

    private ontrack(event: RTCTrackEvent) {
        event.streams[0].getTracks().forEach(track => {
            this.remoteStream?.addTrack(track);
        });
    }

    private onicecandidate(event: RTCPeerConnectionIceEvent) {
        console.log(event.candidate?.toJSON());
        return;
    }

    public async start() {
        this.localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    }

    public async createOffer(roomId: string): Promise<boolean> {
        try {
            // Create offer
            const offerDescription = await this.peerConnection.createOffer();
            this.peerConnection.setLocalDescription(offerDescription);

            const offer = {
                sdp: offerDescription.sdp,
                type: offerDescription.type
            };

            console.log({offer, roomId});

            return true;
        } catch {
            return false;
        }
    }
}

const WebRtcContext = createContext<WebRtcConnection | undefined>(undefined);

export default WebRtcContext;