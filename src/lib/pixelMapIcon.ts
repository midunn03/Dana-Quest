// Small, hand-drawn pixel landmarks. Static markup only; no user content is inserted.
const water = '<path fill="#32b9e7" d="M2 25h28v5H2z"/><path stroke="#d9f8ff" d="M4 27h6m5 1h7m3-2h4"/>'
const hill = '<path fill="#30ab78" d="M2 26v-5h4v-5h4v-5h5v5h4v-8h4v6h4v7h3v7H2z"/>'
const palm = '<path fill="#b78545" d="M15 15h3v13h-3z"/><path fill="#28aa70" d="M5 13V9h8V6h7v3h7v5h-7v-3h-3v5h-4v-4H9v3H5z"/>'
const building = '<path fill="#fff0bc" d="M5 13h22v15H5z"/><path fill="#f1b63e" d="M3 11h4V8h5V5h8v3h5v3h4v3H3z"/><path fill="#24628b" d="M8 17h3v8H8zm7 0h3v8h-3zm7 0h3v8h-3z"/>'
const landmarks: Record<string, string> = {
  'due-dau-an-50-nam': '<path fill="#fff2ce" d="M3 27V8h3V5h12v3h3v19h-5V11H8v16z"/><path fill="#34b7d8" d="M5 27V9h3v18z"/><path fill="#ffe7a3" d="M21 15h9v12h-9z"/><path fill="#227d9a" d="M22 18h7v3h-7z"/>',
  'cau-rong': water + '<path fill="#ffbd28" d="M2 23v-7h3v-5h4v5h3v6h3v-7h3v-5h4v6h4v-6h-3V6h3V3h3v4h3v10h-5v7h-6v-8h-3v8h-8v-7H6v7z"/><path fill="#fff0a5" d="M25 9h5v3h-5z"/><path fill="#153b55" d="M28 7h2v2h-2z"/>',
  'cau-song-han': water + '<path fill="#f6f5de" d="M2 22h28v3H2z"/><path stroke="#fff7cf" stroke-width="1.5" d="M22 8L5 22m17-10L11 22m11-7l-5 7m5-12l7 12"/><path fill="#215e88" d="M21 5h4v19h-4z"/>',
  'bao-tang-da-nang': building,
  'bao-tang-dieu-khac-cham': '<path fill="#e7a260" d="M5 27V15h3v-5h5V5h6v5h5v5h3v12z"/><path fill="#ffe2a5" d="M11 13h10v4H11zm-3 7h16v3H8z"/><path fill="#905339" d="M14 20h4v8h-4z"/>',
  'cong-vien-apec': '<path fill="#31ad7f" d="M2 25h28v5H2z"/><path fill="#fff0c6" d="M3 9h4v4h4v3h4v3h3v-4h4v-5h4V5h4v13h-4v4H8v-4H3z"/><path fill="#f0bd50" d="M8 22h18v3H8z"/>',
  'cau-tinh-yeu': water + '<path fill="#205b7b" d="M14 13h3v14h-3zM4 24h24v3H4z"/><path fill="#fa6570" d="M7 5h6v3h3V5h6v3h3v6h-3v3h-3v3h-6v-3h-3v-3H7z"/>',
  'bai-bien-my-khe': water + '<path fill="#ffe29a" d="M2 20h28v5H2z"/>' + palm,
  'cong-vien-bien-dong': water + '<path fill="#faffed" d="M3 8h5v4h5v4h4v-4h5V8h6v5h-4v5h-5v4h-6v-4H8v-5H3z"/>',
  'bien-man-thai-sup': water + '<path fill="#ffd14d" d="M3 24h26v3H3z"/><path fill="#fa7b55" d="M13 11h6v8h-6z"/><path fill="#f8dfb3" d="M14 5h5v5h-5z"/><path stroke="#153b55" stroke-width="2" d="M22 10l-3 18"/>',
  'chua-linh-ung-bai-but': hill + '<path fill="#fff9df" d="M13 3h6v5h-6zm-1 6h8v5h2v5h-3v6h5v4H8v-4h5v-6h-3v-5h2z"/>',
  'dinh-ban-co': hill + '<path fill="#ffe2a5" d="M7 21h18v7H7z"/><path fill="#153b55" d="M8 22h4v3H8zm8 0h4v3h-4zm-4 3h4v3h-4zm8 0h4v3h-4z"/><path fill="#f5bf43" d="M13 10h6v4h-2v5h4v3H11v-3h4v-5h-2z"/>',
  'hai-van-quan': hill + '<path fill="#ce9262" d="M5 12h22v16H5z"/><path fill="#f2c68e" d="M3 8h5v4h5V8h6v4h5V8h5v7H3z"/><path fill="#153b55" d="M13 20h6v9h-6z"/>',
  'ngu-hanh-son': hill + '<path fill="#a1d9a2" d="M7 23V13h3V7h4v9h3v8zm12 1V12h3V4h4v15h3v7z"/>',
  'cau-vang-ba-na-hills': hill + '<path fill="#fff0c5" d="M5 21V10h3v7h2V8h3v9h2v-6h3v10h-3v7H8v-7zm17 0V10h3v8h2v-5h3v10h-3v5h-5z"/><path fill="#ffc634" d="M2 19h28v4H2z"/>',
  'bai-bien-nam-o': water + '<path fill="#587c68" d="M3 23v-6h5v-4h6v6h4v5zm16 2v-8h5v-5h5v13z"/>',
}
export function pixelMapIcon(placeId?: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" shape-rendering="crispEdges" aria-hidden="true">${landmarks[placeId ?? ''] ?? building}</svg>`
}
