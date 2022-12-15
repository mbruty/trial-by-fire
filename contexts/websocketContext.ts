import { createContext } from "react";
import { io as socketio } from "socket.io-client";
import { GameUser, IGame } from "../database/models/game";
import { v4 as uuid } from "uuid";
import { Socket } from "socket.io";

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
        state: false
    };

    private onUserUpdateSubscribers: Array<OnUbpdateObject<Array<GameUser>>> = [];
    private onStartSubscribers: Array<OnUbpdateObject<string>> = [];
    private onStateSubscribers: Array<OnUbpdateObject<IGame>> = [];

    constructor() {
        const io = socketio();

        io.on('connect', () => {
            console.log('connected')
        });

        this.socket = io as unknown as SocketWithEvents;

        // Bind the socket functions to 'this' scope
        // By default socketio calls the functions with a Socket scope
        this.onUserUpdate = this.onUserUpdate.bind(this);
        this.onStart = this.onStart.bind(this);
        this.onState = this.onState.bind(this);
    }

    // #region Client to server events
    public joinRoom(code: string) {
        this.socket?.emit('join', code);
    }

    public startGame(code: string, gameId: string) {
        this.socket?.emit('start', JSON.stringify({ code, gameId }));
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
        const parsed: IGame = JSON.parse(data);
        this.onStateSubscribers.forEach(x => x.onUpdate(parsed));
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

    public subscribeToState(cb: OnUpdate<IGame>): string {
        if (!this.eventsSubscribedTo.state) {
            this.socket?.on('state', this.onState);
            this.eventsSubscribedTo.state = true;
        }

        const id = uuid();
        this.onStateSubscribers.push({ id, onUpdate: cb });
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
    // #endregion
}

export const WebsocketContext = createContext<SocketObservable | undefined>(undefined);
