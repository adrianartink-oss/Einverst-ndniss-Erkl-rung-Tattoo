import type { ReactNode, InputHTMLAttributes, TextareaHTMLAttributes } from 'react'

export function Field({
  label,
  hint,
  error,
  required,
  children,
}: {
  label?: string
  hint?: string
  error?: string
  required?: boolean
  children: ReactNode
}) {
  return (
    <div>
      {label && (
        <label className="label">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      {children}
      {hint && !error && <p className="mt-1 text-xs text-ink-400">{hint}</p>}
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  )
}

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean
}
export function TextInput({ invalid, className = '', ...rest }: TextInputProps) {
  return <input className={`input ${invalid ? 'field-error' : ''} ${className}`} {...rest} />
}

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean
}
export function TextArea({ invalid, className = '', rows = 3, ...rest }: TextAreaProps) {
  return (
    <textarea rows={rows} className={`input resize-y ${invalid ? 'field-error' : ''} ${className}`} {...rest} />
  )
}

export function Checkbox({
  checked,
  onChange,
  children,
  required,
  invalid,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  children: ReactNode
  required?: boolean
  invalid?: boolean
}) {
  return (
    <label
      className={`flex gap-3 items-start cursor-pointer rounded-xl border p-3 transition ${
        invalid ? 'border-red-500/70 bg-red-500/5' : 'border-ink-700 bg-ink-950/40 hover:border-ink-500'
      }`}
    >
      <span
        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition ${
          checked ? 'border-rose-500 bg-rose-500 text-white' : 'border-ink-500 bg-transparent'
        }`}
      >
        {checked && (
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="3">
            <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="text-sm leading-relaxed text-ink-100">
        {children} {required && <span className="text-rose-500">*</span>}
      </span>
    </label>
  )
}

export function YesNo({
  value,
  onChange,
  yesLabel,
  noLabel,
  invalid,
}: {
  value: 'yes' | 'no' | ''
  onChange: (v: 'yes' | 'no') => void
  yesLabel: string
  noLabel: string
  invalid?: boolean
}) {
  const base =
    'flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition border select-none'
  return (
    <div className={`flex gap-2 ${invalid ? 'ring-1 ring-red-500/60 rounded-lg p-0.5' : ''}`}>
      <button
        type="button"
        onClick={() => onChange('no')}
        className={`${base} ${
          value === 'no'
            ? 'bg-ink-100 text-ink-950 border-ink-100'
            : 'bg-transparent text-ink-300 border-ink-700 hover:border-ink-500'
        }`}
      >
        {noLabel}
      </button>
      <button
        type="button"
        onClick={() => onChange('yes')}
        className={`${base} ${
          value === 'yes'
            ? 'bg-rose-500 text-white border-rose-500'
            : 'bg-transparent text-ink-300 border-ink-700 hover:border-ink-500'
        }`}
      >
        {yesLabel}
      </button>
    </div>
  )
}

export function SectionTitle({ children, sub }: { children: ReactNode; sub?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-xl font-semibold text-ink-50">{children}</h2>
      {sub && <p className="mt-1 text-sm text-ink-400">{sub}</p>}
    </div>
  )
}

export function Callout({ children, tone = 'info' }: { children: ReactNode; tone?: 'info' | 'warn' | 'legal' }) {
  const tones = {
    info: 'border-ink-700 bg-ink-900/60 text-ink-200',
    warn: 'border-amber-500/40 bg-amber-500/10 text-amber-200',
    legal: 'border-rose-500/30 bg-rose-500/5 text-ink-300',
  }
  return (
    <div className={`rounded-xl border px-4 py-3 text-sm leading-relaxed ${tones[tone]}`}>{children}</div>
  )
}
