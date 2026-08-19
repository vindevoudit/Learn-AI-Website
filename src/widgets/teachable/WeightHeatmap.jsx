import { useEffect, useRef } from 'react'
import { GRID, weightRange } from '../../lib/classifier'
import { colors } from '../../theme'

const SIZE = 160
const CELL = SIZE / GRID

/**
 * What the model actually learned, drawn back onto the same grid the student
 * drew on: one colour where a lit pixel is evidence for the first class, the
 * other where it's evidence for the second.
 *
 * This is the payoff of using plain logistic regression instead of a library —
 * the "brain" is small enough to look straight at.
 */
export default function WeightHeatmap({ model, classes }) {
  const ref = useRef(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = SIZE * dpr
    canvas.height = SIZE * dpr
    const ctx = canvas.getContext('2d')
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    const range = weightRange(model)
    ctx.fillStyle = colors.panel2
    ctx.fillRect(0, 0, SIZE, SIZE)

    for (let i = 0; i < model.w.length; i++) {
      const weight = model.w[i] / range
      if (Math.abs(weight) < 0.02) continue
      ctx.globalAlpha = Math.min(Math.abs(weight), 1) * 0.95
      ctx.fillStyle = weight > 0 ? classes[1].hex : classes[0].hex
      ctx.fillRect((i % GRID) * CELL, Math.floor(i / GRID) * CELL, CELL, CELL)
    }
    ctx.globalAlpha = 1
  }, [model, model.epoch, classes])

  return (
    <div className="w-full max-w-[200px]">
      <canvas
        ref={ref}
        style={{ width: '100%', maxWidth: SIZE, aspectRatio: '1 / 1' }}
        className="rounded-panel border border-line"
        role="img"
        aria-label="Heatmap of the learned weights, drawn over the same grid used for drawing."
      />
      <p className="mt-3 text-sm leading-relaxed text-mute">
        Pixels in{' '}
        <span style={{ color: classes[0].hex }}>{classes[0].name.toLowerCase()}</span> push the guess
        one way; pixels in{' '}
        <span style={{ color: classes[1].hex }}>{classes[1].name.toLowerCase()}</span> push it the
        other. Grey pixels the model has decided not to care about.
      </p>
    </div>
  )
}
