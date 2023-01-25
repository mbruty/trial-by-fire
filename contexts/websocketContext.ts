import { createContext } from 'react';
import { io as socketio } from 'socket.io-client';
import { GameUser, IGame } from '../database/models/game';
import { v4 as uuid } from 'uuid';
import { Socket } from 'socket.io';
import { RoundState, stateFromString } from '../types/RoundState';
import { getCookie } from 'cookies-next';
import { Candidate, Offer } from 'database/models/iceCalls';

type OnUpdate<T> = (data: T) => void;

type OnUpdateObject<T> = {
    id: string;
    onUpdate: OnUpdate<T>;
}

type SocketWithEvents = Socket<ServerToClientEvents, ClientToServerEvents>;

export class SocketObservable {
    private socket: SocketWithEvents | undefined;
    private eventsSubscribedTo = {
        userUpdate: false,
        start: false,
        state: false,
        bid: false,
        bidError: false,
        bidSuccess: false,
        newOffer: false,
        newAnswer: false,
        answer: false,
    };

    private onUserUpdateSubscribers: Array<OnUpdateObject<Array<GameUser>>> = [];
    private onStartSubscribers: Array<OnUpdateObject<string>> = [];
    private onStateSubscribers: Array<OnUpdateObject<RoundState>> = [];
    private onBidSubscribers: Array<OnUpdateObject<number>> = [];
    private onBidErrorSubscribers: Array<OnUpdateObject<string>> = [];
    private onBidSuccessSubscribers: Array<OnUpdateObject<number>> = [];
    private onceConnectedFuncs: Array<() => void> = [];
    private onNewOfferSubscribers: Array<OnUpdateObject<Candidate>> = [];
    private onNewAnswerSubscribers: Array<OnUpdateObject<Candidate>> = [];
    private onAnswerSubscribers: Array<OnUpdateObject<Offer & { playerId: string }>> = [];
    private gameId = '';

    constructor() {
        const io = socketio();

        io.on('connect', () => {
            console.log('connected')
        });

        this.socket = io as unknown as SocketWithEvents;

        this.socket.on('joined', data => {
            const game: IGame = JSON.parse(data);
            this.gameId = game._id as string;
            this.onceConnectedFuncs.forEach(x => x());

            // Delete all listeners
            this.onceConnectedFuncs = [];
        })

        // Bind the socket functions to 'this' scope
        // By default socketio calls the functions with a Socket scope
        this.onUserUpdate = this.onUserUpdate.bind(this);
        this.onStart = this.onStart.bind(this);
        this.onState = this.onState.bind(this);
        this.onBid = this.onBid.bind(this);
        this.onBidError = this.onBidError.bind(this);
        this.onBidSuccess = this.onBidSuccess.bind(this);
        this.onAnswer = this.onAnswer.bind(this);
        this.onNewAnswer = this.onNewAnswer.bind(this);
        this.onNewOffer = this.onNewOffer.bind(this);
    }

    public getGameId() {
        return this.gameId;
    }

    public onceConnected(cb: () => void) {
        this.onceConnectedFuncs.push(cb);
    }

    // #region Client to server events
    public joinRoom(code: string) {
        this.socket?.emit('join', code);
    }

    public startGame(code: string) {
        this.socket?.emit('start', JSON.stringify({ code, gameId: this.gameId }));
    }

    public updateRoundState(state: RoundState) {
        this.socket?.emit('stateUpdate', JSON.stringify({ state, gameId: this.gameId }));
    }

    public bid(ammount: number) {
        const userId = getCookie('id');
        this.socket?.emit('bid', JSON.stringify({ ammount, userId, gameId: this.gameId }))
    }

    //#endregion

    // #region server to client events
    private onUserUpdate(data: string) {
        const parsed: GameUser[] = JSON.parse(data);
        this.onUserUpdateSubscribers.forEach(x => x.onUpdate(parsed));
    }

    private onStart(data: string) {
        this.onStartSubscribers.forEach(x => x.onUpdate(data));
    }

