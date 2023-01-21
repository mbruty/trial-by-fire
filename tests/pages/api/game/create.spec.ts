/* eslint-disable @typescript-eslint/no-explicit-any */

import { connectMockDb, disconnectMockDb } from 'tests/utils/setupDatabase';
import { afterAll, afterEach, beforeAll, expect, test, vi } from 'vitest'
import handler from 'pages/api/game/create';
import Game from 'database/models/game';
import mockResponse from 'tests/utils/mockResponse';
import { isObjectIdOrHexString } from 'mongoose';

vi.mock('cookies-next');

// Connect to the mock db
beforeAll(async () => {
    await connectMockDb();
});

afterAll(async () => {
    await disconnectMockDb();
})

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

test('Api route returns a 400 with empty body', async () => {
    const req: any = { method: 'POST', body: {} };
    const res = mockResponse;
    await handler(req, res as any);

    expect(res.status).toBeCalledTimes(1);
    expect(res.status).toBeCalledWith(400);
    expect(res.end).toBeCalledTimes(1);
});

test('Api route returns a 400 with empty trials array', async () => {
    const req: any = { method: 'POST', body: { trials: [] } };
    const res = mockResponse;
    await handler(req, res as any);

    expect(res.status).toBeCalledTimes(1);
    expect(res.status).toBeCalledWith(400);
    expect(res.end).toBeCalledTimes(1);
});

test('Api route returns a 400 with no bean count', async () => {
    const req: any = { method: 'POST', body: { trials: [{ title: 'test trial', type: 'test' }] } };
    const res = mockResponse;
    await handler(req, res as any);

    expect(res.status).toBeCalledTimes(1);
    expect(res.status).toBeCalledWith(400);
    expect(res.end).toBeCalledTimes(1);
});

test('Api route returns a 400 with title missing from trial', async () => {
    const req: any = {
        method: 'POST',
        body: {
            trials: [{
                type: 'test',
            }],
            starterBeanCount: 100
        }
    };

    const res = mockResponse;
    await handler(req, res as any);

    expect(res.status).toBeCalledTimes(1);
    expect(res.status).toBeCalledWith(400);
    expect(res.end).toBeCalledTimes(1);
});

test('Api route returns a 400 with type missing from trial', async () => {
    const req: any = {
        method: 'POST',
        body: {
            trials: [{
                title: 'test trial'
            }],
            starterBeanCount: 100
        }
    };

    const res = mockResponse;
    await handler(req, res as any);

    expect(res.status).toBeCalledTimes(1);
    expect(res.status).toBeCalledWith(400);
    expect(res.end).toBeCalledTimes(1);
});

test('Api route returns a 200 with correct body', async () => {
    const req: any = {
        method: 'POST',
        body: {
            trials: [{
                title: 'test trial',
                type: 'test',
            }],
            starterBeanCount: 100
        }
    };

    const res = mockResponse;
    await handler(req, res as any);

    expect(res.status).toBeCalledTimes(1);
    expect(res.status).toBeCalledWith(200);
    expect(res.end).toBeCalledTimes(1);
});

test('Api gives a correct json response', async () => {
    const req: any = {
        method: 'POST',
        body: {
            trials: [{
                title: 'test trial',
                type: 'test',
            }],
            starterBeanCount: 100
        }
    };

    const res = mockResponse;
    await handler(req, res as any);

    const calls = res.json.mock.calls[0][0]; // Get the first argument from the first call
    
    expect(res.status).toBeCalledTimes(1);
    expect(res.status).toBeCalledWith(200);
    expect(isObjectIdOrHexString(calls.gameId)).toBeTruthy();

    const game = await Game.findById(calls.gameId).lean();
    expect(game).toBeDefined();
    expect(calls.code).toBe(game?.code);

    expect(res.end).toBeCalledTimes(1);
});

test('Api creates the object correctly', async () => {
    const req: any = {
        method: 'POST',
        body: {
            trials: [{
                title: 'test trial',
                type: 'test',
            }],
            starterBeanCount: 100
        }
    };

    const res = mockResponse;
    await handler(req, res as any);

    const calls = res.json.mock.calls[0][0]; // Get the first argument from the first call
    
    expect(res.status).toBeCalledTimes(1);
    expect(res.status).toBeCalledWith(200);

    const game = await Game.findById(calls.gameId).lean();
    expect(game).toBeDefined();
    expect(game?.rounds).toMatchObject(req.body.trials);
    expect(game?.startingBalance).toBe(req.body.starterBeanCount);
    expect(res.end).toBeCalledTimes(1);
});