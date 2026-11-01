import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Home, Users, Droplets, Activity, HeartPulse, FileText, Menu, X, LogOut, Coins, MessageSquare, Info, HelpCircle, FileBarChart } from 'lucide-react'
import { useState, useEffect, useRef, type ReactNode } from 'react'
import { useAuth } from '../auth/AuthContext'
import { supabase } from '../../lib/supabase'

const navItems = [
  { path: '/', label: 'Dashboard', icon: Home },
  { path: '/cows', label: 'Cows', icon: Users },
  { path: '/milk', label: 'Milk', icon: Droplets },
  { path: '/breeding', label: 'Breeding', icon: Activity },
  { path: '/health', label: 'Health', icon: HeartPulse },
  { path: '/notes', label: 'Notes', icon: FileText },
  { path: '/chat', label: 'Chat', icon: MessageSquare, isChat: true },
  { path: '/reports', label: 'Reports', icon: FileBarChart }, // <--- REPORTS ADDED HERE
  { path: '/finances', label: 'Finances', icon: Coins, ownerOnly: true },
]

export function Layout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [hasUnreadChat, setHasUnreadChat] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  
  const location = useLocation()
  const navigate = useNavigate()
  const { profile, signOut } = useAuth()
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    if (!profile?.farmId) return

    const channel = supabase
      .channel('layout-notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `farm_id=eq.${profile.farmId}` },
        (payload) => {
          if (payload.new.sender_id !== profile.id && location.pathname !== '/chat') {
            setHasUnreadChat(true)
          }
        }
      )
      .subscribe()

    return () => { channel.unsubscribe() }
  }, [profile?.farmId, location.pathname])

  useEffect(() => {
    if (location.pathname === '/chat') setHasUnreadChat(false)
  }, [location.pathname])

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  const visibleNavItems = navItems.filter(item => {
    if (item.ownerOnly && profile?.role !== 'owner') return false
    return true
  })

  const initials = profile?.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U'

  return (
    <div className="flex h-screen overflow-hidden bg-[#fdf6f0] font-sans">
      
      {/* --- DESKTOP SIDEBAR --- */}
      <aside
        className={`
          hidden md:flex flex-col bg-[#0a2e23] text-white transition-all duration-300 h-full overflow-y-auto
          ${sidebarOpen ? 'w-64' : 'w-20'}
        `}
      >
        <div className="flex items-center justify-between p-6">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <div className="bg-orange-500 p-1.5 rounded-lg">
                <Activity size={20} className="text-white" />
              </div>
              <h1 className="text-xl font-bold tracking-tight">Dairy Manager</h1>
            </div>
          )}
          <button
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="rounded-lg p-1.5 hover:bg-white/10 text-orange-100 transition-colors"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="mt-4 space-y-1 px-3 flex-1">
          {visibleNavItems.map(({ path, label, icon: Icon, isChat }) => {
            const active = location.pathname === path
            return (
              <Link
                key={path}
                to={path}
                className={[
                  'relative flex items-center gap-3 rounded-xl px-3 py-3 transition-all duration-200',
                  active 
                    ? 'bg-orange-600/20 text-orange-300 font-semibold' 
                    : 'text-orange-100/70 hover:bg-white/5 hover:text-white'
                ].join(' ')}
              >
                <Icon size={20} className={active ? 'text-orange-500' : ''} />
                {sidebarOpen && <span className="text-sm">{label}</span>}
                
                {isChat && hasUnreadChat && (
                  <span className={`absolute ${sidebarOpen ? 'right-4' : 'top-2 right-2'} flex h-3 w-3 rounded-full bg-red-500 ring-2 ring-[#0a2e23]`} />
                )}
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        
        <header className="border-b border-slate-200 bg-white px-4 md:px-8 py-4 md:py-5 shrink-0 relative z-20">
          <div className="flex justify-between items-center w-full">
            <div>
              <p className="text-[10px] md:text-xs uppercase tracking-widest text-orange-600 font-bold mb-1">Farm Operations</p>
              <h2 className="text-xl md:text-2xl font-bold text-slate-800">
                {navItems.find((item) => item.path === location.pathname)?.label || 'Dashboard'}
              </h2>
            </div>
            
            <div className="relative" ref={menuRef}>
              <button 
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 rounded-full border-2 border-transparent hover:border-orange-200 transition-all p-1 pr-3"
              >
                <div className="h-10 w-10 rounded-full bg-[#0a2e23] text-white flex items-center justify-center font-bold text-sm shadow-md">
                  {profile?.avatarUrl ? (
                    <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    initials
                  )}
                </div>
                <span className="hidden md:block text-sm font-semibold text-slate-700">{profile?.name}</span>
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-4 py-3 border-b border-slate-100 mb-2">
                    <p className="text-sm font-bold text-slate-800 truncate">{profile?.name}</p>
                    <p className="text-xs text-orange-600 capitalize">{profile?.role}</p>
                  </div>
                  
                  <Link to="/info" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                    <Info size={16} className="text-slate-400" /> Info & Guide
                  </Link>
                  
                  <Link to="/about" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                    <HelpCircle size={16} className="text-slate-400" /> About Us
                  </Link>

                  <div className="border-t border-slate-100 mt-2 pt-2">
                    <button onClick={handleLogout} className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors font-medium">
                      <LogOut size={16} /> Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8 w-full">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>

      {/* --- MOBILE BOTTOM NAVIGATION --- */}
      <nav className="md:hidden fixed bottom-0 w-full bg-[#0a2e23] border-t border-white/10 flex justify-around items-center px-2 py-3 z-50">
        {visibleNavItems.slice(0, 5).map(({ path, label, icon: Icon, isChat }) => {
          const active = location.pathname === path
          return (
            <Link key={path} to={path} className="flex flex-col items-center gap-1 p-2 relative">
              <Icon size={22} className={active ? 'text-orange-500' : 'text-slate-400'} />
              <span className={`text-[10px] font-medium ${active ? 'text-orange-500' : 'text-slate-400'}`}>
                {label}
              </span>
              {isChat && hasUnreadChat && (
                <span className="absolute top-1 right-2 flex h-2.5 w-2.5 rounded-full bg-red-500" />
              )}
            </Link>
          )
        })}
      </nav>

    </div>
  )
}