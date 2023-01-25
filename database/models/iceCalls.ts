import mongoose, { Schema, Types } from 'mongoose';

export type IceCall = {
    _id: Types.ObjectId | string;
    offer: Offer
    offerCandidates: Array<Candidate>,
    answer: Offer,
    answerCandidates: Array<Candidate>
}

export type Candidate = {
    candidate: string,
    sdpMLineIndex: number,
    sdpMid: string,
    type: 'offer' | 'accept' | null;
    usernameFragment: string;
}

export type Offer = {
    sdp: string;
    type: string;
}

const iceCalls = new Schema({
    offer: {
        sdp: { type: String, required: true },
        type: { type: String, required: true }
    },
    offerCandidates: [{
        candidate: { type: String, required: true },
        sdpMLineIndex: { type: Number, required: true },
        sdpMid: { type: String, required: true },
        usernameFragment: { type: String, required: true }
    }],
    answerCandidates: [{
        candidate: { type: String, required: true },
        sdpMLineIndex: { type: Number, required: true },
        sdpMid: { type: String, required: true },
        usernameFragment: { type: String, required: true }
    }],
    answer: {
        sdp: { type: String, required: true },
        type: { type: String, required: true }
    }
})

// This is required to work with nextjs hmr
// If mongoose has already registered ice calls, return the registered one... Else create it
export default mongoose.models['iceCalls'] ? mongoose.model<IceCall>('iceCalls') : mongoose.model<IceCall>('iceCalls', iceCalls);