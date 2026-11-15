import { useState, useEffect } from 'react'
import { Plus, Trash2, Package, ArrowUpCircle, Clock, XCircle } from 'lucide-react'
import type { FeedItem, Expense } from '../../lib/schemas'
import { Card } from '../../components/Card'
import { getAllFeed, addFeedItem, updateFeedQuantity, deleteFeedItem } from './feedService'
import { addExpense, getAllExpenses } from '../finances/financeService'
import { useAuth } from '../auth/AuthContext'
import { supabase } from '../../lib/supabase'

export function FeedList() {
  const { profile } = useAuth()
  const farmId = profile?.farmId || ''
  const userName = profile?.name || 'Unknown User'
  const workerNum = profile?.workerNumber || 'N/A'
  const isOwner = profile?.role === 'owner' || profile?.role === 'manager'

  const [items, setItems] = useState<FeedItem[]>([])
  const [allExpenses, setAllExpenses] = useState<Expense[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [filterLowStock, setFilterLowStock] = useState(false)
  
  const [selectedUser, setSelectedUser] = useState(`${workerNum} - ${userName}`)

  const [form, setForm] = useState({
    name: '', category: 'Concentrate', quantity: '0', unit: 'Bags', reorderLevel: '5', costPerUnit: '0'
  })

  const loadData = async () => {
    if (!farmId) return
    try {
      setLoading(true)
      const [feedData, expensesData, usersData] = await Promise.all([
        getAllFeed(farmId),
        getAllExpenses(farmId),
        supabase.from('profiles').select('id, name, worker_number').eq('farm_id', farmId)
      ])
      setItems(feedData)
      setAllExpenses(expensesData)
      if (usersData.data) setUsers(usersData.data)
    } catch (err) {
      console.error('Error loading feed:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [farmId])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!form.name || !farmId) return

    const exists = items.some(i => i.name.toLowerCase() === form.name.trim().toLowerCase())
    if (exists) {
      alert(`"${form.name}" already exists. Please use "Restock" on the table.`)
      return
    }

    try {
      const qty = Number(form.quantity)
      const cost = Number(form.costPerUnit)

      const newItem = await addFeedItem({
        farmId, name: form.name, category: form.category,
        quantity: isOwner ? qty : 0, 
        unit: form.unit, reorderLevel: Number(form.reorderLevel), costPerUnit: cost
      })

      if (qty > 0 && cost > 0) {
        await addExpense({
          farmId, date: new Date().toISOString().slice(0, 10), category: 'Feed',
          amount: qty * cost, description: `Initial stock: ${qty} ${form.unit} of ${form.name}`,
          status: isOwner ? 'approved' : 'pending', feedItemId: newItem.id, quantityAdded: qty,
          createdByName: selectedUser
        })
      }

      setShowForm(false)
      setForm({ name: '', category: 'Concentrate', quantity: '0', unit: 'Bags', reorderLevel: '5', costPerUnit: '0' })
      loadData()
    } catch (err) { alert('Failed to save feed item.') }
  }

  const handleRestock = async (item: FeedItem, addedAmount: number) => {
    if (addedAmount <= 0) return
    try {
      const totalCost = addedAmount * item.costPerUnit

      if (isOwner) {
        await updateFeedQuantity(item.id, item.quantity + addedAmount)
        await addExpense({
          farmId, date: new Date().toISOString().slice(0, 10), category: 'Feed',
          amount: totalCost, description: `Restocked ${addedAmount} ${item.unit} of ${item.name}`,
          status: 'approved', feedItemId: item.id, quantityAdded: addedAmount, createdByName: selectedUser
        })
      } else {
        await addExpense({
          farmId, date: new Date().toISOString().slice(0, 10), category: 'Feed',
          amount: totalCost, description: `Restock request: ${addedAmount} ${item.unit} of ${item.name}`,
          status: 'pending', feedItemId: item.id, quantityAdded: addedAmount, createdByName: selectedUser
        })
        alert('Restock sent for Owner approval.')
      }
      loadData()
    } catch (err) { alert('Failed to process restock.') }
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this feed item?')) {
      try { await deleteFeedItem(id); loadData() } catch (err) { console.error(err) }
    }
  }

  const lowStockItems = items.filter(i => i.quantity <= i.reorderLevel)
  const displayedItems = filterLowStock ? lowStockItems : items
  const rejectedRequests = allExpenses.filter(e => e.status === 'rejected' && e.category === 'Feed')
  const pendingRestocks = allExpenses.filter(e => e.category === 'Feed' && e.status === 'pending' && e.feedItemId)
  const myRejectedRequests = rejectedRequests.filter(e => e.createdByName === selectedUser)
  const totalInventoryValue = items.reduce((sum, i) => sum + (i.quantity * i.costPerUnit), 0)

  if (loading) return <div className="p-8 text-slate-500">Loading inventory...</div>

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-orange-600 font-bold">Inventory</p>
          <h3 className="mt-1 text-3xl font-bold text-slate-900">Feed & Stock</h3>
        </div>
        
        <div className="flex gap-2">
          <select value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)} className="rounded-xl border border-slate-300 px-3 py-2 text-sm bg-white">
            {users.map(u => (
              <option key={u.id} value={`${u.worker_number || 'N/A'} - ${u.name}`}>
                {u.worker_number || 'N/A'} - {u.name}
              </option>
            ))}
          </select>
          
          <button type="button" onClick={() => setShowForm(!showForm)} className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-orange-700">
            <Plus size={16} /> {showForm ? 'Close' : 'Add Feed'}
          </button>
        </div>
      </div>

      {myRejectedRequests.length > 0 && (
        <Card className="border-red-300 bg-red-50 p-4">
          <div className="flex items-start gap-3">
            <XCircle className="text-red-600 shrink-0 mt-0.5" size={20} />
            <div>
              <p className="font-semibold text-red-900">Update Rejected by Owner</p>
              <p className="mt-1 text-sm text-red-800">Your recent restock request(s) were not approved. Review with the owner.</p>
            </div>
          </div>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-5"><p className="text-sm text-slate-500 font-medium">Total Items</p><p className="mt-2 text-3xl font-bold">{items.length}</p></Card>
        <Card className={`p-5 cursor-pointer transition-all ${filterLowStock ? 'ring-2 ring-red-500 bg-red-50' : 'hover:border-red-300'}`} onClick={() => setFilterLowStock(!filterLowStock)}>
          <p className="text-sm text-slate-500 font-medium flex items-center justify-between">
            Low Stock {filterLowStock && <span className="text-xs text-red-600 bg-red-100 px-2 py-0.5 rounded">Filtered</span>}
          </p>
          <p className="mt-2 text-3xl font-bold text-red-600">{lowStockItems.length}</p>
        </Card>
        <Card className="p-5"><p className="text-sm text-slate-500 font-medium">Est. Value</p><p className="mt-2 text-3xl font-bold text-emerald-700">KSH {totalInventoryValue.toLocaleString()}</p></Card>
      </div>

      {showForm && (
        <Card className="p-5">
          <h4 className="text-lg font-semibold mb-4">New Feed Item</h4>
          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-3">
            {/* ... existing fields ... */}
            <label className="text-sm text-slate-700"><span className="mb-1 block font-medium">Item Name</span><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Dairy Meal" className="w-full rounded-xl border border-slate-300 px-3 py-2" required /></label>
            <label className="text-sm text-slate-700"><span className="mb-1 block font-medium">Category</span><select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full rounded-xl border border-slate-300 px-3 py-2"><option value="Concentrate">Concentrate</option><option value="Forage">Forage</option><option value="Supplement">Supplement</option><option value="Other">Other</option></select></label>
            <label className="text-sm text-slate-700"><span className="mb-1 block font-medium">Unit</span><select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className="w-full rounded-xl border border-slate-300 px-3 py-2"><option value="Bags">Bags</option><option value="Kg">Kg</option><option value="Bales">Bales</option><option value="Litres">Litres</option></select></label>
            <label className="text-sm text-slate-700"><span className="mb-1 block font-medium">Initial Qty</span><input type="number" min="0" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} className="w-full rounded-xl border border-slate-300 px-3 py-2" required /></label>
            <label className="text-sm text-slate-700"><span className="mb-1 block font-medium">Reorder Level</span><input type="number" min="0" value={form.reorderLevel} onChange={(e) => setForm({ ...form, reorderLevel: e.target.value })} className="w-full rounded-xl border border-slate-300 px-3 py-2" required /></label>
            <label className="text-sm text-slate-700"><span className="mb-1 block font-medium">Cost / Unit (KSH)</span><input type="number" min="0" step="0.01" value={form.costPerUnit} onChange={(e) => setForm({ ...form, costPerUnit: e.target.value })} className="w-full rounded-xl border border-slate-300 px-3 py-2" required /></label>
            <div className="md:col-span-3 flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button type="button" onClick={() => setShowForm(false)} className="rounded-xl border border-slate-300 px-6 py-2 text-slate-700">Cancel</button>
              <button type="submit" className="rounded-xl bg-orange-600 px-6 py-2 text-white hover:bg-orange-700">Save Item</button>
            </div>
          </form>
        </Card>
      )}

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-700">
              <tr><th className="px-6 py-4 font-semibold">Item</th><th className="px-6 py-4 font-semibold">Stock Level</th><th className="px-6 py-4 font-semibold">Action</th><th className="px-6 py-4 font-semibold">Value</th></tr>
            </thead>
            <tbody>
              {displayedItems.map((item) => {
                const isLow = item.quantity <= item.reorderLevel;
                const pendingReq = pendingRestocks.find(r => r.feedItemId === item.id);
                return (
                  <tr key={item.id} className={`border-t border-slate-100 ${isLow ? 'bg-red-50/50' : 'hover:bg-slate-50'}`}>
                    <td className="px-6 py-4"><p className="font-bold text-slate-800 flex items-center gap-2"><Package size={16} className={isLow ? 'text-red-500' : 'text-slate-400'} />{item.name}</p><p className="text-slate-500 text-xs">Last restock: {item.lastRestocked || 'Never'}</p></td>
                    <td className="px-6 py-4">
                      <div className="flex items-baseline gap-1"><span className={`text-xl font-bold ${isLow ? 'text-red-600' : 'text-emerald-600'}`}>{item.quantity}</span><span className="text-slate-500 text-xs">{item.unit}</span></div>
                      {pendingReq ? <div className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded"><Clock size={10} /> +{pendingReq.quantityAdded} pending</div> : <p className="text-xs text-slate-400">Alert at {item.reorderLevel}</p>}
                    </td>
                    <td className="px-6 py-4"><button onClick={() => { const amount = window.prompt(`How many ${item.unit} of ${item.name} are you adding?`); if (amount) handleRestock(item, Number(amount)); }} className="inline-flex items-center gap-1 text-xs font-bold bg-emerald-100 text-emerald-700 hover:bg-emerald-200 px-3 py-1.5 rounded-lg"><ArrowUpCircle size={14} /> Restock</button></td>
                    <td className="px-6 py-4 font-bold text-slate-700">KSH {(item.quantity * item.costPerUnit).toLocaleString()}</td>
                    <td className="px-6 py-4">{isOwner && (<button onClick={() => handleDelete(item.id)} className="text-slate-400 hover:text-red-600"><Trash2 size={16} /></button>)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {rejectedRequests.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-bold text-red-800 flex items-center gap-2 mb-4"><XCircle size={20} /> Rejected Restock Requests</h3>
          <Card className="border-red-200">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-red-50 text-red-900"><tr><th className="px-6 py-3 font-semibold">Date</th><th className="px-6 py-3 font-semibold">Added By</th><th className="px-6 py-3 font-semibold">Details</th></tr></thead>
              <tbody>
                {rejectedRequests.map(r => (
                  <tr key={r.id} className="border-t border-red-100 bg-white">
                    <td className="px-6 py-3 text-slate-700">{r.date}</td>
                    <td className="px-6 py-3 font-medium text-slate-800">{r.createdByName || 'System'}</td>
                    <td className="px-6 py-3 text-slate-600">{r.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      )}
    </div>
  )
}