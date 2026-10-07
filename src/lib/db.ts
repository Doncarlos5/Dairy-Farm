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

export async function seedDatabase() {
  await db.open()

  const cowCount = await db.cows.count()
  if (cowCount > 0) return

  await db.transaction(
    'rw',
    db.cows,
    db.milkRecords,
    db.breedingRecords,
    db.healthRecords,
    db.notes,
    async () => {
      await db.cows.bulkAdd([
        {
          id: 'cow-1',
          farmId: 'farm-1',
          tagId: 'FR-101',
          name: 'Daisy',
          breed: 'Friesian',
          birthDate: '2021-03-12',
          lactationNumber: 3,
          status: 'in_milk',
          pregnancyStatus: 'confirmed',
          notes: 'Producing well this season.',
          createdAt: new Date('2024-01-15T08:00:00Z'),
          updatedAt: new Date('2024-06-10T09:00:00Z')
        },
        {
          id: 'cow-2',
          farmId: 'farm-1',
          tagId: 'AY-204',
          name: 'Belle',
          breed: 'Ayrshire',
          birthDate: '2020-11-02',
          lactationNumber: 2,
          status: 'dry',
          pregnancyStatus: 'bred',
          notes: 'Drying off for recovery period.',
          createdAt: new Date('2023-12-01T08:00:00Z'),
          updatedAt: new Date('2024-05-15T09:00:00Z')
        },
        {
          id: 'cow-3',
          farmId: 'farm-1',
          tagId: 'JR-305',
          name: 'Luna',
          breed: 'Jersey',
          birthDate: '2022-07-20',
          lactationNumber: 1,
          status: 'heifer',
          pregnancyStatus: 'open',
          createdAt: new Date('2024-02-01T08:00:00Z'),
          updatedAt: new Date('2024-02-01T08:00:00Z')
        }
      ])

      await db.milkRecords.bulkAdd([
        {
          id: 'milk-1',
          farmId: 'farm-1',
          cowId: 'cow-1',
          date: '2026-10-01',
          session: 'am',
          litres: 16.8,
          recordedBy: 'M. James',
          createdAt: new Date('2026-10-01T06:15:00Z')
        },
        {
          id: 'milk-2',
          farmId: 'farm-1',
          cowId: 'cow-1',
          date: '2026-10-01',
          session: 'pm',
          litres: 15.4,
          recordedBy: 'M. James',
          createdAt: new Date('2026-10-01T17:20:00Z')
        },
        {
          id: 'milk-3',
          farmId: 'farm-1',
          cowId: 'cow-2',
          date: '2026-10-01',
          session: 'am',
          litres: 11.2,
          recordedBy: 'R. Green',
          createdAt: new Date('2026-10-01T06:10:00Z')
        }
      ])

      await db.breedingRecords.bulkAdd([
        {
          id: 'breed-1',
          farmId: 'farm-1',
          cowId: 'cow-1',
          aiDate: '2026-08-05',
          bullStraw: 'A-281',
          technician: 'L. West',
          expectedCalvingDate: '2027-05-12',
          pregnancyCheckDate: '2026-09-05',
          pregnancyConfirmed: true,
          notes: 'Excellent response to first insemination.',
          createdAt: new Date('2026-08-05T00:00:00Z')
        }
      ])

      await db.healthRecords.bulkAdd([
        {
          id: 'health-1',
          farmId: 'farm-1',
          cowId: 'cow-2',
          date: '2026-09-28',
          condition: 'Mastitis check',
          drug: 'Ceftiofur',
          dose: '4ml',
          route: 'injection',
          withdrawalDays: 7,
          withdrawalEndDate: '2026-10-05',
          vetName: 'Dr. Bailey',
          createdAt: new Date('2026-09-28T00:00:00Z')
        }
      ])

      await db.notes.bulkAdd([
        {
          id: 'note-1',
          farmId: 'farm-1',
          cowId: 'cow-1',
          date: '2026-10-01',
          text: 'Milk quality looks strong and feed intake is stable.',
          createdBy: 'Farm manager',
          createdAt: new Date('2026-10-01T08:00:00Z')
        },
        {
          id: 'note-2',
          farmId: 'farm-1',
          date: '2026-10-01',
          text: 'Pasture field is in good condition after the recent rain.',
          createdBy: 'Farm staff',
          createdAt: new Date('2026-10-01T09:15:00Z')
        }
      ])
    }
  )
}

export { db }