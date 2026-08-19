// Preset drawings for the training lesson.
//
// They exist for two reasons: a freehand canvas is unusable without a pointer,
// and a student who can stamp ten examples in ten seconds gets to the actual
// lesson — what happens with too little data — much faster.

import { GRID } from './classifier'

const blank = () => new Float64Array(GRID * GRID)

const set = (pixels, x, y, value = 1) => {
  const cx = Math.round(x)
  const cy = Math.round(y)
  if (cx < 0 || cy < 0 || cx >= GRID || cy >= GRID) return
  const i = cy * GRID + cx
  if (pixels[i] < value) pixels[i] = value
}

/** Fatten a stroke so stamped shapes look like something a hand drew. */
const stroke = (pixels, x, y) => {
  set(pixels, x, y, 1)
  set(pixels, x + 1, y, 0.55)
  set(pixels, x - 1, y, 0.55)
  set(pixels, x, y + 1, 0.55)
  set(pixels, x, y - 1, 0.55)
}

const jitter = (amount) => (Math.random() - 0.5) * amount

/**
 * A roughly straight line, at any angle, anywhere on the grid.
 *
 * The position and length vary a lot on purpose. If every line were centred,
 * a single training example would describe the whole group perfectly and the
 * lesson about needing more data would have nothing to show.
 */
export function lineShape() {
  const pixels = blank()
  const angle = Math.random() * Math.PI
  const cx = GRID / 2 + jitter(3)
  const cy = GRID / 2 + jitter(3)
  const length = 3 + Math.random() * 4.5

  for (let t = -length; t <= length; t += 0.35) {
    stroke(pixels, cx + Math.cos(angle) * t, cy + Math.sin(angle) * t)
  }
  return pixels
}

/** A rough circle — wobbly and roaming, for the same reason. */
export function circleShape() {
  const pixels = blank()
  const cx = GRID / 2 + jitter(3)
  const cy = GRID / 2 + jitter(3)
  const radius = 2.6 + Math.random() * 3
  const wobble = Math.random() * 0.6

  for (let a = 0; a < Math.PI * 2; a += 0.1) {
    const r = radius + Math.sin(a * 3) * wobble
    stroke(pixels, cx + Math.cos(a) * r, cy + Math.sin(a) * r)
  }
  return pixels
}

export const shapeMakers = {
  line: lineShape,
  circle: circleShape,
}
