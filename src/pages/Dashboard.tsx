import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import type { Consent, Language } from '../types'
import { fullName, formatDate } from '../lib/format'
import { TextInput } from '../components/ui'

function isSigned(c: Consent): boolean {
  return Boolean(c.signatures.customer && c.signatures.artist)
}

export default function Dashboard() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const lang = i18n.language as Language

  const consents = useLiveQuery(() => db.consents.orderBy('createdAt').reverse().toArray(), [])

  const filtered = useMemo(() => {
    if (!consents) return []
    const q = query.trim().toLowerCase()
    if (!q) return consents
    return consents.filter((c) =>
      [fullName(c), c.tattoo.motif, c.customer.email].join(' ').toLowerCase().includes(q),
    )
  }, [consents, query])

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t('dashboard.title')}</h1>
          <p className="text-sm text-ink-400">{t('dashboard.subtitle')}</p>
        </div>
        <button className="btn-primary" onClick={() => navigate('/new')}>
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
          {t('dashboard.newButton')}
        </button>
      </div>

      {consents && consents.length > 0 && (
        <div className="mb-4">
          <TextInput
            placeholder={t('dashboard.searchPlaceholder')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <p className="mt-2 text-xs text-ink-500">{t('dashboard.count', { count: filtered.length })}</p>
        </div>
      )}

      {consents && consents.length === 0 && (
        <div className="card flex flex-col items-center gap-3 px-6 py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-ink-800">
            <svg viewBox="0 0 24 24" className="h-8 w-8 text-ink-400" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M9 12h6M9 16h6M9 8h6M7 3h10a2 2 0 012 2v14a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2z" />
            </svg>
          </div>
          <p className="text-lg font-medium">{t('dashboard.empty')}</p>
          <p className="max-w-sm text-sm text-ink-400">{t('dashboard.emptyHint')}</p>
          <button className="btn-primary mt-2" onClick={() => navigate('/new')}>
            {t('dashboard.newButton')}
          </button>
        </div>
      )}

      <ul className="space-y-3">
        {filtered.map((c) => (
          <li key={c.id}>
            <Link
              to={`/consent/${c.id}`}
              className="card flex items-center gap-4 px-4 py-4 transition hover:border-ink-600"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ink-800 text-sm font-semibold text-ink-100">
                {(fullName(c) || '?').slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-ink-50">{fullName(c) || t('dashboard.unnamed')}</p>
                <p className="truncate text-sm text-ink-400">
                  {c.tattoo.motif || '—'} · {formatDate(c.createdAt, lang)}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                  isSigned(c) ? 'bg-emerald-500/15 text-emerald-300' : 'bg-amber-500/15 text-amber-300'
                }`}
              >
                {isSigned(c) ? t('dashboard.signed') : t('dashboard.draft')}
              </span>
              <span className="ml-1 shrink-0 rounded bg-ink-800 px-1.5 py-0.5 text-[10px] font-semibold text-ink-300">
                {c.language.toUpperCase()}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