    private onState(data: string) {
        const value = stateFromString(data);

        if (value !== undefined) {
            this.onStateSubscribers.forEach(x => x.onUpdate(value));
        }
    }

    private onBid(data: string) {
        const value = parseInt(data);

        if (!isNaN(value)) {
            this.onBidSubscribers.forEach(x => x.onUpdate(value));
        }
    }

    private onBidError(data: string) {
        this.onBidErrorSubscribers.forEach(x => x.onUpdate(data));
    }

    private onBidSuccess(data: string) {
        const value = parseInt(data);

        if (!isNaN(value)) {
            this.onBidSuccessSubscribers.forEach(x => x.onUpdate(value));
        }
    }

    private onAnswer(data: string) {
        const value = JSON.parse(data) as Offer & { playerId: string };
        this.onAnswerSubscribers.forEach(x => x.onUpdate(value));
    }

    private onNewOffer(data: string) {
        const value = JSON.parse(data) as Candidate;
        this.onNewOfferSubscribers.forEach(x => x.onUpdate(value));
    }

    private onNewAnswer(data: string) {
        const value = JSON.parse(data) as Candidate;
        this.onNewAnswerSubscribers.forEach(x => x.onUpdate(value));
    }

    // #endregion

    // #region Subscriptions
    public subscribeToBidErrors(cb: OnUpdate<string>): string {
        if (!this.eventsSubscribedTo.bidError) {
            this.socket?.on('bidError', this.onBidError);
            this.eventsSubscribedTo.bidError = true;
        }
        const id = uuid();

        this.onBidErrorSubscribers.push({ id, onUpdate: cb });
        return id;
    }

    public subscribeToBidSuccess(cb: OnUpdate<number>): string {
        if (!this.eventsSubscribedTo.bidSuccess) {
            this.socket?.on('bidSuccess', this.onBidSuccess);
            this.eventsSubscribedTo.bidError = true;
        }
        const id = uuid();

        this.onBidSuccessSubscribers.push({ id, onUpdate: cb });
        return id;
    }

    public subscribeToOnUserUpdate(cb: OnUpdate<Array<GameUser>>): string {
        if (!this.eventsSubscribedTo.userUpdate) {
            this.socket?.on('userUpdate', this.onUserUpdate);
            this.eventsSubscribedTo.userUpdate = true;
        }

        const id = uuid();
        this.onUserUpdateSubscribers.push({ id, onUpdate: cb });
        return id;
    }

    public subscribeToStart(cb: OnUpdate<string>): string {
        if (!this.eventsSubscribedTo.start) {
            this.socket?.on('start', this.onStart);
            this.eventsSubscribedTo.start = true;
        }

        const id = uuid();
        this.onStartSubscribers.push({ id, onUpdate: cb });
        return id;
    }

    public subscribeToState(cb: OnUpdate<RoundState>): string {
        if (!this.eventsSubscribedTo.state) {
            this.socket?.on('stateUpdate', this.onState);
            this.eventsSubscribedTo.state = true;
        }

        const id = uuid();
        this.onStateSubscribers.push({ id, onUpdate: cb });
        return id;
    }

    public subscribeToBid(cb: OnUpdate<number>): string {
        if (!this.eventsSubscribedTo.bid) {
            this.socket?.on('newBid', this.onBid);
            this.eventsSubscribedTo.bid = true;
        }

        const id = uuid();
        this.onBidSubscribers.push({ id, onUpdate: cb });
        return id;
    }

    public subscribeAnswer(cb: OnUpdate<Offer & { playerId: string }>) {
        if (!this.eventsSubscribedTo.answer) {
            this.socket?.on('answer', this.onAnswer);
            this.eventsSubscribedTo.answer = true;
        }

        const id = uuid();
        this.onAnswerSubscribers.push({ id, onUpdate: cb });
        return id;
    }

    public subscribeToNewOffer(cb: OnUpdate<Candidate>) {
        if (!this.eventsSubscribedTo.newOffer) {
            this.socket?.on('newOfferCandidate', this.onNewOffer);
            this.eventsSubscribedTo.newOffer = true;
        }

        const id = uuid();
        this.onNewOfferSubscribers.push({ id, onUpdate: cb });
        return id;
    }

