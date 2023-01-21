/* eslint-disable @typescript-eslint/no-explicit-any */
import { clearMockDb, connectMockDb, disconnectMockDb } from 'tests/utils/setupDatabase';
import { afterAll, afterEach, beforeAll, beforeEach, expect, test, vi } from 'vitest'
import { getServerSideProps } from '../../../pages/game/rejoin';
import { ContextWithCookies } from '../../../types/ContextWithCookies';
import Game from '../../../database/models/game';
import { Types } from 'mongoose';
import Rejoin from 'pages/game/rejoin';
import { render } from '@testing-library/react';
vi.mock('cookies-next');
vi.mock('next/router');
vi.mock('next/head');

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
    await clearMockDb();
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
    const result: any = await getServerSideProps(context as any);
    context.req.cookies['id'] = playerId.toString();

    expect(result.redirect).toBeDefined();
    expect(result.redirect.destination).toBe('/game');
    expect(result.redirect.permanent).toBeFalsy();
});

test('getServerSideProps redirects with no player id', async () => {
    const context: ContextWithCookies = { req: { cookies: {} } };
    const result: any = await getServerSideProps(context as any);
    context.req.cookies['room-id'] = roomId.toString();

    expect(result.redirect).toBeDefined();
    expect(result.redirect.destination).toBe('/game');
    expect(result.redirect.permanent).toBeFalsy();
});

test('getServerSideProps provides correct data', async () => {
    const context: ContextWithCookies = { req: { cookies: {} } };
    context.req.cookies['room-id'] = roomId.toString();
    context.req.cookies['id'] = playerId.toString();

    const { props: result }: any = await getServerSideProps(context as any);

    expect(result.gameState).toBeDefined();
    expect(result.gameState).toBe('waiting');
    expect(result.gameId).toBeDefined();
    expect(result.gameId).toBe(roomId.toString());
    expect(result.gameCode).toBeDefined();
    expect(result.gameCode).toBe('123');
    expect(result.playerId).toBeDefined();
    expect(result.playerId).toBe(playerId.toString());
    expect(result.playerName).toBeDefined();
    expect(result.playerName).toBe('test');
    expect(result.image).toBeDefined();
    expect(result.image).toBe('https://storage.googleapis.com/trial-by-fire/test.jpg');
});

test('Page sets title', async () => {
    // We can assume that get serverside props is working here & feed it to the component
    const context: ContextWithCookies = { req: { cookies: {} } };
    context.req.cookies['room-id'] = roomId.toString();
    context.req.cookies['id'] = playerId.toString();
    const result: any = await getServerSideProps(context as any);
    render(<Rejoin {...result.props}/>, { container: document.head });

    expect(document.title).toBe('Trials by fire - Rejoin');
});