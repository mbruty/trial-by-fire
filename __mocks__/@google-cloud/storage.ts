import { vi } from 'vitest';

export const bucket = vi.fn();
export const file = vi.fn();
export const save = vi.fn().mockImplementation((_0, callback: (err: string) => void) => {
    callback('');
});
export const _delete = vi.fn();

bucket.mockImplementation(() => {
    return {
        file: file
    };
});

file.mockImplementation(() => {
    return {
        save,
        delete: _delete
    };
});

export class Storage {
    public bucket = bucket;
}