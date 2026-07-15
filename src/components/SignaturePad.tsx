import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import SignaturePadLib from 'signature_pad'
import { useTranslation } from 'react-i18next'

export interface SignaturePadHandle {
  isEmpty: () => boolean
  toDataURL: () => string
  clear: () => void
}

/**
 * A live drawing surface. It never commits on its own — lifting the finger or
 * Apple Pencil does NOT save. The parent reads the result via the ref (on an
 * explicit confirm) and uses `onInkChange` only to know whether anything has
 * been drawn yet. signature_pad uses Pointer Events, so Apple Pencil works.
 */
export const SignaturePad = forwardRef<
  SignaturePadHandle,
  { onInkChange?: (hasInk: boolean) => void; invalid?: boolean }
>(function SignaturePad({ onInkChange, invalid }, ref) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const padRef = useRef<SignaturePadLib | null>(null)
  const onInkRef = useRef(onInkChange)
  onInkRef.current = onInkChange

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const pad = new SignaturePadLib(canvas, {
      penColor: '#12101a',
      backgroundColor: 'rgba(255,255,255,0)', // transparent → clean PDF embedding
      minWidth: 0.9,
      maxWidth: 2.6,
    })
    padRef.current = pad

    const resize = () => {
      const ratio = Math.max(window.devicePixelRatio || 1, 1)
      const data = pad.toData()
      canvas.width = canvas.offsetWidth * ratio
      canvas.height = canvas.offsetHeight * ratio
      const ctx = canvas.getContext('2d')
      if (ctx) ctx.scale(ratio, ratio)
      pad.clear()
      pad.fromData(data)
    }
    resize()

    const report = () => onInkRef.current?.(!pad.isEmpty())
    pad.addEventListener('beginStroke', report)
    pad.addEventListener('endStroke', report)
    window.addEventListener('resize', resize)
    window.addEventListener('orientationchange', resize)

    return () => {
      window.removeEventListener('resize', resize)
      window.removeEventListener('orientationchange', resize)
      pad.removeEventListener('beginStroke', report)
      pad.removeEventListener('endStroke', report)
      pad.off()
    }
  }, [])

  useImperativeHandle(ref, () => ({
    isEmpty: () => padRef.current?.isEmpty() ?? true,
    toDataURL: () => padRef.current?.toDataURL('image/png') ?? '',
    clear: () => {
      padRef.current?.clear()
      onInkRef.current?.(false)
    },
  }))

  const { t } = useTranslation()

  return (
    <div
      className={`relative rounded-xl border-2 bg-white ${
        invalid ? 'border-red-400' : 'border-ink-400'
      }`}
    >
      <canvas ref={canvasRef} className="h-56 w-full touch-none" style={{ touchAction: 'none' }} />
      <span className="pointer-events-none absolute inset-x-0 bottom-2 text-center text-xs text-ink-400">
        {t('signatures.signHere')}
      </span>
    </div>
  )
})
