import { AnimatePresence, motion } from 'framer-motion'
import { END } from '../../lib/ngram'
import { spring } from '../../theme'

/**
 * The sentence so far, one chip per word. The last two chips are outlined,
 * because those two words are the entire memory this model has — everything
 * before them has already been forgotten.
 */
export default function TokenStream({ tokens, accentHex, onUndo }) {
  return (
    <div className="min-h-[64px]">
      <div className="flex flex-wrap items-center gap-1.5">
        <AnimatePresence mode="popLayout" initial={false}>
          {tokens.map((token, i) => {
            const remembered = i >= tokens.length - 2 && token !== END
            const isEnd = token === END
            return (
              <motion.span
                key={`${i}-${token}`}
                layout
                initial={{ opacity: 0, y: -8, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={spring.snappy}
                className={`rounded border px-2 py-1 font-display text-lg ${
                  isEnd
                    ? 'border-line bg-panel2 font-mono text-[11px] uppercase tracking-[0.18em] text-mute'
                    : remembered
                      ? 'bg-panel2'
                      : 'border-transparent'
                }`}
                style={remembered && !isEnd ? { borderColor: accentHex } : undefined}
              >
                {isEnd ? 'end of sentence' : token}
              </motion.span>
            )
          })}
        </AnimatePresence>

        {tokens.length === 0 && (
          <span className="text-[15px] text-mute">Pick a word below to start a sentence.</span>
        )}
      </div>

      {tokens.length > 0 && (
        <button
          type="button"
          onClick={onUndo}
          className="mt-3 rounded-panel font-mono text-[11px] uppercase tracking-[0.18em] text-mute transition-colors hover:text-ink"
        >
          ← take back last word
        </button>
      )}
    </div>
  )
}
