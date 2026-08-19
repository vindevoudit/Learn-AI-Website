import { motion } from 'framer-motion'
import { duration, ease } from '../../theme'
import { useReducedMotion } from '../../hooks/useReducedMotion'

/** Wraps every page so route changes cross-fade instead of snapping. */
export default function PageTransition({ children, className = '' }) {
  const reduced = useReducedMotion()

  return (
    <motion.div
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduced ? { opacity: 0 } : { opacity: 0, y: -8 }}
      transition={{ duration: duration.base, ease: ease.out }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
