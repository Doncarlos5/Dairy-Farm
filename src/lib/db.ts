import Dexie, { type EntityTable } from 'dexie'
import type {
  Farm, User, Cow, MilkRecord, BreedingRecord,
  CalvingRecord, HealthRecord, Note
} from './schemas'

const db = new Dexie('DairyManagerDB') as Dexie & {
  farms: EntityTable<Farm, 'id'>
  users: EntityTable<User, 'id'>
  cows: EntityTable<Cow, 'id'>
  milkRecords: EntityTable<MilkRecord, 'id'>
  breedingRecords: EntityTable<BreedingRecord, 'id'>
  calvingRecords: EntityTable<CalvingRecord, 'id'>
  healthRecords: EntityTable<HealthRecord, 'id'>
  notes: EntityTable<Note, 'id'>
}

db.version(1).stores({
  farms: 'id, name',
  users: 'id, farmId, active',
  cows: 'id, farmId, tagId, status, [farmId+tagId]',
  milkRecords: 'id, farmId, cowId, date, [cowId+date], [farmId+date]',
  breedingRecords: 'id, farmId, cowId, aiDate, expectedCalvingDate',
  calvingRecords: 'id, farmId, cowId, calvingDate',
  healthRecords: 'id, farmId, cowId, date, withdrawalEndDate',
  notes: 'id, farmId, cowId, date'
})

export { db }