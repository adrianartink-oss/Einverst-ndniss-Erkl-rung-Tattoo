import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage, type PDFImage } from 'pdf-lib'
import i18n from '../i18n'
import { HEALTH_QUESTION_KEYS, type Consent, type Settings } from '../types'
import { dataURLtoBytes } from './download'
import { fullName, formatDate, formatDateTime } from './format'

const A4 = { w: 595.28, h: 841.89 }
const M = 48
const CONTENT_W = A4.w - M * 2

const INK = rgb(0.09, 0.08, 0.12)
const ROSE = rgb(0.88, 0.11, 0.47)
const LINE = rgb(0.8, 0.8, 0.85)
const MUTED = rgb(0.45, 0.45, 0.5)

/** Fold typographic punctuation to WinAnsi-safe characters (accents are kept). */
function pdfText(s: string): string {
  return String(s)
    .replace(/[‘’‚‹›]/g, "'")
    .replace(/[“”„]/g, '"')
    .replace(/[–—]/g, '-')
    .replace(/…/g, '...')
    .replace(/[  ]/g, ' ')
    .replace(/•/g, '-')
}

class Layout {
  y: number
  page: PDFPage
  constructor(
    private doc: PDFDocument,
    private font: PDFFont,
    private bold: PDFFont,
  ) {
    this.page = doc.addPage([A4.w, A4.h])
    this.y = A4.h - M
  }
  private addPage() {
    this.page = this.doc.addPage([A4.w, A4.h])
    this.y = A4.h - M
  }
  private ensure(h: number) {
    if (this.y - h < M + 26) this.addPage()
  }
  private lines(text: string, font: PDFFont, size: number, maxW: number): string[] {
    const out: string[] = []
    for (const para of String(text).split('\n')) {
      const words = para.split(/\s+/).filter(Boolean)
      if (words.length === 0) {
        out.push('')
        continue
      }
      let line = ''
      for (const w of words) {
        const test = line ? line + ' ' + w : w
        if (font.widthOfTextAtSize(pdfText(test), size) > maxW && line) {
          out.push(line)
          line = w
        } else {
          line = test
        }
      }
      if (line) out.push(line)
    }
    return out
  }
  spacer(h: number) {
    this.y -= h
  }
  paragraph(
    text: string,
    opts: { size?: number; bold?: boolean; color?: ReturnType<typeof rgb>; x?: number; maxW?: number; after?: number } = {},
  ) {
    const size = opts.size ?? 10
    const font = opts.bold ? this.bold : this.font
    const x = opts.x ?? M
    const maxW = opts.maxW ?? CONTENT_W - (x - M)
    const lh = size + 3.5
    for (const ln of this.lines(text, font, size, maxW)) {
      this.ensure(lh)
      this.page.drawText(pdfText(ln), { x, y: this.y - size, size, font, color: opts.color ?? INK })
      this.y -= lh
    }
    if (opts.after) this.y -= opts.after
  }
  heading(text: string) {
    this.spacer(8)
    this.ensure(22)
    this.paragraph(text, { size: 12.5, bold: true, color: ROSE, after: 1 })
    this.page.drawLine({
      start: { x: M, y: this.y + 3 },
      end: { x: A4.w - M, y: this.y + 3 },
      thickness: 0.5,
      color: LINE,
    })
    this.spacer(6)
  }
  kv(label: string, value: string) {
    if (!value) return
    const size = 10
    const l = label + ':  '
    const lw = this.bold.widthOfTextAtSize(pdfText(l), size)
    // Long labels (e.g. health questions) stack the value on the next line.
    if (lw > CONTENT_W * 0.5) {
      this.paragraph(l.trimEnd(), { size, bold: true })
      this.paragraph(value, { size, x: M + 12, after: 1 })
      return
    }
    const lh = size + 3.5
    const valueLines = this.lines(value, this.font, size, CONTENT_W - lw)
    this.ensure(lh)
    this.page.drawText(pdfText(l), { x: M, y: this.y - size, size, font: this.bold, color: INK })
    this.page.drawText(pdfText(valueLines[0] ?? ''), { x: M + lw, y: this.y - size, size, font: this.font, color: INK })
    this.y -= lh
    for (let i = 1; i < valueLines.length; i++) {
      this.ensure(lh)
      this.page.drawText(pdfText(valueLines[i]), { x: M + lw, y: this.y - size, size, font: this.font, color: INK })
      this.y -= lh
    }
  }
  bullet(text: string) {
    const size = 10
    const indent = 14
    const lh = size + 3.5
    const lns = this.lines(text, this.font, size, CONTENT_W - indent)
    this.ensure(lh)
    this.page.drawText('-', { x: M + 2, y: this.y - size, size, font: this.font, color: ROSE })
    this.page.drawText(pdfText(lns[0] ?? ''), { x: M + indent, y: this.y - size, size, font: this.font, color: INK })
    this.y -= lh
    for (let i = 1; i < lns.length; i++) {
      this.ensure(lh)
      this.page.drawText(pdfText(lns[i]), { x: M + indent, y: this.y - size, size, font: this.font, color: INK })
      this.y -= lh
    }
  }
  check(label: string, checked: boolean) {
    const size = 10
    const box = checked ? '[X] ' : '[  ] '
    const indent = this.bold.widthOfTextAtSize(box, size)
    const lh = size + 4
    const lns = this.lines(label, this.font, size, CONTENT_W - indent)
    this.ensure(lh)
    this.page.drawText(box, { x: M, y: this.y - size, size, font: this.bold, color: checked ? ROSE : MUTED })
    this.page.drawText(pdfText(lns[0] ?? ''), { x: M + indent, y: this.y - size, size, font: this.font, color: INK })
    this.y -= lh
    for (let i = 1; i < lns.length; i++) {
      this.ensure(lh)
      this.page.drawText(pdfText(lns[i]), { x: M + indent, y: this.y - size, size, font: this.font, color: INK })
      this.y -= lh
    }
  }
  header(settings: Settings, logo: PDFImage | null) {
    if (logo) {
      const d = logo.scale(1)
      const h = 42
      const w = (d.width * h) / d.height
      this.page.drawImage(logo, { x: A4.w - M - w, y: this.y - h, width: w, height: h })
    }
    const name = settings.studioName || settings.artistName
    if (name) this.paragraph(name, { size: 15, bold: true, maxW: CONTENT_W - 110 })
    const sub = [
      settings.studioName && settings.artistName ? settings.artistName : '',
      [settings.street, [settings.postalCode, settings.city].filter(Boolean).join(' '), settings.country]
        .filter(Boolean)
        .join(', '),
      [settings.email, settings.phone].filter(Boolean).join('   '),
      settings.vatOrRegistration,
    ].filter(Boolean)
    for (const line of sub) this.paragraph(line, { size: 8.5, color: MUTED })
    this.spacer(6)
    this.page.drawLine({
      start: { x: M, y: this.y },
      end: { x: A4.w - M, y: this.y },
      thickness: 1,
      color: ROSE,
    })
    this.spacer(10)
  }
  title(text: string, meta: string) {
    this.paragraph(text, { size: 18, bold: true, after: 2 })
    if (meta) this.paragraph(meta, { size: 8.5, color: MUTED })
    this.spacer(2)
  }
  signatures(items: { img: PDFImage | null; label: string; meta?: string }[]) {
    const gap = 22
    const boxW = (CONTENT_W - gap) / 2
    const boxH = 84
    this.ensure(boxH + 44)
    const top = this.y
    items.forEach((it, idx) => {
      const x = M + idx * (boxW + gap)
      const bottom = top - boxH
      this.page.drawRectangle({
        x,
        y: bottom,
        width: boxW,
        height: boxH,
        color: rgb(1, 1, 1),
        borderColor: LINE,
        borderWidth: 0.7,
      })
      if (it.img) {
        const d = it.img.scale(1)
        const scale = Math.min((boxW - 16) / d.width, (boxH - 16) / d.height, 1)
        const w = d.width * scale
        const h = d.height * scale
        this.page.drawImage(it.img, { x: x + (boxW - w) / 2, y: bottom + (boxH - h) / 2, width: w, height: h })
      }
      this.page.drawText(pdfText(it.label), { x, y: bottom - 14, size: 9, font: this.bold, color: INK })
      if (it.meta) this.page.drawText(pdfText(it.meta), { x, y: bottom - 26, size: 8, font: this.font, color: MUTED })
    })
    this.y = top - boxH - 40
  }
  finalizeFooters(text: string) {
    const pages = this.doc.getPages()
    pages.forEach((p, i) => {
      p.drawText(pdfText(text), { x: M, y: 26, size: 7, font: this.font, color: MUTED })
      const label = `${i + 1} / ${pages.length}`
      const w = this.font.widthOfTextAtSize(label, 7)
      p.drawText(label, { x: A4.w - M - w, y: 26, size: 7, font: this.font, color: MUTED })
    })
  }
}

