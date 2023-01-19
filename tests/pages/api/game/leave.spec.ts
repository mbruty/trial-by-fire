/* eslint-disable @typescript-eslint/no-explicit-any */

import { connectMockDb, disconnectMockDb } from 'tests/utils/setupDatabase';
import { afterAll, afterEach, beforeAll, beforeEach, expect, test, vi } from 'vitest'
import handler from 'pages/api/game/leave';
import Game from 'database/models/game';
import mockResponse from 'tests/utils/mockResponse';
import { Types } from 'mongoose';
import { bucket, file, _delete } from '__mocks__/@google-cloud/storage';
import { emit, to } from 'sockets/__mocks__/getServerSocket';
import path from 'path';

let gameId: string | Types.ObjectId;
let playerId: string | Types.ObjectId;
let secondPlayerId: string | Types.ObjectId;

vi.mock('cookies-next');
vi.mock('@google-cloud/storage');
vi.mock('sockets/getServerSocket');

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
            beanBalance: 0,
            isRemote: true,
            currentBid: 0
        }, {
            name: 'test2',
            imageURL: 'test2.jpg',
            beanBalance: 0,
            isRemote: true,
            currentBid: 0
        }]
    });
    gameId = game._id;
    playerId = game.players[0]._id;
    secondPlayerId = game.players[1]._id;
});

afterEach(async () => {
    vi.clearAllMocks();
    await Game.deleteMany({});
});

// Has to be ran first else the mocks would have been cleared as these functions run when the file loads
test('GoogleCloud Storage is initalised', () => {
    expect(bucket).toHaveBeenCalledWith('trial-by-fire');
});

test('Api route returns a 405 for get', async () => {
    const req: any = { method: 'GET' };
    const res = mockResponse;
    await handler(req, res as any);

    expect(res.status).toBeCalledTimes(1);
    expect(res.status).toBeCalledWith(405);
    expect(res.end).toBeCalledTimes(1);
});

test('Api route returns a 405 for put', async () => {
    const req: any = { method: 'PUT' };
    const res = mockResponse;
    await handler(req, res as any);

    expect(res.status).toBeCalledTimes(1);
    expect(res.status).toBeCalledWith(405);
    expect(res.end).toBeCalledTimes(1);
});

test('Api route returns a 405 for delete', async () => {
    const req: any = { method: 'DELETE' };
    const res = mockResponse;
    await handler(req, res as any);

    expect(res.status).toBeCalledTimes(1);
    expect(res.status).toBeCalledWith(405);
    expect(res.end).toBeCalledTimes(1);
});

test('Api route returns a 400 with empty body', async () => {
    const req: any = { method: 'POST', body: {} };
    const res = mockResponse;
    await handler(req, res as any);

    expect(res.status).toBeCalledTimes(1);
    expect(res.status).toBeCalledWith(400);
    expect(res.end).toBeCalledTimes(1);
});

test('Api route returns a 400 without id', async () => {
    const req: any = { method: 'POST', body: { gameCode: '123' } };
    const res = mockResponse;
    await handler(req, res as any);

    expect(res.status).toBeCalledTimes(1);
    expect(res.status).toBeCalledWith(400);
    expect(res.end).toBeCalledTimes(1);
}); 4

test('Api route returns a 400 without game code', async () => {
    const req: any = { method: 'POST', body: { id: playerId.toString() } };
    const res = mockResponse;
    await handler(req, res as any);

    expect(res.status).toBeCalledTimes(1);
    expect(res.status).toBeCalledWith(400);
    expect(res.end).toBeCalledTimes(1);
});

test('Api route returns a 404 if no player exsists', async () => {
    const req: any = { method: 'POST', body: { id: playerId.toString(), gameCode: '1234' } };
    const res = mockResponse;

    await Game.create({
        code: '1233',
        startingBalance: 100,
    });

    await handler(req, res as any);

    expect(res.status).toBeCalledTimes(1);
    expect(res.status).toBeCalledWith(404);
    expect(res.end).toBeCalledTimes(1);
});

test('Api deletes image from gcp', async () => {
    const req: any = { method: 'POST', body: { id: playerId.toString(), gameCode: '123' } };
    const res = mockResponse;

    await handler(req, res as any);
    expect(file).toBeCalledTimes(1);
    expect(file).toHaveBeenCalledWith('test.jpg');
    expect(_delete).toBeCalledTimes(1);
});

test('Api removes player from database', async () => {
    const req: any = { method: 'POST', body: { id: playerId.toString(), gameCode: '123' } };
    const res = mockResponse;

    await handler(req, res as any);

    const game = await Game.findById(gameId);

    if (!game) throw 'Game was null, there is an error in the before each function';

    expect(game.players).toHaveLength(1);
    expect(game.players[0]._id.toString()).toBe(secondPlayerId.toString());
});

test('Api sends a message to the room with the updated players', async () => {
    const req: any = { method: 'POST', body: { id: playerId.toString(), gameCode: '123' } };
    const res = mockResponse;

    await handler(req, res as any);
    const expected = `[{"name":"test2","imageURL":"test2.jpg","beanBalance":0,"isRemote":true,"currentBid":0,"_id":"${secondPlayerId.toString()}"}]`
    expect(to).toBeCalledTimes(1);
    expect(to).toBeCalledWith('123');
    expect(emit).toBeCalledTimes(1);
    expect(emit).toBeCalledWith('userUpdate', expected);
});