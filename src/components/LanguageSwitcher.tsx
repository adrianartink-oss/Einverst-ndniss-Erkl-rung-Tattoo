import { useTranslation } from 'react-i18next'
import { LANGUAGES, type Language } from '../types'
import { setAppLanguage, LANGUAGE_LABELS } from '../i18n'

export default function LanguageSwitcher({
  value,
  onChange,
  size = 'sm',
}: {
  value?: Language
  onChange?: (l: Language) => void
  size?: 'sm' | 'lg'
}) {
  const { i18n } = useTranslation()
  const current = (value ?? (i18n.language as Language)) || 'de'

  const select = (l: Language) => {
    if (onChange) onChange(l)
    else setAppLanguage(l)
  }

  const pad = size === 'lg' ? 'px-5 py-3 text-base' : 'px-3 py-1.5 text-sm'

  return (
    <div className="inline-flex flex-wrap gap-1 rounded-xl bg-ink-900/70 p-1 border border-ink-800">
      {LANGUAGES.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => select(l)}
          className={`rounded-lg font-medium transition ${pad} ${
            current === l ? 'bg-rose-500 text-white' : 'text-ink-300 hover:bg-ink-800'
          }`}
        >
          {size === 'lg' ? LANGUAGE_LABELS[l] : l.toUpperCase()}
        </button>
      ))}
    </div>
  )
}
