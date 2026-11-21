// Detailed transparent raster sprites, generated from the user's architectural reference.
const sprites: Record<string, string> = {
  'cong-vien-apec': 'cong-vien-apec-pixel-v2.png',
  'bao-tang-da-nang': 'bao-tang-da-nang-pixel-v2.png',
  'cau-tinh-yeu': 'cau-tinh-yeu-pixel-v2.png',
  'bao-tang-dieu-khac-cham': 'bao-tang-dieu-khac-cham-pixel-v2.png',
  'cong-vien-bien-dong': 'cong-vien-bien-dong-pixel-v2.png',
  'bien-man-thai-sup': 'bien-man-thai-sup-pixel-v2.png',
  'bai-bien-my-khe': 'bai-bien-my-khe-pixel-v2.png',
  'chua-linh-ung-bai-but': 'chua-linh-ung-bai-but-pixel-v2.png',
  'hai-van-quan': 'hai-van-quan-pixel-v2.png',
  'dinh-ban-co': 'dinh-ban-co-pixel-v2.png',
  'bai-bien-nam-o': 'bai-bien-nam-o-pixel-v2.png',
  'cau-vang-ba-na-hills': 'cau-vang-ba-na-hills-pixel-v2.png',
  'ngu-hanh-son': 'ngu-hanh-son-pixel-v2.png',
  'cau-song-han': 'han-bridge-pixel-v2.png',
  'cau-rong': 'dragon-bridge-pixel-v2.png',
  'due-dau-an-50-nam': 'due-gate-pixel-v2.png',
}
export const hasPixelLandmarkSample = (id?: string) => !!sprites[id ?? '']
export function pixelLandmarkImageUrl(id?: string): string | null {
  const file = sprites[id ?? '']
  return file ? `${import.meta.env.BASE_URL}art/map/${file}` : null
}
export function pixelLandmarkSample(id?: string) {
  const file = sprites[id ?? '']
  return file ? '<img src="' + import.meta.env.BASE_URL + 'art/map/' + file + '" alt="" aria-hidden="true" draggable="false"/>' : ''
}
