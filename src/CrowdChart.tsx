const HOURS = Array.from({ length: 18 }, (_, index) => index + 6)

const vietnamHour = (now: Date) => Number(new Intl.DateTimeFormat('en-GB', { hour: 'numeric', hourCycle: 'h23', timeZone: 'Asia/Ho_Chi_Minh' }).format(now))

/** Biểu đồ mức đông theo giờ (6:00–23:00) do admin nhập; giờ hiện tại được tô đậm. */
export default function CrowdChart({ levels, note, now = new Date() }: { levels: number[]; note?: string; now?: Date }) {
  if (levels.length !== HOURS.length) return null
  const current = vietnamHour(now)
  return <>
    <div className="crowd-chart" role="img" aria-label="Biểu đồ mức đông đúc theo giờ trong ngày">
      {levels.map((level, index) => <span key={HOURS[index]} className={`crowd-bar ${HOURS[index] === current ? 'now' : ''}`} style={{ height: `${Math.max(6, level)}%` }} title={`${HOURS[index]}:00 · mức ${level}/100`} />)}
    </div>
    <div className="crowd-axis"><span>6:00</span><span>12:00</span><span>18:00</span><span>23:00</span></div>
    {note && <p className="crowd-note">{note}</p>}
  </>
}
