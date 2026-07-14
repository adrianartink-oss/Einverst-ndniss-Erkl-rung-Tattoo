import Dexie, { type Table } from 'dexie'
import type { Consent, Settings, ClauseTemplate } from './types'

export class ConsentDB extends Dexie {
  consents!: Table<Consent, number>
  settings!: Table<Settings, string>

  constructor() {
    super('tattoo-consent-db')
    this.version(1).stores({
      consents: '++id, createdAt, updatedAt, language',
      settings: 'id',
    })
  }
}

export const db = new ConsentDB()

export function defaultClauseTemplates(): ClauseTemplate[] {
  return [
    {
      id: 'deposit',
      title: 'Anzahlung / Deposit',
      text: 'Eine geleistete Anzahlung wird mit dem Endpreis verrechnet und ist bei kurzfristiger Absage (weniger als 48 Stunden) oder Nichterscheinen nicht erstattungsfähig.',
      enabledByDefault: false,
    },
    {
      id: 'touchup',
      title: 'Nachstechen / Touch-up',
      text: 'Ein einmaliges Nachstechen innerhalb von 8 Wochen ist im Preis enthalten, sofern die Nachsorgehinweise eingehalten wurden.',
      enabledByDefault: false,
    },
    {
      id: 'noalcohol',
      title: 'Hinweis Erscheinen',
      text: 'Ich erscheine ausgeruht, ausreichend gegessen und nicht unter Einfluss von Alkohol oder Drogen zum Termin.',
      enabledByDefault: true,
    },
  ]
}

export function defaultSettings(): Settings {
  return {
    id: 'app',
    studioName: '',
    artistName: '',
    street: '',
    postalCode: '',
    city: '',
    country: '',
    email: '',
    phone: '',
    vatOrRegistration: '',
    logo: '',
    defaultLanguage: 'de',
    retentionInfo: '',
    clauseTemplates: defaultClauseTemplates(),
  }
}

export async function getSettings(): Promise<Settings> {
  const existing = await db.settings.get('app')
  if (existing) return existing
  const fresh = defaultSettings()
  await db.settings.put(fresh)
  return fresh
}

export async function saveSettings(settings: Settings): Promise<void> {
  await db.settings.put({ ...settings, id: 'app' })
}
