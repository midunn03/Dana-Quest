import { pixelLandmarkImageUrl } from './pixelLandmarkSamples'

export interface JourneyCardData {
  questId: string
  questTitle: string
  area: string
  solved: number
  total: number
  xp: number
  coins: number
  playerName?: string
  completedAt?: number
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise(resolve => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })
}

function drawRoundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const radius = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.arcTo(x + w, y, x + w, y + h, radius)
  ctx.arcTo(x + w, y + h, x, y + h, radius)
  ctx.arcTo(x, y + h, x, y, radius)
  ctx.arcTo(x, y, x + w, y, radius)
  ctx.closePath()
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean)
  if (!words.length) return ['']
  const lines: string[] = []
  let current = ''
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word
    if (ctx.measureText(candidate).width <= maxWidth) {
      current = candidate
    } else {
      if (current) lines.push(current)
      current = word
      if (lines.length >= maxLines) break
    }
  }
  if (current && lines.length < maxLines) lines.push(current)
  if (lines.length === maxLines && words.join(' ') !== lines.join(' ')) {
    let last = lines[maxLines - 1]
    while (last.length > 3 && ctx.measureText(`${last}…`).width > maxWidth) {
      last = last.slice(0, -1).trimEnd()
    }
    lines[maxLines - 1] = `${last}…`
  }
  return lines
}

function fitTextLine(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text
  let trimmed = text.trim()
  while (trimmed.length > 3 && ctx.measureText(`${trimmed}…`).width > maxWidth) {
    trimmed = trimmed.slice(0, -1).trimEnd()
  }
  return `${trimmed}…`
}

