/* eslint-disable @typescript-eslint/no-explicit-any */

import { connectMockDb, disconnectMockDb } from 'tests/utils/setupDatabase';
import { afterAll, afterEach, beforeAll, beforeEach, expect, test, vi } from 'vitest'
import stateUpdate from 'sockets/stateUpdate';
import Game from 'database/models/game';
import { Types } from 'mongoose';
import { emit, to } from 'sockets/__mocks__/getServerSocket';

let gameId: string | Types.ObjectId;
type message = { state: string; gameId: string; };
vi.mock('sockets/getServerSocket');

// Connect to the mock db
beforeAll(async () => {
    await connectMockDb();
});

afterAll(async () => {
    await disconnectMockDb();
})

beforeEach(async () => {
    vi.useFakeTimers();
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
    vi.useRealTimers();
    vi.clearAllMocks();
    await Game.deleteMany({});
});

test('No updates are pushed with invalid object id', async () => {
    const message: message = {
        state: 'waiting',
        gameId: new Types.ObjectId().toString()
    };


    await stateUpdate(JSON.stringify(message));

    const game = await Game.findById(gameId);

    expect(game).toBeDefined();
    expect(game?.__v).toBe(0); // Game hasn't been upated
    expect(to).toHaveBeenCalledTimes(0);
    expect(emit).toHaveBeenCalledTimes(0);
});

test('Game state is updated correctly', async () => {
    const message: message = {
        state: 'playing',
        gameId: gameId.toString()
    };


    await stateUpdate(JSON.stringify(message));

    const game = await Game.findById(gameId);

    expect(game).toBeDefined();
    expect(game?.state).toBe('playing');
});

test('Bidding time started is set to now when state is set to bidding', async () => {
    vi.setSystemTime(new Date(2023, 1, 1, 12));

    const message: message = {
        state: 'bidding',
        gameId: gameId.toString()
    };


    await stateUpdate(JSON.stringify(message));

    const game = await Game.findById(gameId);

    expect(game?.bidStartedTimeStamp).toBe((vi.getMockedSystemTime() as Date).getTime());
});

test('Player bids are reset when state is set to bidding', async () => {

    const message: message = {
        state: 'bidding',
        gameId: gameId.toString()
    };

    let game = await Game.findById(gameId);

    game?.players.forEach(x => x.currentBid = 100);
    await game?.save();

    await stateUpdate(JSON.stringify(message));

    game = await Game.findById(gameId);
    game?.players.forEach(x => expect(x.currentBid).toBe(0));
});

test('State update is sent to sockets', async () => {
    const message: message = {
        state: 'playing',
        gameId: gameId.toString()
    };

    await stateUpdate(JSON.stringify(message));

    expect(to).toHaveBeenCalledOnce();
    expect(to).toBeCalledWith('123');
    expect(emit).toHaveBeenCalledOnce();
    expect(emit).toBeCalledWith('stateUpdate', 'playing');
});