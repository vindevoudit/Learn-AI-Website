import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useAnimationFrame } from '../../hooks/useAnimationFrame'
import { useMotionScale } from '../../hooks/useReducedMotion'
import { colors } from '../../theme'

const W = 480
const H = 260
const LAYER_X = [64, 240, 416]
const R = 17

/** Evenly space a layer's neurons down the canvas. */
function layerPositions(count, x) {
  const gap = H / (count + 1)
  return Array.from({ length: count }, (_, i) => ({ x, y: gap * (i + 1) }))
}

const lerp = (a, b, t) => a + (b - a) * t

/**
 * The network, drawn.
 *
 * Edge thickness = how strongly one neuron listens to another.
 * Edge colour   = whether it's pushing the next neuron up (cyan) or down (magenta).
 * Neuron glow   = how strongly that neuron is firing right now.
 *
 * Clicking a neuron selects it, which is what fills the weight panel beside it —
 * the point being that each neuron owns its own set of dials.
 */
export default function NetworkGraph({
  network,
  activations,
  selected,
  onSelect,
  pulseKey,
  pickable = false,
}) {
  const motionScale = useMotionScale()

  const nodes = useMemo(
    () => network.sizes.map((count, l) => layerPositions(count, LAYER_X[l])),
    [network.sizes],
  )

  // A pulse runs 0 → layers.length: whole numbers mean "arrived at that layer".
  // The ref carries the true position; state exists only to trigger a repaint.
  const [progress, setProgress] = useState(null)
  const progressRef = useRef(null)

  // Restart the travelling pulse whenever the lesson bumps pulseKey.
  useEffect(() => {
    if (pulseKey > 0) {
      progressRef.current = 0
      setProgress(0)
    }
  }, [pulseKey])

  useAnimationFrame(
    (delta) => {
      if (progressRef.current == null) return
      const next = progressRef.current + delta * 1.1 * motionScale
      if (next >= network.layers.length) {
        progressRef.current = null
        setProgress(null)
      } else {
        progressRef.current = next
        setProgress(next)
      }
    },
    progress != null,
  )

  // `selected` names a weight layer; visual layer l is fed by weight layer l-1.
  const isSelected = (l, i) => selected && selected.layer === l - 1 && selected.neuron === i

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ maxHeight: 320 }}
        role="img"
        aria-label="Network diagram. Full values are listed in the table below."
      >
        <defs>
          <filter id="neuron-glow" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Edges first, so neurons sit on top of them. */}
        {network.layers.map((layer, l) =>
          layer.weights.map((row, to) =>
            row.map((weight, from) => {
              const a = nodes[l][from]
              const b = nodes[l + 1][to]
              const strength = Math.min(Math.abs(weight) / 3, 1)
              const dim = selected && !isSelected(l + 1, to)
              return (
                <line
                  key={`e-${l}-${to}-${from}`}
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke={weight >= 0 ? colors.signal : colors.spark}
                  strokeWidth={0.6 + strength * 4.4}
                  strokeOpacity={(dim ? 0.12 : 0.25 + strength * 0.6) * (weight === 0 ? 0.3 : 1)}
                  strokeLinecap="round"
                />
              )
            }),
          ),
        )}

        {/* The travelling signal: one dot per edge on the active layer. */}
        {progress != null &&
          network.layers.map((layer, l) => {
            const local = progress - l
            if (local < 0 || local > 1) return null
            return layer.weights.map((row, to) =>
              row.map((weight, from) => {
                if (weight === 0) return null
                const a = nodes[l][from]
                const b = nodes[l + 1][to]
                const t = local
                return (
                  <circle
                    key={`p-${pulseKey}-${l}-${to}-${from}`}
                    cx={lerp(a.x, b.x, t)}
                    cy={lerp(a.y, b.y, t)}
                    r={3}
                    fill={weight >= 0 ? colors.signal : colors.spark}
                    opacity={Math.sin(t * Math.PI) * 0.95}
                  />
                )
              }),
            )
          })}

        {/* Neurons. */}
        {nodes.map((layer, l) =>
          layer.map((node, i) => {
            const value = activations[l]?.[i] ?? 0
            const selectable = l > 0
            const active = isSelected(l, i)
            return (
              <g key={`n-${l}-${i}`}>
                {/* Glow scales with how hard this neuron is firing. */}
                <motion.circle
                  cx={node.x}
                  cy={node.y}
                  r={R}
                  fill={colors.signal}
                  filter="url(#neuron-glow)"
                  animate={{ opacity: value * 0.55 }}
                  transition={{ type: 'spring', stiffness: 220, damping: 26 }}
                  style={{ pointerEvents: 'none' }}
                />
                <motion.circle
                  cx={node.x}
                  cy={node.y}
                  r={R}
                  fill={colors.panel}
                  stroke={active ? colors.charge : colors.line}
                  strokeWidth={active ? 2.5 : 1.5}
                  className={selectable ? 'cursor-pointer' : ''}
                  onClick={selectable ? () => onSelect({ layer: l - 1, neuron: i }) : undefined}
                  whileHover={selectable ? { scale: 1.08 } : undefined}
                  style={{ transformOrigin: `${node.x}px ${node.y}px` }}
                />
                <text
                  x={node.x}
                  y={node.y + 4}
                  textAnchor="middle"
                  className="pointer-events-none select-none font-mono"
                  fontSize="11"
                  fill={value > 0.6 ? colors.ink : colors.mute}
                >
                  {value.toFixed(2)}
                </text>
              </g>
            )
          }),
        )}

        {/* Layer labels sit outside the diagram so they never crowd a neuron. */}
        {['Inputs', 'Hidden layer', 'Output'].map((label, l) => (
          <text
            key={label}
            x={LAYER_X[l]}
            y={H - 6}
            textAnchor="middle"
            fontSize="9"
            letterSpacing="1.6"
            fill={colors.mute}
            className="font-mono uppercase"
          >
            {label}
          </text>
        ))}
      </svg>

      {pickable && (
        <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-line px-1 pt-3">
          <span className="rail-label">Edit neuron</span>
          {network.layers.map((layer, l) =>
            layer.biases.map((_, i) => {
              const last = l === network.layers.length - 1
              const name = last ? 'Output' : `Hidden ${i + 1}`
              const active = selected && selected.layer === l && selected.neuron === i
              return (
                <button
                  key={`pick-${l}-${i}`}
                  type="button"
                  onClick={() => onSelect({ layer: l, neuron: i })}
                  aria-pressed={active}
                  className={`rounded-panel border px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.14em] transition-colors ${
                    active ? 'border-charge text-charge' : 'border-line text-mute hover:text-ink'
                  }`}
                >
                  {name}
                </button>
              )
            }),
          )}
        </div>
      )}

      {/* Same information, as text, for anyone not reading the picture. */}
      <table className="sr-only">
        <caption>Current neuron values</caption>
        <tbody>
          {activations.map((layer, l) => (
            <tr key={l}>
              <th scope="row">{['Inputs', 'Hidden layer', 'Output'][l]}</th>
              {layer.map((v, i) => (
                <td key={i}>
                  Neuron {i + 1}: {v.toFixed(2)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
