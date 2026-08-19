// Single source of truth for motion + accent tokens.
// Colors are mirrored in tailwind.config.js; these are for canvas/SVG work,
// where Tailwind classes can't reach.

export const colors = {
  void: '#08080F',
  panel: '#10101F',
  panel2: '#161628',
  line: '#252540',
  ink: '#E9E9F6',
  mute: '#8B8BAA',
  signal: '#22D3EE',
  spark: '#F472B6',
  charge: '#A3E635',
}

// One accent per lesson, so each has its own identity while sharing a system.
export const accents = {
  signal: { hex: colors.signal, text: 'text-signal', bg: 'bg-signal', border: 'border-signal' },
  spark: { hex: colors.spark, text: 'text-spark', bg: 'bg-spark', border: 'border-spark' },
  charge: { hex: colors.charge, text: 'text-charge', bg: 'bg-charge', border: 'border-charge' },
}

// Springs, not linear ramps — everything should feel like it has weight.
export const spring = {
  snappy: { type: 'spring', stiffness: 520, damping: 32 },
  soft: { type: 'spring', stiffness: 220, damping: 26 },
  lazy: { type: 'spring', stiffness: 120, damping: 20 },
}

export const ease = {
  out: [0.22, 1, 0.36, 1],
  inOut: [0.65, 0, 0.35, 1],
}

export const duration = {
  fast: 0.16,
  base: 0.28,
  slow: 0.5,
}

// Shared entrance for stacked content.
export const stagger = (delayChildren = 0, staggerChildren = 0.07) => ({
  hidden: {},
  show: { transition: { delayChildren, staggerChildren } },
})

export const riseIn = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: duration.slow, ease: ease.out } },
}
