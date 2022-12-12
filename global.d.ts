import type { NextApiRequest as OriginalNextApiRequest, NextApiResponse as OriginalNextApiResponse } from 'next'
import type { Socket as OriginalSocket } from 'node:net';
import { Server } from 'socket.io';

declare global {
    declare interface NextApiRequest extends OriginalNextApiRequest {
        
    }

    declare interface NextApiResponse<T = any> extends OriginalNextApiResponse<T> {
        
    }
    
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
    }

    declare interface LeaveRoomBody {
        id: string;
        gameCode: string;
    }
    // endregion
}