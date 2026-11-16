import { useState, useEffect } from 'react'
import { Plus, Trash2, Package, ArrowUpCircle, Clock, MinusCircle, Calculator, Scale, FileText, Send, CheckCircle2, History } from 'lucide-react'
import type { FeedItem, Expense, Cow, FeedAudit } from '../../lib/schemas'
import { Card } from '../../components/Card'
import { getAllFeed, addFeedItem, updateFeedQuantity, deleteFeedItem, logFeedUsage, getTodayFeedUsage, saveFeedAudit, getAllFeedAudits } from './feedService'
import { addExpense, getAllExpenses } from '../finances/financeService'
import { getAllCows } from '../cows/cowService'
import { useAuth } from '../auth/AuthContext'
import { supabase } from '../../lib/supabase'

export function FeedList() {
  const { profile } = useAuth()
  const farmId = profile?.farmId || ''
  const userName = profile?.name || 'Unknown User'
  const workerNum = profile?.workerNumber || 'N/A'
  const isOwner = profile?.role === 'owner' || profile?.role === 'manager'

  const [activeTab, setActiveTab] = useState<'inventory' | 'logs' | 'audit' | 'history'>('inventory')
  
  const [items, setItems] = useState<FeedItem[]>([])
  const [allExpenses, setAllExpenses] = useState<Expense[]>([])
  const [cows, setCows] = useState<Cow[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [todayUsage, setTodayUsage] = useState<any[]>([])
  const [auditHistory, setAuditHistory] = useState<FeedAudit[]>([])
  const [loading, setLoading] = useState(true)
  
  const [showForm, setShowForm] = useState(false)
  const [showLogForm, setShowLogForm] = useState(false)
  const [filterLowStock, setFilterLowStock] = useState(false)
  const [selectedUser, setSelectedUser] = useState(`${workerNum} - ${userName}`)
  const [physicalCounts, setPhysicalCounts] = useState<Record<string, string>>({})

  const [form, setForm] = useState({ name: '', category: 'Concentrate', quantity: '0', unit: 'Bags', reorderLevel: '5', costPerUnit: '0' })
  const [logForm, setLogForm] = useState({ feedItemId: '', cowId: 'bulk', quantity: '' })

  const loadData = async () => {
    if (!farmId) return
    try {
      setLoading(true)
      const [feedData, expensesData, cowsData, usersData, usageData, historyData] = await Promise.all([
        getAllFeed(farmId), getAllExpenses(farmId), getAllCows(farmId),
        supabase.from('profiles').select('id, name, worker_number').eq('farm_id', farmId),
        getTodayFeedUsage(farmId),
        getAllFeedAudits(farmId)
      ])
      setItems(feedData)
      setAllExpenses(expensesData)
      setCows(cowsData)
      if (usersData.data) setUsers(usersData.data)
      setTodayUsage(usageData)
      setAuditHistory(historyData)
    } catch (err) { console.error('Error loading feed:', err) } finally { setLoading(false) }
  }

  useEffect(() => { loadData() }, [farmId])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!form.name || !farmId) return
    if (items.some(i => i.name.toLowerCase() === form.name.trim().toLowerCase())) return alert(`"${form.name}" already exists.`)

    try {
      const qty = Number(form.quantity)
      const cost = Number(form.costPerUnit)
      const newItem = await addFeedItem({
        farmId, name: form.name, category: form.category, quantity: isOwner ? qty : 0, 
        unit: form.unit, reorderLevel: Number(form.reorderLevel), costPerUnit: cost
      })
      if (qty > 0 && cost > 0) {
        await addExpense({
          farmId, date: new Date().toISOString().slice(0, 10), category: 'Feed',
          amount: qty * cost, description: `Initial stock: ${qty} ${form.unit} of ${form.name}`,
          status: isOwner ? 'approved' : 'pending', feedItemId: newItem.id, quantityAdded: qty, createdByName: selectedUser
        })
      }
      setShowForm(false); setForm({ name: '', category: 'Concentrate', quantity: '0', unit: 'Bags', reorderLevel: '5', costPerUnit: '0' }); loadData()
    } catch (err) { alert('Failed to save feed item.') }
  }

  const handleLogFeed = async (event: React.FormEvent) => {
    event.preventDefault()
    const feedItem = items.find(i => i.id === logForm.feedItemId)
    if (!feedItem || !farmId) return
    const qty = Number(logForm.quantity)
    if (qty > feedItem.quantity) return alert(`Cannot log ${qty}. Only ${feedItem.quantity} left.`)

    try {
      const cowId = logForm.cowId === 'bulk' ? null : logForm.cowId
      await logFeedUsage(farmId, feedItem.id, cowId, qty, selectedUser, feedItem.quantity)
      setLogForm({ feedItemId: '', cowId: 'bulk', quantity: '' }); setShowLogForm(false); loadData()
    } catch (err) { alert('Failed to log feed usage.') }
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

  const handleSendReport = async () => {
    if (!farmId || !profile) return
    
    // Construct the details array to save to DB
    const auditDetails = usedItemsToday.map(item => {
      const physical = Number(physicalCounts[item.id] || 0)
      const expected = item.quantity
      return {
        itemName: item.name,
        expected: expected,
        physical: physical,
        variance: physical - expected,
        unit: item.unit
      }
    })

    let reportText = `📋 *END OF DAY FEED AUDIT*\nSubmitted by: ${selectedUser}\nDate: ${new Date().toLocaleDateString()}\n\n`
    
    auditDetails.forEach(detail => {
      reportText += `* ${detail.itemName}:\n   Expected: ${detail.expected} ${detail.unit}\n   Physical: ${detail.physical} ${detail.unit}\n   Variance: ${detail.variance !== 0 ? `⚠️ ${detail.variance} ${detail.unit}` : '✅ 0'}\n\n`
    })

    try {
      // 1. Save to DB
      await saveFeedAudit(farmId, selectedUser, auditDetails)
      
      // 2. Send to Chat
      await supabase.from('messages').insert({
        farm_id: farmId, sender_id: profile.id, sender_name: profile.name, content: reportText
      })

      alert('Audit report saved and sent to Owner via Farm Chat!')
      setPhysicalCounts({})
      loadData() // Refresh history
      setActiveTab('history') // Switch to history tab to show the result
    } catch (err) { alert('Failed to send report.') }
  }

  const usedItemsToday = Array.from(new Set(todayUsage.map(u => u.feed_item_id))).map(id => items.find(i => i.id === id)).filter(Boolean) as FeedItem[]
  const lowStockItems = items.filter(i => i.quantity <= i.reorderLevel)
  const displayedItems = filterLowStock ? lowStockItems : items
  const pendingRestocks = allExpenses.filter(e => e.category === 'Feed' && e.status === 'pending' && e.feedItemId)

  if (loading) return <div className="p-8 text-slate-500">Loading inventory...</div>

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-orange-600 font-bold">Inventory</p>
          <h3 className="mt-1 text-3xl font-bold text-slate-900">Feed & Stock</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          <select value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)} className="rounded-xl border border-slate-300 px-3 py-2 text-sm bg-white">
            {users.map(u => <option key={u.id} value={`${u.worker_number || 'N/A'} - ${u.name}`}>{u.worker_number || 'N/A'} - {u.name}</option>)}
          </select>
          <button onClick={() => { setShowLogForm(!showLogForm); setShowForm(false); }} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700"><MinusCircle size={16} /> Log Feeding</button>
          <button onClick={() => { setShowForm(!showForm); setShowLogForm(false); }} className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-orange-700"><Plus size={16} /> Add Feed</button>
        </div>
      </div>

      <div className="flex overflow-x-auto border-b border-slate-200">
        {[
          { id: 'inventory', label: 'Inventory', icon: Package },
          { id: 'logs', label: 'Today\'s Logs', icon: FileText },
          { id: 'audit', label: 'End of Day Audit', icon: Calculator },
          { id: 'history', label: 'Audit History', icon: History },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex items-center gap-2 px-6 py-3 text-sm font-bold border-b-2 capitalize transition-colors ${activeTab === tab.id ? 'border-orange-600 text-orange-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
            <tab.icon size={16} /> {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'inventory' && (
        <div className="space-y-6">
          {showForm && (
            <Card className="p-5">
              <h4 className="text-lg font-semibold mb-4">New Feed Item</h4>
              <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-3">
                <label className="text-sm text-slate-700"><span className="mb-1 block font-medium">Item Name</span><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-xl border border-slate-300 px-3 py-2" required /></label>
                <label className="text-sm text-slate-700"><span className="mb-1 block font-medium">Category</span><select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full rounded-xl border border-slate-300 px-3 py-2"><option value="Concentrate">Concentrate</option><option value="Forage">Forage</option><option value="Supplement">Supplement</option><option value="Other">Other</option></select></label>
                <label className="text-sm text-slate-700"><span className="mb-1 block font-medium">Unit</span><select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className="w-full rounded-xl border border-slate-300 px-3 py-2"><option value="Bags">Bags</option><option value="Kg">Kg</option><option value="Bales">Bales</option><option value="Litres">Litres</option></select></label>
                <label className="text-sm text-slate-700"><span className="mb-1 block font-medium">Initial Qty</span><input type="number" min="0" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} className="w-full rounded-xl border border-slate-300 px-3 py-2" required /></label>
                <label className="text-sm text-slate-700"><span className="mb-1 block font-medium">Reorder Level</span><input type="number" min="0" value={form.reorderLevel} onChange={(e) => setForm({ ...form, reorderLevel: e.target.value })} className="w-full rounded-xl border border-slate-300 px-3 py-2" required /></label>
                <label className="text-sm text-slate-700"><span className="mb-1 block font-medium">Cost / Unit (KSH)</span><input type="number" min="0" step="0.01" value={form.costPerUnit} onChange={(e) => setForm({ ...form, costPerUnit: e.target.value })} className="w-full rounded-xl border border-slate-300 px-3 py-2" required /></label>
                <div className="md:col-span-3 flex justify-end gap-3 pt-4"><button type="button" onClick={() => setShowForm(false)} className="rounded-xl border border-slate-300 px-6 py-2 text-slate-700">Cancel</button><button type="submit" className="rounded-xl bg-orange-600 px-6 py-2 text-white hover:bg-orange-700">Save Item</button></div>
              </form>
            </Card>
          )}

          {showLogForm && (
            <Card className="p-5 border-emerald-200 bg-emerald-50/50">
              <h4 className="text-lg font-semibold mb-4 text-emerald-900">Log Feed Consumption</h4>
              <form onSubmit={handleLogFeed} className="grid gap-4 md:grid-cols-4">
                <label className="text-sm text-slate-700"><span className="mb-1 block font-medium">Feed Item</span><select value={logForm.feedItemId} onChange={(e) => setLogForm({...logForm, feedItemId: e.target.value})} className="w-full rounded-xl border border-slate-300 px-3 py-2" required><option value="">Select feed...</option>{items.map(i => <option key={i.id} value={i.id}>{i.name} ({i.quantity} {i.unit} left)</option>)}</select></label>
                <label className="text-sm text-slate-700"><span className="mb-1 block font-medium">Target</span><select value={logForm.cowId} onChange={(e) => setLogForm({...logForm, cowId: e.target.value})} className="w-full rounded-xl border border-slate-300 px-3 py-2"><option value="bulk">Calves / Bulk Feeding</option>{cows.filter(c => c.status !== 'calf').map(c => <option key={c.id} value={c.id}>{c.name || c.tagId}</option>)}</select></label>
                <label className="text-sm text-slate-700"><span className="mb-1 block font-medium">Quantity Used</span><input type="number" min="0" step="0.1" value={logForm.quantity} onChange={(e) => setLogForm({...logForm, quantity: e.target.value})} placeholder="e.g. 5" className="w-full rounded-xl border border-slate-300 px-3 py-2" required /></label>
                <div className="flex items-end"><button type="submit" className="w-full rounded-xl bg-emerald-600 px-6 py-2 text-white hover:bg-emerald-700 h-[42px]">Deduct from Stock</button></div>
              </form>
            </Card>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <Card className={`p-5 cursor-pointer transition-all ${filterLowStock ? 'ring-2 ring-red-500 bg-red-50' : 'hover:border-red-300'}`} onClick={() => setFilterLowStock(!filterLowStock)}>
              <p className="text-sm text-slate-500 font-medium flex items-center justify-between">Low Stock {filterLowStock && <span className="text-xs text-red-600 bg-red-100 px-2 py-0.5 rounded">Filtered</span>}</p>
              <p className="mt-2 text-3xl font-bold text-red-600">{lowStockItems.length}</p>
            </Card>
            <Card className="p-5"><p className="text-sm text-slate-500 font-medium">Total Items</p><p className="mt-2 text-3xl font-bold">{items.length}</p></Card>
          </div>

          <Card className="overflow-hidden hidden md:block">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 text-slate-700"><tr><th className="px-6 py-4 font-semibold">Item</th><th className="px-6 py-4 font-semibold">Stock Level</th><th className="px-6 py-4 font-semibold">Action</th><th className="px-6 py-4 font-semibold">Value</th></tr></thead>
                <tbody>
                  {displayedItems.map((item) => {
                    const isLow = item.quantity <= item.reorderLevel;
                    const pendingReq = pendingRestocks.find(r => r.feedItemId === item.id);
                    return (
                      <tr key={item.id} className={`border-t border-slate-100 ${isLow ? 'bg-red-50/50' : 'hover:bg-slate-50'}`}>
                        <td className="px-6 py-4"><p className="font-bold text-slate-800 flex items-center gap-2"><Package size={16} className={isLow ? 'text-red-500' : 'text-slate-400'} />{item.name}</p><p className="text-slate-500 text-xs">Last restock: {item.lastRestocked || 'Never'}</p></td>
                        <td className="px-6 py-4"><div className="flex items-baseline gap-1"><span className={`text-xl font-bold ${isLow ? 'text-red-600' : 'text-emerald-600'}`}>{item.quantity}</span><span className="text-slate-500 text-xs">{item.unit}</span></div>{pendingReq ? <div className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded"><Clock size={10} /> +{pendingReq.quantityAdded} pending</div> : <p className="text-xs text-slate-400">Alert at {item.reorderLevel}</p>}</td>
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

          <div className="md:hidden space-y-4">
            {displayedItems.map((item) => {
              const isLow = item.quantity <= item.reorderLevel;
              const pendingReq = pendingRestocks.find(r => r.feedItemId === item.id);
              return (
                <Card key={item.id} className={`p-4 flex flex-col gap-3 ${isLow ? 'border-l-4 border-l-red-500 bg-red-50/30' : ''}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-slate-800 flex items-center gap-2"><Package size={16} className={isLow ? 'text-red-500' : 'text-slate-400'} />{item.name}</p>
                      <p className="text-xs text-slate-500">Last restock: {item.lastRestocked || 'Never'}</p>
                    </div>
                    <span className={`text-xl font-bold ${isLow ? 'text-red-600' : 'text-emerald-600'}`}>{item.quantity} <span className="text-sm text-slate-500">{item.unit}</span></span>
                  </div>
                  {pendingReq && <div className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded w-max"><Clock size={10} className="inline mr-1"/> +{pendingReq.quantityAdded} pending</div>}
                  <div className="flex justify-between items-center border-t border-slate-100 pt-3 mt-1">
                    <p className="font-bold text-slate-700 text-sm">KSH {(item.quantity * item.costPerUnit).toLocaleString()}</p>
                    <div className="flex gap-2">
                      <button onClick={() => { const amount = window.prompt(`How many ${item.unit} of ${item.name} are you adding?`); if (amount) handleRestock(item, Number(amount)); }} className="inline-flex items-center gap-1 text-xs font-bold bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg"><ArrowUpCircle size={14} /> Restock</button>
                      {isOwner && (<button onClick={() => handleDelete(item.id)} className="text-slate-400 p-1.5 bg-slate-100 rounded-lg"><Trash2 size={16} /></button>)}
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {activeTab === 'logs' && (
        <>
          <Card className="overflow-hidden hidden md:block">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 text-slate-700">
                  <tr><th className="px-6 py-3 font-semibold">Feed Item</th><th className="px-6 py-3 font-semibold">Target</th><th className="px-6 py-3 font-semibold">Quantity Used</th><th className="px-6 py-3 font-semibold">Recorded By</th></tr>
                </thead>
                <tbody>
                  {todayUsage.length > 0 ? todayUsage.map((log, i) => {
                    const feedItem = items.find(f => f.id === log.feed_item_id)
                    const cow = cows.find(c => c.id === log.cow_id)
                    return (
                      <tr key={i} className="border-t border-slate-100 hover:bg-slate-50">
                        <td className="px-6 py-3 font-medium text-slate-800">{feedItem?.name || 'Unknown'}</td>
                        <td className="px-6 py-3">{cow ? cow.name || cow.tagId : 'Calves / Bulk'}</td>
                        <td className="px-6 py-3 font-bold text-orange-600">-{log.quantity_used} {feedItem?.unit}</td>
                        <td className="px-6 py-3 text-xs text-slate-500">{log.recorded_by}</td>
                      </tr>
                    )
                  }) : (
                    <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-500">No feed logged today.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          <div className="md:hidden space-y-4">
            {todayUsage.length > 0 ? todayUsage.map((log, i) => {
              const feedItem = items.find(f => f.id === log.feed_item_id)
              const cow = cows.find(c => c.id === log.cow_id)
              return (
                <Card key={i} className="p-4 flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-slate-800">{feedItem?.name || 'Unknown'}</p>
                      <p className="text-sm text-slate-500">Target: {cow ? cow.name || cow.tagId : 'Calves / Bulk'}</p>
                    </div>
                    <p className="font-bold text-orange-600">-{log.quantity_used} {feedItem?.unit}</p>
                  </div>
                  <p className="text-xs text-slate-400 border-t border-slate-100 pt-2 mt-1">By: {log.recorded_by}</p>
                </Card>
              )
            }) : (
              <Card className="p-6 text-center text-slate-500">No feed logged today.</Card>
            )}
          </div>
        </>
      )}

      {activeTab === 'audit' && (
        <Card className="p-6 border-slate-200">
          <div className="mb-6 border-b border-slate-100 pb-4">
            <h3 className="text-xl font-bold flex items-center gap-2 text-slate-800"><Calculator size={22} className="text-orange-600" /> End of Day Feed Audit</h3>
            <p className="text-slate-500 text-sm mt-1">Verify the physical stock left in the store against the expected system stock.</p>
          </div>
          
          {usedItemsToday.length > 0 ? (
            <div className="space-y-4">
              {usedItemsToday.map(item => {
                const physical = Number(physicalCounts[item.id] || 0)
                const expected = item.quantity
                const variance = physical - expected
                const hasValue = physicalCounts[item.id] !== undefined && physicalCounts[item.id] !== ''
                
                return (
                  <div key={item.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 grid grid-cols-1 md:grid-cols-4 items-center gap-4">
                    <div>
                      <p className="font-bold text-slate-800 text-lg">{item.name}</p>
                      <p className="text-xs text-slate-500">Expected System Stock: {expected} {item.unit}</p>
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 block mb-1 font-medium">Physical Count</label>
                      <div className="flex items-center gap-2">
                        <input type="number" value={physicalCounts[item.id] || ''} onChange={e => setPhysicalCounts({...physicalCounts, [item.id]: e.target.value})} placeholder="0" className="w-24 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm font-bold" />
                        <span className="text-sm text-slate-500 font-medium">{item.unit}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 block mb-1 font-medium">Variance</p>
                      {hasValue ? (
                        <span className={`inline-flex items-center gap-1 text-sm font-bold px-2 py-1 rounded-lg ${variance === 0 ? 'text-emerald-700 bg-emerald-100' : 'text-red-700 bg-red-100'}`}>
                          {variance === 0 ? <><CheckCircle2 size={14}/> Match</> : `⚠️ ${variance > 0 ? '+' : ''}${variance} ${item.unit}`}
                        </span>
                      ) : <span className="text-sm text-slate-400">-</span>}
                    </div>
                    <div className="text-right">
                      <Scale size={24} className="text-slate-300 inline-block" />
                    </div>
                  </div>
                )
              })}
              
              <div className="flex justify-end mt-6">
                <button onClick={handleSendReport} className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-6 py-3 text-sm font-bold text-white hover:bg-orange-700 transition-colors shadow-sm">
                  <Send size={16} /> Send & Save Audit Report
                </button>
              </div>
            </div>
          ) : (
            <p className="text-slate-500 text-center py-10">No feed has been used today. Audit is not required.</p>
          )}
        </Card>
      )}

      {activeTab === 'history' && (
        <div className="space-y-6">
          {auditHistory.length > 0 ? (
            auditHistory.map(audit => (
              <Card key={audit.id} className="p-6">
                <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <FileText size={18} className="text-orange-600" /> Audit Report
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">Date: {audit.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-500">Audited by</p>
                    <p className="font-bold text-slate-800">{audit.auditorName}</p>
                  </div>
                </div>
                
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {audit.details.map((detail, i) => (
                    <div key={i} className={`p-3 rounded-xl border ${detail.variance === 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
                      <p className="font-bold text-slate-800 text-sm">{detail.itemName}</p>
                      <div className="flex justify-between items-center text-xs mt-2">
                        <span className="text-slate-500">Expected: {detail.expected} {detail.unit}</span>
                        <span className="text-slate-500">Actual: {detail.physical} {detail.unit}</span>
                      </div>
                      <p className={`mt-2 text-sm font-bold text-center ${detail.variance === 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                        {detail.variance === 0 ? '✅ Match' : `⚠️ Variance: ${detail.variance > 0 ? '+' : ''}${detail.variance} ${detail.unit}`}
                      </p>
                    </div>
                  ))}
                </div>
              </Card>
            ))
          ) : (
            <Card className="p-10 text-center text-slate-500">
              <History size={48} className="mx-auto text-slate-300 mb-4" />
              <h3 className="text-lg font-bold text-slate-800 mb-1">No Audit History</h3>
              <p>When you complete an End of Day Audit, the report will be saved here permanently.</p>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}