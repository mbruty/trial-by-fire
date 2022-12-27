export enum RoundState {
    STARTING = 'starting',
    BIDDING = 'bidding',
    PLAYING = 'playing',
    ENDING = 'ending'
}

export function stateFromString(val: string): RoundState {
    if (val === RoundState.STARTING) {
        return RoundState.STARTING;
    }

    if (val === RoundState.BIDDING) {
        return RoundState.BIDDING;
    }

    if (val === RoundState.PLAYING) {
        return RoundState.PLAYING;
    }

    if (val === RoundState.ENDING) {
        return RoundState.ENDING;
    }

    return RoundState.STARTING
}