import { vi } from 'vitest';

export const post = vi.fn();

post.mockImplementation(() => ({ status: 200 }));