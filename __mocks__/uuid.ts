import { vi } from 'vitest';

export const uuidstring = '1111-2222-3333-4444';
export const v4 = vi.fn().mockReturnValue(uuidstring);