import { vi } from 'vitest';

export const push = vi.fn();
export const useRouter = vi.fn();

useRouter.mockImplementation(() => ({ push }));