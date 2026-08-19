import { useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { GRID } from '../../lib/classifier'
import { colors, spring } from '../../theme'

const THUMB = 44

/** A tiny read-only render of one drawing. */
function Thumb({ pixels, accent }) {
  const ref = useRef(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = THUMB * dpr
    canvas.height = THUMB * dpr
    const ctx = canvas.getContext('2d')
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, THUMB, THUMB)
    const cell = THUMB / GRID
    for (let i = 0; i < pixels.length; i++) {
      if (pixels[i] <= 0) continue
      ctx.globalAlpha = Math.min(pixels[i], 1)
      ctx.fillStyle = accent
      ctx.fillRect((i % GRID) * cell, Math.floor(i / GRID) * cell, cell, cell)
    }
  }, [pixels, accent])

  return <canvas ref={ref} style={{ width: THUMB, height: THUMB }} aria-hidden="true" />
}

/**
 * Everything the model has been shown, split by class. Counts are prominent
 * because "how many examples of each" is the variable the whole lesson turns on.
 */
export default function SampleTray({ samples, classes, onRemove }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {classes.map((cls) => {
        const mine = samples.filter((s) => s.label === cls.label)
        return (
          <div key={cls.label} className="rounded-panel border border-line bg-panel2/40 p-3">
            <div className="mb-3 flex items-baseline justify-between">
              <span
                className="font-mono text-[11px] uppercase tracking-[0.18em]"
                style={{ color: cls.hex }}
              >
                {cls.name}
              </span>
              <span className="readout">
                {mine.length} example{mine.length === 1 ? '' : 's'}
              </span>
            </div>

            <div className="flex min-h-[52px] flex-wrap gap-2">
              <AnimatePresence mode="popLayout">
                {mine.map((sample) => (
                  <motion.button
                    key={sample.id}
                    layout
                    type="button"
                    onClick={() => onRemove(sample.id)}
                    title="Remove this example"
                    aria-label={`Remove one ${cls.name} example`}
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.6 }}
                    transition={spring.snappy}
                    whileHover={{ scale: 1.08 }}
                    className="rounded border border-line bg-panel p-0.5 hover:border-spark/60"
                  >
                    <Thumb pixels={sample.raw} accent={cls.hex} />
                  </motion.button>
                ))}
              </AnimatePresence>

              {mine.length === 0 && (
                <p className="self-center text-sm text-mute">Nothing yet.</p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
