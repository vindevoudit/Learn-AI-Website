import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { layout } from '../../lib/decisionTree'
import { colors, spring } from '../../theme'

const NODE_W = 150
const NODE_H = 54
const LEVEL_H = 96

/**
 * The machine's entire mind, drawn.
 *
 * Nodes are laid out by `layout()` and animated with springs, so teaching it a
 * new animal makes one leaf split in two and everything else glide aside — the
 * knowledge visibly growing rather than being replaced.
 */
export default function TreeView({ tree, activePath = [], highlightId }) {
  const scrollRef = useRef(null)
  const { nodes, edges, width, height } = layout(tree)

  const boardW = (width + 1) * NODE_W
  const boardH = (height + 1) * LEVEL_H

  const cx = (node) => node.x * NODE_W + NODE_W / 2
  const cy = (node) => node.level * LEVEL_H + NODE_H / 2 + 8
  const byId = new Map(nodes.map((n) => [n.id, n]))

  // A node is "on the path" when the answers given so far lead through it.
  const onPath = (node) =>
    node.path.length <= activePath.length &&
    node.path.every((step, i) => step === activePath[i])

  // Keep the part being talked about on screen: the node the player's answers
  // have reached, or the middle of the tree before a round starts.
  const focusNode =
    nodes.filter((n) => onPath(n)).sort((a, b) => b.level - a.level)[0] ?? nodes[0]

  useEffect(() => {
    const box = scrollRef.current
    if (!box || !focusNode) return
    const target = focusNode.x * NODE_W + NODE_W / 2 - box.clientWidth / 2
    box.scrollTo({ left: Math.max(0, target), behavior: 'smooth' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusNode?.id, activePath.length])

  return (
    <div ref={scrollRef} className="overflow-x-auto pb-2">
      <div className="relative" style={{ width: boardW, height: boardH, minWidth: '100%' }}>
        <svg width={boardW} height={boardH} className="absolute inset-0">
          {edges.map((edge) => {
            const from = byId.get(edge.from)
            const to = byId.get(edge.to)
            if (!from || !to) return null
            const lit = onPath(to) && to.path.length <= activePath.length
            const x1 = cx(from)
            const y1 = cy(from) + NODE_H / 2
            const x2 = cx(to)
            const y2 = cy(to) - NODE_H / 2
            const mid = (y1 + y2) / 2
            return (
              <g key={`${edge.from}-${edge.to}`}>
                <path
                  d={`M${x1} ${y1} C ${x1} ${mid}, ${x2} ${mid}, ${x2} ${y2}`}
                  fill="none"
                  stroke={lit ? colors.signal : colors.line}
                  strokeWidth={lit ? 2 : 1.2}
                />
                <text
                  x={(x1 + x2) / 2 + (edge.label === 'yes' ? -12 : 12)}
                  y={mid + 4}
                  textAnchor="middle"
                  fontSize="10"
                  className="font-mono uppercase"
                  fill={lit ? colors.signal : colors.mute}
                >
                  {edge.label}
                </text>
              </g>
            )
          })}
        </svg>

        {nodes.map((node) => {
          const lit = onPath(node)
          const isNew = node.id === highlightId
          return (
            <motion.div
              key={node.id}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{
                opacity: 1,
                scale: 1,
                left: cx(node) - NODE_W / 2 + 8,
                top: cy(node) - NODE_H / 2,
              }}
              transition={spring.soft}
              className="absolute flex items-center justify-center rounded-panel border px-2 text-center"
              style={{
                width: NODE_W - 16,
                minHeight: NODE_H,
                borderColor: isNew ? colors.charge : lit ? colors.signal : colors.line,
                background: node.type === 'leaf' ? colors.panel2 : colors.panel,
                color: lit || isNew ? colors.ink : colors.mute,
              }}
            >
              <span
                className={
                  node.type === 'leaf'
                    ? 'font-display text-[13px] leading-tight'
                    : 'text-[12px] leading-tight'
                }
              >
                {node.type === 'leaf' ? node.answer : node.question}
              </span>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