    public subscribeToNewAnswer(cb: OnUpdate<Candidate>) {
        if (!this.eventsSubscribedTo.newAnswer) {
            this.socket?.on('newAnswerCandidate', this.onNewAnswer);
            this.eventsSubscribedTo.newAnswer = true;
        }

        const id = uuid();
        this.onNewAnswerSubscribers.push({ id, onUpdate: cb });
        return id;
    }
    // #endregion

    // #region Unsubscribe
    public unsubscribeOnUserUpdate(id: string) {
        this.onUserUpdateSubscribers = this.onUserUpdateSubscribers.filter(x => x.id !== id);

        // Stop listening to these events as we don't need them
        if (this.onUserUpdateSubscribers.length === 0) {
            this.socket?.off('userpdate', this.onUserUpdate);
            this.eventsSubscribedTo.userUpdate = false;
        }
    }

    public unsubscribeStart(id: string) {
        this.onStartSubscribers = this.onStartSubscribers.filter(x => x.id !== id);

        // Stop listening to these events as we don't need them
        if (this.onStartSubscribers.length === 0) {
            this.socket?.off('start', this.onStart);
            this.eventsSubscribedTo.start = false;
        }
    }

    public unsubscribeState(id: string) {
        this.onStateSubscribers = this.onStateSubscribers.filter(x => x.id !== id);

        // Stop listening to these events as we don't need them
        if (this.onStateSubscribers.length === 0) {
            this.socket?.off('stateUpdate', this.onState);
            this.eventsSubscribedTo.state = false;
        }
    }

    public unsubscribeBid(id: string) {
        this.onBidSubscribers = this.onBidSubscribers.filter(x => x.id !== id);

        // Stop listening to these events as we don't need them
        if (this.onBidSubscribers.length === 0) {
            this.socket?.off('newBid', this.onBid);
            this.eventsSubscribedTo.bid = false;
        }
    }

    public unsubscribeBidErrors(id: string) {
        this.onBidErrorSubscribers = this.onBidErrorSubscribers.filter(x => x.id !== id);

        // Stop listening to these events as we don't need them
        if (this.onBidErrorSubscribers.length === 0) {
            this.socket?.off('bidError', this.onBidError);
            this.eventsSubscribedTo.bidError = false;
        }
    }

    public unsubscribeBidSuccess(id: string) {
        this.onBidSuccessSubscribers = this.onBidSuccessSubscribers.filter(x => x.id !== id);

        // Stop listening to these events as we don't need them
        if (this.onBidSuccessSubscribers.length === 0) {
            this.socket?.off('bidSuccess', this.onBidError);
            this.eventsSubscribedTo.bidSuccess = false;
        }
    }

    public unsubscribeAnswer(id: string) {
        this.onAnswerSubscribers = this.onAnswerSubscribers.filter(x => x.id !== id);

        // Stop listening to these events if we don't have any subscribers
        if (this.onAnswerSubscribers.length === 0) {
            this.socket?.off('answer', this.onAnswer);
            this.eventsSubscribedTo.answer = false;
        }
    }

    public unsubscribeNewOffer(id: string) {
        this.onNewOfferSubscribers = this.onNewOfferSubscribers.filter(x => x.id !== id);

        // Stop listening to these events if we don't have any subscribers
        if (this.onNewOfferSubscribers.length === 0) {
            this.socket?.off('newOfferCandidate', this.onNewOffer);
            this.eventsSubscribedTo.newOffer = false;
        }
    }

    public unsubscribeNewAnswer(id: string) {
        this.onNewAnswerSubscribers = this.onNewAnswerSubscribers.filter(x => x.id !== id);

        // Stop listening to these events if we don't have any subscribers
        if (this.onNewAnswerSubscribers.length === 0) {
            this.socket?.off('newAnswerCandidate', this.onNewAnswer);
            this.eventsSubscribedTo.newAnswer = false;
        }
    }
    // #endregion
}

export const WebsocketContext = createContext<SocketObservable | undefined>(undefined);
