import questLocationRecords from './questLocations.json'

export type QuestChallenge =
  | { type: 'text'; prompt: string; acceptedAnswers: string[]; placeholder?: string }
  | { type: 'single-choice'; prompt: string; options: { id: string; label: string }[]; correctOptionId: string }
  | { type: 'photo'; prompt: string }
  | { type: 'observation'; prompt: string; confirmationLabel: string }

export interface QuestCheckpoint {
  id: string
  title: string
  story: string
  instruction: string
  placeLabel: string
  position?: [number, number]
  challenge: QuestChallenge
  reward: { xp: number; coins: number }
  sourceUrls: string[]
}

export interface Quest {
  id: string
  title: string
  summary: string
  city: 'Đà Nẵng'
  area: string
  startPosition: [number, number]
  estimatedMinutes: number
  safetyNote: string
  checkpointOrder: string[]
  checkpoints: QuestCheckpoint[]
}

const questLocations = questLocationRecords as { id: string; name: string; position: [number, number] }[]
const dueLocation = questLocations.find(location => location.id === 'due-dau-an-50-nam')!

// Demo data is intentionally separate from the legacy mission factory. This
// keeps the current gameplay stable until the new quest runtime is connected.
export const quests: Quest[] = [
  {
    id: 'due-dau-an-50-nam',
    title: 'DUE — Dấu ấn 50 năm',
    summary: 'Một hành trình ngắn giúp người chơi nhận diện địa chỉ và dấu mốc hình thành của Trường Đại học Kinh tế – Đại học Đà Nẵng.',
    city: 'Đà Nẵng',
    area: 'Trường Đại học Kinh tế – Đại học Đà Nẵng',
    // OpenStreetMap way 968380513; used as a campus overview point.
    startPosition: dueLocation.position,
    estimatedMinutes: 10,
    safetyNote: 'Chỉ quan sát ở khu vực công cộng, không cản trở cổng ra vào và tuân theo hướng dẫn của nhà trường.',
    checkpointOrder: ['cong-71', 'dau-moc-1975'],
    checkpoints: [
      {
        id: 'cong-71',
        title: 'Con số mở cổng',
        story: 'Mỗi hành trình cần một tọa độ bắt đầu. Dấu hiệu đầu tiên nằm ngay trong địa chỉ chính thức của trường.',
        instruction: 'Đứng ở khu vực công cộng, quan sát biển tên hoặc địa chỉ của trường rồi nhập số nhà. Không đi vào khu vực hạn chế.',
        placeLabel: 'Khu vực cổng Trường Đại học Kinh tế – Đại học Đà Nẵng',
        challenge: {
          type: 'text',
          prompt: 'Số nhà trên đường Ngũ Hành Sơn của trường là bao nhiêu?',
          acceptedAnswers: ['71', 'số 71', 'so 71'],
          placeholder: 'Nhập số nhà',
        },
        reward: { xp: 50, coins: 10 },
        sourceUrls: ['https://due.udn.vn/', 'https://daotao.due.udn.vn/'],
      },
      {
        id: 'dau-moc-1975',
        title: 'Nửa thế kỷ tri thức',
        story: 'Từ nền móng ban đầu, hành trình đào tạo kinh tế tại Đà Nẵng đã phát triển qua nhiều giai đoạn và trở thành DUE hôm nay.',
        instruction: 'Đọc câu chuyện và chọn dấu mốc phù hợp với nền tảng 50 năm xây dựng, phát triển được nhà trường nhắc đến.',
        placeLabel: 'Khuôn viên công cộng của trường',
        challenge: {
          type: 'single-choice',
          prompt: 'Dấu mốc khởi đầu nào phù hợp với hành trình 50 năm của DUE?',
          options: [
            { id: '1965', label: 'Năm 1965' },
            { id: '1975', label: 'Năm 1975' },
            { id: '1995', label: 'Năm 1995' },
          ],
          correctOptionId: '1975',
        },
        reward: { xp: 70, coins: 10 },
        sourceUrls: ['https://congvieclam.due.udn.vn/', 'https://daotao.due.udn.vn/gioi-thieu-chung/'],
      },
    ],
  },
]

export const getQuest = (id: string) => quests.find(quest => quest.id === id)

