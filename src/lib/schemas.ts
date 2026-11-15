export interface Farm {
  id: string
  name: string
  location: string
  ownerName: string
  createdAt: Date
}

export interface User {
  id: string
  farmId: string
  name: string
  role: 'owner' | 'manager' | 'staff'
  pinHash: string
  active: boolean
  createdAt: Date
  nationalId?: string
  phoneNumber?: string
  workerNumber?: string
}

export interface Cow {
  id: string
  farmId: string
  tagId: string
  name?: string
  breed: 'Friesian' | 'Ayrshire' | 'Jersey' | 'Cross'
  birthDate: string
  lactationNumber: number
  status: 'in_milk' | 'dry' | 'heifer' | 'calf' | 'culled'
  pregnancyStatus: 'open' | 'bred' | 'confirmed' | 'dry'
  photo?: string
  notes?: string
  createdAt: Date
  updatedAt: Date
  lastCalvedDate?: string
  calfDetails?: string
  dryOffDate?: string
  weight?: number
  bcs?: number
}

export interface MilkRecord {
  id: string
  farmId: string
  cowId: string
  date: string
  session: 'am' | 'midday' | 'pm'
  litres: number
  recordedBy: string
  pendingDeletion?: boolean 
  createdAt: Date
}

export interface BreedingRecord {
  id: string
  farmId: string
  cowId: string
  aiDate: string
  bullStraw: string
  technician: string
  cost?: number
  expectedCalvingDate: string
  pregnancyCheckDate: string
  pregnancyConfirmed: boolean
  notes?: string
   status?: 'active' | 'calved' | 'failed'
  createdAt: Date
}

export interface CalvingRecord {
  id: string
  farmId: string
  cowId: string
  breedingId?: string
  calvingDate: string
  calfSex: 'male' | 'female'
  calfTagId: string
  calvingEase: 'easy' | 'assisted' | 'difficult'
  calfStatus: 'alive' | 'stillborn' | 'died'
  notes?: string
  createdAt: Date
}

export interface HealthRecord {
  id: string
  farmId: string
  cowId: string
  date: string
  condition: string
  drug: string
  dose: string
  route: 'injection' | 'oral' | 'topical'
  withdrawalDays: number
  withdrawalEndDate: string
  vetName?: string
  cost?: number
  notes?: string
  // NEW FIELDS:
  weight?: number
  bcs?: number
  temperature?: number
  vaccination?: string
   recordedBy?: string
  createdAt: Date
}

export interface Note {
  id: string
  farmId: string
  cowId?: string
  date: string
  text: string
  createdBy: string
  createdAt: Date
}
export interface Sale {
  id: string
  farmId: string
  date: string
  litres: number
  pricePerLitre: number
  total: number
  buyer?: string
  notes?: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: Date
  createdByName?: string
}

export interface Expense {
  id: string
  farmId: string
  date: string
  category: string
  amount: number
  description?: string
  status: 'pending' | 'approved' | 'rejected'
  feedItemId?: string
  quantityAdded?: number
  createdByName?: string     // <-- ADD
  createdAt: Date
  statusUpdatedAt?: Date     // <-- ADD
}

export interface FeedItem {
  id: string
  farmId: string
  name: string
  category: string
  quantity: number
  unit: string
  reorderLevel: number
  costPerUnit: number
  lastRestocked?: string
  createdAt: Date
}