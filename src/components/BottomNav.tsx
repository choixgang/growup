import { NavLink, useLocation } from 'react-router-dom'
import { CalendarDays, Rows3, Settings2 } from 'lucide-react'

const items = [
  { to: '/', label: 'Monthly', icon: CalendarDays, match: (p: string) => p === '/' },
  { to: '/week', label: 'Weekly', icon: Rows3, match: (p: string) => p.startsWith('/week') },
  { to: '/settings', label: 'Settings', icon: Settings2, match: (p: string) => p.startsWith('/settings') },
]

export default function BottomNav() {
  const { pathname } = useLocation()
  if (pathname.startsWith('/export')) return null
  return (
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper/95 backdrop-blur">
      <div className="mx-auto flex max-w-[520px] justify-around px-4 pt-2 pb-2">
        {items.map(({ to, label, icon: Icon, match }) => {
          const active = match(pathname)
          return (
            <NavLink
              key={to}
              to={to}
              className={`flex min-w-[72px] flex-col items-center gap-0.5 rounded-xl px-3 py-1 ${
                active ? 'text-ink' : 'text-ink-faint'
              }`}
            >
              <Icon size={20} strokeWidth={1.5} />
              <span className={`title-serif text-[15px] ${active ? 'italic' : ''}`}>{label}</span>
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
