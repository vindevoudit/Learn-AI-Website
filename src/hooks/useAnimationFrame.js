import { useEffect, useRef } from 'react'

/**
 * Runs `callback(deltaSeconds, elapsedSeconds)` once per frame.
 * Cancels on unmount and pauses when the tab is hidden, so navigating away
 * from a lesson never leaves a loop burning CPU.
 *
 * `active` toggles the loop without tearing down the component.
 */
export function useAnimationFrame(callback, active = true) {
  const savedCallback = useRef(callback)
  savedCallback.current = callback

  useEffect(() => {
    if (!active) return

    let frame
    let last = performance.now()
    let elapsed = 0
    let stopped = false

    const loop = (now) => {
      if (stopped) return
      // Clamp: a backgrounded tab can produce a multi-second delta that
      // would make simulations jump.
      const delta = Math.min((now - last) / 1000, 0.05)
      last = now
      elapsed += delta
      savedCallback.current(delta, elapsed)
      frame = requestAnimationFrame(loop)
    }

    const onVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(frame)
      } else {
        last = performance.now()
        frame = requestAnimationFrame(loop)
      }
    }

    frame = requestAnimationFrame(loop)
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      stopped = true
      cancelAnimationFrame(frame)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [active])
}
