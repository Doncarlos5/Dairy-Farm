import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './AuthContext'

export function ProtectedRoute() {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-emerald-600">
        Loading application...
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}