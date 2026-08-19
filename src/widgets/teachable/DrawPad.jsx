import { useCallback, useEffect, useRef } from 'react'
import { GRID } from '../../lib/classifier'
import { colors } from '../../theme'

const CELL = 17
const SIZE = GRID * CELL

/** Paints a soft dot: full strength at the centre, half on the neighbours. */
function paint(pixels, cx, cy) {
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const x = cx + dx
      const y = cy + dy
      if (x < 0 || y < 0 || x >= GRID || y >= GRID) continue
      const strength = dx === 0 && dy === 0 ? 1 : 0.55
      const i = y * GRID + x
      if (pixels[i] < strength) pixels[i] = strength
    }
  }
}

/**
 * A 16x16 drawing grid. Low resolution on purpose: at this size a student can
 * see every number the model is given, which is the point of the lesson.
 *
 * Pointer to draw. Preset stamps exist so the lesson is completable without a
 * mouse — a freehand canvas is otherwise a dead end for keyboard users.
 */
export default function DrawPad({ pixels, onChange, accent = colors.spark, label = 'Drawing pad' }) {
  const canvasRef = useRef(null)
  const drawing = useRef(false)

  const render = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    if (canvas.width !== SIZE * dpr) {
      canvas.width = SIZE * dpr
      canvas.height = SIZE * dpr
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, SIZE, SIZE)

    for (let y = 0; y < GRID; y++) {
      for (let x = 0; x < GRID; x++) {
        const value = pixels[y * GRID + x]
        const px = x * CELL
        const py = y * CELL

        ctx.fillStyle = colors.panel2
        ctx.fillRect(px + 1, py + 1, CELL - 2, CELL - 2)

        if (value > 0) {
          ctx.globalAlpha = Math.min(value, 1)
          ctx.fillStyle = accent
          ctx.fillRect(px + 1, py + 1, CELL - 2, CELL - 2)
          ctx.globalAlpha = 1
        }
      }
    }
  }, [pixels, accent])

  useEffect(render, [render])

  const cellFromEvent = (e) => {
    const rect = canvasRef.current.getBoundingClientRect()
    const x = Math.floor(((e.clientX - rect.left) / rect.width) * GRID)
    const y = Math.floor(((e.clientY - rect.top) / rect.height) * GRID)
    return { x, y }
  }

  const handleDraw = (e) => {
    const { x, y } = cellFromEvent(e)
    if (x < 0 || y < 0 || x >= GRID || y >= GRID) return
    const next = Float64Array.from(pixels)
    paint(next, x, y)
    onChange(next)
  }

  return (
    <div>
      <canvas
        ref={canvasRef}
        style={{ width: '100%', maxWidth: SIZE, aspectRatio: '1 / 1', touchAction: 'none' }}
        className="cursor-crosshair rounded-panel border border-line bg-void"
        role="img"
        aria-label={label}
        onPointerDown={(e) => {
          drawing.current = true
          e.currentTarget.setPointerCapture(e.pointerId)
          handleDraw(e)
        }}
        onPointerMove={(e) => drawing.current && handleDraw(e)}
        onPointerUp={() => (drawing.current = false)}
        onPointerLeave={() => (drawing.current = false)}
      />
    </div>
  )
}
