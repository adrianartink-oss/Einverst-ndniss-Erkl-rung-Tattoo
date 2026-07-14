import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import SignaturePadLib from 'signature_pad'
import { useTranslation } from 'react-i18next'

export interface SignaturePadHandle {
  isEmpty: () => boolean
  toDataURL: () => string
  clear: () => void
}

export const SignaturePad = forwardRef<SignaturePadHandle, { onEnd?: () => void; invalid?: boolean }>(
  function SignaturePad({ onEnd, invalid }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const padRef = useRef<SignaturePadLib | null>(null)
    const onEndRef = useRef(onEnd)
    onEndRef.current = onEnd

    useEffect(() => {
      const canvas = canvasRef.current
      if (!canvas) return
      const pad = new SignaturePadLib(canvas, {
        penColor: '#12101a',
        backgroundColor: 'rgba(255,255,255,0)',
        minWidth: 0.9,
        maxWidth: 2.4,
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

      const handleEnd = () => onEndRef.current?.()
      pad.addEventListener('endStroke', handleEnd)
      window.addEventListener('resize', resize)
      window.addEventListener('orientationchange', resize)

      return () => {
        window.removeEventListener('resize', resize)
        window.removeEventListener('orientationchange', resize)
        pad.removeEventListener('endStroke', handleEnd)
        pad.off()
      }
    }, [])

    useImperativeHandle(ref, () => ({
      isEmpty: () => padRef.current?.isEmpty() ?? true,
      toDataURL: () => padRef.current?.toDataURL('image/png') ?? '',
      clear: () => padRef.current?.clear(),
    }))

    const { t } = useTranslation()

    return (
      <div
        className={`relative rounded-xl border-2 border-dashed bg-white ${
          invalid ? 'border-red-400' : 'border-ink-400'
        }`}
      >
        <canvas ref={canvasRef} className="h-44 w-full" style={{ touchAction: 'none' }} />
        <span className="pointer-events-none absolute inset-x-0 bottom-2 text-center text-xs text-ink-400">
          {t('signatures.signHere')}
        </span>
      </div>
    )
  },
)
