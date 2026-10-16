import type { IncomingMessage, ServerResponse } from 'node:http'
type Middleware = (request: IncomingMessage, response: ServerResponse, next: () => void) => void
export declare function createAuthApi(options?: { file?: string }): Middleware
export declare function normalizePhone(value: unknown): string
export declare const authApi: Middleware
