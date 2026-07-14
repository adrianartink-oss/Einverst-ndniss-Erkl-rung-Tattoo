import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { db, getSettings } from '../db'
import {
  HEALTH_QUESTION_KEYS,
  LANGUAGES,
  newConsent,
  type Consent,
  type Language,
  type Settings,
  type YesNo,
} from '../types'
import { setAppLanguage, LANGUAGE_LABELS } from '../i18n'
import { ageFromDob } from '../lib/format'
import { Callout, Checkbox, Field, SectionTitle, TextArea, TextInput, YesNo as YesNoToggle } from '../components/ui'
import { SignaturePad, type SignaturePadHandle } from '../components/SignaturePad'

const STEP_KEYS = [
  'language',
  'personal',
  'health',
  'tattoo',
  'consent',
  'additional',
  'privacy',
  'signatures',
] as const
type StepKey = (typeof STEP_KEYS)[number]

export default function NewConsent() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [settings, setSettings] = useState<Settings | null>(null)
  const [consent, setConsent] = useState<Consent>(() => newConsent('de'))
  const [step, setStep] = useState(0)
  const [showErrors, setShowErrors] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getSettings().then((s) => {
      setSettings(s)
      setConsent((c) => ({
        ...c,
        language: s.defaultLanguage,
        selectedClauses: s.clauseTemplates
          .filter((tpl) => tpl.enabledByDefault)
          .map(({ id, title, text }) => ({ id, title, text })),
        signatures: {
          ...c.signatures,
          place: s.city || '',
          date: new Date().toISOString().slice(0, 10),
        },
        tattoo: { ...c.tattoo, sessionDate: new Date().toISOString().slice(0, 10) },
      }))
      setAppLanguage(s.defaultLanguage)
    })
  }, [])

  const stepKey: StepKey = STEP_KEYS[step]

  const errors = useMemo(() => validate(consent), [consent])
  const errorText = useStepErrorText(errors)
  const firstErrorStep = useMemo(() => {
    const order: StepKey[] = ['personal', 'consent', 'privacy', 'signatures']
    for (const s of order) if (errors[s]) return STEP_KEYS.indexOf(s)
    return -1
  }, [errors])

  const patch = (updater: (c: Consent) => Consent) => setConsent((c) => updater(c))

  const goNext = () => {
    if (step < STEP_KEYS.length - 1) setStep(step + 1)
  }
  const goBack = () => {
    if (step > 0) setStep(step - 1)
  }

  const finish = async () => {
    if (firstErrorStep >= 0) {
      setShowErrors(true)
      setStep(firstErrorStep)
      return
    }
    if (!settings) return
    setSaving(true)
    const now = Date.now()
    const id = await db.consents.add({ ...consent, createdAt: consent.createdAt || now, updatedAt: now })
    navigate(`/consent/${id}`)
  }

  const isLast = step === STEP_KEYS.length - 1

  return (
    <div>
      <StepIndicator
        current={step}
        errorSteps={showErrors ? errorStepSet(errors) : new Set()}
        onJump={setStep}
      />

      <div className="card mt-4 p-5 sm:p-7">
        {stepKey === 'language' && (
          <LanguageStep
            value={consent.language}
            onChange={(l) => {
              patch((c) => ({ ...c, language: l }))
              setAppLanguage(l)
            }}
          />
        )}
        {stepKey === 'personal' && <PersonalStep consent={consent} patch={patch} errors={showErrors ? errors.personal : undefined} />}
        {stepKey === 'health' && <HealthStep consent={consent} patch={patch} />}
        {stepKey === 'tattoo' && <TattooStep consent={consent} patch={patch} />}
        {stepKey === 'consent' && <ConsentStep consent={consent} patch={patch} showErrors={showErrors && !!errors.consent} />}
        {stepKey === 'additional' && settings && <AdditionalStep consent={consent} patch={patch} settings={settings} />}
        {stepKey === 'privacy' && settings && (
          <PrivacyStep consent={consent} patch={patch} settings={settings} showErrors={showErrors && !!errors.privacy} />
        )}
        {stepKey === 'signatures' && <SignaturesStep consent={consent} patch={patch} showErrors={showErrors && !!errors.signatures} />}
      </div>

      {showErrors && errors[stepKey] && (
        <p className="mt-3 text-sm text-red-400">{errorText[stepKey]}</p>
      )}

      <div className="mt-5 flex items-center justify-between gap-3">
        <button className="btn-ghost" onClick={goBack} disabled={step === 0}>
          {t('common.back')}
        </button>
        <span className="text-xs text-ink-500">
          {t('common.step')} {step + 1} {t('common.of')} {STEP_KEYS.length}
        </span>
        {isLast ? (
          <button className="btn-primary" onClick={finish} disabled={saving}>
            {saving ? t('common.saving') : t('common.finish')}
          </button>
        ) : (
          <button className="btn-primary" onClick={goNext}>
            {t('common.next')}
          </button>
        )}
      </div>
    </div>
  )
}

