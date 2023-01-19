/* eslint-disable @typescript-eslint/no-explicit-any */
import { connectMockDb, disconnectMockDb } from 'tests/utils/setupDatabase';
import { afterAll, afterEach, beforeAll, beforeEach, expect, test, vi } from 'vitest'
import { getServerSideProps } from 'pages/host/play/[id]';
import { ContextWithCookies } from 'types/ContextWithCookies';
import Game from 'database/models/game';
import { Types } from 'mongoose';

let roomId: string | Types.ObjectId;
let playerId: string | Types.ObjectId;

vi.mock('cookies-next');

// Connect to the mock db
beforeAll(async () => {
    await connectMockDb();
});

afterAll(async () => {
    vi.clearAllMocks();
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
});

afterEach(async () => {
    await Game.deleteMany({});
})

test('getServerSideProps redirects with invalid object id', async () => {
    const context: ContextWithCookies = { req: { cookies: {} }, params: { id: 'not a object id' } };
    const result: any = await getServerSideProps(context as any);

    expect(result.redirect).toBeDefined();
    expect(result.redirect.destination).toBe('/host/new');
    expect(result.redirect.permanent).toBeFalsy();
});

test('getServerSideProps redirects with deleted game', async () => {
    const context: ContextWithCookies = { req: { cookies: {} }, params: { id: roomId.toString() } };
    await Game.findByIdAndDelete(roomId);
    const result: any = await getServerSideProps(context as any);

    expect(result.redirect).toBeDefined();
    expect(result.redirect.destination).toBe('/host/new');
    expect(result.redirect.permanent).toBeFalsy();
});

test('getServerSideProps redirects when game is waiting', async () => {
    const context: ContextWithCookies = { req: { cookies: {} }, params: { id: roomId.toString() } };
    const game = await Game.findById(roomId);
    if (!game) {
        throw 'Game was not found, something has gone wrong in the before each'
    }
    game.state = 'waiting';
    await game.save();
    const result: any = await getServerSideProps(context as any);

    expect(result.redirect).toBeDefined();
    expect(result.redirect.destination).toBe(`/host/lobby/${roomId.toString()}`);
    expect(result.redirect.permanent).toBeFalsy();
});

test('getServerSideProps returns correct props when everything is supplied', async () => {
    const context: ContextWithCookies = { req: { cookies: { id: playerId.toString() } }, params: { id: roomId.toString() } };
    const game = await Game.findById(roomId);
    if (!game) {
        throw 'Game was not found, something has gone wrong in the before each'
    }
    game.state = 'playing';
    await game.save();
    const { props }: any = await getServerSideProps(context as any);
    const expected = {
        game: {
            code: '123',
            startingBalance: 100,
            state: 'playing',
            players: [{
                name: 'test',
                beanBalance: 0,
                isRemote: true,
                currentBid: 0
            }, {
                name: 'test2',
                beanBalance: 0,
                isRemote: true,
                currentBid: 0
            }]
        },
        id: roomId.toString()
    }

    expect(props.game).toBeDefined();
    expect(props).toMatchObject(expected);
});