import { Link } from 'react-router-dom'
import { Home, ArrowLeft } from 'lucide-react'

export function NotFound() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center p-6">
      <div className="max-w-md text-center">
        <p className="text-7xl font-bold text-sky-600">404</p>
        <h1 className="mt-4 text-2xl font-bold text-slate-800">Page not found</h1>
        <p className="mt-2 text-slate-600">
          The page you're looking for doesn't exist or was moved. Let's get you back to the farm.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-sky-700"
          >
            <Home size={16} /> Back to dashboard
          </Link>
          <button
            type="button"
            onClick={() => history.back()}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft size={16} /> Go back
          </button>
        </div>
      </div>
    </div>
  )
}