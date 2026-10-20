export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-3xl border border-slate-100 bg-white shadow-sm shadow-slate-200/50 ${className}`}>
      {children}
    </div>
  )
}