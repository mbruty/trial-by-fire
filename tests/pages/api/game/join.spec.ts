/* eslint-disable @typescript-eslint/no-explicit-any */

import { connectMockDb, disconnectMockDb } from 'tests/utils/setupDatabase';
import { afterAll, afterEach, beforeAll, beforeEach, expect, test, vi } from 'vitest'
import handler from 'pages/api/game/join';
import Game from 'database/models/game';
import mockResponse from 'tests/utils/mockResponse';

vi.mock('cookies-next');

// Connect to the mock db
beforeAll(async () => {
    await connectMockDb();
});

afterAll(async () => {
    await disconnectMockDb();
});

beforeEach(async () => {
    await Game.create({
        code: '123',
        startingBalance: 100,
    });
});

afterEach(async () => {
    vi.clearAllMocks();
    await Game.deleteMany({});
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

test('Api route returns a 400 with invalid game code', async () => {
    const req: any = { method: 'POST', body: { gameCode: 'abc' } };
    const res = mockResponse;
    await handler(req, res as any);

    expect(res.status).toBeCalledTimes(1);
    expect(res.status).toBeCalledWith(400);
    expect(res.end).toBeCalledTimes(1);
});

test('Api route returns 400 with isRemote missing', async () => {
    const req: any = {
        method: 'POST',
        body: {
            name: 'test'
        }
    };
    const res = mockResponse;
    await handler(req, res as any);

    expect(res.status).toBeCalledTimes(1);
    expect(res.status).toBeCalledWith(400);
    expect(res.end).toBeCalledTimes(1);
});

test('Api route returns 400 with name missing', async () => {
    const req: any = {
        method: 'POST',
        body: {
            isRemote: true
        }
    };
    const res = mockResponse;
    await handler(req, res as any);

    expect(res.status).toBeCalledTimes(1);
    expect(res.status).toBeCalledWith(400);
    expect(res.end).toBeCalledTimes(1);
});

test('Api route returns 200 with correct body', async () => {
    const req: any = {
        method: 'POST',
        body: {
            gameCode: '123',
            name: 'test',
            isRemote: true
        }
    };
    const res = mockResponse;
    await handler(req, res as any);

    expect(res.status).toBeCalledTimes(1);
    expect(res.status).toBeCalledWith(200);
    expect(res.end).toBeCalledTimes(1);
});

test('Api route creates entry in database', async () => {
    const req: any = {
        method: 'POST',
        body: {
            gameCode: '123',
            name: 'test',
            isRemote: true
        }
    };
    const res = mockResponse;
    await handler(req, res as any);

    const game = await Game.find({});

    if (!game || game.length === 0) throw 'Game was not ceated in before each';

    const players = game[0].players;
    expect(res.status).toBeCalledTimes(1);
    expect(res.status).toBeCalledWith(200);
    expect(players).toHaveLength(1);
    expect(players[0].name).toBe('test');
    expect(players[0].isRemote).toBe(true);
    expect(players[0].beanBalance).toBe(game[0].startingBalance);
    expect(res.end).toBeCalledTimes(1);
});

test('Api route gives correct json response', async () => {
    const req: any = {
        method: 'POST',
        body: {
            gameCode: '123',
            name: 'test',
            isRemote: true
        }
    };
    const res = mockResponse;
    await handler(req, res as any);

    const game = await Game.find({});

    if (!game || game.length === 0) throw 'Game was not ceated in before each';

    const player = game[0].players[0];

    const call = res.json.mock.calls[0][0]; // Get the first argument from the first call

    expect(res.status).toBeCalledTimes(1);
    expect(res.status).toBeCalledWith(200);
    expect(call.ID).toBe(player._id.toString());
    expect(call.roomID).toBe(game[0]._id.toString());
    expect(res.end).toBeCalledTimes(1);
});