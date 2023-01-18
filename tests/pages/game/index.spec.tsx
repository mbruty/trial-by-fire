/* eslint-disable @typescript-eslint/no-explicit-any */
import { expect, test } from 'vitest'
import { getServerSideProps } from '../../../pages/game/index';
import { ContextWithCookies } from '../../../types/ContextWithCookies';

test('getServerSideProps returns redirect with correct cookies present', async () => {
    const context: ContextWithCookies = { req: { cookies: {} } };
    context.req.cookies['room-id'] = 'a';
    const result: any = await getServerSideProps(context as any);

    expect(result.redirect).toBeDefined();
    expect(result.redirect.destination).toBe('/game/rejoin');
    expect(result.redirect.permanent).toBeFalsy();
});

test('getServerSideProps returns nothing with no cookies present', async () => {
    const context: ContextWithCookies = { req: { cookies: {} } };
    const result: any = await getServerSideProps(context as any);

    expect(result.redirect).toBeUndefined();
});