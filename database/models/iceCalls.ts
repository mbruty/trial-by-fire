import mongoose, { Schema, Types } from 'mongoose';

export type IceCall = {
    gameId: Types.ObjectId | string;
    offers: Array<{
        candidate: string;
        sdpMLineIndex: number;
        sdpMid: string;
    }>
}

const iceCalls = new Schema({
    gameId: { type: Types.ObjectId, required: true },
    offers: [{
        candidate: { type: String, required: true },
        sdpMLineIndex: { type: Number, required: true },
        sdpMid: { type: String, required: true }
    }]
})

// This is required to work with nextjs hmr
// If mongoose has already registered ice calls, return the registered one... Else create it
export default mongoose.models['iceCalls'] ? mongoose.model<IceCall>('iceCalls') : mongoose.model<IceCall>('iceCalls', iceCalls);