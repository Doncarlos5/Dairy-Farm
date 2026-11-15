import { useState, useEffect } from 'react'
import { Plus, Trash2, ArrowUpRight, ArrowDownRight, DollarSign, CheckCircle, AlertCircle, XCircle, Clock } from 'lucide-react'
import type { Sale, Expense } from '../../lib/schemas'
import { Card } from '../../components/Card'
import { useAuth } from '../auth/AuthContext'
import { getAllSales, addSale, deleteSale, getAllExpenses, addExpense, deleteExpense, approveExpense, rejectExpense } from './financeService'

export function Finances() {
  const { profile } = useAuth()
  const farmId = profile?.farmId || ''
  const isOwner = profile?.role === 'owner' || profile?.role === 'manager'
  const userName = profile?.name || 'Unknown'

  const [activeTab, setActiveTab] = useState<'overview' | 'sales' | 'expenses'>('overview')
  
  const [sales, setSales] = useState<Sale[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)

  // Form states
  const [showSaleForm, setShowSaleForm] = useState(false)
  const [saleForm, setSaleForm] = useState({
    date: new Date().toISOString().slice(0, 10), litres: '', pricePerLitre: '', buyer: ''
  })

  const [showExpenseForm, setShowExpenseForm] = useState(false)
  const [expenseForm, setExpenseForm] = useState({
    date: new Date().toISOString().slice(0, 10), category: 'Feed', amount: '', description: ''
  })

  const loadData = async () => {
    if (!farmId || !isOwner) return
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

  useEffect(() => { loadData() }, [farmId, isOwner])

  if (!isOwner) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center">
        <AlertCircle size={48} className="text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-slate-800">Access Denied</h2>
        <p className="text-slate-500 mt-2">Only farm owners and managers can view financial records.</p>
      </div>
    )
  }

  // --- CALCULATIONS ---
  const approvedExpenses = expenses.filter(e => e.status === 'approved')
  const pendingExpenses = expenses.filter(e => e.status === 'pending')

  const totalIncome = sales.reduce((sum, s) => sum + s.total, 0)
  const totalExpenses = approvedExpenses.reduce((sum, e) => sum + e.amount, 0)
  const netProfit = totalIncome - totalExpenses

  // --- HANDLERS ---
  const handleSaleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!farmId) return
    try {
      await addSale({ farmId, date: saleForm.date, litres: Number(saleForm.litres), pricePerLitre: Number(saleForm.pricePerLitre), buyer: saleForm.buyer || undefined, status: 'approved' })
      setShowSaleForm(false)
      setSaleForm({ date: new Date().toISOString().slice(0, 10), litres: '', pricePerLitre: '', buyer: '' })
      loadData()
    } catch (err) { alert('Failed to add sale') }
  }

  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!farmId) return
    try {
      await addExpense({
        farmId, date: expenseForm.date, category: expenseForm.category,
        amount: Number(expenseForm.amount), description: expenseForm.description || undefined,
        status: 'approved', createdByName: userName
      })
      setShowExpenseForm(false)
      setExpenseForm({ date: new Date().toISOString().slice(0, 10), category: 'Feed', amount: '', description: '' })
      loadData()
    } catch (err) { alert('Failed to add expense') }
  }

  const handleApprove = async (id: string) => {
    try { await approveExpense(id); loadData() } catch (err) { alert('Failed to approve') }
  }

  const handleReject = async (id: string) => {
    if (window.confirm('Reject this expense?')) {
      try { await rejectExpense(id); loadData() } catch (err) { alert('Failed to reject') }
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

      <div className="flex overflow-x-auto border-b border-slate-200">
        {['overview', 'sales', 'expenses'].map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab as any)} className={`px-6 py-3 text-sm font-bold border-b-2 capitalize transition-colors ${activeTab === tab ? 'border-orange-600 text-orange-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
            {tab}
          </button>
        ))}
      </div>

      <div className="pt-2">
        
        {/* --- OVERVIEW TAB --- */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {pendingExpenses.length > 0 && (
              <div className="bg-amber-100 border border-amber-300 text-amber-800 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <AlertCircle size={20} className="shrink-0" />
                  <p className="text-sm font-semibold">You have {pendingExpenses.length} pending expense(s) to review.</p>
                </div>
                <button onClick={() => setActiveTab('expenses')} className="text-xs font-bold bg-amber-200 px-3 py-1.5 rounded-lg hover:bg-amber-300 w-full sm:w-auto">Review Now</button>
              </div>
            )}
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="p-6 bg-gradient-to-br from-emerald-50 to-white border-emerald-100"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-emerald-700">Total Income</p><p className="mt-2 text-3xl font-bold text-emerald-900">KSH {totalIncome.toLocaleString()}</p></div><div className="rounded-xl bg-emerald-100 p-3 text-emerald-600"><ArrowUpRight size={24} /></div></div></Card>
              <Card className="p-6 bg-gradient-to-br from-red-50 to-white border-red-100"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-red-700">Total Expenses</p><p className="mt-2 text-3xl font-bold text-red-900">KSH {totalExpenses.toLocaleString()}</p></div><div className="rounded-xl bg-red-100 p-3 text-red-600"><ArrowDownRight size={24} /></div></div></Card>
              <Card className="p-6 bg-gradient-to-br from-orange-50 to-white border-orange-100"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-orange-700">Net Profit</p><p className="mt-2 text-3xl font-bold text-orange-900">KSH {netProfit.toLocaleString()}</p></div><div className="rounded-xl bg-orange-100 p-3 text-orange-600"><DollarSign size={24} /></div></div></Card>
            </div>
          </div>
        )}

        {/* --- SALES TAB --- */}
        {activeTab === 'sales' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h3 className="text-xl font-bold text-slate-800">Milk Sales</h3>
              <button onClick={() => setShowSaleForm(!showSaleForm)} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 w-full sm:w-auto justify-center"><Plus size={16} /> Record Sale</button>
            </div>
            {showSaleForm && (
              <Card className="p-5 border-emerald-200 bg-emerald-50/50">
                <form onSubmit={handleSaleSubmit} className="grid gap-4 md:grid-cols-4">
                  <label className="text-sm text-slate-700"><span className="mb-1 block font-medium">Date</span><input type="date" value={saleForm.date} onChange={(e) => setSaleForm({...saleForm, date: e.target.value})} className="w-full rounded-xl border border-slate-300 px-3 py-2" required /></label>
                  <label className="text-sm text-slate-700"><span className="mb-1 block font-medium">Litres</span><input type="number" min="0" step="0.1" value={saleForm.litres} onChange={(e) => setSaleForm({...saleForm, litres: e.target.value})} className="w-full rounded-xl border border-slate-300 px-3 py-2" required /></label>
                  <label className="text-sm text-slate-700"><span className="mb-1 block font-medium">Price / Litre</span><input type="number" min="0" step="0.01" value={saleForm.pricePerLitre} onChange={(e) => setSaleForm({...saleForm, pricePerLitre: e.target.value})} className="w-full rounded-xl border border-slate-300 px-3 py-2" required /></label>
                  <label className="text-sm text-slate-700"><span className="mb-1 block font-medium">Buyer</span><input value={saleForm.buyer} onChange={(e) => setSaleForm({...saleForm, buyer: e.target.value})} className="w-full rounded-xl border border-slate-300 px-3 py-2" /></label>
                  <div className="md:col-span-4 flex justify-end"><button type="submit" className="rounded-xl bg-emerald-600 px-6 py-2 text-white hover:bg-emerald-700 w-full sm:w-auto">Save Sale</button></div>
                </form>
              </Card>
            )}
            
            {/* Desktop Table */}
            <Card className="overflow-hidden hidden md:block">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-700"><tr><th className="px-6 py-3 font-semibold">Date</th><th className="px-6 py-3 font-semibold">Details</th><th className="px-6 py-3 font-semibold">Litres</th><th className="px-6 py-3 font-semibold">Price/L</th><th className="px-6 py-3 font-semibold">Total</th><th className="px-6 py-3 font-semibold">Action</th></tr></thead>
                <tbody>
                  {sales.map(s => (
                    <tr key={s.id} className="border-t border-slate-100"><td className="px-6 py-3">{s.date}</td><td className="px-6 py-3">
  <p className="font-medium text-slate-800">{s.buyer || '—'}</p>
  <p className="text-xs text-slate-500">By: {s.createdByName || 'System'}</p>
</td><td className="px-6 py-3">{s.litres}L</td><td className="px-6 py-3">KSH {s.pricePerLitre}</td><td className="px-6 py-3 font-bold text-emerald-600">KSH {s.total}</td><td className="px-6 py-3"><button onClick={() => deleteSale(s.id).then(loadData)} className="text-red-500 hover:text-red-700"><Trash2 size={16}/></button></td></tr>
                  ))}
                </tbody>
              </table>
            </Card>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-4">
              {sales.map(s => (
                <Card key={s.id} className="p-4 flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-slate-800">{s.date}</p>
                      <p className="text-sm text-slate-500">{s.buyer || 'Unknown Buyer'}</p>
                    </div>
                    <span className="font-bold text-emerald-600">KSH {s.total}</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-slate-100 pt-2 mt-1">
                    <p className="text-sm text-slate-600">{s.litres} L @ KSH {s.pricePerLitre}</p>
                    <button onClick={() => deleteSale(s.id).then(loadData)} className="text-red-500 p-2 bg-red-50 rounded-lg"><Trash2 size={16}/></button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* --- EXPENSES TAB --- */}
        {activeTab === 'expenses' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h3 className="text-xl font-bold text-slate-800">Expense Audit Log</h3>
              <button onClick={() => setShowExpenseForm(!showExpenseForm)} className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 w-full sm:w-auto justify-center"><Plus size={16} /> Add Expense</button>
            </div>
            {showExpenseForm && (
              <Card className="p-5 border-red-200 bg-red-50/50">
                <form onSubmit={handleExpenseSubmit} className="grid gap-4 md:grid-cols-4">
                  <label className="text-sm text-slate-700"><span className="mb-1 block font-medium">Date</span><input type="date" value={expenseForm.date} onChange={(e) => setExpenseForm({...expenseForm, date: e.target.value})} className="w-full rounded-xl border border-slate-300 px-3 py-2" required /></label>
                  <label className="text-sm text-slate-700"><span className="mb-1 block font-medium">Category</span><select value={expenseForm.category} onChange={(e) => setExpenseForm({...expenseForm, category: e.target.value})} className="w-full rounded-xl border border-slate-300 px-3 py-2"><option value="Feed">Feed</option><option value="Vet">Vet / Health</option><option value="Labor">Labor</option><option value="Equipment">Equipment</option><option value="Other">Other</option></select></label>
                  <label className="text-sm text-slate-700"><span className="mb-1 block font-medium">Amount (KSH)</span><input type="number" min="0" step="0.01" value={expenseForm.amount} onChange={(e) => setExpenseForm({...expenseForm, amount: e.target.value})} className="w-full rounded-xl border border-slate-300 px-3 py-2" required /></label>
                  <label className="text-sm text-slate-700"><span className="mb-1 block font-medium">Description</span><input value={expenseForm.description} onChange={(e) => setExpenseForm({...expenseForm, description: e.target.value})} className="w-full rounded-xl border border-slate-300 px-3 py-2" /></label>
                  <div className="md:col-span-4 flex justify-end"><button type="submit" className="rounded-xl bg-red-600 px-6 py-2 text-white hover:bg-red-700 w-full sm:w-auto">Save Expense</button></div>
                </form>
              </Card>
            )}

            {/* Desktop Table */}
            <Card className="overflow-hidden hidden md:block">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-700">
                  <tr>
                    <th className="px-6 py-3 font-semibold">Date / Time</th>
                    <th className="px-6 py-3 font-semibold">Added By</th>
                    <th className="px-6 py-3 font-semibold">Description</th>
                    <th className="px-6 py-3 font-semibold">Amount</th>
                    <th className="px-6 py-3 font-semibold">Status</th>
                    <th className="px-6 py-3 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map(e => (
                    <tr key={e.id} className={`border-t border-slate-100 ${e.status === 'pending' ? 'bg-amber-50/50' : e.status === 'rejected' ? 'bg-red-50/50' : ''}`}>
                      <td className="px-6 py-3">
                        <p className="font-medium text-slate-800">{e.date}</p>
                        <p className="text-xs text-slate-500">{e.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </td>
                      <td className="px-6 py-3 font-medium text-slate-700">{e.createdByName || 'System'}</td>
                      <td className="px-6 py-3 text-slate-600">{e.description || e.category}</td>
                      <td className="px-6 py-3 font-bold text-red-600">KSH {e.amount}</td>
                      <td className="px-6 py-3">
                        {e.status === 'approved' && <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded inline-flex items-center gap-1"><CheckCircle size={12}/> Approved</span>}
                        {e.status === 'pending' && <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded inline-flex items-center gap-1"><Clock size={12}/> Pending</span>}
                        {e.status === 'rejected' && <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded inline-flex items-center gap-1"><XCircle size={12}/> Rejected</span>}
                      </td>
                      <td className="px-6 py-3 flex gap-2">
                        {e.status === 'pending' && (
                          <>
                            <button onClick={() => handleApprove(e.id)} className="text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-2 py-1 rounded">Approve</button>
                            <button onClick={() => handleReject(e.id)} className="text-xs font-bold text-white bg-slate-400 hover:bg-slate-500 px-2 py-1 rounded">Reject</button>
                          </>
                        )}
                        {e.status === 'rejected' && (
                          <button onClick={() => handleApprove(e.id)} className="text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-2 py-1 rounded">Override & Approve</button>
                        )}
                        <button onClick={() => deleteExpense(e.id).then(loadData)} className="text-red-500 hover:text-red-700"><Trash2 size={16}/></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-4">
              {expenses.map(e => (
                <Card key={e.id} className={`p-4 flex flex-col gap-3 border-l-4 ${e.status === 'pending' ? 'border-l-amber-400' : e.status === 'rejected' ? 'border-l-red-500' : 'border-l-emerald-500'}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-slate-800">{e.date}</p>
                      <p className="text-xs text-slate-500">{e.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Added by {e.createdByName || 'System'}</p>
                    </div>
                    <span className="font-bold text-red-600">KSH {e.amount}</span>
                  </div>
                  
                  <div className="bg-slate-50 p-2 rounded-lg text-sm text-slate-700">
                    {e.description || e.category}
                  </div>

                  <div className="flex justify-between items-center mt-2">
                    <div>
                      {e.status === 'approved' && <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded inline-flex items-center gap-1"><CheckCircle size={12}/> Approved</span>}
                      {e.status === 'pending' && <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded inline-flex items-center gap-1"><Clock size={12}/> Pending</span>}
                      {e.status === 'rejected' && <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded inline-flex items-center gap-1"><XCircle size={12}/> Rejected</span>}
                    </div>
                    
                    <div className="flex gap-2">
                      {e.status === 'pending' && (
                        <>
                          <button onClick={() => handleApprove(e.id)} className="text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 rounded-lg">Approve</button>
                          <button onClick={() => handleReject(e.id)} className="text-xs font-bold text-white bg-slate-400 hover:bg-slate-500 px-3 py-1.5 rounded-lg">Reject</button>
                        </>
                      )}
                      {e.status === 'rejected' && (
                        <button onClick={() => handleApprove(e.id)} className="text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 rounded-lg">Override</button>
                      )}
                      <button onClick={() => deleteExpense(e.id).then(loadData)} className="text-red-500 p-1.5"><Trash2 size={18}/></button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}