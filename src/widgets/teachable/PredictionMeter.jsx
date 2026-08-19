import { motion } from 'framer-motion'
import { spring } from '../../theme'

/**
 * The model's verdict on the current drawing. Both classes are always shown,
 * because "70% one thing" only means something next to "30% the other".
 */
export default function PredictionMeter({ probability, classes, trained, blank }) {
  const scores = [
    { ...classes[0], value: 1 - probability },
    { ...classes[1], value: probability },
  ]
  const winner = scores[0].value >= scores[1].value ? scores[0] : scores[1]
  const confident = Math.abs(probability - 0.5) > 0.15

  return (
    <div>
      <div className="space-y-3">
        {scores.map((score) => (
          <div key={score.name}>
            <div className="mb-1 flex items-baseline justify-between">
              <span className="text-sm">{score.name}</span>
              <span
                className="font-mono text-[12px] tabular-nums"
                style={{ color: score.hex }}
              >
                {trained && !blank ? `${(score.value * 100).toFixed(0)}%` : '—'}
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-line">
              <motion.div
                className="h-full rounded-full"
                animate={{ width: trained && !blank ? `${score.value * 100}%` : '0%' }}
                transition={spring.soft}
                style={{ background: score.hex }}
              />
            </div>
          </div>
        ))}
      </div>

      <p className="mt-4 text-[15px] leading-relaxed text-mute">
        {!trained
          ? 'Train the model first — until then it has no opinion at all.'
          : blank
            ? 'Draw something in the test pad and the guess appears here.'
            : confident
              ? `It thinks this is a ${winner.singular ?? winner.name.toLowerCase()}.`
              : `It is close to 50/50 — this drawing doesn't look much like either group.`}
      </p>
    </div>
  )
}
