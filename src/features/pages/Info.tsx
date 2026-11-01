import { BookOpen, Users, Droplets, Activity, HeartPulse, Coins, MessageSquare } from 'lucide-react'
import { Card } from '../../components/Card'

export function Info() {
  const guides = [
    {
      icon: Users,
      color: 'text-emerald-600 bg-emerald-100',
      title: 'Managing Cows',
      desc: 'Go to the Cows tab to register new animals. Click on any cow to see their full profile, upload a photo, and view their specific milk and health history.'
    },
    {
      icon: Droplets,
      color: 'text-blue-600 bg-blue-100',
      title: 'Logging Milk',
      desc: 'Go to Milk Records to log daily production. Select the cow, the session (AM/PM), and the litres produced. The dashboard will automatically update your daily totals.'
    },
    {
      icon: Activity,
      color: 'text-violet-600 bg-violet-100',
      title: 'Breeding & Alerts',
      desc: 'Log insemination dates in the Breeding tab. The Dashboard will automatically alert you when a cow is due for a heat check, pregnancy check, or dry-off.'
    },
    {
      icon: HeartPulse,
      color: 'text-rose-600 bg-rose-100',
      title: 'Health Records',
      desc: 'Record any illnesses, drugs administered, and withdrawal periods. Cows under withdrawal will be flagged with an amber warning so their milk is not sold.'
    },
    {
      icon: Coins,
      color: 'text-orange-600 bg-orange-100',
      title: 'Finances (Owner Only)',
      desc: 'Record milk sales and expenses to see your net profit. This tab is hidden from staff members to keep your financial data secure.'
    },
    {
      icon: MessageSquare,
      color: 'text-slate-600 bg-slate-100',
      title: 'Farm Chat',
      desc: 'Use the Chat tab to communicate instantly with other users on the farm. Look out for the red notification dot when a new message arrives.'
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