/* eslint-disable @typescript-eslint/no-explicit-any */

import { connectMockDb, disconnectMockDb } from 'tests/utils/setupDatabase';
import { afterAll, afterEach, beforeAll, beforeEach, expect, test, vi } from 'vitest'
import handler from 'pages/api/game/[id]/bets';
import Game from 'database/models/game';
import { Types } from 'mongoose';
import mockResponse from 'tests/utils/mockResponse';

let roomId: string | Types.ObjectId;
let playerId: string | Types.ObjectId;
let secondPlayerId: string | Types.ObjectId;
vi.mock('cookies-next');

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

    roomId = game._id;
    playerId = game.players[0]._id;
    secondPlayerId = game.players[1]._id;
});

afterEach(async () => {
    vi.clearAllMocks();
    await Game.deleteMany({});
})

test('Api route returns a 405 for post', async () => {
    const req: any = { method: 'POST' };
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

test('Api route returns a 200 for get', async () => {
    const req: any = { method: 'GET', query: { id: roomId.toString() } };
    const res = mockResponse;
    await handler(req, res as any);

    expect(res.status).toBeCalledTimes(1);
    expect(res.status).toBeCalledWith(200);
    expect(res.json).toBeCalledTimes(1);
    expect(res.end).toBeCalledTimes(1);
});

test('Api route returns a 400 for an invalid id', async () => {
    const req: any = { method: 'GET', query: { id: 'not a valid id' } };
    const res = mockResponse;
    await handler(req, res as any);

    expect(res.status).toBeCalledTimes(1);
    expect(res.status).toBeCalledWith(400);
    expect(res.end).toBeCalledTimes(1);
});

test('Api route returns a 404 after game is deleted', async () => {
    const req: any = { method: 'GET', query: { id: roomId.toString() } };
    const res = mockResponse;

    await Game.findByIdAndDelete(roomId);
    await handler(req, res as any);

    expect(res.status).toBeCalledTimes(1);
    expect(res.status).toBeCalledWith(404);
    expect(res.end).toBeCalledTimes(1);
});

test('Api route returns nothing if no players have bid', async () => {
    const req: any = { method: 'GET', query: { id: roomId.toString() } };
    const res = mockResponse;

    await handler(req, res as any);

    expect(res.json).toBeCalledTimes(1);
    const calls = res.json.mock.calls[0][0]; // Get the first argument from the first call
    expect(calls).toHaveLength(0);
    expect(res.end).toBeCalledTimes(1);
});

test('Api route returns correct amount of players after bidding', async () => {
    const req: any = { method: 'GET', query: { id: roomId.toString() } };
    const res = mockResponse;

    const game = await Game.findById(roomId);

    if (!game) {
        throw 'Game was not found, there is an issue with the before each function';
    }
    game.players[0].currentBid = 10;
    game.players[1].currentBid = 10;

    await game.save();

    await handler(req, res as any);

    expect(res.json).toBeCalledTimes(1);
    const calls = res.json.mock.calls[0][0]; // Get the first argument from the first call
    expect(calls).toHaveLength(2);
    expect(res.end).toBeCalledTimes(1);
});

test('Api route returns players sorted correctly', async () => {
    const req: any = { method: 'GET', query: { id: roomId.toString() } };
    const res = mockResponse;

    const game = await Game.findById(roomId);

    if (!game) {
        throw 'Game was not found, there is an issue with the before each function';
    }
    game.players[0].currentBid = 5;
    game.players[1].currentBid = 10;

    await game.save();

    await handler(req, res as any);

    expect(res.json).toBeCalledTimes(1);
    const calls = res.json.mock.calls[0][0]; // Get the first argument from the first call
    expect(calls[0]._id.toString()).toBe(secondPlayerId.toString());
    expect(calls[1]._id.toString()).toBe(playerId.toString());
    expect(res.end).toBeCalledTimes(1);
});

test('Api route filters out players with no bids', async () => {
    const req: any = { method: 'GET', query: { id: roomId.toString() } };
    const res = mockResponse;

    const game = await Game.findById(roomId);

    if (!game) {
        throw 'Game was not found, there is an issue with the before each function';
    }
    game.players[1].currentBid = 10;

    await game.save();

    await handler(req, res as any);

    expect(res.json).toBeCalledTimes(1);
    const calls = res.json.mock.calls[0][0]; // Get the first argument from the first call
    expect(calls).toHaveLength(1);
    expect(calls[0]._id.toString()).toBe(secondPlayerId.toString());
    expect(res.end).toBeCalledTimes(1);
});