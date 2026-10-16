import type { IncomingMessage, ServerResponse } from 'node:http'

export declare function placesApi(request: IncomingMessage, response: ServerResponse, next: (error?: Error) => void): Promise<void>
