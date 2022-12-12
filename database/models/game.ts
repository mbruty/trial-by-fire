import mongoose, { Schema, model, Types } from "mongoose";

export type GameUser = {
    _id: Types.ObjectId;
    name: string;
    imageURL?: string;
    beanBalance: number;
}

export type GameRound = {

}

export type IGame = {
    code: String;
    startingBalance: number;
    players: Array<GameUser>;
}

const gameSchema = new Schema({
    code: { type: String, required: true },
    startingBalance: { type: Number, required: true },
    players: [{
        _id: { type: Types.ObjectId, required: true },
        name: { type: String, required: true },
        imageURL: { type: String, required: false },
        beanBalance: { type: Number, required: true },
    }]
})

// This is required to work with nextjs hmr
export default mongoose.models['games'] ? mongoose.model<IGame>('games') : mongoose.model<IGame>('games', gameSchema);