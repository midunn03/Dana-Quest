import { categoryLabels, type Destination, type DestinationCategory } from '../data/destinations'
import { distanceMeters, isFresh, MAX_ACCURACY, type LocationSample } from './location'

export const searchText = (text: string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd').toLowerCase().trim()
const conversationalWords = new Set(['tim', 'kiem', 'cho', 'toi', 'minh', 'muon', 'di', 'den', 'gan', 'day', 'o', 'co', 'nao', 'dia', 'diem', 'hay', 'xem', 'giup'])
const destinationAliases: Record<string, string[]> = {
  'cau-rong': ['dragon bridge', 'rong phun lua', 'rong phun nuoc'],
  'cau-song-han': ['han river bridge', 'cau quay'],
  'bao-tang-da-nang': ['da nang museum', 'city museum'],
  'bao-tang-dieu-khac-cham': ['cham museum', 'cham sculpture museum', 'museum of cham sculpture'],
  'cong-vien-apec': ['apec park', 'walking area'],
  'cau-tinh-yeu': ['love bridge', 'love pier', 'pho di bo', 'walking street', 'ben song'],
  'bai-bien-my-khe': ['my khe beach'],
  'cong-vien-bien-dong': ['east sea park'],
  'bien-man-thai-sup': ['man thai beach', 'paddle board'],
  'chua-linh-ung-bai-but': ['linh ung pagoda', 'linh ung temple', 'lady buddha'],
  'dinh-ban-co': ['ban co peak', 'chess board peak'],
  'hai-van-quan': ['hai van pass', 'hai van gate'],
  'ngu-hanh-son': ['marble mountains'],
  'cau-vang-ba-na-hills': ['golden bridge', 'ba na hills'],
  'bai-bien-nam-o': ['nam o beach'],
}
export function naturalSearchTerms(query: string) {
  const normalized = searchText(query).replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim()
  if (normalized.includes('pho di bo')) return ['pho di bo']
  if (normalized.includes('walking street') || normalized.includes('pedestrian street')) return ['walking street']
  const terms = normalized.split(/\s+/).filter(term => term && !conversationalWords.has(term))
  return terms.length ? terms : searchText(query).split(/\s+/).filter(Boolean)
}
export function filterDestinations(places: Destination[], query: string, maxKm: number, sample: LocationSample | null, now = Date.now(), category: DestinationCategory | null = null): Destination[] {
  const terms = naturalSearchTerms(query)
  return places.filter(place => {
    const searchable = [place.name, categoryLabels[place.category], ...place.tags, ...(destinationAliases[place.id] ?? [])].map(searchText).join(' ')
    if (!terms.every(term => searchable.includes(term)) || (category && place.category !== category)) return false
    if (!maxKm) return true
    if (!sample || !isFresh(sample, now) || sample.accuracy > MAX_ACCURACY) return false
    return distanceMeters([sample.latitude, sample.longitude], place.position) <= maxKm * 1000
  })
}
