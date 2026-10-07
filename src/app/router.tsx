import { createBrowserRouter } from 'react-router-dom'
import { Layout } from '../features/layout/Layout'
import { Dashboard } from '../features/dashboard/Dashboard'
import { CowList } from '../features/cows/components/CowList'
import { MilkList } from '../features/milk/components/MilkList'
//import { BreedingList } from '../features/breeding/components/BreedingList'
//import { HealthList } from '../features/health/components/HealthList'
//import { NoteList } from '../features/notes/components/NoteList'

export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <Layout>
        <Dashboard />
      </Layout>
    )
  },
  {
    path: '/cows',
    element: (
      <Layout>
        <CowList />
      </Layout>
    )
  },
  {
    path: '/milk',
    element: (
      <Layout>
        <MilkList />
      </Layout>
    )
  },
  //{ path: '/breeding', element: ( <Layout>   <BreedingList /> </Layout> )},
  //{ path: '/health', element: (  <Layout> <HealthList /> </Layout> ) },
  //{ path: '/notes',  element: (  <Layout>  <NoteList />  </Layout> ) }
])