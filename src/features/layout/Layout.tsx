import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Home, Users, Droplets, Activity, HeartPulse, FileText, LogOut, Coins, MessageSquare, Info, HelpCircle, FileBarChart, Settings as SettingsIcon, Baby, Package } from 'lucide-react'
import { useState, useEffect, useRef, type ReactNode } from 'react'
import { useAuth } from '../auth/AuthContext'
import { supabase } from '../../lib/supabase'

const navItems = [
  { path: '/', label: 'Dashboard', icon: Home },
  { path: '/cows', label: 'Cows', icon: Users },
  { path: '/calves', label: 'Calves', icon: Baby }, // <-- ADDED
  { path: '/milk', label: 'Milk', icon: Droplets },
  { path: '/breeding', label: 'Breeding', icon: Activity },
  { path: '/health', label: 'Health', icon: HeartPulse },
  { path: '/notes', label: 'Notes', icon: FileText },
  { path: '/chat', label: 'Chat', icon: MessageSquare, isChat: true },
  { path: '/reports', label: 'Reports', icon: FileBarChart },
  { path: '/feed', label: 'Feed & Stock', icon: Package },
  { path: '/finances', label: 'Finances', icon: Coins, ownerOnly: true },
]

export function Layout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
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
    setMobileMenuOpen(false)
  }, [location.pathname])

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

  // Split items for mobile: first 4 go to bottom bar, rest go to "More"
  const mobileBottomItems = visibleNavItems.slice(0, 4)
  const mobileMoreItems = visibleNavItems.slice(4)

  const initials = profile?.name?.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() || 'U'

  return (
    <div className="flex h-screen overflow-hidden bg-[#fdf6f0] font-sans">
      
      {/* DESKTOP SIDEBAR */}
      <aside
        onMouseEnter={() => setSidebarOpen(true)}
        onMouseLeave={() => setSidebarOpen(false)}
        className={`
          hidden md:flex flex-col bg-[#0a2e23] text-white transition-all duration-300 ease-in-out h-full overflow-y-auto overflow-x-hidden z-30
          ${sidebarOpen ? 'w-64 shadow-2xl shadow-emerald-900/20' : 'w-20'}
        `}
      >
        <div className="flex items-center justify-center h-20 border-b border-white/5 shrink-0">
          {sidebarOpen ? (
            <div className="flex items-center gap-2 animate-in fade-in duration-300">
              <div className="bg-orange-500 p-1.5 rounded-lg">
                <Activity size={20} className="text-white" />
              </div>
              <h1 className="text-xl font-bold tracking-tight whitespace-nowrap">Dairy Manager</h1>
            </div>
          ) : (
            <div className="bg-orange-500 p-2 rounded-xl">
              <Activity size={24} className="text-white" />
            </div>
          )}
        </div>

        <nav className="mt-4 space-y-1 px-3 flex-1 pb-4">
          {visibleNavItems.map(({ path, label, icon: Icon, isChat }) => {
            const active = location.pathname === path
            return (
              <Link
                key={path}
                to={path}
                className={[
                  'relative flex items-center rounded-xl py-3 transition-all duration-200',
                  sidebarOpen ? 'px-3 gap-3' : 'justify-center px-0',
                  active 
                    ? 'bg-orange-600/20 text-orange-300 font-semibold' 
                    : 'text-orange-100/70 hover:bg-white/5 hover:text-white'
                ].join(' ')}
              >
                <Icon size={22} className={`shrink-0 ${active ? 'text-orange-500' : ''}`} />
                <span className={`text-sm whitespace-nowrap transition-all duration-300 ${sidebarOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0 overflow-hidden'}`}>
                  {label}
                </span>
                {isChat && hasUnreadChat && (
                  <span className={`absolute flex h-3 w-3 rounded-full bg-red-500 ring-2 ring-[#0a2e23] ${sidebarOpen ? 'right-4' : 'top-2 right-2'}`} />
                )}
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* MAIN CONTENT */}
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
                <div className="h-10 w-10 rounded-full bg-[#0a2e23] text-white flex items-center justify-center font-bold text-sm shadow-md overflow-hidden">
                  {profile?.avatarUrl ? (
                    <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
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
                  
                  <Link to="/settings" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                    <SettingsIcon size={16} className="text-slate-400" /> Account Settings
                  </Link>

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

        <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8 w-full scroll-smooth">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>

      {/* MOBILE BOTTOM NAVIGATION */}
      <nav className="md:hidden fixed bottom-0 w-full bg-[#0a2e23] border-t border-white/10 flex justify-around items-center px-2 py-3 z-40">
        {mobileBottomItems.map(({ path, label, icon: Icon, isChat }) => {
          const active = location.pathname === path
          return (
            <Link key={path} to={path} className="flex flex-col items-center gap-1 p-2 relative w-16">
              <Icon size={22} className={active ? 'text-orange-500' : 'text-slate-400'} />
              <span className={`text-[10px] font-medium truncate w-full text-center ${active ? 'text-orange-500' : 'text-slate-400'}`}>
                {label}
              </span>
              {isChat && hasUnreadChat && (
                <span className="absolute top-1 right-3 flex h-2.5 w-2.5 rounded-full bg-red-500" />
              )}
            </Link>
          )
        })}
        
        <button onClick={() => setMobileMenuOpen(true)} className="flex flex-col items-center gap-1 p-2 relative w-16 text-slate-400">
          <MoreHorizontalIcon />
          <span className="text-[10px] font-medium">More</span>
        </button>
      </nav>

      {/* MOBILE "MORE" MENU OVERLAY */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setMobileMenuOpen(false)}>
          <div 
            className="absolute bottom-0 w-full bg-white rounded-t-[2rem] p-6 pb-12 animate-in slide-in-from-bottom duration-300"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6"></div>
            <h3 className="text-xl font-bold text-slate-800 mb-6 px-2">All Modules</h3>
            
            <div className="grid grid-cols-3 gap-4">
              {mobileMoreItems.map(({ path, label, icon: Icon, isChat }) => {
                const active = location.pathname === path
                return (
                  <Link 
                    key={path} 
                    to={path} 
                    className={`flex flex-col items-center justify-center gap-3 p-4 rounded-2xl transition-colors ${active ? 'bg-orange-50 text-orange-600' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
                  >
                    <div className="relative">
                      <Icon size={28} className={active ? 'text-orange-600' : 'text-slate-400'} />
                      {isChat && hasUnreadChat && (
                        <span className="absolute -top-1 -right-1 flex h-3 w-3 rounded-full bg-red-500 border-2 border-slate-50" />
                      )}
                    </div>
                    <span className="text-xs font-semibold text-center leading-tight">{label}</span>
                  </Link>
                )
              })}
            </div>

            <div className="mt-8 border-t border-slate-100 pt-6">
              <button onClick={handleLogout} className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-100">
                <LogOut size={18} /> Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

// Quick inline component for the More icon since it wasn't imported
function MoreHorizontalIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>
    </svg>
  )
}