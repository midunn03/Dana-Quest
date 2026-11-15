import type { Destination } from './data/destinations'
import LandmarkArt from './LandmarkArt'

/** Hình đại diện của địa điểm: ảnh do admin tải lên, hoặc tranh minh họa có sẵn cho địa điểm mẫu. */
export default function PlaceArt({ place, sunset }: { place: Destination; sunset?: boolean }) {
  if (place.source !== 'admin') return <LandmarkArt id={place.id} sunset={sunset} />
  const photo = place.photos?.[0]
  return photo ? <img className="place-art-photo" src={photo.url} alt="" /> : <span className="admin-hero-empty" aria-hidden="true" />
}
