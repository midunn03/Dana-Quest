import { useEffect, useState } from 'react'
import {
  fetchMyGroups,
  createGroup,
  joinGroupByCode,
  leaveGroup,
  type PlayerGroupItem,
} from './lib/groups'
import { t, interpolate } from './i18n/locale'
import './GroupLeaderboard.css'

export default function GroupLeaderboardPage() {
  const [groups, setGroups] = useState<PlayerGroupItem[]>([])
  const [loading, setLoading] = useState(true)
  const [newGroupName, setNewGroupName] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const loadData = () => {
    fetchMyGroups().then((res) => {
      setGroups(res)
      setLoading(false)
    })
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newGroupName.trim()) return
    setBusy(true)
    setMessage(null)
    const res = await createGroup(newGroupName.trim())
    setBusy(false)
    if (res.success) {
      setNewGroupName('')
      setMessage(t('Tạo nhóm thành công!'))
      loadData()
    } else {
      setMessage(res.message || t('Tạo nhóm thất bại.'))
    }
  }

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!joinCode.trim()) return
    setBusy(true)
    setMessage(null)
    const res = await joinGroupByCode(joinCode.trim())
    setBusy(false)
    if (res.success) {
      setJoinCode('')
      setMessage(t('Đã tham gia nhóm!'))
      loadData()
    } else {
      setMessage(res.message || t('Mã nhóm không hợp lệ.'))
    }
  }

  const handleLeave = async (groupId: number, groupName: string) => {
    if (!window.confirm(interpolate('Bạn có chắc chắn muốn rời nhóm "${0}" không?', [groupName]))) return
    setBusy(true)
    await leaveGroup(groupId)
    setBusy(false)
    loadData()
  }

  return (
    <div className="leader-page">
      <div className="leader-privacy-banner" role="note">
        <strong>🔒 {t('Cam kết bảo mật & quyền riêng tư:')}</strong>{' '}
        {t('Bảng xếp hạng chỉ trong phạm vi nhóm bạn bè. Chỉ hiển thị tên và điểm số khám phá; tuyệt đối KHÔNG chia sẻ vị trí GPS thực của bạn.')}
      </div>

      {message && <p role="status" style={{ padding: '8px 12px', background: '#fef3c7', borderRadius: '4px' }}>{message}</p>}

      {/* Tạo nhóm & Tham gia nhóm */}
      <section className="leader-actions-card">
        <div>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '15px' }}>{t('Tham gia nhóm bằng mã mời')}</h3>
          <form className="leader-form-row" onSubmit={handleJoin}>
            <input
              className="leader-input"
              type="text"
              placeholder={t('Nhập mã nhóm (vd: DANA-A1B2C3)')}
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              disabled={busy}
              aria-label={t('Mã tham gia nhóm')}
            />
            <button className="leader-btn" type="submit" disabled={busy || !joinCode.trim()}>
              {t('Vào nhóm')}
            </button>
          </form>
        </div>

        <div style={{ borderTop: '1px solid #eee', paddingTop: '12px' }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '15px' }}>{t('Tạo nhóm bạn bè mới')}</h3>
          <form className="leader-form-row" onSubmit={handleCreate}>
            <input
              className="leader-input"
              type="text"
              placeholder={t('Tên nhóm (vd: Biệt đội Săn Rồng)')}
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              disabled={busy}
              aria-label={t('Tên nhóm mới')}
            />
            <button className="leader-btn" type="submit" disabled={busy || !newGroupName.trim()}>
              {t('Tạo nhóm')}
            </button>
          </form>
        </div>
      </section>

      {/* Danh sách các nhóm của bạn */}
      {loading ? (
        <p role="status">{t('Đang tải danh sách nhóm…')}</p>
      ) : groups.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#666' }}>{t('Bạn chưa tham gia nhóm nào. Hãy tạo nhóm hoặc nhập mã mời để cùng bạn bè khám phá!')}</p>
      ) : (
        groups.map((group) => (
          <section className="leader-group-card" key={group.id}>
            <div className="leader-group-header">
              <div className="leader-group-title">
                <h3>{group.name}</h3>
                <small>{interpolate('${0} thành viên · Mã mời:', [group.memberCount])} </small>
                <span className="leader-code-badge">{group.code}</span>
              </div>
              <button
                style={{ background: 'transparent', border: '1px solid #dc2626', color: '#dc2626', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', minHeight: '36px' }}
                onClick={() => void handleLeave(group.id, group.name)}
                disabled={busy}
              >
                {t('Rời nhóm')}
              </button>
            </div>

            <div style={{ fontSize: '13px', color: '#666', marginBottom: '8px' }}>
              💡 {t('Thưởng "Đi cùng nhau": Check-in cùng địa điểm với bạn trong nhóm để nhận thêm +10 xu!')}
            </div>

            <ul className="leader-board-list">
              {group.leaderboard.map((member) => (
                <li
                  key={member.userId}
                  className={`leader-board-item ${member.isSelf ? 'is-self' : ''}`}
                >
                  <div className="leader-member-info">
                    <span className={`leader-rank-badge ${member.rank === 1 ? 'top-1' : ''}`}>
                      {member.rank}
                    </span>
                    <span className="leader-member-name">
                      {member.displayName} {member.isSelf ? `(${t('Bạn')})` : ''} {member.isLeader ? '👑' : ''}
                    </span>
                  </div>
                  <span className="leader-score">
                    {member.score} {t('điểm')}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  )
}
