import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { accents, spring } from '../../theme'

/**
 * One lesson on the map. Ready lessons are links; upcoming ones are visibly
 * inert rather than pretending to be clickable.
 */
export default function LessonCard({ lesson }) {
  const accent = accents[lesson.accent] ?? accents.signal
  const ready = lesson.status === 'ready'

  const inner = (
    <motion.article
      whileHover={ready ? { y: -4 } : undefined}
      transition={spring.soft}
      className={`panel group relative h-full overflow-hidden ${
        ready ? 'hover:border-mute/40' : 'opacity-55'
      }`}
    >
      {/* The accent edge is the only colour on the card until you hover it. */}
      <span
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-[2px] origin-left transition-transform duration-300"
        style={{
          background: accent.hex,
          transform: ready ? undefined : 'scaleX(0.25)',
        }}
      />

      <div className="flex h-full flex-col p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <span
            className="font-mono text-[11px] uppercase tracking-[0.2em]"
            style={{ color: accent.hex }}
          >
            {lesson.number} · {lesson.tagline}
          </span>
          <span className="readout">{ready ? `${lesson.minutes} min` : 'soon'}</span>
        </div>

        <h3 className="font-display text-xl font-bold tracking-tight">{lesson.title}</h3>
        <p className="mt-2 flex-1 text-[15px] leading-relaxed text-mute">{lesson.blurb}</p>

        <p
          className="mt-4 flex items-center gap-1.5 text-sm font-medium"
          style={{ color: ready ? accent.hex : undefined }}
        >
          {ready ? (
            <>
              Start
              <motion.span
                aria-hidden="true"
                className="inline-block"
                initial={{ x: 0 }}
                whileHover={{ x: 3 }}
              >
                →
              </motion.span>
            </>
          ) : (
            <span className="text-mute">Not built yet</span>
          )}
        </p>
      </div>
    </motion.article>
  )

  // Upcoming lessons still route — to a page that says plainly what's coming,
  // which beats a dead card that swallows the click.
  return (
    <Link to={lesson.path} className="block h-full rounded-panel">
      {inner}
    </Link>
  )
}