async function embed(doc: PDFDocument, dataUrl: string): Promise<PDFImage | null> {
  if (!dataUrl || !dataUrl.startsWith('data:image')) return null
  try {
    const bytes = dataURLtoBytes(dataUrl)
    return dataUrl.startsWith('data:image/png') ? await doc.embedPng(bytes) : await doc.embedJpg(bytes)
  } catch {
    return null
  }
}

export async function generateConsentPdf(consent: Consent, settings: Settings): Promise<Uint8Array> {
  const t = i18n.getFixedT(consent.language)
  const lang = consent.language
  const doc = await PDFDocument.create()
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)

  const logo = await embed(doc, settings.logo)
  const custSig = await embed(doc, consent.signatures.customer)
  const artistSig = await embed(doc, consent.signatures.artist)

  const L = new Layout(doc, font, bold)
  L.header(settings, logo)
  L.title(t('pdf.documentTitle'), `${t('dashboard.createdOn')}: ${formatDateTime(consent.createdAt, lang)}`)

  // Person
  L.heading(t('pdf.person'))
  L.kv(t('pdf.name'), fullName(consent))
  L.kv(t('pdf.dob'), formatDate(consent.customer.dateOfBirth, lang))
  const address = [
    consent.customer.street,
    [consent.customer.postalCode, consent.customer.city].filter(Boolean).join(' '),
    consent.customer.country,
  ]
    .filter(Boolean)
    .join(', ')
  L.kv(t('pdf.address'), address)
  L.kv(t('pdf.contact'), [consent.customer.email, consent.customer.phone].filter(Boolean).join('   '))
  L.kv(t('pdf.idNumber'), consent.customer.idNumber)

  // Health
  L.heading(t('pdf.health'))
  L.paragraph(t('health.intro'), { size: 9, color: MUTED, after: 2 })
  for (const key of HEALTH_QUESTION_KEYS) {
    const ans = consent.health.answers[key]
    const val = ans === 'yes' ? t('pdf.yes') : ans === 'no' ? t('pdf.no') : t('view.noAnswer')
    L.kv(t(`health.q.${key}`), val)
  }
  L.kv(t('health.allergyDetails'), consent.health.allergyDetails)
  L.kv(t('health.medicationDetails'), consent.health.medicationDetails)
  L.kv(t('health.notes'), consent.health.notes)

  // Tattoo
  L.heading(t('pdf.tattoo'))
  L.kv(t('tattoo.motif'), consent.tattoo.motif)
  L.kv(t('tattoo.bodyLocation'), consent.tattoo.bodyLocation)
  L.kv(t('tattoo.size'), consent.tattoo.size)
  L.kv(t('tattoo.colors'), consent.tattoo.colors)
  L.kv(t('tattoo.sessionDate'), formatDate(consent.tattoo.sessionDate, lang))
  L.kv(t('tattoo.price'), consent.tattoo.price)

  // Information & consent
  L.heading(t('pdf.declarations'))
  L.paragraph(t('consentText.procedureTitle'), { size: 10.5, bold: true, after: 1 })
  L.paragraph(t('consentText.procedureBody'), { after: 4 })
  L.paragraph(t('consentText.risksTitle'), { size: 10.5, bold: true, after: 1 })
  L.paragraph(t('consentText.risksIntro'), { after: 2 })
  for (const r of t('consentText.risks', { returnObjects: true }) as string[]) L.bullet(r)
  L.spacer(2)
  L.paragraph(t('consentText.aftercareTitle'), { size: 10.5, bold: true, after: 1 })
  L.paragraph(t('consentText.aftercareBody'), { after: 6 })
  L.check(t('declarations.procedure'), consent.consents.procedure)
  L.check(t('declarations.risksUnderstood'), consent.consents.risksUnderstood)
  L.check(t('declarations.truthful'), consent.consents.truthful)
  L.check(t('declarations.noRevocationAfter'), consent.consents.noRevocationAfter)

  // Additional
  if (consent.selectedClauses.length > 0 || consent.customClauseText.trim()) {
    L.heading(t('pdf.additional'))
    for (const c of consent.selectedClauses) {
      L.paragraph(c.title, { size: 10, bold: true, after: 1 })
      L.paragraph(c.text, { after: 4 })
    }
    if (consent.customClauseText.trim()) L.paragraph(consent.customClauseText, { after: 2 })
  }

  // Privacy
  L.heading(t('pdf.privacy'))
  const controller =
    [settings.studioName, settings.artistName].filter(Boolean).join(' – ') || t('privacy.controllerFallback')
  L.kv(t('privacy.controllerLabel'), controller)
  L.paragraph(`${t('privacy.purposeTitle')}: ${t('privacy.purposeBody')}`, { size: 9, after: 2 })
  L.paragraph(`${t('privacy.legalBasisTitle')}: ${t('privacy.legalBasisBody')}`, { size: 9, after: 2 })
  L.paragraph(`${t('privacy.retentionTitle')}: ${settings.retentionInfo || t('privacy.retentionFallback')}`, {
    size: 9,
    after: 2,
  })
  L.paragraph(`${t('privacy.rightsTitle')}: ${t('privacy.rightsBody')} ${t('privacy.withdrawalBody')}`, {
    size: 9,
    after: 4,
  })
  L.check(t('privacy.consentCheckbox'), consent.consents.dataProcessing)
  if (consent.consents.imageRights) L.check(t('privacy.imageRightsCheckbox'), true)

  // Signatures
  L.heading(t('pdf.signatures'))
  const meta = [
    consent.signatures.place ? `${t('pdf.place')}: ${consent.signatures.place}` : '',
    consent.signatures.date ? `${t('pdf.date')}: ${formatDate(consent.signatures.date, lang)}` : '',
  ]
    .filter(Boolean)
    .join('   ')
  if (meta) L.paragraph(meta, { size: 9, color: MUTED, after: 6 })
  L.signatures([
    { img: custSig, label: t('pdf.customer'), meta: fullName(consent) },
    { img: artistSig, label: t('pdf.artist'), meta: settings.artistName || settings.studioName },
  ])

  L.finalizeFooters(t('pdf.generated'))
  return doc.save()
}
