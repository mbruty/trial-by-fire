/* eslint-disable @typescript-eslint/no-explicit-any */

import { connectMockDb, disconnectMockDb } from 'tests/utils/setupDatabase';
import { afterAll, afterEach, beforeAll, beforeEach, expect, test, vi } from 'vitest'
import joinRoom from 'sockets/joinRoom';
import Game from 'database/models/game';
import { Types } from 'mongoose';

let gameId: string | Types.ObjectId;

// Connect to the mock db
beforeAll(async () => {
    await connectMockDb();
});

afterAll(async () => {
    await disconnectMockDb();
})

beforeEach(async () => {
    const game = await Game.create({
        code: '123',
        startingBalance: 100,
        players: [{
            name: 'test',
            imageURL: 'test.jpg',
            beanBalance: 100,
            isRemote: true,
            currentBid: 0
        }, {
            name: 'test2',
            imageURL: 'test2.jpg',
            beanBalance: 100,
            isRemote: true,
            currentBid: 0
        }]
    });
    gameId = game._id;
});

afterEach(async () => {
    vi.clearAllMocks();
    await Game.deleteMany({});
});

test('No socket connections are attempted if invalid room', async () => {
    const socket: any = { 
        join: vi.fn(),
        emit: vi.fn()
     };
    await joinRoom('abc', socket);

    expect(socket.join).toHaveBeenCalledTimes(0);
    expect(socket.emit).toHaveBeenCalledTimes(0);
});

test('Socket room is join with valid room code', async () => {
    const socket: any = { 
        join: vi.fn(),
        emit: vi.fn()
     };
    await joinRoom('123', socket);

    expect(socket.join).toHaveBeenCalledTimes(1);
    expect(socket.join).toBeCalledWith('123');
    expect(socket.emit).toHaveBeenCalledTimes(1);
});

test('Socket room is join with valid room code', async () => {
    const socket: any = { 
        join: vi.fn(),
        emit: vi.fn()
     };
    await joinRoom('123', socket);

    expect(socket.join).toHaveBeenCalledTimes(1);
    expect(socket.join).toBeCalledWith('123');
});

test('Socket emits room data when given a valid room code', async () => {
    const socket: any = { 
        join: vi.fn(),
        emit: vi.fn()
     };
    await joinRoom('123', socket);
     const expected = `{"_id":"${gameId.toString()}","code":"123","startingBalance":100,"state":"waiting","currentRound":"0","biddingSeconds":30,"players":[{"name":"test","imageURL":"test.jpg","beanBalance":100,"isRemote":true,"currentBid":0},{"name":"test2","imageURL":"test2.jpg","beanBalance":100,"isRemote":true,"currentBid":0}],"rounds":[],"__v":0}`
    expect(socket.emit).toHaveBeenCalledTimes(1);
    expect(socket.emit).toHaveBeenCalledWith('joined', expected);
});