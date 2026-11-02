import { getDestination } from './data/destinations'
import LandmarkArt from './LandmarkArt'
import { useProgress } from './lib/useProgress'
import { requiredCount } from './lib/rules'
import AdminGallery from './AdminGallery'
import CrowdChart from './CrowdChart'
import { usePlaceData } from './lib/placeContent'

export default function DestinationDetails({ id }: { id: string }) {
  usePlaceData() // tải danh sách địa điểm từ Django và vẽ lại khi có
  const place = getDestination(id)
  const { state } = useProgress()
  if (!place) return <main className="screen-page"><h1>Không tìm thấy điểm đến</h1><a href="#/kham-pha">← Bản đồ</a></main>
  const progress = state.destinations[id]
  const missionLinks = <><a className="game-button" href={`#/chi-duong/${id}`}>Bắt đầu khám phá →</a><a className="detail-secondary" href={`#/nhiem-vu/${id}`}>Nhiệm vụ và tiến độ {progress?.started ? `· mục tiêu ${requiredCount(progress.selected.length)}` : ''}</a></>
  const missionFact = <div><dt>◎ Nhiệm vụ</dt><dd>{progress?.started ? `${progress.completed.length}/${progress.selected.length} đã xong` : 'Chọn số lượng 5–10'}</dd></div>
  if (place.source === 'admin') {
    const [cover, ...rest] = place.photos ?? []
    return <main className="detail-screen">
      <div className="destination-hero admin-hero">{cover
        ? <img className="destination-photo" src={cover.url} alt={cover.caption || place.name} />
        : <span className="admin-hero-empty" aria-hidden="true" />}<a className="round-back" href="#/kham-pha" aria-label="Quay lại bản đồ">←</a>{cover?.credit && <span className="photo-credit">Ảnh: {cover.credit}</span>}</div>
      <section className="detail-sheet"><h1>{place.name}</h1><div className="tag-row"><span>Đà Nẵng</span>{place.hours && <span>{place.hours}</span>}</div>
        {place.description && <p>{place.description}</p>}
        <dl className="place-facts">{(place.address || place.location) && <div><dt>⌖ Địa điểm</dt><dd>{place.address || place.location}</dd></div>}{missionFact}</dl>
        {place.suggestedActivities.length > 0 && <><h2>Gợi ý hoạt động</h2><ul>{place.suggestedActivities.map(activity => <li key={activity}>{activity}</li>)}</ul></>}
        {place.hoursNote && <p>{place.hoursNote}</p>}
        {(place.crowd?.length ?? 0) > 0 && <><h2>Giờ đông đúc</h2><CrowdChart levels={place.crowd ?? []} note={place.crowdNote}/></>}
        {place.tip && <aside className="travel-tip"><strong>☀ Mẹo nhỏ</strong><p>{place.tip}</p></aside>}
        {rest.length > 0 && <AdminGallery name={place.name} photos={rest}/>}
        {missionLinks}
        {place.detail && <details className="more-info"><summary>Tìm hiểu thêm</summary><p>{place.detail}</p></details>}
      </section></main>
  }
  return <main className="detail-screen">
    <div className="destination-hero">{place.photo
      ? <><img className="destination-photo" src={`${import.meta.env.BASE_URL}${place.photo.replace(/^\//, '')}`} alt={`Ảnh thật ${place.name}`} /><a className="round-back" href="#/kham-pha" aria-label="Quay lại bản đồ">←</a><span className="photo-credit">Ảnh: {place.photoCredit}</span></>
      : <><LandmarkArt id={id}/><a className="round-back" href="#/kham-pha" aria-label="Quay lại bản đồ">←</a><span className="art-caption">Minh họa điểm đến</span></>}</div>
    <section className="detail-sheet"><h1>{place.name}</h1><div className="tag-row"><span>Đà Nẵng</span><span>Tự do khám phá</span></div><p>{place.description}</p>
      <dl className="place-facts"><div><dt>⌖ Địa điểm</dt><dd>{place.location}</dd></div><div><dt>◷ Thời gian</dt><dd>Bạn tự sắp xếp</dd></div>{missionFact}</dl>
      <aside className="travel-tip"><strong>☀ Mẹo nhỏ</strong><p>Đi bộ ở lối an toàn, mang nước và giữ gìn không gian chung.</p></aside>
      {missionLinks}
      <details className="more-info"><summary>Tìm hiểu thêm</summary><p>{place.detail}</p><p>Thông tin và tọa độ mẫu, cần kiểm tra thực tế khi đến nơi.</p></details>
    </section>
  </main>
}
