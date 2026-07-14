import { NavLink, Route, Routes } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import LanguageSwitcher from './components/LanguageSwitcher'
import Dashboard from './pages/Dashboard'
import NewConsent from './pages/NewConsent'
import ViewConsent from './pages/ViewConsent'
import Settings from './pages/Settings'

function BrandMark() {
  return (
    <svg viewBox="0 0 512 512" className="h-8 w-8" aria-hidden>
      <rect x="240" y="123" width="32" height="200" rx="16" fill="#F6F5F8" />
      <circle cx="256" cy="323" r="69" fill="#E11D78" />
      <circle cx="235" cy="302" r="19" fill="#ffffff" opacity="0.35" />
    </svg>
  )
}

export default function App() {
  const { t } = useTranslation()
  const navClass = ({ isActive }: { isActive: boolean }) =>
    `rounded-lg px-3 py-2 text-sm font-medium transition ${
      isActive ? 'bg-ink-800 text-white' : 'text-ink-300 hover:bg-ink-900 hover:text-ink-100'
    }`

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-20 border-b border-ink-800 bg-ink-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center gap-3 px-4 py-3">
          <NavLink to="/" className="flex items-center gap-2">
            <BrandMark />
            <span className="text-base font-semibold tracking-tight">{t('app.title')}</span>
          </NavLink>
          <nav className="flex items-center gap-1">
            <NavLink to="/" end className={navClass}>
              {t('nav.dashboard')}
            </NavLink>
            <NavLink to="/new" className={navClass}>
              {t('nav.new')}
            </NavLink>
            <NavLink to="/settings" className={navClass}>
              {t('nav.settings')}
            </NavLink>
          </nav>
          <div className="ml-auto">
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/new" element={<NewConsent />} />
          <Route path="/consent/:id" element={<ViewConsent />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>

      <footer className="border-t border-ink-800 px-4 py-4">
        <div className="mx-auto max-w-4xl text-center text-xs text-ink-500">
          <span className="font-medium text-ink-400">{t('disclaimer.short')}:</span> {t('disclaimer.legal')}
        </div>
      </footer>
    </div>
  )
}
