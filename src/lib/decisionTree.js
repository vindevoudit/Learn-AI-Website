// A twenty-questions tree that the player teaches.
//
// The deliberate contrast with lesson 02: that model's knowledge was 256
// anonymous numbers nobody could read. This model's knowledge is a list of
// questions in plain English. Both learn. Only one can be inspected.

let nextId = 1

export const leaf = (answer) => ({ id: nextId++, type: 'leaf', answer })

export const branch = (question, yes, no) => ({
  id: nextId++,
  type: 'branch',
  question,
  yes,
  no,
})

/** The starting tree — small enough to beat quickly, which is the point. */
export function startingTree() {
  return branch(
    'Does it live in water?',
    branch('Is it enormous?', leaf('a whale'), leaf('a goldfish')),
    branch(
      'Does it have wings?',
      branch('Can it talk?', leaf('a parrot'), leaf('an eagle')),
      branch('Does it purr?', leaf('a cat'), leaf('a horse')),
    ),
  )
}

/** Walks the tree given answers so far. Returns the node it lands on. */
export function walk(tree, answers) {
  let node = tree
  for (const answer of answers) {
    if (node.type === 'leaf') break
    node = answer ? node.yes : node.no
  }
  return node
}

/**
 * Replaces a leaf with a new question separating the old guess from the new
 * animal. This is the entire learning step — one leaf becomes one branch.
 *
 * Returns the new tree and the id of the branch that was created, so the UI can
 * point at the thing that just changed.
 */
export function teach(tree, leafId, { question, answer, answerIsYes }) {
  let branchId = null

  const rebuild = (node) => {
    if (node.type === 'leaf') {
      if (node.id !== leafId) return node
      const learned = leaf(answer)
      const previous = leaf(node.answer)
      const created = answerIsYes
        ? branch(question, learned, previous)
        : branch(question, previous, learned)
      branchId = created.id
      return created
    }
    return { ...node, yes: rebuild(node.yes), no: rebuild(node.no) }
  }

  return { tree: rebuild(tree), branchId }
}

export function countNodes(tree) {
  if (tree.type === 'leaf') return { questions: 0, answers: 1 }
  const yes = countNodes(tree.yes)
  const no = countNodes(tree.no)
  return {
    questions: 1 + yes.questions + no.questions,
    answers: yes.answers + no.answers,
  }
}

export function depth(tree) {
  if (tree.type === 'leaf') return 1
  return 1 + Math.max(depth(tree.yes), depth(tree.no))
}

/** Every animal it can currently name. */
export function allAnswers(tree) {
  if (tree.type === 'leaf') return [tree.answer]
  return [...allAnswers(tree.yes), ...allAnswers(tree.no)]
}

/**
 * Positions for drawing. Leaves are spread evenly left to right and each branch
 * sits above the middle of its two children, which keeps the picture tidy however
 * lopsided the tree gets.
 */
export function layout(tree) {
  const nodes = []
  const edges = []
  let cursor = 0

  const place = (node, level, path) => {
    if (node.type === 'leaf') {
      const x = cursor++
      nodes.push({ ...node, x, level, path })
      return x
    }
    const yesX = place(node.yes, level + 1, [...path, true])
    const noX = place(node.no, level + 1, [...path, false])
    const x = (yesX + noX) / 2
    nodes.push({ ...node, x, level, path })
    edges.push({ from: node.id, to: node.yes.id, label: 'yes' })
    edges.push({ from: node.id, to: node.no.id, label: 'no' })
    return x
  }

  place(tree, 0, [])
  const width = Math.max(cursor - 1, 1)
  const height = Math.max(...nodes.map((n) => n.level), 1)
  return { nodes, edges, width, height }
}

/** Keeps player-typed text short and free of stray whitespace. */
export const clean = (text, max = 40) => text.trim().replace(/\s+/g, ' ').slice(0, max)