/* ---------- validation ---------- */

type StepErrors = Partial<Record<StepKey, string>>

function validate(c: Consent): StepErrors {
  const e: StepErrors = {}
  // handled by i18n at call sites; store keys, resolve via t later — but simpler: return translation keys
  if (!c.customer.firstName.trim() || !c.customer.lastName.trim() || !c.customer.dateOfBirth) {
    e.personal = 'personal'
  }
  const d = c.consents
  if (!d.procedure || !d.risksUnderstood || !d.truthful || !d.noRevocationAfter) e.consent = 'consent'
  if (!c.consents.dataProcessing) e.privacy = 'privacy'
  if (!c.signatures.customer || !c.signatures.artist || !c.signatures.place || !c.signatures.date) {
    e.signatures = 'signatures'
  }
  return e
}

function errorStepSet(e: StepErrors): Set<number> {
  const set = new Set<number>()
  ;(Object.keys(e) as StepKey[]).forEach((k) => set.add(STEP_KEYS.indexOf(k)))
  return set
}

/* Resolve error message keys via translation in a small wrapper hook usage */
function useStepErrorText(errors: StepErrors): Record<string, string> {
  const { t } = useTranslation()
  const map: Record<string, string> = {}
  if (errors.personal) map.personal = t('validation.nameRequired')
  if (errors.consent) map.consent = t('validation.consentsRequired')
  if (errors.privacy) map.privacy = t('validation.privacyRequired')
  if (errors.signatures) map.signatures = t('validation.signaturesRequired')
  return map
}

/* ---------- step indicator ---------- */

