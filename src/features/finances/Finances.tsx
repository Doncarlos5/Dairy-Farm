import { useState, useEffect } from 'react'
import { Plus, Trash2, ArrowUpRight, ArrowDownRight, DollarSign } from 'lucide-react'
import type { Sale, Expense } from '../../lib/schemas'
import { Card } from '../../components/Card'
import { useAuth } from '../auth/AuthContext'
import { getAllSales, addSale, deleteSale, getAllExpenses, addExpense, deleteExpense } from './financeService'

export function Finances() {
  const { profile } = useAuth()
  const farmId = profile?.farmId || ''

  const [activeTab, setActiveTab] = useState<'overview' | 'sales' | 'expenses'>('overview')
  
  const [sales, setSales] = useState<Sale[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)

  // Form states
  const [showSaleForm, setShowSaleForm] = useState(false)
  const [saleForm, setSaleForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    litres: '',
    pricePerLitre: '',
    buyer: ''
  })

  const [showExpenseForm, setShowExpenseForm] = useState(false)
  const [expenseForm, setExpenseForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    category: 'Feed',
    amount: '',
    description: ''
  })

  const loadData = async () => {
    if (!farmId) return
    try {
      setLoading(true)
      const [salesData, expensesData] = await Promise.all([
        getAllSales(farmId),
        getAllExpenses(farmId)
      ])
      setSales(salesData)
      setExpenses(expensesData)
    } catch (err) {
      console.error('Error loading finances:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [farmId])

  // --- Calculations ---
  const totalIncome = sales.reduce((sum, s) => sum + s.total, 0)
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)
  const netProfit = totalIncome - totalExpenses

  // --- Handlers ---
  const handleSaleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!farmId) return
    try {
      await addSale({
        farmId,
        date: saleForm.date,
        litres: Number(saleForm.litres),
        pricePerLitre: Number(saleForm.pricePerLitre),
        buyer: saleForm.buyer || undefined
      })
      setShowSaleForm(false)
      setSaleForm({ date: new Date().toISOString().slice(0, 10), litres: '', pricePerLitre: '', buyer: '' })
      loadData()
    } catch (err) {
      console.error(err)
      alert('Failed to add sale')
    }
  }

  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!farmId) return
    try {
      await addExpense({
        farmId,
        date: expenseForm.date,
        category: expenseForm.category,
        amount: Number(expenseForm.amount),
        description: expenseForm.description || undefined
      })
      setShowExpenseForm(false)
      setExpenseForm({ date: new Date().toISOString().slice(0, 10), category: 'Feed', amount: '', description: '' })
      loadData()
    } catch (err) {
      console.error(err)
      alert('Failed to add expense')
    }
  }

  if (loading) return <div className="p-8 text-slate-500">Loading financial data...</div>

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-orange-600 font-bold">Business</p>
          <h3 className="mt-1 text-3xl font-bold text-slate-900">Finances</h3>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto border-b border-slate-200">
        {['overview', 'sales', 'expenses'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-6 py-3 text-sm font-bold border-b-2 capitalize transition-colors ${
              activeTab === tab 
                ? 'border-orange-600 text-orange-600' 
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="pt-2">
        
        {/* --- OVERVIEW TAB --- */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="p-6 bg-gradient-to-br from-emerald-50 to-white border-emerald-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-emerald-700">Total Income</p>
                    <p className="mt-2 text-3xl font-bold text-emerald-900">KSH {totalIncome.toLocaleString()}</p>
                  </div>
                  <div className="rounded-xl bg-emerald-100 p-3 text-emerald-600">
                    <ArrowUpRight size={24} />
                  </div>
                </div>
              </Card>
              <Card className="p-6 bg-gradient-to-br from-red-50 to-white border-red-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-red-700">Total Expenses</p>
                    <p className="mt-2 text-3xl font-bold text-red-900">KSH {totalExpenses.toLocaleString()}</p>
                  </div>
                  <div className="rounded-xl bg-red-100 p-3 text-red-600">
                    <ArrowDownRight size={24} />
                  </div>
                </div>
              </Card>
              <Card className="p-6 bg-gradient-to-br from-orange-50 to-white border-orange-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-700">Net Profit</p>
                    <p className="mt-2 text-3xl font-bold text-orange-900">KSH {netProfit.toLocaleString()}</p>
                  </div>
                  <div className="rounded-xl bg-orange-100 p-3 text-orange-600">
                    <DollarSign size={24} />
                  </div>
                </div>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Recent Sales</h3>
                <div className="space-y-4">
                  {sales.slice(0, 3).map(s => (
                    <div key={s.id} className="flex justify-between items-center text-sm border-b border-slate-100 pb-2">
                      <div>
                        <p className="font-medium text-slate-800">{s.buyer || 'Unknown Buyer'}</p>
                        <p className="text-slate-500">{s.date} • {s.litres}L</p>
                      </div>
                      <span className="font-bold text-emerald-600">+ KSH {s.total}</span>
                    </div>
                  ))}
                  {sales.length === 0 && <p className="text-slate-500 text-sm">No recent sales.</p>}
                </div>
              </Card>
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Recent Expenses</h3>
                <div className="space-y-4">
                  {expenses.slice(0, 3).map(e => (
                    <div key={e.id} className="flex justify-between items-center text-sm border-b border-slate-100 pb-2">
                      <div>
                        <p className="font-medium text-slate-800">{e.category}</p>
                        <p className="text-slate-500">{e.date} • {e.description || 'No description'}</p>
                      </div>
                      <span className="font-bold text-red-600">- KSH {e.amount}</span>
                    </div>
                  ))}
                  {expenses.length === 0 && <p className="text-slate-500 text-sm">No recent expenses.</p>}
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* --- SALES TAB --- */}
        {activeTab === 'sales' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-800">Milk Sales</h3>
              <button
                onClick={() => setShowSaleForm(!showSaleForm)}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
              >
                <Plus size={16} /> {showSaleForm ? 'Close' : 'Record Sale'}
              </button>
            </div>

            {showSaleForm && (
              <Card className="p-5 border-emerald-200 bg-emerald-50/50">
                <form onSubmit={handleSaleSubmit} className="grid gap-4 md:grid-cols-4">
                  <label className="text-sm text-slate-700">
                    <span className="mb-1 block font-medium">Date</span>
                    <input type="date" value={saleForm.date} onChange={(e) => setSaleForm({...saleForm, date: e.target.value})} className="w-full rounded-xl border border-slate-300 px-3 py-2" required />
                  </label>
                  <label className="text-sm text-slate-700">
                    <span className="mb-1 block font-medium">Litres</span>
                    <input type="number" min="0" step="0.1" value={saleForm.litres} onChange={(e) => setSaleForm({...saleForm, litres: e.target.value})} className="w-full rounded-xl border border-slate-300 px-3 py-2" required />
                  </label>
                  <label className="text-sm text-slate-700">
                    <span className="mb-1 block font-medium">Price / Litre (KSH)</span>
                    <input type="number" min="0" step="0.01" value={saleForm.pricePerLitre} onChange={(e) => setSaleForm({...saleForm, pricePerLitre: e.target.value})} className="w-full rounded-xl border border-slate-300 px-3 py-2" required />
                  </label>
                  <label className="text-sm text-slate-700">
                    <span className="mb-1 block font-medium">Buyer (Optional)</span>
                    <input value={saleForm.buyer} onChange={(e) => setSaleForm({...saleForm, buyer: e.target.value})} className="w-full rounded-xl border border-slate-300 px-3 py-2" />
                  </label>
                  <div className="md:col-span-4 flex justify-end">
                    <button type="submit" className="rounded-xl bg-emerald-600 px-6 py-2 text-white hover:bg-emerald-700">Save Sale</button>
                  </div>
                </form>
              </Card>
            )}

            <Card className="overflow-hidden">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-700">
                  <tr>
                    <th className="px-6 py-3 font-semibold">Date</th>
                    <th className="px-6 py-3 font-semibold">Buyer</th>
                    <th className="px-6 py-3 font-semibold">Litres</th>
                    <th className="px-6 py-3 font-semibold">Price/L</th>
                    <th className="px-6 py-3 font-semibold">Total</th>
                    <th className="px-6 py-3 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.map(s => (
                    <tr key={s.id} className="border-t border-slate-100">
                      <td className="px-6 py-3">{s.date}</td>
                      <td className="px-6 py-3">{s.buyer || '—'}</td>
                      <td className="px-6 py-3">{s.litres}L</td>
                      <td className="px-6 py-3">KSH {s.pricePerLitre}</td>
                      <td className="px-6 py-3 font-bold text-emerald-600">KSH {s.total}</td>
                      <td className="px-6 py-3">
                        <button onClick={() => deleteSale(s.id).then(loadData)} className="text-red-500 hover:text-red-700"><Trash2 size={16}/></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>
        )}

        {/* --- EXPENSES TAB --- */}
        {activeTab === 'expenses' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-800">Farm Expenses</h3>
              <button
                onClick={() => setShowExpenseForm(!showExpenseForm)}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                <Plus size={16} /> {showExpenseForm ? 'Close' : 'Add Expense'}
              </button>
            </div>

            {showExpenseForm && (
              <Card className="p-5 border-red-200 bg-red-50/50">
                <form onSubmit={handleExpenseSubmit} className="grid gap-4 md:grid-cols-4">
                  <label className="text-sm text-slate-700">
                    <span className="mb-1 block font-medium">Date</span>
                    <input type="date" value={expenseForm.date} onChange={(e) => setExpenseForm({...expenseForm, date: e.target.value})} className="w-full rounded-xl border border-slate-300 px-3 py-2" required />
                  </label>
                  <label className="text-sm text-slate-700">
                    <span className="mb-1 block font-medium">Category</span>
                    <select value={expenseForm.category} onChange={(e) => setExpenseForm({...expenseForm, category: e.target.value})} className="w-full rounded-xl border border-slate-300 px-3 py-2">
                      <option value="Feed">Feed</option>
                      <option value="Vet">Vet / Health</option>
                      <option value="Labor">Labor</option>
                      <option value="Equipment">Equipment</option>
                      <option value="Other">Other</option>
                    </select>
                  </label>
                  <label className="text-sm text-slate-700">
                    <span className="mb-1 block font-medium">Amount (KSH)</span>
                    <input type="number" min="0" step="0.01" value={expenseForm.amount} onChange={(e) => setExpenseForm({...expenseForm, amount: e.target.value})} className="w-full rounded-xl border border-slate-300 px-3 py-2" required />
                  </label>
                  <label className="text-sm text-slate-700">
                    <span className="mb-1 block font-medium">Description</span>
                    <input value={expenseForm.description} onChange={(e) => setExpenseForm({...expenseForm, description: e.target.value})} className="w-full rounded-xl border border-slate-300 px-3 py-2" placeholder="e.g. Dairy meal" />
                  </label>
                  <div className="md:col-span-4 flex justify-end">
                    <button type="submit" className="rounded-xl bg-red-600 px-6 py-2 text-white hover:bg-red-700">Save Expense</button>
                  </div>
                </form>
              </Card>
            )}

            <Card className="overflow-hidden">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-700">
                  <tr>
                    <th className="px-6 py-3 font-semibold">Date</th>
                    <th className="px-6 py-3 font-semibold">Category</th>
                    <th className="px-6 py-3 font-semibold">Description</th>
                    <th className="px-6 py-3 font-semibold">Amount</th>
                    <th className="px-6 py-3 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map(e => (
                    <tr key={e.id} className="border-t border-slate-100">
                      <td className="px-6 py-3">{e.date}</td>
                      <td className="px-6 py-3 font-medium">{e.category}</td>
                      <td className="px-6 py-3 text-slate-500">{e.description || '—'}</td>
                      <td className="px-6 py-3 font-bold text-red-600">KSH {e.amount}</td>
                      <td className="px-6 py-3">
                        <button onClick={() => deleteExpense(e.id).then(loadData)} className="text-red-500 hover:text-red-700"><Trash2 size={16}/></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}