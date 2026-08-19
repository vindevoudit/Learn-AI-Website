import { NavLink, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { spring } from '../../theme'

const links = [
  { to: '/', label: 'Home', end: true },
  { to: '/lessons', label: 'Lessons' },
]

export default function NavBar() {
  const { pathname } = useLocation()

  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-void/80 backdrop-blur-md">
      <nav
        aria-label="Main"
        className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6"
      >
        <NavLink
          to="/"
          className="group flex items-center gap-2.5 rounded-panel"
          aria-label="Learn AI — home"
        >
          {/* The signal trace, at its smallest. Same line that runs the hero. */}
          <svg width="26" height="16" viewBox="0 0 26 16" fill="none" aria-hidden="true">
            <path
              d="M1 8h4l2.5-5.5L11 13l3-8 2.5 5H25"
              stroke="currentColor"
              className="text-signal transition-colors group-hover:text-charge"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="font-display text-[15px] font-bold tracking-tight text-ink">
            Learn AI
          </span>
        </NavLink>

        <ul className="flex items-center gap-1">
          {links.map((link) => {
            const active = link.end ? pathname === link.to : pathname.startsWith(link.to)
            return (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  className={`relative block rounded-panel px-3 py-1.5 text-sm transition-colors ${
                    active ? 'text-ink' : 'text-mute hover:text-ink'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="nav-active"
                      transition={spring.snappy}
                      className="absolute inset-0 rounded-panel border border-line bg-panel"
                    />
                  )}
                  <span className="relative">{link.label}</span>
                </NavLink>
              </li>
            )
          })}
        </ul>
      </nav>
    </header>
  )
}