function StepIndicator({
  current,
  errorSteps,
  onJump,
}: {
  current: number
  errorSteps: Set<number>
  onJump: (i: number) => void
}) {
  const { t } = useTranslation()
  return (
    <div className="-mx-4 overflow-x-auto px-4">
      <div className="flex min-w-max gap-2">
        {STEP_KEYS.map((k, i) => {
          const active = i === current
          const err = errorSteps.has(i)
          return (
            <button
              key={k}
              onClick={() => onJump(i)}
              className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                active
                  ? 'border-rose-500 bg-rose-500/15 text-white'
                  : err
                    ? 'border-red-500/60 bg-red-500/10 text-red-300'
                    : 'border-ink-800 bg-ink-900/60 text-ink-400 hover:text-ink-200'
              }`}
            >
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${
                  active ? 'bg-rose-500 text-white' : 'bg-ink-800 text-ink-300'
                }`}
              >
                {i + 1}
              </span>
              {t(`wizard.steps.${k}`)}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ---------- steps ---------- */

function LanguageStep({ value, onChange }: { value: Language; onChange: (l: Language) => void }) {
  const { t } = useTranslation()
  return (
    <div>
      <SectionTitle sub={t('wizard.languageIntro')}>{t('wizard.steps.language')}</SectionTitle>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {LANGUAGES.map((l) => (
          <button
            key={l}
            onClick={() => onChange(l)}
            className={`rounded-2xl border-2 px-4 py-6 text-center transition ${
              value === l
                ? 'border-rose-500 bg-rose-500/10 text-white'
                : 'border-ink-800 bg-ink-950/40 text-ink-300 hover:border-ink-600'
            }`}
          >
            <div className="text-2xl font-bold uppercase">{l}</div>
            <div className="mt-1 text-sm">{LANGUAGE_LABELS[l]}</div>
          </button>
        ))}
      </div>
    </div>
  )
}

function PersonalStep({
  consent,
  patch,
  errors,
}: {
  consent: Consent
  patch: (u: (c: Consent) => Consent) => void
  errors?: string
}) {
  const { t } = useTranslation()
  const set = (field: keyof Consent['customer']) => (e: { target: { value: string } }) =>
    patch((c) => ({ ...c, customer: { ...c.customer, [field]: e.target.value } }))
  const age = ageFromDob(consent.customer.dateOfBirth)
  const nameMissing = Boolean(errors) && (!consent.customer.firstName.trim() || !consent.customer.lastName.trim())
  const dobMissing = Boolean(errors) && !consent.customer.dateOfBirth

  return (
    <div>
      <SectionTitle>{t('personal.title')}</SectionTitle>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t('personal.firstName')} required>
          <TextInput value={consent.customer.firstName} onChange={set('firstName')} invalid={nameMissing} />
        </Field>
        <Field label={t('personal.lastName')} required>
          <TextInput value={consent.customer.lastName} onChange={set('lastName')} invalid={nameMissing} />
        </Field>
        <Field label={t('personal.dateOfBirth')} required hint={age !== null ? `${t('personal.age')}: ${age} ${t('personal.years')}` : undefined}>
          <TextInput type="date" value={consent.customer.dateOfBirth} onChange={set('dateOfBirth')} invalid={dobMissing} />
        </Field>
        <Field label={t('personal.idNumber')}>
          <TextInput value={consent.customer.idNumber} onChange={set('idNumber')} />
        </Field>
        <Field label={t('personal.email')}>
          <TextInput type="email" value={consent.customer.email} onChange={set('email')} />
        </Field>
        <Field label={t('personal.phone')}>
          <TextInput type="tel" value={consent.customer.phone} onChange={set('phone')} />
        </Field>
        <div className="sm:col-span-2">
          <Field label={t('personal.street')}>
            <TextInput value={consent.customer.street} onChange={set('street')} />
          </Field>
        </div>
        <Field label={t('personal.postalCode')}>
          <TextInput value={consent.customer.postalCode} onChange={set('postalCode')} />
        </Field>
        <Field label={t('personal.city')}>
          <TextInput value={consent.customer.city} onChange={set('city')} />
        </Field>
        <div className="sm:col-span-2">
          <Field label={t('personal.country')}>
            <TextInput value={consent.customer.country} onChange={set('country')} />
          </Field>
        </div>
      </div>
      {age !== null && age < 18 && (
        <div className="mt-4">
          <Callout tone="warn">{t('personal.minorWarning')}</Callout>
        </div>
      )}
    </div>
  )
}

function HealthStep({ consent, patch }: { consent: Consent; patch: (u: (c: Consent) => Consent) => void }) {
  const { t } = useTranslation()
  const setAnswer = (key: string, v: YesNo) =>
    patch((c) => ({ ...c, health: { ...c.health, answers: { ...c.health.answers, [key]: v } } }))
  const setField = (field: keyof Consent['health']) => (e: { target: { value: string } }) =>
    patch((c) => ({ ...c, health: { ...c.health, [field]: e.target.value } }))

  return (
    <div>
      <SectionTitle>{t('health.title')}</SectionTitle>
      <Callout tone="info">{t('health.intro')}</Callout>
      <div className="mt-4 divide-y divide-ink-800">
        {HEALTH_QUESTION_KEYS.map((key) => (
          <div key={key} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="pr-2 text-sm text-ink-100">{t(`health.q.${key}`)}</span>
            <div className="w-full sm:w-44">
              <YesNoToggle
                value={consent.health.answers[key] ?? ''}
                onChange={(v) => setAnswer(key, v)}
                yesLabel={t('common.yes')}
                noLabel={t('common.no')}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 grid gap-4">
        {consent.health.answers.allergies === 'yes' && (
          <Field label={t('health.allergyDetails')}>
            <TextInput value={consent.health.allergyDetails} onChange={setField('allergyDetails')} />
          </Field>
        )}
        {consent.health.answers.medication === 'yes' && (
          <Field label={t('health.medicationDetails')}>
            <TextInput value={consent.health.medicationDetails} onChange={setField('medicationDetails')} />
          </Field>
        )}
        <Field label={t('health.notes')}>
          <TextArea value={consent.health.notes} onChange={setField('notes')} placeholder={t('health.notesPlaceholder')} />
        </Field>
      </div>
    </div>
  )
}

function TattooStep({ consent, patch }: { consent: Consent; patch: (u: (c: Consent) => Consent) => void }) {
  const { t } = useTranslation()
  const set = (field: keyof Consent['tattoo']) => (e: { target: { value: string } }) =>
    patch((c) => ({ ...c, tattoo: { ...c.tattoo, [field]: e.target.value } }))
  return (
    <div>
      <SectionTitle>{t('tattoo.title')}</SectionTitle>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Field label={t('tattoo.motif')}>
            <TextArea rows={2} value={consent.tattoo.motif} onChange={set('motif')} />
          </Field>
        </div>
        <Field label={t('tattoo.bodyLocation')}>
          <TextInput value={consent.tattoo.bodyLocation} onChange={set('bodyLocation')} />
        </Field>
        <Field label={t('tattoo.size')}>
          <TextInput value={consent.tattoo.size} onChange={set('size')} />
        </Field>
        <Field label={t('tattoo.colors')}>
          <TextInput value={consent.tattoo.colors} onChange={set('colors')} />
        </Field>
        <Field label={t('tattoo.sessionDate')}>
          <TextInput type="date" value={consent.tattoo.sessionDate} onChange={set('sessionDate')} />
        </Field>
        <Field label={t('tattoo.price')}>
          <TextInput value={consent.tattoo.price} onChange={set('price')} />
        </Field>
      </div>
    </div>
  )
}

function ConsentStep({
  consent,
  patch,
  showErrors,
}: {
  consent: Consent
  patch: (u: (c: Consent) => Consent) => void
  showErrors: boolean
}) {
  const { t } = useTranslation()
  const risks = t('consentText.risks', { returnObjects: true }) as string[]
  const setFlag = (field: keyof Consent['consents']) => (v: boolean) =>
    patch((c) => ({ ...c, consents: { ...c.consents, [field]: v } }))

  return (
    <div>
      <SectionTitle>{t('consentText.title')}</SectionTitle>
      <div className="space-y-4 text-sm leading-relaxed text-ink-200">
        <Callout tone="info">
          <span className="font-semibold text-ink-100">{t('consentText.introTitle')}. </span>
          {t('consentText.introBody')}
        </Callout>
        <div>
          <h3 className="font-semibold text-ink-50">{t('consentText.procedureTitle')}</h3>
          <p className="mt-1">{t('consentText.procedureBody')}</p>
        </div>
        <div>
          <h3 className="font-semibold text-ink-50">{t('consentText.risksTitle')}</h3>
          <p className="mt-1">{t('consentText.risksIntro')}</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 marker:text-rose-500">
            {risks.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="font-semibold text-ink-50">{t('consentText.aftercareTitle')}</h3>
          <p className="mt-1">{t('consentText.aftercareBody')}</p>
        </div>
      </div>

      <h3 className="mb-3 mt-6 text-base font-semibold text-ink-50">{t('declarations.title')}</h3>
      <div className="space-y-2">
        <Checkbox checked={consent.consents.procedure} onChange={setFlag('procedure')} required invalid={showErrors && !consent.consents.procedure}>
          {t('declarations.procedure')}
        </Checkbox>
        <Checkbox checked={consent.consents.risksUnderstood} onChange={setFlag('risksUnderstood')} required invalid={showErrors && !consent.consents.risksUnderstood}>
          {t('declarations.risksUnderstood')}
        </Checkbox>
        <Checkbox checked={consent.consents.truthful} onChange={setFlag('truthful')} required invalid={showErrors && !consent.consents.truthful}>
          {t('declarations.truthful')}
        </Checkbox>
        <Checkbox checked={consent.consents.noRevocationAfter} onChange={setFlag('noRevocationAfter')} required invalid={showErrors && !consent.consents.noRevocationAfter}>
          {t('declarations.noRevocationAfter')}
        </Checkbox>
      </div>
    </div>
  )
}

function AdditionalStep({
  consent,
  patch,
  settings,
}: {
  consent: Consent
  patch: (u: (c: Consent) => Consent) => void
  settings: Settings
}) {
  const { t } = useTranslation()
  const selectedIds = new Set(consent.selectedClauses.map((c) => c.id))
  const toggle = (id: string) => {
    const tpl = settings.clauseTemplates.find((x) => x.id === id)
    if (!tpl) return
    patch((c) => {
      const exists = c.selectedClauses.some((x) => x.id === id)
      return {
        ...c,
        selectedClauses: exists
          ? c.selectedClauses.filter((x) => x.id !== id)
          : [...c.selectedClauses, { id: tpl.id, title: tpl.title, text: tpl.text }],
      }
    })
  }
  return (
    <div>
      <SectionTitle sub={t('additional.intro')}>{t('additional.title')}</SectionTitle>
      <h3 className="mb-2 text-sm font-semibold text-ink-200">{t('additional.templatesTitle')}</h3>
      {settings.clauseTemplates.length === 0 ? (
        <Callout tone="info">{t('additional.none')}</Callout>
      ) : (
        <div className="space-y-2">
          {settings.clauseTemplates.map((tpl) => (
            <Checkbox key={tpl.id} checked={selectedIds.has(tpl.id)} onChange={() => toggle(tpl.id)}>
              <span className="font-semibold text-ink-50">{tpl.title}</span>
              <span className="mt-0.5 block text-ink-300">{tpl.text}</span>
            </Checkbox>
          ))}
        </div>
      )}
      <div className="mt-5">
        <Field label={t('additional.customLabel')}>
          <TextArea
            rows={4}
            value={consent.customClauseText}
            onChange={(e) => patch((c) => ({ ...c, customClauseText: e.target.value }))}
            placeholder={t('additional.customPlaceholder')}
          />
        </Field>
      </div>
    </div>
  )
}

function PrivacyStep({
  consent,
  patch,
  settings,
  showErrors,
}: {
  consent: Consent
  patch: (u: (c: Consent) => Consent) => void
  settings: Settings
  showErrors: boolean
}) {
  const { t } = useTranslation()
  const controller = [settings.studioName, settings.artistName].filter(Boolean).join(' – ')
  const rows: [string, string][] = [
    [t('privacy.purposeTitle'), t('privacy.purposeBody')],
    [t('privacy.legalBasisTitle'), t('privacy.legalBasisBody')],
    [t('privacy.categoriesTitle'), t('privacy.categoriesBody')],
    [t('privacy.recipientsTitle'), t('privacy.recipientsBody')],
    [t('privacy.retentionTitle'), settings.retentionInfo || t('privacy.retentionFallback')],
    [t('privacy.rightsTitle'), t('privacy.rightsBody')],
    [t('privacy.withdrawalTitle'), t('privacy.withdrawalBody')],
    [t('privacy.complaintTitle'), t('privacy.complaintBody')],
  ]
  return (
    <div>
      <SectionTitle sub={t('privacy.intro')}>{t('privacy.title')}</SectionTitle>
      <div className="rounded-xl border border-ink-800 bg-ink-950/40 p-4 text-sm">
        <p>
          <span className="font-semibold text-ink-100">{t('privacy.controllerLabel')}: </span>
          {controller || <span className="text-amber-300">{t('privacy.controllerFallback')}</span>}
        </p>
        <dl className="mt-3 space-y-2 text-ink-300">
          {rows.map(([term, desc]) => (
            <div key={term}>
              <dt className="font-medium text-ink-100">{term}</dt>
              <dd>{desc}</dd>
            </div>
          ))}
        </dl>
      </div>
      <div className="mt-4">
        <Callout tone="legal">{t('privacy.voluntaryNote')}</Callout>
      </div>
      <div className="mt-4 space-y-2">
        <Checkbox
          checked={consent.consents.dataProcessing}
          onChange={(v) => patch((c) => ({ ...c, consents: { ...c.consents, dataProcessing: v } }))}
          required
          invalid={showErrors && !consent.consents.dataProcessing}
        >
          {t('privacy.consentCheckbox')}
        </Checkbox>
        <Checkbox
          checked={consent.consents.imageRights}
          onChange={(v) => patch((c) => ({ ...c, consents: { ...c.consents, imageRights: v } }))}
        >
          {t('privacy.imageRightsCheckbox')}
        </Checkbox>
      </div>
    </div>
  )
}

function SignatureField({
  label,
  value,
  onChange,
  invalid,
}: {
  label: string
  value: string
  onChange: (dataUrl: string) => void
  invalid?: boolean
}) {
  const { t } = useTranslation()
  const ref = useRef<SignaturePadHandle>(null)
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="label mb-0">{label} <span className="text-rose-500">*</span></span>
        <button
          type="button"
          className="text-xs font-medium text-ink-400 hover:text-rose-400"
          onClick={() => {
            ref.current?.clear()
            onChange('')
          }}
        >
          {t('signatures.clear')}
        </button>
      </div>
      {value ? (
        <div className={`rounded-xl border-2 bg-white p-2 ${invalid ? 'border-red-400' : 'border-ink-400'}`}>
          <img src={value} alt={label} className="mx-auto h-40 object-contain" />
        </div>
      ) : (
        <SignaturePad ref={ref} invalid={invalid} onEnd={() => onChange(ref.current?.toDataURL() ?? '')} />
      )}
    </div>
  )
}

function SignaturesStep({
  consent,
  patch,
  showErrors,
}: {
  consent: Consent
  patch: (u: (c: Consent) => Consent) => void
  showErrors: boolean
}) {
  const { t } = useTranslation()
  const setSig = (field: keyof Consent['signatures']) => (value: string) =>
    patch((c) => ({ ...c, signatures: { ...c.signatures, [field]: value } }))
  return (
    <div>
      <SectionTitle>{t('signatures.title')}</SectionTitle>
      <div className="mb-5 grid gap-4 sm:grid-cols-2">
        <Field label={t('signatures.place')}>
          <TextInput value={consent.signatures.place} onChange={(e) => setSig('place')(e.target.value)} invalid={showErrors && !consent.signatures.place} />
        </Field>
        <Field label={t('signatures.date')}>
          <TextInput type="date" value={consent.signatures.date} onChange={(e) => setSig('date')(e.target.value)} invalid={showErrors && !consent.signatures.date} />
        </Field>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <SignatureField
          label={t('signatures.customer')}
          value={consent.signatures.customer}
          onChange={setSig('customer')}
          invalid={showErrors && !consent.signatures.customer}
        />
        <SignatureField
          label={t('signatures.artist')}
          value={consent.signatures.artist}
          onChange={setSig('artist')}
          invalid={showErrors && !consent.signatures.artist}
        />
      </div>
    </div>
  )
}
