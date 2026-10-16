import type { IncomingMessage, ServerResponse } from 'node:http'

export interface NearbyRecommendation {
  id: string
  distanceKm: number
  highlightReason: string
}

export declare function rankNearbyDestinations(latitude: number, longitude: number, limit?: number): NearbyRecommendation[]
export declare function recommendationsApi(request: IncomingMessage, response: ServerResponse, next: (error?: Error) => void): void
