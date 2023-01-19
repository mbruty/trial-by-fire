import { OptionsType } from 'cookies-next/lib/types';
import { vi } from 'vitest';

function mockGetCookie() {
    console.log('ere')
    vi.mock('cookies-next', () => {
        console.log('ere2')
        const getCookie = vi.fn();
        getCookie.mockImplementation((key: string, options: OptionsType) => {
            if (!options.req) return '';
            if (!options.req.cookies) return '';
            return options.req.cookies[key];
        })

        return { getCookie };
    })
}

export default mockGetCookie