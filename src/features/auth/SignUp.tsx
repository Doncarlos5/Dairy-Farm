import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Milk } from 'lucide-react'

export function SignUp() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    nationalId: '',
    phoneNumber: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // 1. Create the Auth User
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      })

      if (authError) throw authError

      if (authData.user) {
        // 2. Generate the Worker Number from Database
        const { data: workerNumData, error: rpcError } = await supabase.rpc('generate_worker_number')
        if (rpcError) throw rpcError

        const generatedWorkerNum = workerNumData

        // 3. Create the Profile
        const { error: profileError } = await supabase.from('profiles').insert({
          id: authData.user.id,
          farm_id: '00000000-0000-0000-0000-000000000001', // Default farm
          name: formData.name,
          role: 'staff',
          national_id: formData.nationalId,
          phone_number: formData.phoneNumber,
          worker_number: generatedWorkerNum
        })

        if (profileError) throw profileError
      }

      navigate('/')
    } catch (err: any) {
      setError(err.message || 'Failed to create account')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#fdf6f0] p-4">
      <div className="w-full max-w-md space-y-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
            <Milk size={24} />
          </div>
          <h2 className="mt-4 text-2xl font-bold text-slate-900">Create an account</h2>
          <p className="mt-1 text-sm text-slate-500">Join your farm's management system</p>
        </div>

        <form className="mt-8 space-y-4" onSubmit={handleSignUp}>
          {error && <div className="rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</div>}

          <label className="block text-sm font-medium text-slate-700">
            Full Name
            <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500" />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            National ID Number
            <input type="text" required value={formData.nationalId} onChange={(e) => setFormData({...formData, nationalId: e.target.value})} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500" />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Phone Number
            <input type="tel" required value={formData.phoneNumber} onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500" />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Email address
            <input type="email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500" />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Password
            <input type="password" required value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500" />
          </label>

          <button type="submit" disabled={loading} className="w-full rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-50">
            {loading ? 'Creating account...' : 'Sign up'}
          </button>
        </form>
        
        <div className="text-center text-sm text-slate-500">
          Already have an account? <Link to="/login" className="font-semibold text-orange-600 hover:underline">Log in</Link>
        </div>
      </div>
    </div>
  )
}