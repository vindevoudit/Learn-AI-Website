import { useReducedMotion as useFramerReducedMotion } from 'framer-motion'

/**
 * True when the visitor asked their OS to reduce motion.
 *
 * Ambient/decorative motion is switched off entirely when this is true.
 * Instructional motion (a signal travelling a wire, a bar growing) is *content*
 * here, so it slows and simplifies instead of disappearing — see `motionScale`.
 */
export function useReducedMotion() {
  return useFramerReducedMotion() ?? false
}

/** Multiplier for instructional animation speed. */
export function useMotionScale() {
  return useReducedMotion() ? 0.35 : 1
}
