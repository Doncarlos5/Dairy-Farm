import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Home, Users, Droplets, Activity, HeartPulse, FileText, Menu, X, LogOut, Coins } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { useAuth } from '../auth/AuthContext'

const navItems = [
  { path: '/', label: 'Dashboard', icon: Home },
  { path: '/cows', label: 'Cows', icon: Users },
  { path: '/milk', label: 'Milk Records', icon: Droplets },
  { path: '/breeding', label: 'Breeding', icon: Activity },
  { path: '/health', label: 'Health', icon: HeartPulse },
  { path: '/notes', label: 'Notes', icon: FileText },
  // We will uncomment this when we build the finances page
  // { path: '/finances', label: 'Finances', icon: Coins }, 
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
   <div className="flex min-h-screen bg-[#fdf6f0] font-sans">     
    <aside
        className={
          sidebarOpen
            ? 'w-64 bg-[#0a2e23] text-white transition-all duration-300 flex flex-col' // Premium dark green
            : 'w-20 bg-[#0a2e23] text-white transition-all duration-300 flex flex-col'
        }
      >
        <div className="flex items-center justify-between p-6">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <div className="bg-emerald-500 p-1.5 rounded-lg">
                <Activity size={20} className="text-white" />
              </div>
              <h1 className="text-xl font-bold tracking-tight">Dairy Manager</h1>
            </div>
          )}
          <button
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="rounded-lg p-1.5 hover:bg-white/10 text-emerald-100 transition-colors"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="mt-4 space-y-1 px-3 flex-1">
          {navItems.map(({ path, label, icon: Icon }) => {
            const active = location.pathname === path
            return (
              <Link
                key={path}
                to={path}
                className={[
                  'flex items-center gap-3 rounded-xl px-3 py-3 transition-all duration-200',
                  active 
                    ? 'bg-emerald-600/20 text-emerald-300 font-semibold' 
                    : 'text-emerald-100/70 hover:bg-white/5 hover:text-white'
                ].join(' ')}
              >
                <Icon size={20} className={active ? 'text-emerald-400' : ''} />
                {sidebarOpen && <span className="text-sm">{label}</span>}
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-white/10 p-4 space-y-3">
          {sidebarOpen && profile && (
            <div className="px-2">
              <p className="text-sm font-semibold text-white">{profile.name}</p>
              <p className="text-xs text-emerald-400 capitalize">{profile.role}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-emerald-100/70 hover:bg-red-500/10 hover:text-red-400 transition-colors"
          >
            <LogOut size={18} />
            {sidebarOpen && <span className="text-sm font-medium">Sign out</span>}
          </button>
        </div>
      </aside>

       <main className="flex-1 overflow-auto bg-[#ecf5ff]">         <header className="border-b border-slate-200 bg-white px-8 py-5">
          <p className="text-xs uppercase tracking-widest text-emerald-600 font-bold mb-1">Farm Operations</p>
          <h2 className="text-2xl font-bold text-slate-800">
            {navItems.find((item) => item.path === location.pathname)?.label || 'Dashboard'}
          </h2>
        </header>

        <div className="p-8 max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  )
}