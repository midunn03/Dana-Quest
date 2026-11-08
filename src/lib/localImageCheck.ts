import { t } from '../i18n/locale'
export interface ImageCheckResult { status: 'checking' | 'pass' | 'review' | 'fail'; message: string }

export async function checkImageLocally(blob: Blob): Promise<ImageCheckResult> {
  if (!('createImageBitmap' in window)) return { status: 'review', message: t("Trình duyệt không hỗ trợ phân tích ảnh cục bộ. Bạn có thể tự kiểm tra và xác nhận.") }
  try {
    const bitmap = await createImageBitmap(blob)
    if (bitmap.width < 320 || bitmap.height < 240) { bitmap.close(); return { status: 'fail', message: t("Ảnh quá nhỏ. Hãy chọn ảnh rõ hơn, tối thiểu khoảng 320 × 240 px.") } }
    const canvas = document.createElement('canvas'); canvas.width = 48; canvas.height = 48
    const context = canvas.getContext('2d', { willReadFrequently: true })
    if (!context) { bitmap.close(); return { status: 'review', message: t("Không đọc được nội dung ảnh. Bạn có thể tự kiểm tra và xác nhận.") } }
    context.drawImage(bitmap, 0, 0, 48, 48); bitmap.close()
    const pixels = context.getImageData(0, 0, 48, 48).data
    let sum = 0; let squared = 0
    for (let index = 0; index < pixels.length; index += 4) { const light = (pixels[index] + pixels[index + 1] + pixels[index + 2]) / 3; sum += light; squared += light * light }
    const count = pixels.length / 4; const average = sum / count; const deviation = Math.sqrt(Math.max(0, squared / count - average * average))
    if (average < 18) return { status: 'fail', message: t("Ảnh quá tối để kiểm tra. Hãy chụp lại ở nơi sáng hơn.") }
    if (average > 245) return { status: 'fail', message: t("Ảnh bị quá sáng. Hãy chụp lại để nhìn rõ cảnh vật.") }
    if (deviation < 8) return { status: 'fail', message: t("Ảnh có quá ít chi tiết hoặc bị che. Hãy chụp lại cảnh vật rõ hơn.") }
    return { status: 'pass', message: t("Kiểm tra cục bộ đạt: ảnh đủ sáng, đủ kích thước và có chi tiết để lưu.") }
  } catch {
    return { status: 'review', message: t("Không phân tích được ảnh trên thiết bị này. Bạn có thể xem ảnh và tự xác nhận.") }
  }
}
