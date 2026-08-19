import { useCallback, useEffect, useRef, useState } from 'react'
import GridCanvas from './GridCanvas'
import { useAnimationFrame } from '../../hooks/useAnimationFrame'
import { useMotionScale } from '../../hooks/useReducedMotion'
import { createSearch } from '../../lib/pathfinding'
import { colors } from '../../theme'

/**
 * One running search, drawn on top of the maze.
 *
 * Dim blue  = squares already checked
 * Green     = the frontier, the edge of what it knows
 * Bright    = the route it settled on
 *
 * `runToken` is how a parent starts it: change the number and the search
 * restarts from scratch. That lets the race step start two of these in lockstep.
 */
export default function SearchView({
  grid,
  algorithmId,
  runToken = 0,
  speed = 6,
  autoRun = true,
  onStats,
  onPaint,
  paintMode,
  maxHeight = 420,
  ariaLabel,
}) {
  const searchRef = useRef(null)
  const [version, setVersion] = useState(0)
  const [running, setRunning] = useState(false)
  const motionScale = useMotionScale()

  const publish = useCallback(
    (search) => {
      const { expanded, done, found, path } = search.state
      onStats?.({ expanded, done, found, length: path ? path.length - 1 : null })
    },
    [onStats],
  )

  const reset = useCallback(
    (start) => {
      const search = createSearch(grid, algorithmId)
      searchRef.current = search
      setVersion((v) => v + 1)
      setRunning(start)
      publish(search)
    },
    [grid, algorithmId, publish],
  )

  // Restart whenever the maze, the algorithm, or the run token changes.
  useEffect(() => {
    reset(autoRun)
  }, [reset, runToken, autoRun])

  useAnimationFrame(() => {
    const search = searchRef.current
    if (!search) return

    // Reduced motion slows the search rather than removing it: the spreading
    // frontier IS the lesson, so it has to stay visible.
    const perFrame = Math.max(1, Math.round(speed * motionScale))
    let alive = true
    for (let i = 0; i < perFrame && alive; i++) alive = search.step()

    setVersion((v) => v + 1)
    publish(search)
    if (!alive) setRunning(false)
  }, running)

  const overlay = useCallback(
    (ctx, { cell, px, py }) => {
      const search = searchRef.current
      if (!search) return
      const { visited, inFrontier, path, current } = search.state

      for (let i = 0; i < visited.length; i++) {
        if (!visited[i] && !inFrontier[i]) continue
        ctx.globalAlpha = visited[i] ? 0.22 : 0.45
        ctx.fillStyle = visited[i] ? colors.signal : colors.charge
        ctx.fillRect(px(i), py(i), cell - 1, cell - 1)
      }

      if (path) {
        ctx.globalAlpha = 0.95
        ctx.fillStyle = colors.signal
        for (const i of path) {
          ctx.fillRect(px(i) + 1, py(i) + 1, cell - 3, cell - 3)
        }
      } else if (current != null) {
        ctx.globalAlpha = 1
        ctx.fillStyle = colors.ink
        ctx.fillRect(px(current) + 1, py(current) + 1, cell - 3, cell - 3)
      }

      ctx.globalAlpha = 1
    },
    // version is the repaint trigger; the drawing reads from the ref.
    [version],
  )

  return (
    <GridCanvas
      grid={grid}
      overlay={overlay}
      version={version}
      onPaint={onPaint}
      paintMode={paintMode}
      maxHeight={maxHeight}
      ariaLabel={ariaLabel ?? 'Maze with the search spreading across it'}
    />
  )
}
