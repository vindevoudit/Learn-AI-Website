import { colors } from '../../theme'

const tones = {
  signal: colors.signal,
  spark: colors.spark,
  charge: colors.charge,
}

/**
 * A short aside pinned to an accent bar. Used for the one thing in a step that
 * a student should leave remembering.
 */
export default function Callout({ title, tone = 'signal', children, className = '' }) {
  const hex = tones[tone] ?? tones.signal

  return (
    <aside
      className={`rounded-panel border border-line bg-panel/60 p-4 ${className}`}
      style={{ borderLeft: `2px solid ${hex}` }}
    >
      {title && (
        <p
          className="mb-1 font-mono text-[11px] uppercase tracking-[0.18em]"
          style={{ color: hex }}
        >
          {title}
        </p>
      )}
      <div className="text-[15px] leading-relaxed text-mute">{children}</div>
    </aside>
  )
}
