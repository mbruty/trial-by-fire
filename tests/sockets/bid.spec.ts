/* eslint-disable @typescript-eslint/no-explicit-any */

import { connectMockDb, disconnectMockDb } from 'tests/utils/setupDatabase';
import { afterAll, afterEach, beforeAll, beforeEach, expect, test, vi } from 'vitest'
import bid from 'sockets/bid';
import Game from 'database/models/game';
import { Types } from 'mongoose';
import { emit, to } from 'sockets/__mocks__/getServerSocket';

let gameId: string | Types.ObjectId;
let playerId: string | Types.ObjectId;

vi.mock('sockets/getServerSocket');

type message = { ammount: number, userId: string, gameId: string };

// Connect to the mock db
beforeAll(async () => {
    await connectMockDb();
});

afterAll(async () => {
    await disconnectMockDb();
})

const socket: any = {
    emit: vi.fn()
 };

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
    playerId = game.players[0]._id;
});

afterEach(async () => {
    vi.clearAllMocks();
    await Game.deleteMany({});
});

test('No games get updated if invalid id is provided', async () => {
    const message: message = {
        ammount: 100,
        userId: playerId.toString(),
        gameId: 'not a object id'
    }
    await bid(JSON.stringify(message), socket);

    // Get all games, and ensure their __v property is 0
    const games = await Game.find({});
    games.forEach(x => {
        expect(x.__v).toBe(0);
    })

    expect(to).toHaveBeenCalledTimes(0);
    expect(emit).toHaveBeenCalledTimes(0);
})

test('No games get updated if random game id is provided', async () => {
    const message: message = {
        ammount: 100,
        userId: playerId.toString(),
        gameId: new Types.ObjectId().toString()
    }
    await bid(JSON.stringify(message), socket);

    // Get all games, and ensure their __v property is 0
    const games = await Game.find({});
    games.forEach(x => {
        expect(x.__v).toBe(0);
    })

    expect(to).toHaveBeenCalledTimes(0);
    expect(emit).toHaveBeenCalledTimes(0);
})

test('No games get updated if random game id is provided', async () => {
    const message: message = {
        ammount: 100,
        userId: playerId.toString(),
        gameId: new Types.ObjectId().toString()
    }

    await bid(JSON.stringify(message), socket);

    // Get all games, and ensure their __v property is 0
    const games = await Game.find({});
    games.forEach(x => {
        expect(x.__v).toBe(0);
    })

    expect(to).toHaveBeenCalledTimes(0);
    expect(emit).toHaveBeenCalledTimes(0);
})

test('Game does not updated if bid is after the ending', async () => {
    const message: message = {
        ammount: 100,
        userId: playerId.toString(),
        gameId: gameId.toString()
    }

    let game = await Game.findById(gameId);

    if (!game) throw 'Game was not found, there is an error in the before each';

    game.bidStartedTimeStamp = Date.now() - 6 * 1000;
    game.biddingSeconds = 5;

    await game.save();

    await bid(JSON.stringify(message), socket);

    game = await Game.findById(gameId);

    expect(game).toBeDefined();
    if (!game) throw 'Game has been deleted in function';


    const player = game.players.find(x => x._id.toString() === playerId.toString());
    expect(player).toBeDefined();
    expect(player?.currentBid).toBe(0);
    expect(to).toHaveBeenCalledTimes(0);
    expect(emit).toHaveBeenCalledTimes(0);
});

test('Player does not get updated if bid is less than current bid', async () => {
    const message: message = {
        ammount: 100,
        userId: playerId.toString(),
        gameId: gameId.toString()
    }

    let game = await Game.findById(gameId);

    if (!game) throw 'Game was not found, there is an error in the before each';

    game.bidStartedTimeStamp = Date.now();
    game.biddingSeconds = 5;
    game.players.forEach(x => x.currentBid = 101);

    await game.save();

    await bid(JSON.stringify(message), socket);

    game = await Game.findById(gameId);
    expect(game).toBeDefined();
    game?.players.forEach(x => expect(x.currentBid).toBe(101));
});

test('Player does not get updated if bid is greater than bean balance', async () => {
    const message: message = {
        ammount: 101,
        userId: playerId.toString(),
        gameId: gameId.toString()
    }

    let game = await Game.findById(gameId);

    if (!game) throw 'Game was not found, there is an error in the before each';

    game.bidStartedTimeStamp = Date.now();
    game.biddingSeconds = 5;

    await game.save();

    await bid(JSON.stringify(message), socket);

    game = await Game.findById(gameId);
    expect(game).toBeDefined();
    const player = game?.players.find(x => x._id.toString() === playerId.toString());
    expect(player).toBeDefined();
    expect(player?.currentBid).toBe(0);
});

test('Player gets updated if bid is within time and under their balance', async () => {
    const message: message = {
        ammount: 100,
        userId: playerId.toString(),
        gameId: gameId.toString()
    }

    let game = await Game.findById(gameId);

    if (!game) throw 'Game was not found, there is an error in the before each';

    game.bidStartedTimeStamp = Date.now();
    game.biddingSeconds = 5;

    await game.save();

    await bid(JSON.stringify(message), socket);

    game = await Game.findById(gameId);
    expect(game).toBeDefined();
    const player = game?.players.find(x => x._id.toString() === playerId.toString());
    expect(player).toBeDefined();
    expect(player?.currentBid).toBe(100);
});

test('Player gets told if there was an error with the object id', async () => {
    const message: message = {
        ammount: 100,
        userId: playerId.toString(),
        gameId: 'not a valid id'
    }

    await bid(JSON.stringify(message), socket);

    expect(socket.emit).toBeCalledTimes(1);
    expect(socket.emit).toBeCalledWith('bidError', 'There was an error processing the bid, try again');
});

test('Player gets told if their bid was out of time', async () => {
    const message: message = {
        ammount: 100,
        userId: playerId.toString(),
        gameId: gameId.toString()
    }

    const game = await Game.findById(gameId);

    if (!game) throw 'Game was not found, there is an error in the before each';

    game.bidStartedTimeStamp = Date.now() - 6 * 1000;
    game.biddingSeconds = 5;

    await game.save();

    await bid(JSON.stringify(message), socket);

    expect(socket.emit).toBeCalledTimes(1);
    expect(socket.emit).toBeCalledWith('bidError', 'The bidding phase has ended.');
});

test('A socket update gets sent to the host with the new bid amount', async () => {
    const message: message = {
        ammount: 100,
        userId: playerId.toString(),
        gameId: gameId.toString()
    }

    const game = await Game.findById(gameId);

    if (!game) throw 'Game was not found, there is an error in the before each';

    game.bidStartedTimeStamp = Date.now();
    game.biddingSeconds = 5;

    await game.save();

    await bid(JSON.stringify(message), socket);

    expect(to).toBeCalledTimes(1);
    expect(to).toBeCalledWith('123');
    expect(emit).toBeCalledTimes(1);
    expect(emit).toBeCalledWith('newBid', '100');
});

test('A socket update gets sent to the user with the new bid amount', async () => {
    const message: message = {
        ammount: 100,
        userId: playerId.toString(),
        gameId: gameId.toString()
    }

    const game = await Game.findById(gameId);

    if (!game) throw 'Game was not found, there is an error in the before each';

    game.bidStartedTimeStamp = Date.now();
    game.biddingSeconds = 5;

    await game.save();

    await bid(JSON.stringify(message), socket);

    expect(socket.emit).toBeCalledTimes(1);
    expect(socket.emit).toBeCalledWith('bidSuccess', '100');
});