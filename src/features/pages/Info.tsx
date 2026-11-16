import { BookOpen, Users, Droplets, Activity, HeartPulse, Coins, MessageSquare, Package } from 'lucide-react'
import { Card } from '../../components/Card'

export function Info() {
  const guides = [
    {
      icon: Users,
      color: 'text-emerald-600 bg-emerald-100',
      title: 'Managing Cows & Calves',
      desc: 'Go to the Cows tab to register animals. You can link a new calf to its mother during registration. Click "View Calves" on any cow to see her lineage, or go to the dedicated Calves tab.'
    },
    {
      icon: Droplets,
      color: 'text-blue-600 bg-blue-100',
      title: 'Milk Records & Sales',
      desc: 'Log daily production in the Milk tab. Staff can also record End of Day Sales here, which are sent to the Owner for approval before they count towards income.'
    },
    {
      icon: Activity,
      color: 'text-violet-600 bg-violet-100',
      title: 'Breeding & Maternity',
      desc: 'Log AI dates to automatically calculate calving dates. The Maternity Pen automatically pulls in cows that are 60 days from calving so you know when to Dry Off, and 21 days from calving for Steaming.'
    },
    {
      icon: HeartPulse,
      color: 'text-rose-600 bg-rose-100',
      title: 'Health Records',
      desc: 'Record illnesses, drugs, and withdrawal periods. If you enter a Vet cost, the system automatically logs it as a pending expense for the Owner.'
    },
    {
      icon: Package,
      color: 'text-amber-600 bg-amber-100',
      title: 'Feed & Stock',
      desc: 'Track feed inventory. Use the "Log Feeding" button to deduct stock (either for a specific cow or for the whole calf pen). Use the End of Day Audit to report any missing stock.'
    },
    {
      icon: Coins,
      color: 'text-orange-600 bg-orange-100',
      title: 'Finances (Owner Only)',
      desc: 'Record milk sales and expenses to see your net profit. This tab is hidden from staff members. Owners must approve pending expenses logged by staff.'
    },
    {
      icon: MessageSquare,
      color: 'text-slate-600 bg-slate-100',
      title: 'Farm Chat',
      desc: 'Use the Chat tab to communicate instantly with other users. End of Day Feed Audit reports are automatically sent here for the Owner to review.'
    }
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-10">
      <div className="flex items-center gap-4 border-b border-slate-200 pb-6">
        <div className="bg-orange-100 p-3 rounded-2xl">
          <BookOpen size={28} className="text-orange-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">System Guide</h1>
          <p className="text-slate-500 mt-1">Everything you need to know to run your farm smoothly.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {guides.map((g, i) => (
          <Card key={i} className="p-6 flex gap-4 items-start">
            <div className={`p-3 rounded-xl shrink-0 ${g.color}`}>
              <g.icon size={24} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg">{g.title}</h3>
              <p className="text-slate-600 text-sm mt-1 leading-relaxed">{g.desc}</p>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-6 bg-slate-50 border-slate-200">
        <h3 className="font-bold text-slate-800 text-lg mb-2">Need Help?</h3>
        <p className="text-slate-600 text-sm">
          If you encounter any bugs, have suggestions for new features, or need technical support, please contact the system administrator at <a href="mailto:support@dairymanager.com" className="text-orange-600 font-semibold hover:underline">support@dairymanager.com</a>.
        </p>
      </Card>
    </div>
  )
}