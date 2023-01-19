export type ContextWithCookies = {
    params?: {
        id: string;
    }
    req: {
        cookies: Partial<{
            [key: string]: string;
        }>
    }
}