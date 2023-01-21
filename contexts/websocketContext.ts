import { createContext } from 'react';
import { io as socketio } from 'socket.io-client';
import { GameUser, IGame } from '../database/models/game';
import { v4 as uuid } from 'uuid';
import { Socket } from 'socket.io';
import { RoundState, stateFromString } from '../types/RoundState';
import { getCookie } from 'cookies-next';

type OnUpdate<T> = (data: T) => void;

type OnUbpdateObject<T> = {
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
    };

    private onUserUpdateSubscribers: Array<OnUbpdateObject<Array<GameUser>>> = [];
    private onStartSubscribers: Array<OnUbpdateObject<string>> = [];
    private onStateSubscribers: Array<OnUbpdateObject<RoundState>> = [];
    private onBidSubscribers: Array<OnUbpdateObject<number>> = [];
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
        })

        // Bind the socket functions to 'this' scope
        // By default socketio calls the functions with a Socket scope
        this.onUserUpdate = this.onUserUpdate.bind(this);
        this.onStart = this.onStart.bind(this);
        this.onState = this.onState.bind(this);
        this.onBid = this.onBid.bind(this);
    }

    public getGameId() {
        return this.gameId;
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

    // #endregion

    // #region Subscriptions
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
    // #endregion
}

export const WebsocketContext = createContext<SocketObservable | undefined>(undefined);
