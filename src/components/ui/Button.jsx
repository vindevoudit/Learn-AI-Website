import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { spring } from '../../theme'

const variants = {
  primary: 'bg-signal text-void hover:bg-signal/90 font-medium',
  spark: 'bg-spark text-void hover:bg-spark/90 font-medium',
  charge: 'bg-charge text-void hover:bg-charge/90 font-medium',
  ghost: 'border border-line bg-panel text-ink hover:border-mute/50 hover:bg-panel2',
  quiet: 'text-mute hover:text-ink',
}

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
}

/**
 * One button, three surfaces: router link, anchor, or plain button.
 * Press feedback is a scale spring — cheap, and it makes the UI feel physical.
 */
export default function Button({
  children,
  to,
  href,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  ...props
}) {
  const classes = `inline-flex items-center justify-center gap-2 rounded-panel transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${variants[variant]} ${sizes[size]} ${className}`

  const motionProps = disabled
    ? {}
    : { whileHover: { scale: 1.03 }, whileTap: { scale: 0.97 }, transition: spring.snappy }

  if (to) {
    return (
      <motion.div {...motionProps} className="inline-flex">
        <Link to={to} className={classes} {...props}>
          {children}
        </Link>
      </motion.div>
    )
  }

  if (href) {
    return (
      <motion.a href={href} className={classes} {...motionProps} {...props}>
        {children}
      </motion.a>
    )
  }

  return (
    <motion.button type="button" className={classes} disabled={disabled} {...motionProps} {...props}>
      {children}
    </motion.button>
  )
}
