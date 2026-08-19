import { AnimatePresence, motion } from 'framer-motion'
import { END } from '../../lib/ngram'
import { colors, spring } from '../../theme'

/**
 * The model's odds for every word it is considering, biggest first. Clicking
 * one commits it — so a student can feel that the model never invents a word,
 * it only ever picks from a ranked list it already had.
 */
export default function ProbabilityBars({ dist, onPick, accentHex, highlight }) {
  const top = dist.slice(0, 6)
  const rest = dist.length - top.length
  const max = top[0]?.prob ?? 1

  return (
    <div>
      <ul className="space-y-1.5">
        <AnimatePresence initial={false}>
          {top.map((entry) => {
            const isEnd = entry.word === END
            const isTarget = highlight && entry.word === highlight
            return (
              <motion.li key={entry.word} layout transition={spring.soft}>
                <button
                  type="button"
                  onClick={() => onPick(entry.word)}
                  className="group flex w-full items-center gap-3 rounded-panel border border-line bg-panel2/40 px-3 py-2 text-left transition-colors hover:border-mute/50 hover:bg-panel2"
                >
                  <span
                    className={`w-32 shrink-0 truncate ${
                      isEnd
                        ? 'font-mono text-[11px] uppercase tracking-[0.14em] text-mute'
                        : 'font-display text-[15px]'
                    }`}
                    style={isTarget ? { color: colors.charge } : undefined}
                  >
                    {isEnd ? 'end of sentence' : entry.word}
                  </span>

                  <span className="relative h-2 flex-1 overflow-hidden rounded-full bg-line">
                    <motion.span
                      className="absolute inset-y-0 left-0 rounded-full"
                      animate={{ width: `${(entry.prob / max) * 100}%` }}
                      transition={spring.soft}
                      style={{ background: isTarget ? colors.charge : accentHex }}
                    />
                  </span>

                  <span className="w-12 shrink-0 text-right font-mono text-[12px] tabular-nums text-mute">
                    {(entry.prob * 100).toFixed(0)}%
                  </span>
                </button>
              </motion.li>
            )
          })}
        </AnimatePresence>
      </ul>

      {rest > 0 && (
        <p className="readout mt-3">
          + {rest} more word{rest === 1 ? '' : 's'} with smaller odds
        </p>
      )}
    </div>
  )
}
