import type { NextApiRequest as OriginalNextApiRequest, NextApiResponse as OriginalNextApiResponse } from 'next'

declare global {
    declare interface ServerToClientEvents {
        userUpdate: (data: string) => void;
        start: (data: string) => void;
        joined: (data: string) => void;
        stateUpdate: (data: string) => void;
        newBid: (data: string) => void;
    }

    declare interface ClientToServerEvents {
        join: (code: string) => void;
        start: (code: string) => void;
        stateUpdate: (data: string) => void;
        bid: (data: string) => void;
    }

    type NextApiRequest = OriginalNextApiRequest

    type NextApiResponse<T = unkown> = OriginalNextApiResponse<T>

    // region API request bodies
    declare interface ImageUploadBody {
        gameCode;
        userId: string;
        imageBase64: string;
    }

    declare interface JoinRoomBody {
        name: string;
        gameCode: string;
        isRemote: boolean;
    }

    declare interface JoinRoomResponse {
        ID: string;
        roomID: string;
    }

    declare interface LeaveRoomBody {
        id: string;
        gameCode: string;
    }

    declare interface CreateGameBody {
        trials: Array<{
            title: string;
            type: string;
        }>

        createdBy?: string;

        starterBeanCount: number;
    }

    declare interface CreateGameResponse {
        code: string;
        gameId: string;
    }
    // endregion
}