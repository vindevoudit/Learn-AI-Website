import { useCallback, useEffect, useRef } from 'react'
import { EMPTY, LAVA, WALL, toXY } from '../../lib/grid'
import { colors } from '../../theme'

/**
 * Draws a grid world and lets you paint on it.
 *
 * Both maze lessons render through this. Each one supplies its own `overlay`
 * to draw on top — a spreading search frontier in one, a robot's learned
 * opinions in the other — so the world looks identical in both and only the
 * thing being taught differs.
 *
 * `version` is how an animating parent asks for a repaint without this
 * component needing to know what changed.
 */
export default function GridCanvas({
  grid,
  overlay,
  version = 0,
  onPaint,
  paintMode = null,
  ariaLabel = 'Maze grid',
  maxHeight = 420,
}) {
  const canvasRef = useRef(null)
  const geometryRef = useRef({ cell: 20, offsetX: 0, offsetY: 0 })
  const paintingRef = useRef(false)
  const lastCellRef = useRef(-1)

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    if (!rect.width) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    if (canvas.width !== Math.round(rect.width * dpr) || canvas.height !== Math.round(rect.height * dpr)) {
      canvas.width = Math.round(rect.width * dpr)
      canvas.height = Math.round(rect.height * dpr)
    }

    const ctx = canvas.getContext('2d')
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, rect.width, rect.height)

    // Square cells, centred — a stretched maze would misrepresent distance,
    // which matters when the whole lesson is about distance.
    const cell = Math.floor(Math.min(rect.width / grid.cols, rect.height / grid.rows))
    const offsetX = Math.floor((rect.width - cell * grid.cols) / 2)
    const offsetY = Math.floor((rect.height - cell * grid.rows) / 2)
    geometryRef.current = { cell, offsetX, offsetY }

    const px = (i) => offsetX + (i % grid.cols) * cell
    const py = (i) => offsetY + Math.floor(i / grid.cols) * cell

    for (let i = 0; i < grid.cells.length; i++) {
      const type = grid.cells[i]
      ctx.fillStyle = type === WALL ? colors.line : colors.panel2
      ctx.fillRect(px(i), py(i), cell - 1, cell - 1)

      if (type === LAVA) {
        const x = px(i)
        const y = py(i)
        ctx.save()
        ctx.beginPath()
        ctx.rect(x, y, cell - 1, cell - 1)
        ctx.clip()
        ctx.globalAlpha = 0.45
        ctx.fillStyle = colors.spark
        ctx.fillRect(x, y, cell - 1, cell - 1)
        // Hazard stripes, so lava is a texture rather than just a colour.
        ctx.globalAlpha = 0.75
        ctx.strokeStyle = colors.void
        ctx.lineWidth = 2
        for (let d = -cell; d < cell * 2; d += 6) {
          ctx.beginPath()
          ctx.moveTo(x + d, y)
          ctx.lineTo(x + d - cell, y + cell)
          ctx.stroke()
        }
        ctx.restore()
        ctx.globalAlpha = 1
      }
    }

    if (overlay) {
      overlay(ctx, { cell, offsetX, offsetY, px, py, grid })
    }

    // Start and goal sit above the overlay so a search can never bury them.
    const marker = (i, color, filled) => {
      const x = px(i)
      const y = py(i)
      ctx.strokeStyle = color
      ctx.fillStyle = color
      ctx.lineWidth = 2
      if (filled) {
        ctx.globalAlpha = 0.85
        ctx.fillRect(x + 2, y + 2, cell - 5, cell - 5)
        ctx.globalAlpha = 1
      } else {
        ctx.strokeRect(x + 2.5, y + 2.5, cell - 6, cell - 6)
      }
    }
    marker(grid.start, colors.charge, false)
    marker(grid.goal, colors.signal, true)
  }, [grid, overlay])

  useEffect(() => {
    draw()
  }, [draw, version])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const observer = new ResizeObserver(() => draw())
    observer.observe(canvas)
    return () => observer.disconnect()
  }, [draw])

  const cellFromEvent = (e) => {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const { cell, offsetX, offsetY } = geometryRef.current
    const x = Math.floor((e.clientX - rect.left - offsetX) / cell)
    const y = Math.floor((e.clientY - rect.top - offsetY) / cell)
    if (x < 0 || y < 0 || x >= grid.cols || y >= grid.rows) return -1
    return y * grid.cols + x
  }

  const handlePaint = (e) => {
    if (!onPaint || !paintMode) return
    const i = cellFromEvent(e)
    // Dragging across one cell fires many pointermove events; only act on change.
    if (i < 0 || i === lastCellRef.current) return
    lastCellRef.current = i
    onPaint(i)
  }

  const interactive = Boolean(onPaint && paintMode)

  return (
    <canvas
      ref={canvasRef}
      className={`block w-full rounded-panel border border-line bg-void ${
        interactive ? 'cursor-crosshair' : ''
      }`}
      style={{
        aspectRatio: `${grid.cols} / ${grid.rows}`,
        maxHeight,
        maxWidth: (maxHeight * grid.cols) / grid.rows,
        margin: '0 auto',
        touchAction: 'none',
      }}
      role="img"
      aria-label={ariaLabel}
      onPointerDown={(e) => {
        if (!interactive) return
        paintingRef.current = true
        lastCellRef.current = -1
        e.currentTarget.setPointerCapture(e.pointerId)
        handlePaint(e)
      }}
      onPointerMove={(e) => paintingRef.current && handlePaint(e)}
      onPointerUp={() => {
        paintingRef.current = false
        lastCellRef.current = -1
      }}
      onPointerLeave={() => {
        paintingRef.current = false
        lastCellRef.current = -1
      }}
    />
  )
}

/** Shared helper: which cell types a lesson lets you paint. */
export const PAINT_MODES = [
  { id: WALL, label: 'Wall', hint: 'blocks the way' },
  { id: LAVA, label: 'Lava', hint: 'deadly to the robot' },
  { id: EMPTY, label: 'Erase', hint: 'clear a square' },
]
