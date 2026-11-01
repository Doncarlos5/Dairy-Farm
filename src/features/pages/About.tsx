import { Activity } from 'lucide-react'
import { FaXTwitter, FaFacebookF, FaInstagram, FaLinkedinIn, FaGithub, FaGlobe } from 'react-icons/fa6'

export function About() {
  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-10">
      
      {/* Hero */}
      <div className="text-center space-y-4 py-8 flex flex-col items-center">
        <div className="flex h-24 w-24 items-center justify-center rounded-[2rem] bg-[#0a2e23] shadow-2xl shadow-emerald-900/20">
          <Activity size={48} className="text-orange-500" />
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">Dairy Manager</h1>
        <p className="text-lg text-slate-500 max-w-2xl mx-auto text-center leading-relaxed">
          The modern, cloud-based operating system for dairy farms. Built to help you manage your herd, track milk production, monitor health, and maximize profits.
        </p>
      </div>

      {/* Mission Statement */}
      <div className="bg-white p-10 rounded-[2rem] shadow-sm border border-slate-100 text-center flex flex-col items-center space-y-4">
        <h2 className="text-2xl font-bold text-slate-800">Our Mission</h2>
        <p className="text-slate-600 leading-relaxed max-w-3xl mx-auto text-center">
          We believe that farmers deserve software that is as hard-working as they are. We built Dairy Manager to replace messy paper records with a clean, instant, and secure digital system. Whether you are managing 5 cows or 500, our goal is to give you clarity on your farm's performance so you can make better decisions every single day.
        </p>
      </div>

      {/* Connect with Us */}
      <div className="bg-[#0a2e23] p-12 rounded-[2rem] shadow-2xl flex flex-col items-center text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Connect with Us</h2>
        <p className="text-slate-300 mb-8 max-w-md mx-auto">Follow our journey, get support, and see the latest updates from the farm.</p>
        
        <div className="flex flex-wrap justify-center gap-4">
          <a href="https://your-website.com" target="_blank" rel="noreferrer" className="group flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-slate-300 transition-all duration-300 hover:bg-orange-500 hover:text-white hover:-translate-y-2 hover:shadow-lg hover:shadow-orange-500/30" title="Website">
            <FaGlobe size={24} className="transition-transform group-hover:scale-110" />
          </a>
          
          <a href="https://twitter.com" target="_blank" rel="noreferrer" className="group flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-slate-300 transition-all duration-300 hover:bg-black hover:text-white hover:-translate-y-2 hover:shadow-lg hover:shadow-black/50" title="X (Twitter)">
            <FaXTwitter size={22} className="transition-transform group-hover:scale-110" />
          </a>
          
          <a href="https://facebook.com" target="_blank" rel="noreferrer" className="group flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-slate-300 transition-all duration-300 hover:bg-[#1877F2] hover:text-white hover:-translate-y-2 hover:shadow-lg hover:shadow-[#1877F2]/30" title="Facebook">
            <FaFacebookF size={22} className="transition-transform group-hover:scale-110" />
          </a>
          
          <a href="https://instagram.com" target="_blank" rel="noreferrer" className="group flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-slate-300 transition-all duration-300 hover:bg-gradient-to-tr hover:from-[#f09433] hover:via-[#dc2743] hover:to-[#bc1888] hover:text-white hover:-translate-y-2 hover:shadow-lg hover:shadow-[#dc2743]/30" title="Instagram">
            <FaInstagram size={24} className="transition-transform group-hover:scale-110" />
          </a>
          
          <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="group flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-slate-300 transition-all duration-300 hover:bg-[#0A66C2] hover:text-white hover:-translate-y-2 hover:shadow-lg hover:shadow-[#0A66C2]/30" title="LinkedIn">
            <FaLinkedinIn size={22} className="transition-transform group-hover:scale-110" />
          </a>
          
          <a href="https://github.com" target="_blank" rel="noreferrer" className="group flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-slate-300 transition-all duration-300 hover:bg-[#333] hover:text-white hover:-translate-y-2 hover:shadow-lg hover:shadow-[#333]/50" title="GitHub">
            <FaGithub size={24} className="transition-transform group-hover:scale-110" />
          </a>
        </div>
      </div>

      <div className="text-center text-sm text-slate-400 pt-4">
        <p>© {new Date().getFullYear()} Dairy Manager. All rights reserved.</p>
        <p className="mt-1">Version 1.0.0</p>
      </div>
    </div>
  )
}