import { useState, useEffect } from 'react'
import { 
  FileText, Droplets, Activity, HeartPulse, Coins, ArrowLeft, Printer, TrendingUp, AlertTriangle 
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import type { Cow, MilkRecord, HealthRecord, BreedingRecord, Sale, Expense } from '../../lib/schemas'
import { Card } from '../../components/Card'
import { useAuth } from '../auth/AuthContext'
import { getAllCows } from '../cows/cowService'
import { getAllMilkRecords } from '../milk/milkService'
import { getAllHealthRecords, isUnderWithdrawal } from '../health/healthService'
import { getAllBreedingRecords } from '../breeding/breedingService'
import { getAllSales, getAllExpenses } from '../finances/financeService'

export function Reports() {
  const { profile } = useAuth()
  const farmId = profile?.farmId || ''
  const isOwner = profile?.role === 'owner' || profile?.role === 'manager'

  const [activeReport, setActiveReport] = useState<'hub' | 'milk' | 'health' | 'breeding' | 'financial'>('hub')
  const [loading, setLoading] = useState(true)

  // Data State
  const [cows, setCows] = useState<Cow[]>([])
  const [milk, setMilk] = useState<MilkRecord[]>([])
  const [health, setHealth] = useState<HealthRecord[]>([])
  const [breeding, setBreeding] = useState<BreedingRecord[]>([])
  const [sales, setSales] = useState<Sale[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])

  useEffect(() => {
    async function loadData() {
      if (!farmId) return
      try {
        setLoading(true)
        const [cowsData, milkData, healthData, breedingData, salesData, expensesData] = await Promise.all([
          getAllCows(farmId),
          getAllMilkRecords(farmId),
          getAllHealthRecords(farmId),
          getAllBreedingRecords(farmId),
          isOwner ? getAllSales(farmId) : Promise.resolve([]),
          isOwner ? getAllExpenses(farmId) : Promise.resolve([])
        ])
        setCows(cowsData)
        setMilk(milkData)
        setHealth(healthData)
        setBreeding(breedingData)
        setSales(salesData)
        setExpenses(expensesData)
      } catch (err) {
        console.error('Failed to load reports:', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [farmId, isOwner])

  const cowName = (cowId: string) => cows.find(c => c.id === cowId)?.name || cows.find(c => c.id === cowId)?.tagId || 'Unknown'

  // --- REPORT CALCULATIONS ---
  const totalMilk = milk.reduce((sum, m) => sum + m.litres, 0)
  const avgMilkPerSession = milk.length > 0 ? totalMilk / milk.length : 0
  
  // Top producing cows
  const cowMilkTotals = milk.reduce((acc, record) => {
    acc[record.cowId] = (acc[record.cowId] || 0) + record.litres
    return acc
  }, {} as Record<string, number>)
  const topCows = Object.entries(cowMilkTotals)
    .map(([cowId, litres]) => ({ name: cowName(cowId), litres }))
    .sort((a, b) => b.litres - a.litres)
    .slice(0, 5)

  // Chart Data (Last 7 Days)
  const dailyMilk = milk.reduce((acc, record) => {
    acc[record.date] = (acc[record.date] || 0) + record.litres
    return acc
  }, {} as Record<string, number>)
  const chartData = Object.entries(dailyMilk)
    .map(([date, litres]) => ({ date: date.slice(5), litres }))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-7)

  const totalIncome = sales.reduce((sum, s) => sum + s.total, 0)
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)
  const netProfit = totalIncome - totalExpenses

  const cowsUnderWithdrawal = health.filter(isUnderWithdrawal)

  if (loading) return <div className="p-8 text-slate-500">Loading analytics...</div>

  // --- HUB VIEW ---
  if (activeReport === 'hub') {
    return (
      <div className="space-y-6 max-w-6xl mx-auto">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-orange-600 font-bold">Analytics</p>
          <h3 className="mt-1 text-3xl font-bold text-slate-900">Reports & Summaries</h3>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="p-6 flex flex-col items-center text-center hover:border-orange-300 hover:shadow-md transition-all cursor-pointer" onClick={() => setActiveReport('milk')}>
            <div className="bg-blue-100 p-4 rounded-full mb-4 text-blue-600"><Droplets size={32} /></div>
            <h4 className="text-lg font-bold text-slate-800">Milk Production Report</h4>
            <p className="text-sm text-slate-500 mt-2">Totals, averages, and top producing cows.</p>
          </Card>
          
          <Card className="p-6 flex flex-col items-center text-center hover:border-orange-300 hover:shadow-md transition-all cursor-pointer" onClick={() => setActiveReport('health')}>
            <div className="bg-rose-100 p-4 rounded-full mb-4 text-rose-600"><HeartPulse size={32} /></div>
            <h4 className="text-lg font-bold text-slate-800">Health & Vet Report</h4>
            <p className="text-sm text-slate-500 mt-2">Current withdrawal status and recent treatments.</p>
          </Card>

          <Card className="p-6 flex flex-col items-center text-center hover:border-orange-300 hover:shadow-md transition-all cursor-pointer" onClick={() => setActiveReport('breeding')}>
            <div className="bg-violet-100 p-4 rounded-full mb-4 text-violet-600"><Activity size={32} /></div>
            <h4 className="text-lg font-bold text-slate-800">Breeding Report</h4>
            <p className="text-sm text-slate-500 mt-2">Pregnancy checks and upcoming calvings.</p>
          </Card>

          {isOwner && (
            <Card className="p-6 flex flex-col items-center text-center hover:border-orange-300 hover:shadow-md transition-all cursor-pointer" onClick={() => setActiveReport('financial')}>
              <div className="bg-emerald-100 p-4 rounded-full mb-4 text-emerald-600"><Coins size={32} /></div>
              <h4 className="text-lg font-bold text-slate-800">Financial Summary</h4>
              <p className="text-sm text-slate-500 mt-2">Income vs expenses and net profit.</p>
            </Card>
          )}
        </div>
      </div>
    )
  }

  // --- DETAILED REPORT VIEW ---
  return (
    <div className="space-y-6 max-w-5xl mx-auto print-container">
      {/* Header Controls (Hidden on Print) */}
      <div className="flex items-center justify-between no-print">
        <button onClick={() => setActiveReport('hub')} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800">
          <ArrowLeft size={16} /> Back to Reports
        </button>
        <button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-xl bg-[#0a2e23] px-4 py-2 text-sm font-medium text-white hover:bg-emerald-900 transition-colors">
          <Printer size={16} /> Print / Save PDF
        </button>
      </div>

      <Card className="p-8 print-container">
        {/* Report Header */}
        <div className="border-b-2 border-slate-800 pb-4 mb-6 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 capitalize">{activeReport} Report</h1>
            <p className="text-slate-500 font-medium mt-1">Generated on {new Date().toLocaleDateString()}</p>
          </div>
          <div className="text-right">
            <p className="font-bold text-slate-800">Dairy Manager</p>
            <p className="text-sm text-slate-500">Farm ID: {farmId.slice(0, 8)}</p>
          </div>
        </div>

        {/* MILK REPORT */}
        {activeReport === 'milk' && (
          <div className="space-y-8">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <p className="text-sm text-slate-500 font-medium">Total Litres (All Time)</p>
                <p className="text-3xl font-bold text-slate-800">{totalMilk.toFixed(1)} L</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <p className="text-sm text-slate-500 font-medium">Total Sessions</p>
                <p className="text-3xl font-bold text-slate-800">{milk.length}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <p className="text-sm text-slate-500 font-medium">Avg / Session</p>
                <p className="text-3xl font-bold text-slate-800">{avgMilkPerSession.toFixed(1)} L</p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">Last 7 Days Production Trend</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <XAxis dataKey="date" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip cursor={{fill: '#f8fafc'}} />
                    <Bar dataKey="litres" fill="#0a2e23" radius={[4, 4, 0, 0]} maxBarSize={50} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">Top Producing Cows</h3>
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="py-2">Cow</th>
                    <th className="py-2 text-right">Total Yield</th>
                  </tr>
                </thead>
                <tbody>
                  {topCows.map((c, i) => (
                    <tr key={i} className="border-b border-slate-100">
                      <td className="py-3 font-medium">{c.name}</td>
                      <td className="py-3 text-right font-bold text-slate-800">{c.litres.toFixed(1)} L</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* HEALTH REPORT */}
        {activeReport === 'health' && (
          <div className="space-y-8">
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl">
              <h3 className="text-lg font-bold text-amber-900 flex items-center gap-2">
                <AlertTriangle size={20} /> Active Withdrawals ({cowsUnderWithdrawal.length})
              </h3>
              <p className="text-sm text-amber-800 mt-1 mb-4">Milk from these cows cannot be sold.</p>
              
              {cowsUnderWithdrawal.length > 0 ? (
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-amber-200 text-amber-900">
                      <th className="py-2">Cow</th>
                      <th className="py-2">Condition</th>
                      <th className="py-2">Withdrawal Ends</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cowsUnderWithdrawal.map((h) => (
                      <tr key={h.id} className="border-b border-amber-100">
                        <td className="py-2 font-bold">{cowName(h.cowId)}</td>
                        <td className="py-2">{h.condition}</td>
                        <td className="py-2 font-bold text-red-600">{h.withdrawalEndDate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : <p className="text-sm text-amber-700 font-medium">No cows currently under withdrawal.</p>}
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">Recent Health Logs</h3>
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="py-2">Date</th>
                    <th className="py-2">Cow</th>
                    <th className="py-2">Condition</th>
                    <th className="py-2">Drug</th>
                  </tr>
                </thead>
                <tbody>
                  {health.slice(0, 10).map((h) => (
                    <tr key={h.id} className="border-b border-slate-100">
                      <td className="py-2">{h.date}</td>
                      <td className="py-2 font-medium">{cowName(h.cowId)}</td>
                      <td className="py-2">{h.condition}</td>
                      <td className="py-2">{h.drug}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* BREEDING REPORT */}
        {activeReport === 'breeding' && (
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">Upcoming Calvings</h3>
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="py-2">Cow</th>
                    <th className="py-2">Expected Date</th>
                    <th className="py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {breeding
                    .filter(b => b.expectedCalvingDate && new Date(b.expectedCalvingDate) >= new Date())
                    .sort((a, b) => new Date(a.expectedCalvingDate).getTime() - new Date(b.expectedCalvingDate).getTime())
                    .map((b) => (
                    <tr key={b.id} className="border-b border-slate-100">
                      <td className="py-2 font-medium">{cowName(b.cowId)}</td>
                      <td className="py-2 font-bold text-orange-600">{b.expectedCalvingDate}</td>
                      <td className="py-2">{b.pregnancyConfirmed ? 'Confirmed' : 'Pending'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* FINANCIAL REPORT */}
        {activeReport === 'financial' && (
          <div className="space-y-8">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                <p className="text-sm text-emerald-700 font-medium">Total Income</p>
                <p className="text-3xl font-bold text-emerald-900">KSH {totalIncome.toLocaleString()}</p>
              </div>
              <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                <p className="text-sm text-red-700 font-medium">Total Expenses</p>
                <p className="text-3xl font-bold text-red-900">KSH {totalExpenses.toLocaleString()}</p>
              </div>
              <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                <p className="text-sm text-slate-300 font-medium">Net Profit</p>
                <p className="text-3xl font-bold text-white">KSH {netProfit.toLocaleString()}</p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">Recent Sales</h3>
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="py-2">Date</th>
                    <th className="py-2">Buyer</th>
                    <th className="py-2">Litres</th>
                    <th className="py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.slice(0, 5).map((s) => (
                    <tr key={s.id} className="border-b border-slate-100">
                      <td className="py-2">{s.date}</td>
                      <td className="py-2">{s.buyer || '—'}</td>
                      <td className="py-2">{s.litres}L</td>
                      <td className="py-2 text-right font-bold text-emerald-600">+ KSH {s.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}