export async function renderJourneyCardPng(data: JourneyCardData): Promise<Blob> {
  const W = 1200
  const H = 675
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Không thể khởi tạo khung vẽ PNG trên trình duyệt này.')
  }

  const base = import.meta.env.BASE_URL || '/'
  const landmarkUrl = pixelLandmarkImageUrl(data.questId)
  const [bgImg, logoImg, landmarkImg] = await Promise.all([
    loadImage(`${base}art/home/dragon-bridge-adventure.png`),
    loadImage(`${base}brand/dana-quest-logo.png`),
    landmarkUrl ? loadImage(landmarkUrl) : Promise.resolve(null),
  ])

  // 1. Nền phong cảnh pixel Đà Nẵng
  if (bgImg) {
    const scale = Math.max(W / bgImg.width, H / bgImg.height)
    const dw = bgImg.width * scale
    const dh = bgImg.height * scale
    ctx.drawImage(bgImg, (W - dw) / 2, (H - dh) / 2, dw, dh)
  } else {
    const sky = ctx.createLinearGradient(0, 0, 0, H)
    sky.addColorStop(0, '#5ac8f5')
    sky.addColorStop(0.55, '#a8e6ff')
    sky.addColorStop(1, '#2694c8')
    ctx.fillStyle = sky
    ctx.fillRect(0, 0, W, H)
  }

  // Lớp phủ nhẹ giúp thẻ nổi bật mà vẫn lộ cậu bé + hoa hồng bên trái & cầu rồng
  const overlay = ctx.createLinearGradient(0, 0, W, H)
  overlay.addColorStop(0, 'rgba(16, 48, 72, 0.20)')
  overlay.addColorStop(1, 'rgba(16, 48, 72, 0.35)')
  ctx.fillStyle = overlay
  ctx.fillRect(0, 0, W, H)

  // 2. Khung viền kép pixel-adventure
  ctx.lineWidth = 12
  ctx.strokeStyle = '#153b55'
  drawRoundedRect(ctx, 6, 6, W - 12, H - 12, 26)
  ctx.stroke()

  ctx.lineWidth = 4
  ctx.strokeStyle = '#ffd24c'
  drawRoundedRect(ctx, 18, 18, W - 36, H - 36, 18)
  ctx.stroke()

  // Điểm nhấn pixel vàng ở 4 góc
  ctx.fillStyle = '#ffd24c'
  for (const [cx, cy] of [[24, 24], [W - 36, 24], [24, H - 36], [W - 36, H - 36]]) {
    ctx.fillRect(cx, cy, 12, 12)
  }

  // 3. Header: Logo góc trái & Badge trạng thái góc phải
  if (logoImg) {
    const targetH = 96
    const targetW = (logoImg.width / logoImg.height) * targetH
    ctx.drawImage(logoImg, 46, 26, targetW, targetH)
  } else {
    ctx.font = '900 40px "Segoe UI", system-ui, sans-serif'
    ctx.lineWidth = 6
    ctx.strokeStyle = '#153b55'
    ctx.strokeText('DANA QUEST', 46, 86)
    ctx.fillStyle = '#ffd24c'
    ctx.fillText('DANA QUEST', 46, 86)
  }

  const isCompleted = data.total > 0 && data.solved >= data.total
  const statusText = isCompleted ? '✓ ĐÃ CHINH PHỤC' : '⚑ ĐANG KHÁM PHÁ'
  ctx.font = '800 18px "Segoe UI", system-ui, sans-serif'
  const statusW = ctx.measureText(statusText).width + 34
  const pillText = '✦ THẺ HÀNH TRÌNH CÁ NHÂN'
  const pillW = ctx.measureText(pillText).width + 34

  const pillX = W - 46 - pillW
  const statusX = pillX - 12 - statusW

  // Pill trạng thái
  drawRoundedRect(ctx, statusX, 46, statusW, 42, 21)
  ctx.fillStyle = isCompleted ? '#219653' : '#f5a623'
  ctx.fill()
  ctx.lineWidth = 2.5
  ctx.strokeStyle = '#ffffff'
  ctx.stroke()
  ctx.fillStyle = isCompleted ? '#ffffff' : '#153b55'
  ctx.textBaseline = 'middle'
  ctx.fillText(statusText, statusX + 17, 67)

  // Pill thẻ hành trình cá nhân
  drawRoundedRect(ctx, pillX, 46, pillW, 42, 21)
  ctx.fillStyle = '#153b55'
  ctx.fill()
  ctx.lineWidth = 2.5
  ctx.strokeStyle = '#ffd24c'
  ctx.stroke()
  ctx.fillStyle = '#fff8dc'
  ctx.fillText(pillText, pillX + 17, 67)
  ctx.textBaseline = 'alphabetic'

  // 4. Bảng thông tin trung tâm lệch phải (giữ cậu bé & hoa hồng bên trái dưới)
  const cardX = 300
  const cardY = 148
  const cardW = 852
  const cardH = 428

  // Bóng đổ pixel cứng
  drawRoundedRect(ctx, cardX + 8, cardY + 8, cardW, cardH, 18)
  ctx.fillStyle = 'rgba(21, 59, 85, 0.55)'
  ctx.fill()

  // Nền giấy kem sáng
  drawRoundedRect(ctx, cardX, cardY, cardW, cardH, 18)
  ctx.fillStyle = 'rgba(255, 254, 246, 0.94)'
  ctx.fill()
  ctx.lineWidth = 4
  ctx.strokeStyle = '#153b55'
  ctx.stroke()

  drawRoundedRect(ctx, cardX + 8, cardY + 8, cardW - 16, cardH - 16, 12)
  ctx.lineWidth = 2
  ctx.strokeStyle = '#a5cad2'
  ctx.stroke()

  // Cột phải trong bảng: Khung tem địa điểm
  const stampX = 918
  const stampY = 178
  const stampW = 204
  const stampH = 230

  drawRoundedRect(ctx, stampX, stampY, stampW, stampH, 14)
  ctx.fillStyle = '#dff4fb'
  ctx.fill()
  ctx.lineWidth = 3
  ctx.strokeStyle = '#e5a930'
  ctx.stroke()

  if (landmarkImg) {
    const pad = 16
    const maxS = Math.min(stampW - pad * 2, stampH - 64)
    const ratio = Math.min(maxS / landmarkImg.width, maxS / landmarkImg.height)
    const lw = landmarkImg.width * ratio
    const lh = landmarkImg.height * ratio
    const prevSmooth = ctx.imageSmoothingEnabled
    ctx.imageSmoothingEnabled = false
    ctx.drawImage(landmarkImg, stampX + (stampW - lw) / 2, stampY + 14 + (maxS - lh) / 2, lw, lh)
    ctx.imageSmoothingEnabled = prevSmooth
  } else {
    ctx.font = '800 54px "Segoe UI", system-ui, sans-serif'
    ctx.fillStyle = '#217c5b'
    ctx.textAlign = 'center'
    ctx.fillText('⚑', stampX + stampW / 2, stampY + 112)
    ctx.textAlign = 'left'
  }

  // Tem dấu mộc dưới khung địa điểm
  const sealW = 168
  const sealX = stampX + (stampW - sealW) / 2
  const sealY = stampY + stampH - 42
  drawRoundedRect(ctx, sealX, sealY, sealW, 28, 14)
  ctx.fillStyle = '#153b55'
  ctx.fill()
  ctx.lineWidth = 1.5
  ctx.strokeStyle = '#ffd24c'
  ctx.stroke()
  ctx.font = '800 12px "Segoe UI", system-ui, sans-serif'
  ctx.fillStyle = '#ffe8a3'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('DANA QUEST · 2026', stampX + stampW / 2, sealY + 14)
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'

  // Cột trái trong bảng
  const leftX = 332
  const leftMaxW = 562

  // Badge địa điểm / khu vực
  ctx.font = '800 18px "Segoe UI", system-ui, sans-serif'
  const areaLabel = fitTextLine(ctx, `⌖ ${data.area}`, leftMaxW - 28)
  const areaW = Math.min(leftMaxW, ctx.measureText(areaLabel).width + 28)
  drawRoundedRect(ctx, leftX, 178, areaW, 36, 18)
  ctx.fillStyle = '#dcf4e7'
  ctx.fill()
  ctx.lineWidth = 2
  ctx.strokeStyle = '#28796b'
  ctx.stroke()
  ctx.fillStyle = '#185545'
  ctx.textBaseline = 'middle'
  ctx.fillText(areaLabel, leftX + 14, 196)
  ctx.textBaseline = 'alphabetic'

  // Tên Quest (36px-40px bold, tối đa 2 dòng)
  ctx.font = '800 37px "Segoe UI", system-ui, sans-serif'
  ctx.fillStyle = '#153b55'
  const titleLines = wrapLines(ctx, data.questTitle, leftMaxW, 2)
  let titleY = 260
  for (const line of titleLines) {
    ctx.fillText(line, leftX, titleY)
    titleY += 46
  }

  // Tiến độ thử thách + thanh tiến độ pixel
  const progressTextY = titleLines.length > 1 ? 356 : 332
  ctx.font = '700 20px "Segoe UI", system-ui, sans-serif'
  ctx.fillStyle = '#244d64'
  ctx.fillText(`${data.solved} / ${data.total} thử thách đã giải đúng`, leftX, progressTextY)

  const barX = leftX
  const barY = progressTextY + 16
  const barW = 540
  const barH = 22
  drawRoundedRect(ctx, barX, barY, barW, barH, 11)
  ctx.fillStyle = '#e3f0ea'
  ctx.fill()
  ctx.lineWidth = 2
  ctx.strokeStyle = '#153b55'
  ctx.stroke()

  const ratio = data.total > 0 ? Math.max(0, Math.min(1, data.solved / data.total)) : 0
  if (ratio > 0) {
    const fillW = Math.max(20, (barW - 4) * ratio)
    const barGrad = ctx.createLinearGradient(barX, barY, barX + fillW, barY)
    barGrad.addColorStop(0, '#2ec480')
    barGrad.addColorStop(1, '#1d8a5c')
    drawRoundedRect(ctx, barX + 2, barY + 2, fillW, barH - 4, 9)
    ctx.fillStyle = barGrad
    ctx.fill()
  }

  // Hàng 3 ô thông số nổi bật (y = 446, h = 104, x = 332..1122, gap = 16)
  const boxY = 446
  const boxH = 104
  const gap = 16
  const boxW = (1122 - 332 - gap * 2) / 3
  const formattedDate = new Date(data.completedAt || Date.now()).toLocaleDateString('vi-VN')

  const statBoxes = [
    {
      x: 332,
      bg: '#fff3c4',
      border: '#d69b27',
      label: 'ĐIỂM KINH NGHIỆM',
      labelColor: '#8a5a0a',
      value: `⚡ ${data.xp} XP`,
      valueColor: '#153b55',
      sub: '',
    },
    {
      x: 332 + boxW + gap,
      bg: '#dff6ea',
      border: '#217c5b',
      label: 'PHẦN THƯỞNG',
      labelColor: '#185545',
      value: `🪙 ${data.coins} xu`,
      valueColor: '#153b55',
      sub: '',
    },
    {
      x: 332 + (boxW + gap) * 2,
      bg: '#e2f3fb',
      border: '#2289b5',
      label: 'NHÀ THÁM HIỂM',
      labelColor: '#155470',
      value: data.playerName?.trim() || 'Người khám phá',
      valueColor: '#153b55',
      sub: formattedDate,
    },
  ]

  for (const box of statBoxes) {
    drawRoundedRect(ctx, box.x, boxY, boxW, boxH, 12)
    ctx.fillStyle = box.bg
    ctx.fill()
    ctx.lineWidth = 3
    ctx.strokeStyle = box.border
    ctx.stroke()

    ctx.font = '800 13px "Segoe UI", system-ui, sans-serif'
    ctx.fillStyle = box.labelColor
    ctx.fillText(box.label, box.x + 16, boxY + 28)

    ctx.font = box.sub ? '800 22px "Segoe UI", system-ui, sans-serif' : '900 30px "Segoe UI", system-ui, sans-serif'
    ctx.fillStyle = box.valueColor
    const valLine = fitTextLine(ctx, box.value, boxW - 32)
    ctx.fillText(valLine, box.x + 16, box.sub ? boxY + 62 : boxY + 72)

    if (box.sub) {
      ctx.font = '700 14px "Segoe UI", system-ui, sans-serif'
      ctx.fillStyle = '#506b7c'
      ctx.fillText(box.sub, box.x + 16, boxY + 88)
    }
  }

  // 5. Footer ribbon
  drawRoundedRect(ctx, 260, 602, W - 294, 46, 12)
  ctx.fillStyle = 'rgba(21, 59, 85, 0.88)'
  ctx.fill()
  ctx.lineWidth = 2
  ctx.strokeStyle = '#ffd24c'
  ctx.stroke()
  ctx.font = '700 18px "Segoe UI", system-ui, sans-serif'
  ctx.fillStyle = '#fff8dc'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('✦ Khám phá Đà Nẵng, mở lối phiêu lưu · Dana Quest', 260 + (W - 294) / 2, 625)
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(blob => {
      if (blob) {
        resolve(blob)
        return
      }
      try {
        const dataUrl = canvas.toDataURL('image/png')
        const [, raw] = dataUrl.split(',')
        const bytes = atob(raw)
        const arr = new Uint8Array(bytes.length)
        for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i)
        resolve(new Blob([arr], { type: 'image/png' }))
      } catch {
        reject(new Error('Không xuất được ảnh PNG.'))
      }
    }, 'image/png')
  })
}

export async function downloadJourneyCardPng(data: JourneyCardData): Promise<void> {
  const blob = await renderJourneyCardPng(data)
  const slug = data.questId.replace(/[^a-z0-9-]+/gi, '-').replace(/^-|-$/g, '') || 'hanh-trinh'
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `dana-quest-hanh-trinh-${slug}.png`
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}
