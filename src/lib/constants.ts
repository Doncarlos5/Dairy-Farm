export const BREEDS = ['Friesian', 'Ayrshire', 'Jersey', 'Cross'] as const

export const MILK_SESSIONS = [
  { key: 'am', label: '4:00 AM' },
  { key: 'midday', label: '12:00 PM' },
  { key: 'pm', label: '8:00 PM' }
] as const

export const COW_STATUSES = [
  { key: 'in_milk', label: 'In Milk' },
  { key: 'dry', label: 'Dry' },
  { key: 'heifer', label: 'Heifer' },
  { key: 'calf', label: 'Calf' },
  { key: 'culled', label: 'Culled' }
] as const

export const GESTATION_DAYS = 280
export const PREGNANCY_CHECK_DAYS = 45

export const DEFAULT_PIN = '0000'