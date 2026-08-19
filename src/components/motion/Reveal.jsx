import { motion } from 'framer-motion'
import { duration, ease } from '../../theme'
import { useReducedMotion } from '../../hooks/useReducedMotion'

/** Scroll-triggered entrance. Fires once, so scrolling back up isn't busy. */
export default function Reveal({ children, delay = 0, y = 18, className = '', as = 'div' }) {
  const reduced = useReducedMotion()
  const MotionTag = motion[as] ?? motion.div

  return (
    <MotionTag
      initial={reduced ? { opacity: 0 } : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: duration.slow, ease: ease.out, delay: reduced ? 0 : delay }}
      className={className}
    >
      {children}
    </MotionTag>
  )
}
