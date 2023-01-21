import { vi } from 'vitest';

const mockResponse = {
    json: vi.fn(),
    status: vi.fn(),
    end: vi.fn()
};

export default mockResponse;