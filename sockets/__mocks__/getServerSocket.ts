import { vi } from 'vitest';

export const emit = vi.fn();
export const to = vi.fn().mockImplementation(() => ({ emit }));

function getServerSocket() {
    return {
        to
    }
}

export default getServerSocket;