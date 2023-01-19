import { vi } from 'vitest';

export const bucket = vi.fn();
export const file = vi.fn();
export const _delete = vi.fn();

bucket.mockImplementation(() => {
    return {
        file: file
    };
});

file.mockImplementation(() => {
    return {
        delete: _delete
    };
});

export class Storage {
    public bucket = bucket;
}