export type ContextWithCookies = {
    req: {
        cookies: Partial<{
            [key: string]: string;
        }>
    }
}