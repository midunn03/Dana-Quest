import type { IncomingMessage, ServerResponse } from 'node:http'

type Middleware = (request: IncomingMessage, response: ServerResponse, next: () => void) => void
type Limiter = {
  prune(): void
  consume(key: string, limit: number, duration: number): boolean
  beginLogin(key: string): ((outcome: boolean | null) => void) | null
}
export function createPersistentLimiter(options?: { file?: string; clock?: () => number }): Limiter
export function createApiRateLimit(options?: { limiter?: Pick<Limiter, 'consume'>; trustProxy?: boolean }): Middleware
export function rateLimitResponse(response: ServerResponse, status?: number): void
export const apiRateLimit: Middleware
