import axios, { AxiosResponse } from 'axios';
import { Candidate, IceCall, Offer } from 'database/models/iceCalls';
import { createContext, MutableRefObject } from 'react';

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
    public remoteId: string | null = null;
    public localId: string | null = null;
    private roomId = '';
    private isInitalised = false;
    private offerCreated = false;
    private isHost = true;

    constructor() {
        this.peerConnection = new RTCPeerConnection(servers);
        this.ontrack = this.ontrack.bind(this);
        this.onicecandidate = this.onicecandidate.bind(this);

        this.peerConnection.ontrack = this.ontrack;
        this.peerConnection.onicecandidate = this.onicecandidate;
    }

    // Get a media stream for a given user id
    // Will return null if there is none
    public getStreamFor(id: string) {
        if (id === this.localId) return this.localStream;
        if (id === this.remoteId) return this.remoteStream;
        return null
    }

    public setLocalStreamOnVideoElement(v: MutableRefObject<HTMLVideoElement | null>) {
        if (!v.current) return;
        v.current.srcObject = this.localStream;
    }

    public setRemoteStreamOnVideoElement(v: MutableRefObject<HTMLVideoElement | null>) {
        if (!v.current) return;
        v.current.srcObject = this.remoteStream;
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
        if (this.isInitalised) return;

        this.localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        this.remoteStream = new MediaStream();

        this.localStream.getTracks().forEach(track => {
            // Local stream cannot be null here as we just created it!
            // Cast type MediaStream | null to just MediaStream
            this.peerConnection.addTrack(track, this.localStream as MediaStream);
        });

        this.peerConnection.ontrack = (event) => {
            event.streams[0].getTracks().forEach(track => {
                this.remoteStream?.addTrack(track);
            })
        };

        const onicecandidate = (async (event: RTCPeerConnectionIceEvent) => {
            if (event.candidate) {
                try {
                    const body: AddCandidateBody = {
                        gameId: this.roomId,
                        candidate: event.candidate.candidate,
                        sdpMLineIndex: event.candidate.sdpMLineIndex ?? 0,
                        sdpMid: event.candidate.sdpMid ?? '',
                        usernameFragment: event.candidate.usernameFragment ?? '',
                        isHost: this.isHost
                    }

                    await axios.post<AddCandidateBody, never>('/api/calls/addCandidate', body);
                } catch (e) {
                    console.error(e);
                }
            }
        }).bind(this);

        this.peerConnection.onicecandidate = onicecandidate;
        this.isInitalised = true;
    }

    public async createOffer(roomId: string): Promise<boolean> {
        if (this.offerCreated) return true;
        this.roomId = roomId;
        this.isHost = true;
        // Create offer
        const offerDescription = await this.peerConnection.createOffer();
        this.peerConnection.setLocalDescription(offerDescription);

        try {
            const body: CreateCallBody = {
                playerId: '', // We don't need to player id here
                gameId: roomId,
                sdp: offerDescription.sdp ?? '',
                type: offerDescription.type,
                isHost: this.isHost
            }

            await axios.post<CreateCallBody, never>('/api/calls/create', body);
        } catch (e) {
            console.error(e);
            return false;
        }

        // Send this call offer to the database
        this.offerCreated = true;
        return true;
    }

    public async joinCall(roomId: string, playerId: string) {
        this.roomId = roomId;
        this.isHost = false;

        const { data: call } = await axios.get<never, AxiosResponse<IceCall>>('/api/calls/' + roomId);

        await this.peerConnection.setRemoteDescription(new RTCSessionDescription({
            sdp: call.offer.sdp,
            type: call.offer.type as RTCSdpType // We can safely cast this as it was this type before being placed in the db
        }));

        const answerDescription = await this.peerConnection.createAnswer();

        const answer: CreateCallBody = {
            playerId,
            gameId: roomId,
            sdp: answerDescription.sdp ?? '',
            type: answerDescription.type,
            isHost: this.isHost
        }
        this.peerConnection.setLocalDescription(answerDescription);
        await axios.post<CreateCallBody, never>('/api/calls/create', answer).catch(console.error);

    }

    public newCandidate(candidate: Candidate) {
        this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    }

    public answer(offer: Offer) {
        const answerDescription = new RTCSessionDescription({
            type: offer.type as RTCSdpType,
            sdp: offer.sdp
        });

        this.peerConnection.setRemoteDescription(answerDescription);
    }
}

const WebRtcContext = createContext<WebRtcConnection | undefined>(undefined);

export default WebRtcContext;