export const COINS_PER_MISSION = 10
export type RewardCategory = 'postcard' | 'drink' | 'food' | 'transport' | 'admission' | 'activity' | 'souvenir'
export interface Reward {
  id: string
  name: string
  category: RewardCategory
  cost: number
  benefit: string
  validity: string | null
  conditions: string[]
  description: string
  demo: true
}

const demoConditions = ['Voucher minh họa; không có đối tác thương mại.', 'Không có giá trị thanh toán hoặc mã sử dụng thực.']

export const rewards = [
  { id: 'postcard', name: 'Bưu thiếp Đà Nẵng · demo', category: 'postcard', cost: 30, benefit: 'Minh họa một món quà lưu niệm nhỏ.', validity: null, conditions: demoConditions, description: 'Không giao hàng hoặc nhận quà thực.', demo: true },
  { id: 'drink', name: 'Đồ uống địa phương · demo', category: 'drink', cost: 50, benefit: 'Minh họa ưu đãi đồ uống cho khách du lịch.', validity: null, conditions: demoConditions, description: 'Không áp dụng tại cửa hàng hoặc thương hiệu nào.', demo: true },
  { id: 'souvenir', name: 'Quà lưu niệm · demo', category: 'souvenir', cost: 80, benefit: 'Minh họa một món quà kỷ niệm chuyến đi.', validity: null, conditions: demoConditions, description: 'Không có đối tác hay giá trị quy đổi thực.', demo: true },
  { id: 'local-food', name: 'Ẩm thực địa phương · demo', category: 'food', cost: 70, benefit: 'Minh họa ưu đãi trải nghiệm món ăn địa phương.', validity: null, conditions: demoConditions, description: 'Không đại diện cho nhà hàng hoặc món ăn đang bán.', demo: true },
  { id: 'transport', name: 'Di chuyển trong thành phố · demo', category: 'transport', cost: 100, benefit: 'Minh họa hỗ trợ chi phí di chuyển cho du khách.', validity: null, conditions: demoConditions, description: 'Không dùng được cho xe buýt, taxi hay dịch vụ vận tải thật.', demo: true },
  { id: 'admission', name: 'Vé tham quan · demo', category: 'admission', cost: 150, benefit: 'Minh họa ưu đãi vé vào một điểm tham quan.', validity: null, conditions: demoConditions, description: 'Không phải vé vào cổng và không xác nhận quyền tham quan.', demo: true },
  { id: 'outdoor-activity', name: 'Hoạt động ngoài trời · demo', category: 'activity', cost: 140, benefit: 'Minh họa một hoạt động giải trí ngoài trời.', validity: null, conditions: demoConditions, description: 'Không phải booking hoặc xác nhận hoạt động đang được tổ chức.', demo: true },
 ] satisfies Reward[]
