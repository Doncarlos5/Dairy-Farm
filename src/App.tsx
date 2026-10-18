import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'

export default function App() {
  const [status, setStatus] = useState('checking Supabase connection...')

  useEffect(() => {
    supabase
      .from('farms')
      .select('name')
      .limit(1)
      .then(({ data, error }) => {
        if (error) {
          setStatus('Error: ' + error.message)
        } else {
          setStatus('Connected! Farm found: ' + (data?.[0]?.name ?? 'No farms found'))
        }
      })
  }, [])

  return (
    <div style={{ padding: 40, fontSize: 24, fontFamily: 'sans-serif' }}>
      <h1>Supabase Test</h1>
      <p>{status}</p>
    </div>
  )
}