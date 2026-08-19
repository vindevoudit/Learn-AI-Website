// A two-class logistic-regression classifier over a 16x16 drawing grid.
//
// Deliberately plain: one weight per pixel plus a bias, trained by gradient
// descent. That means the learned weights can be drawn straight back onto the
// grid as a heatmap, so a student can literally see what the model is looking
// for. A black-box library could not do that.

export const GRID = 16
export const DIM = GRID * GRID

export function createModel(dim = DIM) {
  return { w: new Float64Array(dim), b: 0, epoch: 0 }
}

const sigmoid = (x) => 1 / (1 + Math.exp(-x))

/** Probability that `pixels` belongs to class 1. */
export function predict(model, pixels) {
  let z = model.b
  for (let i = 0; i < model.w.length; i++) z += model.w[i] * pixels[i]
  return sigmoid(z)
}

/**
 * One full pass over the training set (batch gradient descent).
 * Called once per animation frame, so the accuracy bar and loss curve show the
 * real optimisation rather than a fake progress animation.
 *
 * Returns { loss, accuracy } for this pass.
 */
export function trainStep(model, samples, lr = 0.5, l2 = 0.001) {
  const n = samples.length
  if (n === 0) return { loss: 0, accuracy: 0 }

  const gradW = new Float64Array(model.w.length)
  let gradB = 0
  let loss = 0
  let correct = 0

  for (const sample of samples) {
    const p = predict(model, sample.pixels)
    const y = sample.label
    const err = p - y

    for (let i = 0; i < gradW.length; i++) gradW[i] += err * sample.pixels[i]
    gradB += err

    // Clamp inside the log so a confident-and-right prediction can't produce -Infinity.
    const clamped = Math.min(Math.max(p, 1e-7), 1 - 1e-7)
    loss += -(y * Math.log(clamped) + (1 - y) * Math.log(1 - clamped))
    if ((p >= 0.5 ? 1 : 0) === y) correct++
  }

  // A little L2 keeps the weights from spiking on tiny training sets, which
  // makes the weight heatmap readable instead of noise.
  for (let i = 0; i < model.w.length; i++) {
    model.w[i] -= lr * (gradW[i] / n + l2 * model.w[i])
  }
  model.b -= lr * (gradB / n)
  model.epoch++

  return { loss: loss / n, accuracy: correct / n }
}

export function resetModel(model) {
  model.w.fill(0)
  model.b = 0
  model.epoch = 0
}

/** Largest absolute weight — used to normalise the heatmap colours. */
export function weightRange(model) {
  let max = 0
  for (let i = 0; i < model.w.length; i++) {
    const abs = Math.abs(model.w[i])
    if (abs > max) max = abs
  }
  return max || 1
}

/**
 * Blurs a hard-edged drawing slightly. Two strokes in almost the same place
 * should look almost the same to the model; without this, a one-pixel shift
 * reads as a completely different image and the demo feels broken.
 */
export function smooth(pixels, grid = GRID) {
  const out = new Float64Array(pixels.length)
  for (let y = 0; y < grid; y++) {
    for (let x = 0; x < grid; x++) {
      let sum = 0
      let count = 0
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx
          const ny = y + dy
          if (nx < 0 || ny < 0 || nx >= grid || ny >= grid) continue
          const weight = dx === 0 && dy === 0 ? 2 : 1
          sum += pixels[ny * grid + nx] * weight
          count += weight
        }
      }
      out[y * grid + x] = sum / count
    }
  }
  return out
}

export const isBlank = (pixels) => !pixels.some((p) => p > 0)
