import mongoose, { Schema, Types } from 'mongoose';

export type GameUser = {
    _id: Types.ObjectId | string;
    name: string;
    imageURL?: string;
    beanBalance: number;
    isRemote: boolean;
}

export type Trial = {
    title: string;
    type: string;
    timeLimit: number;
}

export type IGame = {
    code: string;
    state: string;
    startingBalance: number;
    currentRound: number;
    players: Array<GameUser>;
    rounds: Array<Trial>;
    biddingSeconds: number;
}

const gameSchema = new Schema({
    code: { type: String, required: true },
    startingBalance: { type: Number, required: true },
    state: { type: String, required: true, default: 'waiting' },
    currentRound: { type: String, required: true, default: 0 },
    biddingSeconds: { type: Number, required: true, default: 30 },
    players: [{
        name: { type: String, required: true },
        imageURL: { type: String, required: false },
        beanBalance: { type: Number, required: true },
        isRemote: { type: Boolean, required: true }
    }],
    rounds: [{
        title: { type: String, required: true },
        type: { type: String, required: true },
        timeLimit: { type: Number, required: true }
    }]
})

// This is required to work with nextjs hmr
export default mongoose.models['games'] ? mongoose.model<IGame>('games') : mongoose.model<IGame>('games', gameSchema);