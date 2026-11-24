import { mkdir, readFile, writeFile, rename, unlink } from './db-storage.mjs'
import { join } from 'node:path'

export const DEFAULT_BADGE_THEMES = [
  {
    slug: 'cau-da-nang',
    name: 'Cầu Đà Nẵng',
    description: 'Bộ sưu tập những cây cầu huyền thoại bắc qua dòng sông Hàn thơ mộng.',
    icon: '🌉',
    order: 1,
    completionBonusCoins: 50,
    completionBonusXp: 100,
    badges: [
      {
        id: 'cau-rong',
        title: 'Rồng Thép Vươn Biển',
        description: 'Ghé thăm Cầu Rồng biểu tượng kiến trúc của Đà Nẵng hiện đại.',
        rarity: 'common',
        icon: '🐉',
        requiredDestinations: ['cau-rong'],
        bonusCoins: 15,
        bonusXp: 20,
      },
      {
        id: 'cau-song-han',
        title: 'Cầu Quay Độc Bản',
        description: 'Khám phá Cầu Sông Hàn, cây cầu quay đầu tiên do kỹ sư Việt Nam thiết kế.',
        rarity: 'common',
        icon: '🔄',
        requiredDestinations: ['cau-song-han'],
        bonusCoins: 15,
        bonusXp: 20,
      },
      {
        id: 'cau-thuan-phuoc',
        title: 'Dải Lụa Cửa Biển',
        description: 'Chinh phục Cầu Thuận Phước, cây cầu treo dây võng dài nhất Việt Nam.',
        rarity: 'rare',
        icon: '🌉',
        requiredDestinations: ['cau-thuan-phuoc'],
        bonusCoins: 25,
        bonusXp: 30,
      },
      {
        id: 'cau-tran-thi-ly',
        title: 'Cánh Buồm No Gió',
        description: 'Chiêm ngưỡng Cầu Trần Thị Lý với trụ tháp nghiêng độc đáo vươn cao 145m.',
        rarity: 'rare',
        icon: '⛵',
        requiredDestinations: ['cau-tran-thi-ly'],
        bonusCoins: 25,
        bonusXp: 30,
      },
    ],
  },
  {
    slug: 'bien-da-nang',
    name: 'Biển Đà Nẵng',
    description: 'Hành trình trải nghiệm bờ biển cát trắng và thiên nhiên biển đảo tuyệt đẹp.',
    icon: '🌊',
    order: 2,
    completionBonusCoins: 50,
    completionBonusXp: 100,
    badges: [
      {
        id: 'my-khe',
        title: 'Sóng Xanh Mỹ Khê',
        description: 'Ghé thăm bãi biển Mỹ Khê quyến rũ hàng đầu hành tinh.',
        rarity: 'common',
        icon: '🏖️',
        requiredDestinations: ['my-khe', 'bien-my-khe', 'bai-bien-my-khe'],
        bonusCoins: 15,
        bonusXp: 20,
      },
      {
        id: 'non-nuoc',
        title: 'Cát Trắng Non Nước',
        description: 'Dạo bước bên bờ biển nguyên sơ dưới chân Ngũ Hành Sơn.',
        rarity: 'common',
        icon: '🐚',
        requiredDestinations: ['non-nuoc', 'bien-non-nuoc'],
        bonusCoins: 15,
        bonusXp: 20,
      },
      {
        id: 'son-tra',
        title: 'Bảo Vật Bán Đảo',
        description: 'Khám phá bán đảo Sơn Trà, Bãi Bụt và rừng nguyên sinh giáp biển.',
        rarity: 'rare',
        icon: '🐒',
        requiredDestinations: ['son-tra', 'chua-linh-ung-son-tra', 'chua-linh-ung-bai-but'],
        bonusCoins: 30,
        bonusXp: 50,
      },
    ],
  },
  {
    slug: 'am-thuc',
    name: 'Ẩm thực Đà Thành',
    description: 'Hương vị đậm đà miền Trung từ các món ăn đặc sản nổi danh.',
    icon: '🍜',
    order: 3,
    completionBonusCoins: 50,
    completionBonusXp: 100,
    badges: [
      {
        id: 'mi-quang',
        title: 'Đậm Đà Mì Quảng',
        description: 'Thưởng thức món mì Quảng sợi mềm nước nhưn đậm vị tinh hoa Quảng - Đà.',
        rarity: 'common',
        icon: '🍜',
        requiredDestinations: ['mi-quang', 'quan-mi-quang'],
        bonusCoins: 15,
        bonusXp: 20,
      },
      {
        id: 'banh-trang-thit-heo',
        title: 'Bánh Tráng Cuốn Hai Đầu Da',
        description: 'Trải nghiệm bánh tráng cuốn thịt heo chấm mắm nêm danh bất hư truyền.',
        rarity: 'common',
        icon: '🌯',
        requiredDestinations: ['banh-trang-thit-heo'],
        bonusCoins: 15,
        bonusXp: 20,
      },
      {
        id: 'cho-con',
        title: 'Thiên Đường Chợ Cồn',
        description: 'Oanh tạc khu ẩm thực nức tiếng Chợ Cồn và Chợ Hàn.',
        rarity: 'rare',
        icon: '🍢',
        requiredDestinations: ['cho-con', 'cho-han'],
        bonusCoins: 25,
        bonusXp: 40,
      },
    ],
  },
  {
    slug: 'van-hoa-cham',
    name: 'Văn hóa Chăm',
    description: 'Dấu ấn lịch sử và nghệ thuật điêu khắc Champa cổ kính trên đất Đà Nẵng.',
    icon: '🏛️',
    order: 4,
    completionBonusCoins: 50,
    completionBonusXp: 100,
    badges: [
      {
        id: 'bao-tang-cham',
        title: 'Di Sản Điêu Khắc',
        description: 'Chiêm ngưỡng bộ sưu tập hiện vật điêu khắc Chăm quy mô lớn nhất thế giới.',
        rarity: 'common',
        icon: '🗿',
        requiredDestinations: ['bao-tang-cham', 'bao-tang-dieu-khac-cham'],
        bonusCoins: 20,
        bonusXp: 30,
      },
      {
        id: 'ngu-hanh-son',
        title: 'Huyền Bí Năm Ngọn Núi',
        description: 'Khám phá quần thể hang động và chùa chiền tại danh thắng Ngũ Hành Sơn.',
        rarity: 'rare',
        icon: '⛰️',
        requiredDestinations: ['ngu-hanh-son'],
        bonusCoins: 30,
        bonusXp: 40,
      },
      {
        id: 'lang-da-non-nuoc',
        title: 'Tinh Hoa Làng Đá',
        description: 'Ghé thăm làng nghề điêu khắc đá mỹ nghệ Non Nước hơn 300 năm tuổi.',
        rarity: 'common',
        icon: '🔨',
        requiredDestinations: ['lang-da-non-nuoc'],
        bonusCoins: 15,
        bonusXp: 20,
      },
    ],
  },
]

