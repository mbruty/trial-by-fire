import { OptionsType } from 'cookies-next/lib/types';
import { vi } from 'vitest';

export const getCookie = vi.fn().mockImplementation((key: string, options: OptionsType) => {
    if (!options.req) return '';
    if (!options.req.cookies) return '';
    return options.req.cookies[key];
});

export const deleteCookie = vi.fn().mockImplementation(() => null);