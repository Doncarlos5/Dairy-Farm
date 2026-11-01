import { createBrowserRouter } from 'react-router-dom'
import { Layout } from '../features/layout/Layout'
import { Dashboard } from '../features/dashboard/Dashboard'
import { CowList } from '../features/cows/components/CowList'
import { CowProfile } from '../features/cows/components/CowProfile'
import { MilkList } from '../features/milk/components/MilkList'
import { BreedingList } from '../features/breeding/components/BreedingList'
import { HealthList } from '../features/health/components/HealthList'
import { NoteList } from '../features/notes/components/NoteList'
import { NotFound } from '../features/layout/NotFound'
import { Login } from '../features/auth/Login'
import { SignUp } from '../features/auth/SignUp'
import { ProtectedRoute } from '../features/auth/ProtectedRoute'
import { Chat } from '../features/chat/Chat'
import { Finances } from '../features/finances/Finances'
import { About } from '../features/pages/About'
import { Info } from '../features/pages/Info'
import { Reports } from '../features/reports/Reports'

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />
  },
  {
    path: '/signup',
    element: <SignUp />
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: '/',
        element: <Layout><Dashboard /></Layout>
      },
      {
        path: '/cows',
        element: <Layout><CowList /></Layout>
      },
      {
        path: '/cows/:id',
        element: <Layout><CowProfile /></Layout>
      },
      {
        path: '/milk',
        element: <Layout><MilkList /></Layout>
      },
      {
        path: '/breeding',
        element: <Layout><BreedingList /></Layout>
      },
      {
        path: '/health',
        element: <Layout><HealthList /></Layout>
      },
      {
        path: '/notes',
        element: <Layout><NoteList /></Layout>
      },
      {
        path: '*',
        element: <Layout><NotFound /></Layout>
      },
      {
        path: '/chat',
        element: <Layout><Chat /></Layout>
      },
      {
        path: '/reports',
        element: <Layout><Reports /></Layout>
      },
      {
        path: '/finances',
        element: <Layout><Finances /></Layout>
      },
            {
        path: '/about',
        element: <Layout><About /></Layout>
      },
      {
        path: '/info',
        element: <Layout><Info /></Layout>
      },
    ]
  }
])