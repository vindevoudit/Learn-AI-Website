import { useEffect, useRef } from 'react'
import { useAnimationFrame } from '../../hooks/useAnimationFrame'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { colors } from '../../theme'
import { forward, makeNetwork } from '../../lib/nn'

/**
 * The signature element: a glowing trace whose shape is genuinely computed by a
 * small neural network, one forward pass per horizontal sample. The weights
 * drift slowly, so the line breathes.
 *
 * This is not decoration standing in for the subject — it *is* the subject, and
 * the caption on the hero says so.
 *
 * Pointer position nudges the first-layer biases, which makes the whole curve
 * lean toward the cursor: the fastest possible demonstration that changing a
 * number changes the output.
 */
export default function SignalTrace({ height = 260, className = '' }) {
  const canvasRef = useRef(null)
  const pointer = useRef({ x: 0.5, y: 0.5 })
  const sizeRef = useRef({ w: 0, h: 0, dpr: 1 })
  const reduced = useReducedMotion()

  // A fixed network — same shape on every visit, so the hero is recognisable.
  const netRef = useRef(null)
  if (!netRef.current) {
    const net = makeNetwork([2, 5, 1])
    const seeds = [1.8, -2.4, 3.1, -1.2, 2.7, -3.4, 1.1, 2.2, -1.9, 2.9]
    net.layers[0].weights = net.layers[0].weights.map((row, i) =>
      row.map((_, j) => seeds[(i * 2 + j) % seeds.length]),
    )
    net.layers[0].biases = net.layers[0].biases.map((_, i) => seeds[i] * 0.4)
    net.layers[1].weights = [[3.4, -3.0, 2.7, -3.7, 3.1]]
    net.layers[1].biases = [-0.4]
    netRef.current = net
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      sizeRef.current = { w: rect.width, h: rect.height, dpr }
      canvas.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(canvas)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const onMove = (e) => {
      const rect = canvasRef.current?.getBoundingClientRect()
      if (!rect) return
      pointer.current = {
        x: (e.clientX - rect.left) / rect.width,
        y: (e.clientY - rect.top) / rect.height,
      }
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [])

  useAnimationFrame((_, elapsed) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const { w, h } = sizeRef.current
    if (!w || !h) return

    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, w, h)

    const net = netRef.current
    // Reduced motion: hold the network still and draw the curve once.
    const t = reduced ? 0 : elapsed * 0.22
    const lean = (pointer.current.y - 0.5) * 1.6

    const samples = Math.max(48, Math.round(w / 4))
    const points = []
    for (let i = 0; i <= samples; i++) {
      const u = i / samples
      const { output } = forward(net, [u * 2 - 1, Math.sin(u * 6.2 + t) * 0.9 + lean * 0.5])
      // The network's output only ever spans roughly 0.42-1.0, so the trace is
      // stretched to fill the frame — the same auto-scaling an oscilloscope does.
      // The shape is the network's; only the zoom level is ours.
      const fitted = Math.min(Math.max((output - 0.42) / 0.58, 0), 1)
      points.push([u * w, h - (0.1 + fitted * 0.8) * h])
    }

    const stroke = (color, width, alpha, blur) => {
      ctx.save()
      ctx.globalAlpha = alpha
      ctx.strokeStyle = color
      ctx.lineWidth = width
      ctx.lineJoin = 'round'
      ctx.lineCap = 'round'
      ctx.shadowColor = color
      ctx.shadowBlur = blur
      ctx.beginPath()
      points.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)))
      ctx.stroke()
      ctx.restore()
    }

    // Halo, then core — a single line reads as flat, two reads as lit.
    stroke(colors.signal, 10, 0.09, 26)
    stroke(colors.signal, 2, 0.95, 12)

    // The sample dots make it obvious the curve is computed, not drawn.
    ctx.save()
    ctx.fillStyle = colors.charge
    for (let i = 0; i < points.length; i += 10) {
      const [x, y] = points[i]
      ctx.globalAlpha = 0.55
      ctx.beginPath()
      ctx.arc(x, y, 1.6, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.restore()
  })

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ width: '100%', height }}
      role="img"
      aria-label="A glowing line whose shape is calculated live by a small neural network."
    />
  )
}
