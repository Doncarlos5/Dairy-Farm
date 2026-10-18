import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Home, Users, Droplets, Activity, HeartPulse, FileText, Menu, X, LogOut } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { useAuth } from '../auth/AuthContext'

const navItems = [
  { path: '/', label: 'Dashboard', icon: Home },
  { path: '/cows', label: 'Cows', icon: Users },
  { path: '/milk', label: 'Milk Records', icon: Droplets },
  { path: '/breeding', label: 'Breeding', icon: Activity },
  { path: '/health', label: 'Health', icon: HeartPulse },
  { path: '/notes', label: 'Notes', icon: FileText }
]

export function Layout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const location = useLocation()
  const navigate = useNavigate()
  const { profile, signOut } = useAuth()

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="flex min-h-screen bg-slate-100">
      <aside
        className={
          sidebarOpen
            ? 'w-64 bg-gradient-to-b from-sky-700 to-sky-900 text-white transition-all duration-300 flex flex-col'
            : 'w-20 bg-gradient-to-b from-sky-700 to-sky-900 text-white transition-all duration-300 flex flex-col'
        }
      >
        <div className="flex items-center justify-between p-4 border-b border-sky-600/50">
          {sidebarOpen && <h1 className="text-xl font-bold">Dairy Farm</h1>}
          <button
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="rounded-md p-2 hover:bg-sky-600/50"
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        <nav className="mt-6 space-y-2 px-2 flex-1">
          {navItems.map(({ path, label, icon: Icon }) => {
            const active = location.pathname === path
            return (
              <Link
                key={path}
                to={path}
                className={[
                  'flex items-center gap-3 rounded-lg px-3 py-3 transition-colors',
                  active ? 'bg-white/15 text-white shadow-inner' : 'text-sky-100 hover:bg-sky-600/40 hover:text-white'
                ].join(' ')}
              >
                <Icon size={18} />
                {sidebarOpen && <span className="text-sm font-medium">{label}</span>}
              </Link>
            )
          })}
        </nav>

        {/* User Profile & Logout Section */}
        <div className="border-t border-sky-600/50 p-4 space-y-3">
          {sidebarOpen && profile && (
            <div className="text-sm">
              <p className="font-semibold text-white">{profile.name}</p>
              <p className="text-xs text-sky-200 capitalize">{profile.role}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sky-100 hover:bg-red-500/20 hover:text-red-100 transition-colors"
          >
            <LogOut size={18} />
            {sidebarOpen && <span className="text-sm font-medium">Sign out</span>}
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <header className="border-b border-slate-200 bg-white/90 px-6 py-4 shadow-sm backdrop-blur">
          <p className="text-sm uppercase tracking-[0.2em] text-sky-600 font-semibold">Farm Operations</p>
          <h2 className="mt-1 text-2xl font-bold text-slate-800">
            {navItems.find((item) => item.path === location.pathname)?.label || 'Dairy Farm Manager'}
          </h2>
        </header>

        <div className="p-6">{children}</div>
      </main>
    </div>
  )
}