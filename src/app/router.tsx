import { createBrowserRouter } from 'react-router-dom'
import { CowList } from '../features/cows/components/CowList'
//import { CowProfile } from '../features/cows/components/CowProfile'
//import { MilkEntryForm } from '../features/milk/components/MilkEntryForm'
//import { DailyMilkTable } from '../features/milk/components/DailyMilkTable'
//import { BreedingList } from '../features/breeding/components/BreedingList'
//import { HealthForm } from '../features/health/components/HealthForm'
//import { NoteList } from '../features/notes/components/NoteList'
//import { BackupButton } from '../features/backup/components/BackupButton'
//import { LoginForm } from '../features/auth/components/LoginForm'

export const router = createBrowserRouter([
  //{ path: '/', element: <LoginForm /> },
  { path: '/cows', element: <CowList /> },
  //{ path: '/cows/:id', element: <CowProfile /> },
  //{ path: '/milk', element: <MilkEntryForm /> },
  //{ path: '/milk/daily', element: <DailyMilkTable /> },
  //{ path: '/breeding', element: <BreedingList /> },
  //{ path: '/health', element: <HealthForm /> },
  //{ path: '/notes', element: <NoteList /> },
  //{ path: '/backup', element: <BackupButton /> }
])