import { motion } from 'framer-motion'
import { colors, spring } from '../../theme'

/**
 * The loss curve and the accuracy bar, both fed by the real training loop —
 * one point per pass over the data. If the line stalls, training really has
 * stalled; nothing here is a decorative progress animation.
 */
export default function TrainingChart({ history, accuracy, epoch, training }) {
  const width = 320
  const height = 90

  const points = history.length > 1 ? history : []
  const maxLoss = Math.max(0.1, ...points.map((p) => p.loss))

  const path = points
    .map((point, i) => {
      const x = (i / (points.length - 1)) * width
      const y = height - (point.loss / maxLoss) * (height - 8) - 4
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`
    })
    .join(' ')

  return (
    <div className="space-y-4">
      <div>
        <div className="mb-1.5 flex items-baseline justify-between">
          <span className="rail-label">How wrong it is</span>
          <span className="readout">
            {points.length ? points[points.length - 1].loss.toFixed(3) : '—'} · pass {epoch}
          </span>
        </div>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full rounded-panel border border-line bg-panel2/40"
          style={{ height }}
          role="img"
          aria-label={`Error curve. Currently ${
            points.length ? points[points.length - 1].loss.toFixed(3) : 'not started'
          }.`}
        >
          {path && (
            <path d={path} fill="none" stroke={colors.spark} strokeWidth="2" strokeLinejoin="round" />
          )}
          {!path && (
            <text x={width / 2} y={height / 2 + 4} textAnchor="middle" fontSize="11" fill={colors.mute}>
              press Train to start
            </text>
          )}
        </svg>
      </div>

      <div>
        <div className="mb-1.5 flex items-baseline justify-between">
          <span className="rail-label">Accuracy on its own examples</span>
          <span className="readout" style={{ color: colors.charge }}>
            {(accuracy * 100).toFixed(0)}%
          </span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-line">
          <motion.div
            className="h-full rounded-full"
            animate={{ width: `${accuracy * 100}%` }}
            transition={spring.soft}
            style={{ background: colors.charge }}
          />
        </div>
        {training && <p className="readout mt-2">learning…</p>}
      </div>
    </div>
  )
}
