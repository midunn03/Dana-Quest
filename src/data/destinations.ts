import destinationRecords from './destinations.json'
import historicRecords from './historicalDestinations.json'

export type DestinationCategory = 'landmark' | 'museum' | 'park' | 'beach' | 'pagoda' | 'nature' | 'heritage' | 'legacy'
export type ActivityAvailability = 'unknown' | 'verified'

export interface Destination {
  id: string
  name: string
  position: [number, number]
  location: string
  category: DestinationCategory
  tags: string[]
  description: string
  detail: string
  suggestedActivities: string[]
  featuredScore: number
  highlightReason: string
  markerAsset: string
  /** Ghim đại diện cho bao nhiêu mét ngoài đời; quyết định kích thước khi zoom (mặc định 70). */
  markerMeters?: number
  sourceUrl: string
  coordinateSourceUrl: string
  photo?: string
  photoCredit?: string
  photoSourceUrl?: string
  coordinateNote?: string
  activityAvailability?: ActivityAvailability
  verificationNote?: string
}

type DestinationRecord = Omit<Destination, 'position'> & { position: number[] }

function normalizeDestinations(records: DestinationRecord[]): Destination[] {
  return records.map(record => ({
  ...record,
  position: record.position as [number, number],
  }))
}

// Active records feed the map; historic records only keep older progress readable.
export const destinations = normalizeDestinations(destinationRecords as unknown as DestinationRecord[])
export const historicalDestinations = normalizeDestinations(historicRecords as unknown as DestinationRecord[])
export const getDestination = (id: string) => destinations.find(place => place.id === id) ?? historicalDestinations.find(place => place.id === id)

export const categoryLabels: Record<DestinationCategory, string> = {
  landmark: 'Kiến trúc',
  museum: 'Bảo tàng',
  park: 'Công viên',
  beach: 'Biển',
  pagoda: 'Chùa',
  nature: 'Thiên nhiên',
  heritage: 'Di tích',
  legacy: 'Lưu trữ',
}
