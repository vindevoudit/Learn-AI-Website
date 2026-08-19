// A trigram language model with backoff — the smallest thing that is honestly
// "a language model" and still gives interesting predictions.
//
// The same shape as a real LLM's final step: given what came before, produce a
// probability for every word it could say next, then pick one. The difference
// is scale, and the lesson says so explicitly.

export const START = '⬤' // sentence-start marker, never shown to the student
export const END = '■' // end-of-sentence marker, rendered as "· end ·"

/**
 * Counts every 1-, 2- and 3-word sequence in the corpus.
 * Built once at module load; the corpus is ~500 words so this is instant.
 */
export function buildModel(sentences) {
  const tri = new Map() // "w1 w2" -> Map(next -> count)
  const bi = new Map() // "w1"    -> Map(next -> count)
  const uni = new Map() // next    -> count
  const vocab = new Set()

  const bump = (table, key, word) => {
    let inner = table.get(key)
    if (!inner) {
      inner = new Map()
      table.set(key, inner)
    }
    inner.set(word, (inner.get(word) ?? 0) + 1)
  }

  for (const sentence of sentences) {
    const words = [START, START, ...sentence.trim().toLowerCase().split(/\s+/), END]
    for (let i = 2; i < words.length; i++) {
      const w1 = words[i - 2]
      const w2 = words[i - 1]
      const next = words[i]
      bump(tri, `${w1} ${w2}`, next)
      bump(bi, w2, next)
      uni.set(next, (uni.get(next) ?? 0) + 1)
      if (next !== END) vocab.add(next)
    }
  }

  return { tri, bi, uni, vocab, sentenceCount: sentences.length, vocabSize: vocab.size }
}

const toDistribution = (counts) => {
  let total = 0
  for (const count of counts.values()) total += count
  return [...counts.entries()].map(([word, count]) => ({ word, prob: count / total, count }))
}

/**
 * The model's opinion about the next word, given the last two.
 * Backs off trigram -> bigram -> unigram, and reports which one it used so the
 * UI can tell the student "I've seen this exact pair before" vs "I'm guessing
 * from one word".
 */
export function nextDistribution(model, context, temperature = 1) {
  const w1 = context[context.length - 2] ?? START
  const w2 = context[context.length - 1] ?? START

  let counts = model.tri.get(`${w1} ${w2}`)
  let source = 'trigram'

  if (!counts || counts.size === 0) {
    counts = model.bi.get(w2)
    source = 'bigram'
  }
  if (!counts || counts.size === 0) {
    counts = model.uni
    source = 'unigram'
  }

  let dist = toDistribution(counts)

  // Temperature reshapes the distribution: below 1 sharpens toward the
  // favourite, above 1 flattens everything toward equally likely.
  if (temperature !== 1) {
    const t = Math.max(temperature, 0.05)
    let total = 0
    dist = dist.map((entry) => {
      const scaled = Math.pow(entry.prob, 1 / t)
      total += scaled
      return { ...entry, prob: scaled }
    })
    dist = dist.map((entry) => ({ ...entry, prob: entry.prob / total }))
  }

  dist.sort((a, b) => b.prob - a.prob)
  return { dist, source }
}

export function topK(dist, k = 5) {
  return dist.slice(0, k)
}

/** Weighted random pick — this is the actual "sampling" a chatbot does. */
export function sample(dist, random = Math.random) {
  const roll = random()
  let acc = 0
  for (const entry of dist) {
    acc += entry.prob
    if (roll <= acc) return entry.word
  }
  return dist[dist.length - 1]?.word ?? END
}

/** How many distinct next words the model considered — shown as a readout. */
export const optionCount = (dist) => dist.length
