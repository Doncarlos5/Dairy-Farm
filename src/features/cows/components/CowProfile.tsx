import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Edit, Camera, Calendar, Activity, HeartPulse, Milk, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import type { Cow, MilkRecord, BreedingRecord, HealthRecord } from '../../../lib/schemas'
import { Card } from '../../../components/Card'
import { getCow, uploadCowPhoto } from '../cowService'
import { getMilkForCow } from '../../milk/milkService'
import { getBreedingForCow } from '../../breeding/breedingService'
import { getHealthForCow, isUnderWithdrawal } from '../../health/healthService'

export function CowProfile() {
  const { id } = useParams<{ id: string }>()
  
  const [cow, setCow] = useState<Cow | null>(null)
  const [milk, setMilk] = useState<MilkRecord[]>([])
  const [breeding, setBreeding] = useState<BreedingRecord[]>([])
  const [health, setHealth] = useState<HealthRecord[]>([])
  
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'milk' | 'breeding' | 'health'>('overview')
  
  const [chartView, setChartView] = useState<'daily' | 'weekly'>('daily')

  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    async function loadData() {
      if (!id) return
      try {
        setLoading(true)
        const [cowData, milkData, breedingData, healthData] = await Promise.all([
          getCow(id),
          getMilkForCow(id),
          getBreedingForCow(id),
          getHealthForCow(id)
        ])
        setCow(cowData)
        setMilk(milkData)
        setBreeding(breedingData)
        setHealth(healthData)
      } catch (err) {
        console.error('Error loading cow profile:', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [id])

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !id || !cow) return

    try {
      setUploading(true)
      const url = await uploadCowPhoto(file, id)
      setCow({ ...cow, photo: url })
    } catch (err) {
      console.error(err)
      alert('Failed to upload photo.')
    } finally {
      setUploading(false)
    }
  }

  if (loading) return <div className="p-8 text-slate-500">Loading profile...</div>
  if (!cow) return <div className="p-8 text-slate-500">Cow not found.</div>

  // --- CALCULATIONS ---
  const today = new Date()
  
  let age = 'Unknown'
  if (cow.birthDate) {
    const birth = new Date(cow.birthDate)
    const ageInMonths = (today.getFullYear() - birth.getFullYear()) * 12 + (today.getMonth() - birth.getMonth())
    const years = Math.floor(ageInMonths / 12)
    const months = ageInMonths % 12
    age = `${years}y ${months}m`
  }

  let dim = 0
  if (cow.lastCalvedDate) {
    const calved = new Date(cow.lastCalvedDate)
    dim = Math.floor((today.getTime() - calved.getTime()) / (1000 * 60 * 60 * 24))
  }

  // --- CHART DATA & TREND LOGIC ---
  const groupedMilk = milk.reduce((acc, record) => {
    let key = ''
    const d = new Date(record.date)
    if (chartView === 'daily') {
      key = record.date
    } else {
      const firstDayOfYear = new Date(d.getFullYear(), 0, 1)
      const pastDaysOfYear = (d.getTime() - firstDayOfYear.getTime()) / 86400000
      const weekNum = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7)
      key = `W${weekNum}`
    }
    acc[key] = (acc[key] || 0) + record.litres
    return acc
  }, {} as Record<string, number>)

  let chartData = Object.entries(groupedMilk).map(([label, litres]) => ({ 
    label: chartView === 'daily' ? label.slice(5) : label,
    litres 
  }))

  if (chartView === 'daily') {
    chartData.sort((a, b) => a.label.localeCompare(b.label))
  } else {
    chartData.sort((a, b) => parseInt(a.label.replace('W', '')) - parseInt(b.label.replace('W', '')))
  }
  chartData = chartData.slice(-7)

  // Calculate Differences
  let trendPercentage = 0
  let absoluteDiff = 0
  
  if (chartData.length >= 2) {
    const currentTotal = chartData[chartData.length - 1].litres
    const previousTotal = chartData[chartData.length - 2].litres
    absoluteDiff = currentTotal - previousTotal
    if (previousTotal > 0) {
      trendPercentage = (absoluteDiff / previousTotal) * 100
    }
  }

  const totalLitres = milk.reduce((sum, m) => sum + m.litres, 0)
  const avgYield = milk.length > 0 ? (totalLitres / milk.length).toFixed(1) : '0.0'
  const periodWord = chartView === 'daily' ? 'day' : 'week'

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <Link to="/cows" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors">
        <ArrowLeft size={16} /> Back to herd
      </Link>

      {/* --- HERO SECTION --- */}
      <div className="overflow-hidden rounded-3xl bg-white shadow-sm border border-slate-200">
        <div className="h-64 md:h-80 bg-slate-100 relative group">
          {cow.photo ? (
            <img src={cow.photo} alt={cow.name} className="w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-slate-400 font-medium">No photo uploaded</div>
          )}
          
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="absolute bottom-4 right-4 flex items-center gap-2 rounded-xl bg-white/90 px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm backdrop-blur hover:bg-white transition-all disabled:opacity-50"
          >
            <Camera size={18} />
            {uploading ? 'Uploading...' : 'Change Photo'}
          </button>
          
          <input type="file" accept="image/*" ref={fileInputRef} onChange={handlePhotoUpload} className="hidden" />
        </div>

        <div className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-100 pb-6 mb-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900">{cow.name || 'Unnamed cow'}</h1>
              <p className="text-lg font-bold text-orange-600 mt-1">#{cow.tagId}</p>
            </div>
            <div className="flex items-center gap-3">
               <span className="rounded-full bg-emerald-100 px-4 py-1.5 text-sm font-bold text-emerald-700 capitalize">
                 {cow.status.replace('_', ' ')}
               </span>
               <button className="flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition-colors">
                 <Edit size={16} /> Edit
               </button>
            </div>
          </div>

          {/* VITALS ROW */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-slate-50 p-2 rounded-lg text-slate-500"><Milk size={20} /></div>
              <div>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Breed</p>
                <p className="font-bold text-slate-800">{cow.breed}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-slate-50 p-2 rounded-lg text-slate-500"><Calendar size={20} /></div>
              <div>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Age</p>
                <p className="font-bold text-slate-800">{age}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-slate-50 p-2 rounded-lg text-slate-500"><Activity size={20} /></div>
              <div>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Weight (Est)</p>
                <p className="font-bold text-slate-800">{cow.weight ? `${cow.weight} kg` : '—'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-slate-50 p-2 rounded-lg text-slate-500"><HeartPulse size={20} /></div>
              <div>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Body Condition</p>
                <p className="font-bold text-slate-800">{cow.bcs ? `${cow.bcs} / 5` : '—'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- TABS --- */}
      <div className="flex overflow-x-auto border-b border-slate-200 sticky top-0 bg-[#fdf6f0] z-10 pt-2">
        {['overview', 'milk', 'breeding', 'health'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-6 py-3 text-sm font-bold border-b-2 capitalize transition-colors whitespace-nowrap ${
              activeTab === tab 
                ? 'border-orange-600 text-orange-600' 
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* --- TAB CONTENT --- */}
      <div className="pt-2">
        
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="md:col-span-2 p-6 bg-white rounded-3xl shadow-sm border border-slate-100">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                  <h3 className="text-lg font-bold text-slate-800">Milk Yield Trend</h3>
                  <div className="flex bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
                    {(['daily', 'weekly'] as const).map(v => (
                      <button key={v} onClick={() => setChartView(v)} className={`flex-1 sm:flex-none px-4 py-1.5 text-sm font-semibold rounded-lg capitalize transition-all ${chartView === v ? 'bg-white shadow-sm text-orange-600' : 'text-slate-500 hover:text-slate-700'}`}>
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="h-56 w-full">
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                        <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Bar dataKey="litres" radius={[6, 6, 0, 0]} maxBarSize={40}>
                          {chartData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={index === chartData.length - 1 ? '#ea580c' : '#fdba74'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400">Not enough milk data.</div>
                  )}
                </div>
              </Card>

              {/* TREND CARD */}
              <div className="p-6 bg-[#0a2e23] rounded-3xl flex flex-col justify-center text-white relative overflow-hidden shadow-lg shadow-emerald-900/20">
                <p className="text-slate-300 font-semibold text-sm">Avg Yield / Session</p>
                <div className="flex items-baseline gap-1 mt-1">
                  <p className="text-5xl font-bold">{avgYield}</p>
                  <span className="text-xl font-medium text-slate-400">L</span>
                </div>
                <p className="text-sm text-slate-400 mt-2">Across all milk records</p>
                
                {chartData.length >= 2 && (
                  <div className="mt-6 pt-6 border-t border-white/10 flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${trendPercentage >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                      {trendPercentage > 0 ? <TrendingUp size={24} /> : trendPercentage < 0 ? <TrendingDown size={24} /> : <Minus size={24} />}
                    </div>
                    <div>
                      {/* THIS IS WHERE THE ABSOLUTE DIFFERENCE IS DISPLAYED */}
                      <p className={`font-bold text-lg flex gap-2 items-center ${trendPercentage >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {absoluteDiff > 0 ? '+' : ''}{absoluteDiff.toFixed(1)} L
                        <span className="text-sm font-medium opacity-80">
                          ({Math.abs(trendPercentage).toFixed(1)}%)
                        </span>
                      </p>
                      <p className="text-xs text-slate-400 font-medium">vs previous {periodWord}</p>
                    </div>
                  </div>
                )}
                <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-orange-500/20 rounded-full blur-2xl pointer-events-none"></div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card className="p-6 border-t-4 border-t-blue-500">
                <p className="text-sm font-semibold text-slate-500">Days in Milk (DIM)</p>
                <p className="mt-2 text-4xl font-bold text-blue-600">{dim} days</p>
                <p className="text-xs text-slate-400 mt-1">Since {cow.lastCalvedDate || 'N/A'}</p>
              </Card>
              <Card className="p-6 border-t-4 border-t-orange-500">
                <p className="text-sm font-semibold text-slate-500">Calf Details</p>
                <p className="mt-2 text-xl font-bold text-orange-600">{cow.calfDetails || 'None recorded'}</p>
                <p className="text-xs text-slate-400 mt-1">Last calving</p>
              </Card>
            </div>

            <Card className="p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Farm Notes</h3>
              <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                {cow.notes || 'No general notes recorded for this cow.'}
              </p>
            </Card>
          </div>
        )}

        {/* MILK TAB */}
        {activeTab === 'milk' && (
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <TrendingUp size={20} className="text-orange-600" /> Detailed Production History
              </h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                    <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Bar dataKey="litres" fill="#ea580c" radius={[6, 6, 0, 0]} barSize={30} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
            <Card className="overflow-hidden">
              <table className="min-w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 text-slate-700">
                  <tr>
                    <th className="px-6 py-3 font-semibold">Date</th>
                    <th className="px-6 py-3 font-semibold">Session</th>
                    <th className="px-6 py-3 font-semibold">Litres</th>
                  </tr>
                </thead>
                <tbody>
                  {milk.length > 0 ? milk.map(m => (
                    <tr key={m.id} className="border-t border-slate-100">
                      <td className="px-6 py-3">{m.date}</td>
                      <td className="px-6 py-3 uppercase font-medium text-slate-500">{m.session}</td>
                      <td className="px-6 py-3 font-bold text-orange-600">{m.litres} L</td>
                    </tr>
                  )) : <tr><td colSpan={3} className="px-6 py-6 text-center text-slate-500">No milk records.</td></tr>}
                </tbody>
              </table>
            </Card>
          </div>
        )}

        {/* BREEDING TAB */}
        {activeTab === 'breeding' && (
          <Card className="overflow-hidden">
             <table className="min-w-full text-left text-sm whitespace-nowrap">
               <thead className="bg-slate-50 text-slate-700">
                 <tr>
                   <th className="px-6 py-3 font-semibold">AI Date</th>
                   <th className="px-6 py-3 font-semibold">Bull Straw</th>
                   <th className="px-6 py-3 font-semibold">Expected Calving</th>
                   <th className="px-6 py-3 font-semibold">Pregnancy Confirmed</th>
                 </tr>
               </thead>
               <tbody>
                 {breeding.length > 0 ? breeding.map(b => (
                   <tr key={b.id} className="border-t border-slate-100">
                     <td className="px-6 py-3">{b.aiDate}</td>
                     <td className="px-6 py-3 font-medium">{b.bullStraw}</td>
                     <td className="px-6 py-3">{b.expectedCalvingDate || '—'}</td>
                     <td className="px-6 py-3">
                        {b.pregnancyConfirmed ? (
                          <span className="text-emerald-600 font-medium text-xs bg-emerald-50 px-2 py-1 rounded">Yes</span>
                        ) : (
                          <span className="text-amber-600 font-medium text-xs bg-amber-50 px-2 py-1 rounded">Pending</span>
                        )}
                     </td>
                   </tr>
                 )) : <tr><td colSpan={4} className="px-6 py-6 text-center text-slate-500">No breeding records.</td></tr>}
               </tbody>
             </table>
          </Card>
        )}

        {/* HEALTH TAB */}
        {activeTab === 'health' && (
          <Card className="overflow-hidden">
             <table className="min-w-full text-left text-sm whitespace-nowrap">
               <thead className="bg-slate-50 text-slate-700">
                 <tr>
                   <th className="px-6 py-3 font-semibold">Date</th>
                   <th className="px-6 py-3 font-semibold">Condition</th>
                   <th className="px-6 py-3 font-semibold">Drug</th>
                   <th className="px-6 py-3 font-semibold">Status</th>
                 </tr>
               </thead>
               <tbody>
                 {health.length > 0 ? health.map(h => (
                   <tr key={h.id} className="border-t border-slate-100">
                     <td className="px-6 py-3">{h.date}</td>
                     <td className="px-6 py-3 font-medium">{h.condition}</td>
                     <td className="px-6 py-3 text-slate-500">{h.drug}</td>
                     <td className="px-6 py-3">
                        {isUnderWithdrawal(h) ? (
                          <span className="text-amber-600 font-bold text-xs bg-amber-50 px-2 py-1 rounded">Withdrawal</span>
                        ) : (
                          <span className="text-emerald-600 font-bold text-xs bg-emerald-50 px-2 py-1 rounded">Clear</span>
                        )}
                     </td>
                   </tr>
                 )) : <tr><td colSpan={4} className="px-6 py-6 text-center text-slate-500">No health records.</td></tr>}
               </tbody>
             </table>
          </Card>
        )}
      </div>
    </div>
  )
}