import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, getSettings } from '../db'
import { HEALTH_QUESTION_KEYS, type Consent, type Language, type Settings } from '../types'
import { fullName, formatDate, formatDateTime, consentFileName } from '../lib/format'
import { downloadBlob } from '../lib/download'
import { SectionTitle } from '../components/ui'

function Row({ label, value }: { label: string; value?: string }) {
  if (!value) return null
  return (
    <div className="flex gap-3 py-1 text-sm">
      <span className="w-40 shrink-0 text-ink-400">{label}</span>
      <span className="text-ink-100">{value}</span>
    </div>
  )
}

export default function ViewConsent() {
  const { id } = useParams()
  const numId = Number(id)
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [settings, setSettings] = useState<Settings | null>(null)
  const [busy, setBusy] = useState(false)
  const uiLang = i18n.language as Language

  const consent = useLiveQuery(() => db.consents.get(numId), [numId])

  useEffect(() => {
    getSettings().then(setSettings)
  }, [])

  if (consent === undefined) return <p className="text-ink-400">…</p>
  if (consent === null) {
    return (
      <div className="card p-6 text-center">
        <p className="text-ink-300">—</p>
        <button className="btn-secondary mt-4" onClick={() => navigate('/')}>
          {t('nav.dashboard')}
        </button>
      </div>
    )
  }

  const c = consent as Consent
  const lang = c.language

  const exportPdf = async () => {
    if (!settings) return
    setBusy(true)
    try {
      const { generateConsentPdf } = await import('../lib/pdf')
      const bytes = await generateConsentPdf(c, settings)
      downloadBlob(bytes, consentFileName(c), 'application/pdf')
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    if (!confirm(t('view.deleteConfirm'))) return
    await db.consents.delete(numId)
    navigate('/')
  }

  const yesQuestions = HEALTH_QUESTION_KEYS.filter((k) => c.health.answers[k] === 'yes')
  const address = [c.customer.street, [c.customer.postalCode, c.customer.city].filter(Boolean).join(' '), c.customer.country]
    .filter(Boolean)
    .join(', ')

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <button className="btn-ghost" onClick={() => navigate('/')}>
          ← {t('nav.dashboard')}
        </button>
        <div className="flex gap-2">
          <button className="btn-primary" onClick={exportPdf} disabled={busy || !settings}>
            {busy ? '…' : t('common.export')}
          </button>
          <button className="btn-ghost text-red-300 hover:bg-red-500/10" onClick={remove}>
            {t('common.delete')}
          </button>
        </div>
      </div>

      <div className="card mb-4 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{fullName(c) || t('dashboard.unnamed')}</h1>
            <p className="text-sm text-ink-400">
              {t('view.title')} · {c.language.toUpperCase()} · {formatDateTime(c.createdAt, uiLang)}
            </p>
          </div>
          {c.signatures.customer && c.signatures.artist ? (
            <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-300">
              {t('dashboard.signed')}
            </span>
          ) : (
            <span className="rounded-full bg-amber-500/15 px-3 py-1 text-xs font-medium text-amber-300">
              {t('dashboard.draft')}
            </span>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="card p-5">
          <SectionTitle>{t('view.person')}</SectionTitle>
          <Row label={t('pdf.dob')} value={formatDate(c.customer.dateOfBirth, lang)} />
          <Row label={t('pdf.address')} value={address} />
          <Row label={t('personal.email')} value={c.customer.email} />
          <Row label={t('personal.phone')} value={c.customer.phone} />
          <Row label={t('pdf.idNumber')} value={c.customer.idNumber} />
        </div>

        <div className="card p-5">
          <SectionTitle>{t('view.tattoo')}</SectionTitle>
          <Row label={t('tattoo.motif')} value={c.tattoo.motif} />
          <Row label={t('tattoo.bodyLocation')} value={c.tattoo.bodyLocation} />
          <Row label={t('tattoo.size')} value={c.tattoo.size} />
          <Row label={t('tattoo.colors')} value={c.tattoo.colors} />
          <Row label={t('tattoo.sessionDate')} value={formatDate(c.tattoo.sessionDate, lang)} />
          <Row label={t('tattoo.price')} value={c.tattoo.price} />
        </div>

        <div className="card p-5">
          <SectionTitle>{t('view.health')}</SectionTitle>
          <p className="mb-1 text-sm font-medium text-ink-200">{t('view.yesAnswers')}</p>
          {yesQuestions.length === 0 ? (
            <p className="text-sm text-ink-400">{t('view.noneReported')}</p>
          ) : (
            <ul className="list-disc space-y-1 pl-5 text-sm text-ink-100 marker:text-rose-500">
              {yesQuestions.map((k) => (
                <li key={k}>{t(`health.q.${k}`)}</li>
              ))}
            </ul>
          )}
          {c.health.allergyDetails && <Row label={t('health.allergyDetails')} value={c.health.allergyDetails} />}
          {c.health.medicationDetails && <Row label={t('health.medicationDetails')} value={c.health.medicationDetails} />}
          {c.health.notes && <Row label={t('health.notes')} value={c.health.notes} />}
        </div>

        <div className="card p-5">
          <SectionTitle>{t('view.declarations')}</SectionTitle>
          <ul className="space-y-1 text-sm text-ink-100">
            {[
              ['declarations.procedure', c.consents.procedure],
              ['declarations.risksUnderstood', c.consents.risksUnderstood],
              ['declarations.truthful', c.consents.truthful],
              ['declarations.noRevocationAfter', c.consents.noRevocationAfter],
              ['privacy.consentCheckbox', c.consents.dataProcessing],
            ].map(([key, ok]) => (
              <li key={key as string} className="flex items-start gap-2">
                <span className={ok ? 'text-emerald-400' : 'text-ink-500'}>{ok ? '✓' : '—'}</span>
                <span className={ok ? '' : 'text-ink-500'}>{t(key as string)}</span>
              </li>
            ))}
            {c.consents.imageRights && (
              <li className="flex items-start gap-2">
                <span className="text-emerald-400">✓</span>
                <span>{t('privacy.imageRightsCheckbox')}</span>
              </li>
            )}
          </ul>
        </div>

        {(c.selectedClauses.length > 0 || c.customClauseText.trim()) && (
          <div className="card p-5 sm:col-span-2">
            <SectionTitle>{t('view.additional')}</SectionTitle>
            <ul className="space-y-2 text-sm">
              {c.selectedClauses.map((cl) => (
                <li key={cl.id}>
                  <p className="font-semibold text-ink-50">{cl.title}</p>
                  <p className="text-ink-300">{cl.text}</p>
                </li>
              ))}
            </ul>
            {c.customClauseText.trim() && <p className="mt-2 text-sm text-ink-200">{c.customClauseText}</p>}
          </div>
        )}

        <div className="card p-5 sm:col-span-2">
          <SectionTitle>{t('signatures.summaryTitle')}</SectionTitle>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              [t('pdf.customer'), c.signatures.customer],
              [t('pdf.artist'), c.signatures.artist],
            ].map(([label, img]) => (
              <div key={label}>
                <p className="mb-1 text-sm text-ink-400">{label}</p>
                <div className="rounded-xl border border-ink-700 bg-white p-2">
                  {img ? (
                    <img src={img} alt={label} className="mx-auto h-28 object-contain" />
                  ) : (
                    <div className="flex h-28 items-center justify-center text-sm text-ink-400">—</div>
                  )}
                </div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-sm text-ink-400">
            {c.signatures.place && `${t('pdf.place')}: ${c.signatures.place}   `}
            {c.signatures.date && `${t('view.signedAt')}: ${formatDate(c.signatures.date, lang)}`}
          </p>
        </div>
      </div>
    </div>
  )
}
