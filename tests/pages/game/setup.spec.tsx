/* eslint-disable @typescript-eslint/no-explicit-any */
import { connectMockDb, disconnectMockDb } from 'tests/utils/setupDatabase';
import { afterAll, afterEach, beforeAll, beforeEach, expect, test, vi } from 'vitest'
import { getServerSideProps } from 'pages/game/setup';
import { ContextWithCookies } from 'types/ContextWithCookies';
import Game from 'database/models/game';
import { Types } from 'mongoose';
vi.mock('cookies-next');
vi.mock('next/router');
vi.mock('next/head');
vi.mock('axios');

let roomId: string | Types.ObjectId;
let playerId: string | Types.ObjectId;
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
    });

    roomId = game._id;
    playerId = game.players[0]._id;
});

afterEach(async () => {
    await Game.remove({});
})

test('getServerSideProps redirects with no cookies', async () => {
    const context: ContextWithCookies = { req: { cookies: {} } };
    const result: any = await getServerSideProps(context as any);

    expect(result.redirect).toBeDefined();
    expect(result.redirect.destination).toBe('/game');
    expect(result.redirect.permanent).toBeFalsy();
});

test('getServerSideProps redirects with no room id', async () => {
    const context: ContextWithCookies = { req: { cookies: {} } };
    context.req.cookies['id'] = playerId.toString();
    const result: any = await getServerSideProps(context as any);

    expect(result.redirect).toBeDefined();
    expect(result.redirect.destination).toBe('/game');
    expect(result.redirect.permanent).toBeFalsy();
});

test('getServerSideProps redirects with no player id', async () => {
    const context: ContextWithCookies = { req: { cookies: {} } };
    context.req.cookies['room-id'] = roomId.toString();
    const result: any = await getServerSideProps(context as any);

    expect(result.redirect).toBeDefined();
    expect(result.redirect.destination).toBe('/game');
    expect(result.redirect.permanent).toBeFalsy();
});

test('getServerSideProps redirects if game is finished/deleted', async () => {
    const context: ContextWithCookies = { req: { cookies: {} } };
    context.req.cookies['room-id'] = roomId.toString();
    context.req.cookies['id'] = playerId.toString();

    await Game.remove({});

    const result: any = await getServerSideProps(context as any);

    expect(result.redirect).toBeDefined();
    expect(result.redirect.destination).toBeDefined();
    expect(result.redirect.destination).toBe('/game');
    expect(result.redirect.permanent).toBeDefined();
    expect(result.redirect.permanent).toBeFalsy();
});

test('getServerSideProps does not if game state is waiting', async () => {
    const context: ContextWithCookies = { req: { cookies: {} } };
    context.req.cookies['room-id'] = roomId.toString();
    context.req.cookies['id'] = playerId.toString();

    const game = await Game.findById(roomId);

    if (!game) {
        throw 'Game was undefined, something went seriously wrong...';
    }

    game.state = 'waiting';
    await game.save();

    const result: any = await getServerSideProps(context as any);

    expect(result.redirect).toBeUndefined();
});

test('getServerSideProps redirects to play page if game state is not waiting, and the player has an image', async () => {
    const context: ContextWithCookies = { req: { cookies: {} } };
    context.req.cookies['room-id'] = roomId.toString();
    context.req.cookies['id'] = playerId.toString();

    const game = await Game.findById(roomId);

    if (!game) {
        throw 'Game was undefined, something went seriously wrong...';
    }

    game.players[0].imageURL = 'test.jpg';
    game.state = 'playing';
    await game.save();

    const result: any = await getServerSideProps(context as any);

    expect(result.redirect).toBeDefined();
    expect(result.redirect.destination).toBeDefined();
    expect(result.redirect.destination).toBe(`/game/play/${roomId.toString()}`);
    expect(result.redirect.permanent).toBeDefined();
    expect(result.redirect.permanent).toBeFalsy();
});

test('getServerSideProps returns the correct props', async () => {
    const context: ContextWithCookies = { req: { cookies: {} } };
    context.req.cookies['room-id'] = roomId.toString();
    context.req.cookies['id'] = playerId.toString();

    const game = await Game.findById(roomId);

    if (!game) {
        throw 'Game was undefined, something went seriously wrong...';
    }

    game.state = 'waiting';
    await game.save();

    const { props }: any = await getServerSideProps(context as any);
    expect(props.game).toBeDefined();
    expect(props.game).toMatchObject({
        _id: roomId.toString(),
        code: '123',
        startingBalance: 100,
        state: 'waiting',
        players: [{
            _id: playerId.toString(),
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
    });

});