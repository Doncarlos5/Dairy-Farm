import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Milk } from 'lucide-react'

export function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/settings`, // Where they land after clicking the email link
    })

    if (error) {
      setError(error.message)
    } else {
      setMessage('Password reset link sent! Check your email.')
    }
    setLoading(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#fdf6f0] p-4">
      <div className="w-full max-w-md space-y-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
            <Milk size={24} />
          </div>
          <h2 className="mt-4 text-2xl font-bold text-slate-900">Reset Password</h2>
          <p className="mt-1 text-sm text-slate-500">Enter your email and we'll send you a reset link</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleReset}>
          {error && <div className="rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</div>}
          {message && <div className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-600">{message}</div>}

          <label className="block text-sm font-medium text-slate-700">
            Email address
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500" />
          </label>

          <button type="submit" disabled={loading} className="w-full rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-50">
            {loading ? 'Sending link...' : 'Send Reset Link'}
          </button>
        </form>
        
        <div className="text-center text-sm text-slate-500">
          Remembered it? <Link to="/login" className="font-semibold text-orange-600 hover:underline">Log in</Link>
        </div>
      </div>
    </div>
  )
}