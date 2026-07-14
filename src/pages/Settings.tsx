import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { defaultSettings, getSettings, saveSettings } from '../db'
import { LANGUAGES, type ClauseTemplate, type Language, type Settings } from '../types'
import { setAppLanguage, LANGUAGE_LABELS } from '../i18n'
import { exportAllData, importAllData, deleteAllData } from '../lib/backup'
import { Callout, Field, SectionTitle, TextArea, TextInput } from '../components/ui'

function readFile(file: File, as: 'dataURL' | 'text'): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = reject
    if (as === 'dataURL') reader.readAsDataURL(file)
    else reader.readAsText(file)
  })
}

export default function Settings() {
  const { t } = useTranslation()
  const [s, setS] = useState<Settings | null>(null)
  const [message, setMessage] = useState<string>('')
  const logoInput = useRef<HTMLInputElement>(null)
  const importInput = useRef<HTMLInputElement>(null)

  const load = () => getSettings().then(setS)
  useEffect(() => {
    load()
  }, [])

  if (!s) return <p className="text-ink-400">…</p>

  const update = (patch: Partial<Settings>) => setS({ ...s, ...patch })
  const field = (key: keyof Settings) => (e: { target: { value: string } }) => update({ [key]: e.target.value })

  const flash = (msg: string) => {
    setMessage(msg)
    setTimeout(() => setMessage(''), 2500)
  }

  const save = async () => {
    await saveSettings(s)
    flash(t('settings.saved'))
  }

  const onLogo = async (file?: File) => {
    if (!file) return
    const dataUrl = await readFile(file, 'dataURL')
    update({ logo: dataUrl })
  }

  const setClause = (id: string, patch: Partial<ClauseTemplate>) =>
    setS({ ...s, clauseTemplates: s.clauseTemplates.map((c) => (c.id === id ? { ...c, ...patch } : c)) })
  const removeClause = (id: string) =>
    setS({ ...s, clauseTemplates: s.clauseTemplates.filter((c) => c.id !== id) })
  const addClause = () =>
    setS({
      ...s,
      clauseTemplates: [
        ...s.clauseTemplates,
        { id: crypto.randomUUID(), title: '', text: '', enabledByDefault: false },
      ],
    })

  const onImport = async (file?: File) => {
    if (!file) return
    if (!confirm(t('settings.importConfirm'))) return
    try {
      const text = await readFile(file, 'text')
      await importAllData(text)
      await load()
      flash(t('settings.importDone'))
    } catch {
      flash('⚠︎')
    }
  }

  const onDeleteAll = async () => {
    if (!confirm(t('settings.deleteAllConfirm'))) return
    await deleteAllData()
    setS(defaultSettings())
    flash(t('settings.saved'))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('settings.title')}</h1>
        <div className="flex items-center gap-3">
          {message && <span className="text-sm text-emerald-300">{message}</span>}
          <button className="btn-primary" onClick={save}>
            {t('common.save')}
          </button>
        </div>
      </div>

      <Callout tone="legal">{t('disclaimer.legal')}</Callout>

      {/* Studio / controller */}
      <div className="card p-5">
        <SectionTitle>{t('settings.studioSection')}</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t('settings.studioName')}>
            <TextInput value={s.studioName} onChange={field('studioName')} />
          </Field>
          <Field label={t('settings.artistName')}>
            <TextInput value={s.artistName} onChange={field('artistName')} />
          </Field>
          <div className="sm:col-span-2">
            <Field label={t('settings.street')}>
              <TextInput value={s.street} onChange={field('street')} />
            </Field>
          </div>
          <Field label={t('settings.postalCode')}>
            <TextInput value={s.postalCode} onChange={field('postalCode')} />
          </Field>
          <Field label={t('settings.city')}>
            <TextInput value={s.city} onChange={field('city')} />
          </Field>
          <Field label={t('settings.country')}>
            <TextInput value={s.country} onChange={field('country')} />
          </Field>
          <Field label={t('settings.vat')}>
            <TextInput value={s.vatOrRegistration} onChange={field('vatOrRegistration')} />
          </Field>
          <Field label={t('settings.email')}>
            <TextInput value={s.email} onChange={field('email')} />
          </Field>
          <Field label={t('settings.phone')}>
            <TextInput value={s.phone} onChange={field('phone')} />
          </Field>
        </div>
        <div className="mt-4">
          <span className="label">{t('settings.logo')}</span>
          <div className="flex items-center gap-4">
            {s.logo && <img src={s.logo} alt="logo" className="h-12 rounded bg-white p-1" />}
            <input
              ref={logoInput}
              type="file"
              accept="image/png,image/jpeg"
              className="hidden"
              onChange={(e) => onLogo(e.target.files?.[0])}
            />
            <button className="btn-secondary" onClick={() => logoInput.current?.click()}>
              {t('settings.logoUpload')}
            </button>
            {s.logo && (
              <button className="btn-ghost" onClick={() => update({ logo: '' })}>
                {t('settings.logoRemove')}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Preferences */}
      <div className="card p-5">
        <SectionTitle>{t('settings.prefsSection')}</SectionTitle>
        <span className="label">{t('settings.defaultLanguage')}</span>
        <div className="mb-4 inline-flex flex-wrap gap-2">
          {LANGUAGES.map((l) => (
            <button
              key={l}
              onClick={() => {
                update({ defaultLanguage: l })
                setAppLanguage(l as Language)
              }}
              className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
                s.defaultLanguage === l
                  ? 'border-rose-500 bg-rose-500/15 text-white'
                  : 'border-ink-700 text-ink-300 hover:border-ink-500'
              }`}
            >
              {LANGUAGE_LABELS[l]}
            </button>
          ))}
        </div>
        <Field label={t('settings.retentionInfo')}>
          <TextArea rows={2} value={s.retentionInfo} onChange={field('retentionInfo')} />
        </Field>
      </div>

      {/* Clause templates */}
      <div className="card p-5">
        <SectionTitle sub={t('settings.clausesIntro')}>{t('settings.clausesSection')}</SectionTitle>
        <div className="space-y-4">
          {s.clauseTemplates.map((c) => (
            <div key={c.id} className="rounded-xl border border-ink-800 bg-ink-950/40 p-4">
              <div className="mb-3 flex items-center gap-3">
                <TextInput
                  className="flex-1"
                  placeholder={t('settings.clauseTitle')}
                  value={c.title}
                  onChange={(e) => setClause(c.id, { title: e.target.value })}
                />
                <button className="btn-ghost text-red-300 hover:bg-red-500/10" onClick={() => removeClause(c.id)}>
                  {t('common.delete')}
                </button>
              </div>
              <TextArea
                rows={2}
                placeholder={t('settings.clauseText')}
                value={c.text}
                onChange={(e) => setClause(c.id, { text: e.target.value })}
              />
              <label className="mt-2 flex items-center gap-2 text-sm text-ink-300">
                <input
                  type="checkbox"
                  checked={c.enabledByDefault}
                  onChange={(e) => setClause(c.id, { enabledByDefault: e.target.checked })}
                />
                {t('settings.clauseDefault')}
              </label>
            </div>
          ))}
        </div>
        <button className="btn-secondary mt-4" onClick={addClause}>
          + {t('settings.addClause')}
        </button>
      </div>

      {/* Backup */}
      <div className="card p-5">
        <SectionTitle sub={t('settings.backupIntro')}>{t('settings.backupSection')}</SectionTitle>
        <div className="flex flex-wrap gap-3">
          <button className="btn-secondary" onClick={exportAllData}>
            {t('settings.exportData')}
          </button>
          <input
            ref={importInput}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => onImport(e.target.files?.[0])}
          />
          <button className="btn-secondary" onClick={() => importInput.current?.click()}>
            {t('settings.importData')}
          </button>
        </div>
      </div>

      {/* Danger zone */}
      <div className="card border-red-500/30 p-5">
        <SectionTitle>{t('settings.dangerSection')}</SectionTitle>
        <button className="btn bg-red-500/90 text-white hover:bg-red-500" onClick={onDeleteAll}>
          {t('settings.deleteAll')}
        </button>
      </div>

      <Callout tone="info">{t('install.hint')}</Callout>
    </div>
  )
}
