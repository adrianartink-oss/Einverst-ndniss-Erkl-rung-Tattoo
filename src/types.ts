export type Language = 'de' | 'en' | 'es' | 'pt'

export const LANGUAGES: Language[] = ['de', 'en', 'es', 'pt']

export type YesNo = 'yes' | 'no' | ''

/** Keys of the health questionnaire. Labels come from i18n (health.q.<key>). */
export const HEALTH_QUESTION_KEYS = [
  'diabetes',
  'heartCirculatory',
  'epilepsy',
  'bloodClotting',
  'bloodThinners',
  'infectiousDisease',
  'skinDisease',
  'allergies',
  'immuneDisorder',
  'pregnantNursing',
  'keloidScarring',
  'medication',
  'alcoholDrugs24h',
] as const
export type HealthQuestionKey = (typeof HEALTH_QUESTION_KEYS)[number]

export interface Customer {
  firstName: string
  lastName: string
  dateOfBirth: string // ISO yyyy-mm-dd
  email: string
  phone: string
  street: string
  postalCode: string
  city: string
  country: string
  idNumber: string
}

export interface Health {
  answers: Record<string, YesNo>
  allergyDetails: string
  medicationDetails: string
  notes: string
}

export interface Tattoo {
  motif: string
  bodyLocation: string
  size: string
  colors: string
  sessionDate: string // ISO
  price: string
}

export interface ConsentFlags {
  procedure: boolean
  risksUnderstood: boolean
  truthful: boolean
  noRevocationAfter: boolean
  dataProcessing: boolean
  imageRights: boolean // optional / opt-in
}

export interface AdditionalClause {
  id: string
  title: string
  text: string
}

export interface Signatures {
  customer: string // dataURL PNG
  artist: string // dataURL PNG
  place: string
  date: string // ISO
}

export interface Consent {
  id?: number
  createdAt: number
  updatedAt: number
  language: Language
  customer: Customer
  health: Health
  tattoo: Tattoo
  consents: ConsentFlags
  selectedClauses: AdditionalClause[]
  customClauseText: string
  signatures: Signatures
}

export interface ClauseTemplate {
  id: string
  title: string
  text: string
  enabledByDefault: boolean
}

export interface Settings {
  id: 'app'
  studioName: string
  artistName: string
  street: string
  postalCode: string
  city: string
  country: string
  email: string
  phone: string
  vatOrRegistration: string
  logo: string // dataURL
  defaultLanguage: Language
  retentionInfo: string
  clauseTemplates: ClauseTemplate[]
}

export function emptyCustomer(): Customer {
  return {
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    email: '',
    phone: '',
    street: '',
    postalCode: '',
    city: '',
    country: '',
    idNumber: '',
  }
}

export function emptyHealth(): Health {
  return { answers: {}, allergyDetails: '', medicationDetails: '', notes: '' }
}

export function emptyTattoo(): Tattoo {
  return { motif: '', bodyLocation: '', size: '', colors: '', sessionDate: '', price: '' }
}

export function emptyConsentFlags(): ConsentFlags {
  return {
    procedure: false,
    risksUnderstood: false,
    truthful: false,
    noRevocationAfter: false,
    dataProcessing: false,
    imageRights: false,
  }
}

export function emptySignatures(): Signatures {
  return { customer: '', artist: '', place: '', date: '' }
}

export function newConsent(language: Language): Consent {
  const now = Date.now()
  return {
    createdAt: now,
    updatedAt: now,
    language,
    customer: emptyCustomer(),
    health: emptyHealth(),
    tattoo: emptyTattoo(),
    consents: emptyConsentFlags(),
    selectedClauses: [],
    customClauseText: '',
    signatures: emptySignatures(),
  }
}