export function createBadgeStore(directory, { readGame, readQuests, themes = DEFAULT_BADGE_THEMES } = {}) {
  let queue = Promise.resolve()
  const filename = (owner) => join(directory, `${owner}.json`)
  const serial = (action) => {
    const task = queue.then(action)
    queue = task.catch(() => {})
    return task
  }

  async function load(owner) {
    try {
      const data = JSON.parse(await readFile(filename(owner), 'utf8'))
      if (data && data.version === 1 && data.owner === owner) {
        return data
      }
    } catch (e) {
      if (e.code !== 'ENOENT') throw e
    }
    return {
      version: 1,
      owner,
      unlockedBadgeIds: [],
      completedThemeSlugs: [],
      claims: [],
    }
  }

  async function save(owner, state) {
    await mkdir(directory, { recursive: true })
    const tmp = `${filename(owner)}.tmp`
    await writeFile(tmp, JSON.stringify(state, null, 2), { mode: 0o600 })
    await rename(tmp, filename(owner))
  }

  async function evaluateUser(owner) {
    const state = await load(owner)
    let visitedPlaces = new Set()

    if (readGame) {
      try {
        const game = await readGame(owner)
        const dests = game?.state?.destinations ?? {}
        for (const [id, val] of Object.entries(dests)) {
          if (val && val.completed && val.completed.length > 0) {
            visitedPlaces.add(id)
          }
        }
      } catch {}
    }

    if (readQuests) {
      try {
        const quests = await readQuests(owner)
        for (const [qId, run] of Object.entries(quests?.quests ?? {})) {
          if (run && (run.completedAt || (run.completedCheckpointIds && run.completedCheckpointIds.length > 0))) {
            visitedPlaces.add(qId)
          }
        }
        for (const [destId, val] of Object.entries(quests?.legacy?.destinations ?? {})) {
          if (val && val.completed && val.completed.length > 0) {
            visitedPlaces.add(destId)
          }
        }
      } catch {}
    }

    const newlyUnlocked = []
    const now = Date.now()

    for (const theme of themes) {
      let themeUnlockedCount = 0
      for (const badge of theme.badges) {
        const isAlreadyUnlocked = state.unlockedBadgeIds.includes(badge.id)
        const qualifies = badge.requiredDestinations.some((d) => visitedPlaces.has(d))

        if (isAlreadyUnlocked || qualifies) {
          themeUnlockedCount++
          if (!isAlreadyUnlocked && qualifies) {
            state.unlockedBadgeIds.push(badge.id)
            const claim = {
              source: `badge:${badge.id}`,
              badgeId: badge.id,
              amount: badge.bonusCoins,
              xp: badge.bonusXp,
              claimedAt: now,
            }
            state.claims.push(claim)
            newlyUnlocked.push({ type: 'badge', id: badge.id, title: badge.title, bonusCoins: badge.bonusCoins })
          }
        }
      }

      // Check theme completion
      const isThemeAlreadyDone = state.completedThemeSlugs.includes(theme.slug)
      if (!isThemeAlreadyDone && themeUnlockedCount === theme.badges.length && theme.badges.length > 0) {
        state.completedThemeSlugs.push(theme.slug)
        const themeClaim = {
          source: `badge-theme:${theme.slug}`,
          themeSlug: theme.slug,
          amount: theme.completionBonusCoins,
          xp: theme.completionBonusXp,
          claimedAt: now,
        }
        state.claims.push(themeClaim)
        newlyUnlocked.push({ type: 'theme', slug: theme.slug, name: theme.name, bonusCoins: theme.completionBonusCoins })
      }
    }

    if (newlyUnlocked.length > 0) {
      await save(owner, state)
    }

    // Prepare presentation structure
    let totalBadges = 0
    let totalUnlocked = 0
    const presentationThemes = themes.map((theme) => {
      let unlockedInTheme = 0
      const badges = theme.badges.map((b) => {
        const unlocked = state.unlockedBadgeIds.includes(b.id)
        if (unlocked) unlockedInTheme++
        totalBadges++
        if (unlocked) totalUnlocked++
        return {
          ...b,
          unlocked,
        }
      })
      const isCompleted = state.completedThemeSlugs.includes(theme.slug)
      return {
        slug: theme.slug,
        name: theme.name,
        description: theme.description,
        icon: theme.icon,
        order: theme.order,
        completionBonusCoins: theme.completionBonusCoins,
        completionBonusXp: theme.completionBonusXp,
        completed: isCompleted,
        unlockedCount: unlockedInTheme,
        totalCount: badges.length,
        badges,
      }
    })

    return {
      owner,
      totalBadges,
      totalUnlocked,
      newlyUnlocked,
      themes: presentationThemes,
      claims: state.claims,
    }
  }

  return {
    read: (owner) => serial(() => evaluateUser(owner)),
    evaluate: (owner) => serial(() => evaluateUser(owner)),
    remove: (owner) =>
      serial(async () => {
        for (const suffix of ['', '.tmp']) {
          await unlink(`${filename(owner)}${suffix}`).catch((err) => {
            if (err.code !== 'ENOENT') throw err
          })
        }
      }),
  }
}
