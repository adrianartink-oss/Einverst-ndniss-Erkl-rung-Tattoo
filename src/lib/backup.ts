import { db, defaultSettings, saveSettings } from '../db'
import type { Consent, Settings } from '../types'
import { downloadBlob } from './download'

interface BackupFile {
  app: 'tattoo-consent'
  version: 1
  exportedAt: number
  settings: Settings
  consents: Consent[]
}

export async function exportAllData(): Promise<void> {
  const settings = (await db.settings.get('app')) ?? defaultSettings()
  const consents = await db.consents.toArray()
  const payload: BackupFile = {
    app: 'tattoo-consent',
    version: 1,
    exportedAt: Date.now(),
    settings,
    consents,
  }
  const iso = new Date().toISOString().slice(0, 10)
  downloadBlob(JSON.stringify(payload, null, 2), `tattoo-consent-backup-${iso}.json`, 'application/json')
}

export async function importAllData(json: string): Promise<number> {
  const data = JSON.parse(json) as Partial<BackupFile>
  if (!data || data.app !== 'tattoo-consent' || !Array.isArray(data.consents)) {
    throw new Error('Invalid backup file')
  }
  if (data.settings) await saveSettings({ ...data.settings, id: 'app' })
  let count = 0
  for (const c of data.consents) {
    const { id: _id, ...rest } = c
    await db.consents.add(rest as Consent)
    count++
  }
  return count
}

export async function deleteAllData(): Promise<void> {
  await db.consents.clear()
  await db.settings.clear()
}
