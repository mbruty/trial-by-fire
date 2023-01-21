/* eslint-disable @typescript-eslint/no-explicit-any */

import { connectMockDb, disconnectMockDb } from 'tests/utils/setupDatabase';
import { afterAll, afterEach, beforeAll, beforeEach, expect, test, vi } from 'vitest'
import startGame from 'sockets/startGame';
import Game from 'database/models/game';
import { Types } from 'mongoose';
import { emit, to } from 'sockets/__mocks__/getServerSocket';

let gameId: string | Types.ObjectId;

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

test('No updates are pushed with invalid object id', async () => {
    await startGame(JSON.stringify({ code: '123', gameId: 'not a valid object id' }));

    expect(to).toHaveBeenCalledTimes(0);
    expect(emit).toHaveBeenCalledTimes(0);
});

test('No updates are pushed with invalid id', async () => {
    await startGame(JSON.stringify({ code: '123', gameId: new Types.ObjectId() }));

    expect(to).toHaveBeenCalledTimes(0);
    expect(emit).toHaveBeenCalledTimes(0);
});

test('Game state is set to playing with valid code', async () => {
    await startGame(JSON.stringify({ code: '123', gameId: gameId.toString() }));

    const game = await Game.findById(gameId);

    expect(game).toBeDefined();
    expect(game?.state).toBe('playing');
});

test('Socket listeners are updated that the game has started', async () => {
    await startGame(JSON.stringify({ code: '123', gameId: gameId.toString() }));

    expect(to).toBeCalledTimes(1);
    expect(to).toBeCalledWith('123');
    expect(emit).toBeCalledTimes(1);
    expect(emit).toBeCalledWith('start', gameId.toString());
});