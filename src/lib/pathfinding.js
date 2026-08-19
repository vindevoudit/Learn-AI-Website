// Three ways to look for a route, written to be stepped one square at a time
// so the search can be watched rather than just reported.
//
// All three know the whole map from the start. That is the entire difference
// between this lesson and the next one.

import { manhattan, neighbours } from './grid'

export const ALGORITHMS = [
  {
    id: 'bfs',
    name: 'Flood fill',
    formal: 'Breadth-first search',
    blurb: 'Checks every square at distance 1, then every square at distance 2, and so on. No cleverness at all — but it cannot miss the shortest route.',
  },
  {
    id: 'greedy',
    name: 'Beeline',
    formal: 'Greedy best-first search',
    blurb: 'Always looks at whichever square is nearest the goal as the crow flies. Fast when the way is clear, hopeless when it walks into a dead end.',
  },
  {
    id: 'astar',
    name: 'Smart guess',
    formal: 'A*',
    blurb: 'Balances two things: how far it has already walked, and how far it still looks. Finds the shortest route like flood fill, but checks far fewer squares.',
  },
]

export const getAlgorithm = (id) => ALGORITHMS.find((a) => a.id === id) ?? ALGORITHMS[0]

/**
 * A search you can advance one square at a time.
 *
 * Frontier ties break by insertion order, and neighbours always come back in
 * the same order from `neighbours()`, so the same maze always searches
 * identically — a student can re-run it and point at the same squares.
 */
export function createSearch(grid, algorithmId = 'bfs') {
  const size = grid.cells.length
  const visited = new Uint8Array(size)
  const inFrontier = new Uint8Array(size)
  const cameFrom = new Int32Array(size).fill(-1)
  const costSoFar = new Float64Array(size).fill(Infinity)

  const heuristic = (node) => manhattan(grid, node, grid.goal)

  let order = 0
  const frontier = [{ node: grid.start, priority: 0, order: order++ }]
  inFrontier[grid.start] = 1
  costSoFar[grid.start] = 0

  const state = {
    algorithm: algorithmId,
    visited,
    inFrontier,
    current: grid.start,
    path: null,
    done: false,
    found: false,
    expanded: 0,
  }

  const priorityOf = (node, cost) => {
    if (algorithmId === 'bfs') return cost
    if (algorithmId === 'greedy') return heuristic(node)
    return cost + heuristic(node)
  }

  const buildPath = (end) => {
    const path = []
    let at = end
    while (at !== -1) {
      path.push(at)
      at = cameFrom[at]
    }
    return path.reverse()
  }

  /** Advance one square. Returns false once there is nothing left to do. */
  function step() {
    if (state.done) return false

    if (frontier.length === 0) {
      state.done = true
      state.found = false
      return false
    }

    // Smallest priority wins; earliest inserted breaks the tie.
    let best = 0
    for (let i = 1; i < frontier.length; i++) {
      const a = frontier[i]
      const b = frontier[best]
      if (a.priority < b.priority || (a.priority === b.priority && a.order < b.order)) best = i
    }

    const { node } = frontier.splice(best, 1)[0]
    inFrontier[node] = 0

    if (visited[node]) return true
    visited[node] = 1
    state.current = node
    state.expanded++

    if (node === grid.goal) {
      state.done = true
      state.found = true
      state.path = buildPath(node)
      return false
    }

    for (const next of neighbours(grid, node)) {
      if (visited[next]) continue
      const cost = costSoFar[node] + 1
      if (cost < costSoFar[next]) {
        costSoFar[next] = cost
        cameFrom[next] = node
        frontier.push({ node: next, priority: priorityOf(next, cost), order: order++ })
        inFrontier[next] = 1
      }
    }

    return true
  }

  return { state, step, grid }
}

/** Runs a search to the end. Used by the challenge checker and by tests. */
export function runSearch(grid, algorithmId) {
  const search = createSearch(grid, algorithmId)
  let guard = grid.cells.length * 8
  while (search.step() && guard-- > 0) {
    /* keep stepping */
  }
  return {
    expanded: search.state.expanded,
    found: search.state.found,
    length: search.state.path ? search.state.path.length - 1 : null,
    path: search.state.path,
  }
}
