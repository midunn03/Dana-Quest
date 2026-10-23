import { getDestination } from './data/destinations'
import LandmarkArt from './LandmarkArt'
import { useProgress } from './lib/useProgress'
import { requiredCount } from './lib/rules'
import AdminGallery from './AdminGallery'
import { usePlaceData } from './lib/placeContent'
export default function DestinationDetails({ id }: { id:string }) {
  const place = getDestination(id)
  const { state } = useProgress()
  const custom = usePlaceData().content[id]
  if (!place) return <main className="screen-page"><h1>Không tìm thấy điểm đến</h1><a href="#/kham-pha">← Bản đồ</a></main>
  const progress = state.destinations[id]
  return <main className="detail-screen">
    {custom ? <>
      <div className="destination-hero admin-hero">{custom.photos[0]
        ? <img className="destination-photo" src={custom.photos[0].url} alt={custom.photos[0].caption || place.name} />
        : <span className="admin-hero-empty" aria-hidden="true" />}<a className="round-back" href="#/kham-pha" aria-label="Quay lại bản đồ">←</a>{custom.photos[0]?.credit && <span className="photo-credit">Ảnh: {custom.photos[0].credit}</span>}</div>
      <section className="detail-sheet"><h1>{place.name}</h1><div className="tag-row"><span>Đà Nẵng</span>{custom.hours && <span>{custom.hours}</span>}</div>
        {custom.description && <p>{custom.description}</p>}
        <dl className="place-facts">{(custom.address || place.location) && <div><dt>⌖ Địa điểm</dt><dd>{custom.address || place.location}</dd></div>}<div><dt>◎ Nhiệm vụ</dt><dd>{progress?.started ? `${progress.completed.length}/${progress.selected.length} đã xong` : 'Chọn số lượng 5–10'}</dd></div></dl>
        {custom.tip && <aside className="travel-tip"><strong>☀ Mẹo nhỏ</strong><p>{custom.tip}</p></aside>}
        {custom.photos.length > 1 && <AdminGallery name={place.name} photos={custom.photos.slice(1)}/>}
        <a className="game-button" href={`#/chi-duong/${id}`}>Bắt đầu khám phá →</a><a className="detail-secondary" href={`#/nhiem-vu/${id}`}>Nhiệm vụ và tiến độ {progress?.started ? `· mục tiêu ${requiredCount(progress.selected.length)}` : ''}</a>
        {custom.detail && <details className="more-info"><summary>Tìm hiểu thêm</summary><p>{custom.detail}</p></details>}
      </section></> : <>
    <div className="destination-hero">{place.photo
      ? <><img className="destination-photo" src={`${import.meta.env.BASE_URL}${place.photo.replace(/^\//, '')}`} alt={`Ảnh thật ${place.name}`} /><a className="round-back" href="#/kham-pha" aria-label="Quay lại bản đồ">←</a><span className="photo-credit">Ảnh: {place.photoCredit}</span></>
      : <><LandmarkArt id={id}/><a className="round-back" href="#/kham-pha" aria-label="Quay lại bản đồ">←</a><span className="art-caption">Minh họa điểm đến</span></>}</div>
    <section className="detail-sheet"><h1>{place.name}</h1><div className="tag-row"><span>Đà Nẵng</span><span>Tự do khám phá</span></div><p>{place.description}</p>
      <dl className="place-facts"><div><dt>⌖ Địa điểm</dt><dd>{place.location}</dd></div><div><dt>◷ Thời gian</dt><dd>Bạn tự sắp xếp</dd></div><div><dt>◎ Nhiệm vụ</dt><dd>{progress?.started ? `${progress.completed.length}/${progress.selected.length} đã xong` : 'Chọn số lượng 5–10'}</dd></div></dl>
      <aside className="travel-tip"><strong>☀ Mẹo nhỏ</strong><p>Đi bộ ở lối an toàn, mang nước và giữ gìn không gian chung.</p></aside>
      <a className="game-button" href={`#/chi-duong/${id}`}>Bắt đầu khám phá →</a><a className="detail-secondary" href={`#/nhiem-vu/${id}`}>Nhiệm vụ và tiến độ {progress?.started ? `· mục tiêu ${requiredCount(progress.selected.length)}` : ''}</a>
      <details className="more-info"><summary>Tìm hiểu thêm</summary><p>{place.detail}</p><p>Thông tin và tọa độ mẫu, cần kiểm tra thực tế khi đến nơi.</p></details>
    </section>
    </>}
  </main>
}
