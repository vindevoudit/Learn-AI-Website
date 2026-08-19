import { useCallback } from 'react'
import GridCanvas from './GridCanvas'
import { ACTIONS, bestAction, maxAbsQ, qAt } from '../../lib/qlearning'
import { WALL } from '../../lib/grid'
import { colors } from '../../theme'

/**
 * The robot's opinions, drawn straight onto the floor.
 *
 * Each square is split into four triangles, one per direction, shaded by how
 * good the robot currently thinks that move is — green for promising, pink for
 * regretted. The arrow is whichever direction currently wins.
 *
 * Watching green seep backwards from the goal, square by square, is the clearest
 * picture of learning anywhere on this site: the robot is not told the route, it
 * works out that squares near the goal are worth being on, then that squares
 * near *those* are worth being on, and so on.
 */
export default function PolicyView({ grid, brain, version, robotAt, route, onPaint, paintMode }) {
  const overlay = useCallback(
    (ctx, { cell, px, py }) => {
      const scale = maxAbsQ(brain)

      for (let i = 0; i < grid.cells.length; i++) {
        if (grid.cells[i] === WALL) continue
        const x = px(i)
        const y = py(i)
        const cx = x + cell / 2
        const cy = y + cell / 2

        for (let a = 0; a < ACTIONS.length; a++) {
          const value = qAt(brain, i, a) / scale
          if (Math.abs(value) < 0.02) continue

          // Triangle from the centre out towards that direction's edge.
          const { dx, dy } = ACTIONS[a]
          const ex = cx + (dx * cell) / 2
          const ey = cy + (dy * cell) / 2
          // Perpendicular, to give the triangle its width.
          const wx = (dy * cell) / 2
          const wy = (dx * cell) / 2

          ctx.globalAlpha = Math.min(Math.abs(value), 1) * 0.75
          ctx.fillStyle = value > 0 ? colors.charge : colors.spark
          ctx.beginPath()
          ctx.moveTo(cx, cy)
          ctx.lineTo(ex + wx, ey + wy)
          ctx.lineTo(ex - wx, ey - wy)
          ctx.closePath()
          ctx.fill()
        }
      }
      ctx.globalAlpha = 1

      // The plan it would actually follow.
      if (route && route.length > 1) {
        ctx.strokeStyle = colors.ink
        ctx.lineWidth = Math.max(2, cell * 0.16)
        ctx.lineJoin = 'round'
        ctx.lineCap = 'round'
        ctx.globalAlpha = 0.9
        ctx.beginPath()
        route.forEach((i, n) => {
          const x = px(i) + cell / 2
          const y = py(i) + cell / 2
          if (n === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        })
        ctx.stroke()
        ctx.globalAlpha = 1
      }

      // The robot itself, when an episode is being watched at human speed.
      if (robotAt != null) {
        ctx.fillStyle = colors.ink
        ctx.beginPath()
        ctx.arc(px(robotAt) + cell / 2, py(robotAt) + cell / 2, Math.max(3, cell * 0.3), 0, Math.PI * 2)
        ctx.fill()
      }
    },
    [grid, brain, version, robotAt, route],
  )

  return (
    <GridCanvas
      grid={grid}
      overlay={overlay}
      version={version}
      onPaint={onPaint}
      paintMode={paintMode}
      ariaLabel="Maze showing which direction the robot currently prefers on each square"
    />
  )
}

/** Small legend so the triangles aren't a mystery. */
export function PolicyLegend() {
  return (
    <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-mute">
      <span className="flex items-center gap-2">
        <span className="inline-block h-3 w-3 rounded-sm" style={{ background: colors.charge }} />
        worth going this way
      </span>
      <span className="flex items-center gap-2">
        <span className="inline-block h-3 w-3 rounded-sm" style={{ background: colors.spark }} />
        regrets going this way
      </span>
      <span className="flex items-center gap-2">
        <span className="inline-block h-3 w-1 rounded-sm bg-ink" />
        the plan it would follow now
      </span>
    </div>
  )
}
