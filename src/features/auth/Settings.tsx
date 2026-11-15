import { useState, useRef, useEffect } from 'react'
import { Camera, Lock, User, CheckCircle, AlertCircle, Mail } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from './AuthContext'
import { Card } from '../../components/Card'

export function Settings() {
  const { profile, session } = useAuth()
  
  const [name, setName] = useState(profile?.name || '')
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatarUrl || '')
  const [uploading, setUploading] = useState(false)
  
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Sync state if profile loads after initial render
  useEffect(() => {
    if (profile) {
      setName(profile.name || '')
      setAvatarUrl(profile.avatarUrl || '')
    }
  }, [profile])

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !session?.user) return

    try {
      setUploading(true)
      const fileExt = file.name.split('.').pop()
      const fileName = `${session.user.id}/avatar-${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('avatars').getPublicUrl(fileName)
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: data.publicUrl })
        .eq('id', session.user.id)

      if (updateError) throw updateError
      
      setAvatarUrl(data.publicUrl)
      window.location.reload() 
    } catch (err) {
      console.error(err)
      alert('Failed to upload avatar.')
    } finally {
      setUploading(false)
    }
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session?.user) return
    setLoading(true)
    setMessage({ type: '', text: '' })

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ name })
        .eq('id', session.user.id)

      if (error) throw error
      setMessage({ type: 'success', text: 'Profile updated successfully!' })
      setTimeout(() => window.location.reload(), 1000)
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match.' })
      return
    }
    setLoading(true)
    setMessage({ type: '', text: '' })

    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      setMessage({ type: 'success', text: 'Password updated successfully! Redirecting to login...' })
      setPassword('')
      setConfirmPassword('')
      
      // Force logout after password change so they log in with the new one
      setTimeout(async () => {
        await supabase.auth.signOut()
        window.location.href = '/login'
      }, 2000)
      
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-10">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-orange-600 font-bold">Account</p>
        <h3 className="mt-1 text-3xl font-bold text-slate-900">Settings</h3>
      </div>

      {message.text && (
        <div className={`p-4 rounded-xl flex items-center gap-2 text-sm font-medium ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          {message.text}
        </div>
      )}

      {/* PROFILE SECTION */}
      {profile ? (
        <Card className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Avatar */}
            <div className="flex flex-col items-center gap-3 shrink-0">
              <div className="h-28 w-28 rounded-full bg-slate-100 border-4 border-white shadow-lg overflow-hidden flex items-center justify-center relative group">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl font-bold text-slate-300">{profile.name?.charAt(0) || 'U'}</span>
                )}
                <button onClick={() => fileInputRef.current?.click()} className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="text-white" size={24} />
                </button>
              </div>
              <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="text-sm font-semibold text-orange-600 hover:text-orange-700">
                {uploading ? 'Uploading...' : 'Change Picture'}
              </button>
              <input type="file" accept="image/*" ref={fileInputRef} onChange={handleAvatarUpload} className="hidden" />
            </div>

            {/* Profile Form */}
            <form onSubmit={handleUpdateProfile} className="flex-1 space-y-4 w-full">
              <h4 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
                <User size={20} className="text-orange-600" /> Public Profile
              </h4>
              
              <label className="text-sm text-slate-700 block">
                <span className="mb-1 block font-medium">Email Address (Read-only)</span>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 text-slate-400" size={18} />
                  <input value={session?.user?.email || ''} readOnly className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 py-2 text-slate-500" />
                </div>
              </label>

              <label className="text-sm text-slate-700 block">
                <span className="mb-1 block font-medium">Full Name</span>
                <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-2" required />
              </label>
              
              <label className="text-sm text-slate-700 block">
                <span className="mb-1 block font-medium">Worker Number (Read-only)</span>
                <input value={profile.workerNumber || 'Pending'} readOnly className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-500" />
              </label>
              <div className="flex justify-end pt-2">
                <button type="submit" disabled={loading} className="rounded-xl bg-orange-600 px-6 py-2 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-50">
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </Card>
      ) : (
        <Card className="p-6 text-center text-slate-500">
          Loading profile details...
        </Card>
      )}

      {/* SECURITY / PASSWORD RESET SECTION */}
      <Card className="p-6 md:p-8 border-orange-200">
        <div className="flex items-center gap-2 mb-6">
          <Lock size={20} className="text-orange-600" />
          <h4 className="text-lg font-bold text-slate-800">Update Password</h4>
        </div>
        
        <div className="mb-6 bg-blue-50 text-blue-800 p-4 rounded-xl text-sm border border-blue-100 flex items-start gap-3">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <p>You are updating the password for <strong>{session?.user?.email}</strong>. After saving, you will be logged out and asked to log in with your new password.</p>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <label className="text-sm text-slate-700 block">
              <span className="mb-1 block font-medium">New Password</span>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full rounded-xl border border-slate-300 px-3 py-2" required minLength={6} />
            </label>
            <label className="text-sm text-slate-700 block">
              <span className="mb-1 block font-medium">Confirm New Password</span>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" className="w-full rounded-xl border border-slate-300 px-3 py-2" required minLength={6} />
            </label>
          </div>
          <div className="flex justify-end pt-2">
            <button type="submit" disabled={loading} className="rounded-xl bg-[#0a2e23] px-6 py-2 text-sm font-medium text-white hover:bg-emerald-900 disabled:opacity-50">
              Save New Password
            </button>
          </div>
        </form>
      </Card>
    </div>
  )
}