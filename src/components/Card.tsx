import { type HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  className?: string
}

export function Card({ children, className = '', ...props }: CardProps) {
  return (
    <div className={`rounded-3xl border border-slate-100 bg-white shadow-sm shadow-slate-200/50 ${className}`} {...props}>
      {children}
    </div>
  )
}