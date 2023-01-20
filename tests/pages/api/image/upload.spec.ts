/* eslint-disable @typescript-eslint/no-explicit-any */

import { connectMockDb, disconnectMockDb } from 'tests/utils/setupDatabase';
import { afterAll, afterEach, beforeAll, beforeEach, expect, test, vi } from 'vitest'
import handler from 'pages/api/image/upload';
import Game from 'database/models/game';
import mockResponse from 'tests/utils/mockResponse';
import { Types } from 'mongoose';
import { file, save, _delete } from '__mocks__/@google-cloud/storage';
import { emit, to } from 'sockets/__mocks__/getServerSocket';
import { uuidstring } from '__mocks__/uuid';

let gameId: string | Types.ObjectId;
let playerId: string | Types.ObjectId;
let secondPlayerId: string | Types.ObjectId;

vi.mock('cookies-next');
vi.mock('@google-cloud/storage');
vi.mock('sockets/getServerSocket');
vi.mock('uuid');

const imageBase64 = 'data:image/jpeg;base64,iVBORw0KGgoAAAANSUhEUgAAAoAAAANVCAYAAADoSU8LAAAgAElEQVR4Xuy';

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
})

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

test('Api throws 400 if no image is provided', async () => {
    const req: any = { method: 'POST', body: { gameCode: '123', userId: playerId.toString() } };
    const res = mockResponse;
    await handler(req, res as any);

    expect(res.status).toBeCalledTimes(1);
    expect(res.status).toBeCalledWith(400);
    expect(res.end).toBeCalledTimes(1);
});

test('Api deletes previous image if present', async () => {
    const req: any = { method: 'POST', body: { gameCode: '123', userId: playerId.toString(), imageBase64 } };
    const res = mockResponse;
    await handler(req, res as any);

    expect(file).toBeCalledTimes(2);
    expect(file).toBeCalledWith('test.jpg');
    expect(_delete).toBeCalledTimes(1);
});

test('Api does not delete any images when not present', async () => {
    const req: any = { method: 'POST', body: { gameCode: '123', userId: playerId.toString(), imageBase64 } };
    const res = mockResponse;

    const game = await Game.findById(gameId);
    if (!game) throw 'Game was not found, there is an error in beforeEach';

    game.players[0].imageURL = undefined;
    await game.save();

    await handler(req, res as any);

    expect(file).toBeCalledTimes(1);
    expect(_delete).toBeCalledTimes(0);
});

test('Api uploads image', async () => {
    const req: any = { method: 'POST', body: { gameCode: '123', userId: playerId.toString(), imageBase64 } };
    const res = mockResponse;

    await handler(req, res as any);

    expect(file).toBeCalledTimes(2);
    expect(file).toHaveBeenLastCalledWith(uuidstring + '.jpg');
});

test('Api updates player with new image', async () => {
    const req: any = { method: 'POST', body: { gameCode: '123', userId: playerId.toString(), imageBase64 } };
    const res = mockResponse;

    await handler(req, res as any);

    const game = await Game.findById(gameId);
    expect(game).toBeDefined();
    const player = game?.players.find(x => x._id.toString() == playerId.toString());
    expect(player).toBeDefined();
    expect(player?.imageURL).toBeDefined();
    expect(player?.imageURL).toBe(uuidstring + '.jpg');
});

test('Api catches errors throw by gcp bucket save', async () => {
    const req: any = { method: 'POST', body: { gameCode: '123', userId: playerId.toString(), imageBase64 } };
    const res = mockResponse;

    save.mockImplementationOnce((_0, callback: (err: string) => void) => {
        callback('it ain\'t work');
    });

    await handler(req, res as any);

    const game = await Game.findById(gameId);

    expect(res.status).toBeCalledWith(400);

    // Check that the game hasn't been changed
    expect(game).toBeDefined();
    expect(game?.__v).toBe(0);
});

test('Api sends socket update once image saved', async () => {
    const req: any = { method: 'POST', body: { gameCode: '123', userId: playerId.toString(), imageBase64 } };
    const res = mockResponse;

    await handler(req, res as any);

    expect(to).toBeCalledTimes(1);
    expect(to).toBeCalledWith('123');
    expect(emit).toBeCalledTimes(1);
    const expected = `[{"name":"test","imageURL":"${uuidstring}.jpg","beanBalance":0,"isRemote":true,"currentBid":0,"_id":"${playerId.toString()}"},{"name":"test2","imageURL":"test2.jpg","beanBalance":0,"isRemote":true,"currentBid":0,"_id":"${secondPlayerId.toString()}"}]`;
    expect(emit).toBeCalledWith('userUpdate', expected);
});