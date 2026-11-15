import type { IncomingMessage, ServerResponse } from 'node:http'

type Middleware = (request: IncomingMessage, response: ServerResponse, next: (error?: Error) => void) => Promise<void>

export function createEventsFeedProxy(options?: {
  host?: string
  port?: number
  fetchImpl?: typeof fetch
}): Middleware

export const eventsFeedProxy: Middleware
