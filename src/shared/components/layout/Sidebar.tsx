import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Building2,
  Users,
  MessageSquare,
  FlaskConical,
  CreditCard,
  Truck,
  Globe,
  BarChart3,
  Mail,
  type LucideIcon,
} from 'lucide-react'

interface NavItem {
  to: string
  label: string
  icon: LucideIcon
}

interface NavGroup {
  title: string
  items: NavItem[]
}

const navigation: (NavItem | NavGroup)[] = [
  { to: '/', label: 'Overview', icon: LayoutDashboard },
  {
    title: 'LoadMind Tracker',
    items: [
      { to: '/tracker/companies', label: 'Companies', icon: Building2 },
      { to: '/tracker/users', label: 'Users', icon: Truck },
      { to: '/tracker/subscriptions', label: 'Subscriptions', icon: BarChart3 },
      { to: '/demo-requests', label: 'Demo Requests', icon: MessageSquare },
    ],
  },
  {
    title: '3D Load Planning',
    items: [
      { to: '/planning/users', label: 'Users', icon: Users },
      { to: '/planning/trial', label: 'Trial Management', icon: FlaskConical },
      { to: '/planning/subscriptions', label: 'Subscriptions', icon: BarChart3 },
    ],
  },
  {
    title: 'Website',
    items: [
      { to: '/website/users', label: 'Users', icon: Globe },
    ],
  },
  {
    title: 'Shared',
    items: [
      { to: '/payments', label: 'Payments', icon: CreditCard },
      { to: '/broadcasts', label: 'Email Broadcast', icon: Mail },
    ],
  },
]

function NavLinkItem({ to, label, icon: Icon }: NavItem) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
          isActive
            ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400'
            : 'text-surface-600 hover:bg-surface-100 hover:text-surface-900 dark:text-surface-400 dark:hover:bg-surface-800 dark:hover:text-surface-200'
        }`
      }
    >
      <Icon size={20} />
      {label}
    </NavLink>
  )
}

function isNavGroup(item: NavItem | NavGroup): item is NavGroup {
  return 'title' in item
}

export function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-surface-200 bg-white dark:border-surface-700 dark:bg-surface-900">
      <div className="flex h-16 items-center gap-3 border-b border-surface-200 px-6 dark:border-surface-700">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-sm font-bold text-white">
          LM
        </div>
        <span className="text-lg font-semibold text-surface-900 dark:text-surface-100">
          LoadMind Admin
        </span>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {navigation.map((item, i) =>
          isNavGroup(item) ? (
            <div key={item.title} className={i > 0 ? 'pt-4' : ''}>
              <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-surface-400 dark:text-surface-500">
                {item.title}
              </p>
              <div className="space-y-1">
                {item.items.map((navItem) => (
                  <NavLinkItem key={navItem.to} {...navItem} />
                ))}
              </div>
            </div>
          ) : (
            <NavLinkItem key={item.to} {...item} />
          )
        )}
      </nav>
    </aside>
  )
}
