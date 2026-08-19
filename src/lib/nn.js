// A tiny feed-forward network, written out longhand so the lesson can point at
// every step. No framework, no autograd — the student turns the weights by hand.

export const sigmoid = (x) => 1 / (1 + Math.exp(-x))

export const LAYER_SIZES = [2, 3, 1]

/** Weights are stored per-layer as [toNeuron][fromNeuron]. */
export function makeNetwork(sizes = LAYER_SIZES, fill = 0) {
  const layers = []
  for (let l = 1; l < sizes.length; l++) {
    layers.push({
      weights: Array.from({ length: sizes[l] }, () => Array.from({ length: sizes[l - 1] }, () => fill)),
      biases: Array.from({ length: sizes[l] }, () => 0),
    })
  }
  return { sizes, layers }
}

/**
 * Runs the network and keeps every intermediate value, because the lesson
 * animates the signal at each layer rather than just showing the answer.
 * Returns { activations: number[][], output: number }.
 */
export function forward(network, inputs) {
  const activations = [inputs.slice()]

  for (const layer of network.layers) {
    const prev = activations[activations.length - 1]
    const next = layer.weights.map((rowWeights, i) => {
      let sum = layer.biases[i]
      for (let j = 0; j < rowWeights.length; j++) sum += rowWeights[j] * prev[j]
      return sigmoid(sum)
    })
    activations.push(next)
  }

  return { activations, output: activations[activations.length - 1][0] }
}

/** The weighted sum before the squash — shown in the readout so it isn't magic. */
export function preActivation(network, activations, layerIndex, neuronIndex) {
  const layer = network.layers[layerIndex]
  const prev = activations[layerIndex]
  let sum = layer.biases[neuronIndex]
  for (let j = 0; j < prev.length; j++) sum += layer.weights[neuronIndex][j] * prev[j]
  return sum
}

/** Immutably set one weight — keeps React state updates predictable. */
export function setWeight(network, layerIndex, toNeuron, fromNeuron, value) {
  const layers = network.layers.map((layer, l) => {
    if (l !== layerIndex) return layer
    const weights = layer.weights.map((row, i) =>
      i === toNeuron ? row.map((w, j) => (j === fromNeuron ? value : w)) : row,
    )
    return { ...layer, weights }
  })
  return { ...network, layers }
}

export function setBias(network, layerIndex, neuron, value) {
  const layers = network.layers.map((layer, l) => {
    if (l !== layerIndex) return layer
    return { ...layer, biases: layer.biases.map((b, i) => (i === neuron ? value : b)) }
  })
  return { ...network, layers }
}

export function randomize(sizes = LAYER_SIZES) {
  const net = makeNetwork(sizes)
  for (const layer of net.layers) {
    layer.weights = layer.weights.map((row) => row.map(() => +(Math.random() * 4 - 2).toFixed(2)))
    layer.biases = layer.biases.map(() => +(Math.random() * 2 - 1).toFixed(2))
  }
  return net
}

/** The four possible on/off input pairs — the whole truth table of the challenge. */
export const INPUT_CASES = [
  [0, 0],
  [1, 0],
  [0, 1],
  [1, 1],
]

/**
 * The challenge: fire only when BOTH switches are on.
 * Solved when every case lands on the correct side of 0.5 with some margin.
 */
export const TARGET_AND = [0, 0, 0, 1]

export function scoreChallenge(network, targets = TARGET_AND) {
  const results = INPUT_CASES.map((inputs, i) => {
    const { output } = forward(network, inputs)
    const target = targets[i]
    const correct = target === 1 ? output > 0.7 : output < 0.3
    return { inputs, output, target, correct }
  })
  return { results, solved: results.every((r) => r.correct) }
}
