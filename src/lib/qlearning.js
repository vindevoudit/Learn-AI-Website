// A robot that learns a maze by walking into things.
//
// It cannot see the map. All it ever gets is: which square am I on, and what
// happened when I moved. Everything it knows ends up in one table of numbers —
// "how good does each move look from each square" — which is exactly what gets
// drawn on screen.

import { LAVA, inBounds, isWall, toIndex, toXY } from './grid'
import { makeRandom } from './random'

// Up, right, down, left — the order the arrows are drawn in.
export const ACTIONS = [
  { dx: 0, dy: -1, name: 'up' },
  { dx: 1, dy: 0, name: 'right' },
  { dx: 0, dy: 1, name: 'down' },
  { dx: -1, dy: 0, name: 'left' },
]

export const REWARD = {
  goal: 1,
  lava: -1,
  step: -0.02, // dawdling costs something, so short routes win
}

export const defaults = {
  epsilon: 0.25, // how often it tries something random
  alpha: 0.35, // how fast it believes new information
  gamma: 0.95, // how much it cares about later rewards
}

export function createBrain(grid, seed = 7) {
  return {
    q: new Float64Array(grid.cells.length * ACTIONS.length),
    episodes: 0,
    random: makeRandom(seed),
    history: [], // { reward, steps, outcome } per episode
  }
}

export const qAt = (brain, cell, action) => brain.q[cell * ACTIONS.length + action]

/** The move it currently rates highest, ties going to the earliest direction. */
export function bestAction(brain, cell) {
  let best = 0
  let bestValue = qAt(brain, cell, 0)
  for (let a = 1; a < ACTIONS.length; a++) {
    const value = qAt(brain, cell, a)
    if (value > bestValue) {
      bestValue = value
      best = a
    }
  }
  return best
}

export const bestValue = (brain, cell) => qAt(brain, cell, bestAction(brain, cell))

/** Where a move lands. Walking into a wall or the edge leaves you put. */
export function move(grid, cell, action) {
  const { x, y } = toXY(grid, cell)
  const nx = x + ACTIONS[action].dx
  const ny = y + ACTIONS[action].dy
  if (!inBounds(grid, nx, ny)) return cell
  const next = toIndex(grid, nx, ny)
  return isWall(grid, next) ? cell : next
}

const maxSteps = (grid) => grid.cells.length * 3

/**
 * One episode: drop the robot at the start and let it move until it reaches the
 * goal, hits lava, or runs out of patience. Learning happens on every step.
 *
 * `trace` collects the route so a single episode can be replayed slowly.
 */
export function runEpisode(brain, grid, options = {}) {
  const { epsilon, alpha, gamma } = { ...defaults, ...options }
  const trace = options.trace ? [grid.start] : null

  let cell = grid.start
  let total = 0
  let steps = 0
  let outcome = 'gave up'
  const limit = maxSteps(grid)

  while (steps < limit) {
    // Explore or exploit: sometimes try something random, otherwise trust the
    // table. With epsilon at zero it can never discover a better route than the
    // first one it stumbles into.
    const action =
      brain.random() < epsilon
        ? Math.floor(brain.random() * ACTIONS.length)
        : bestAction(brain, cell)

    const next = move(grid, cell, action)
    steps++
    if (trace) trace.push(next)

    let reward = REWARD.step
    let done = false

    if (next === grid.goal) {
      reward = REWARD.goal
      done = true
      outcome = 'reached the goal'
    } else if (grid.cells[next] === LAVA) {
      reward = REWARD.lava
      done = true
      outcome = 'died in lava'
    }

    // The update: nudge this move's score towards what actually happened, plus
    // the best thing available from where it landed.
    const index = cell * ACTIONS.length + action
    const future = done ? 0 : gamma * bestValue(brain, next)
    brain.q[index] += alpha * (reward + future - brain.q[index])

    total += reward
    cell = next
    if (done) break
  }

  brain.episodes++
  const record = { reward: total, steps, outcome, success: outcome === 'reached the goal' }
  brain.history.push(record)
  if (brain.history.length > 400) brain.history.shift()
  return trace ? { ...record, trace } : record
}

/** Follows the learned plan with no randomness — the robot's actual answer. */
export function greedyRoute(brain, grid) {
  const route = [grid.start]
  const seen = new Set([grid.start])
  let cell = grid.start
  const limit = maxSteps(grid)

  for (let i = 0; i < limit; i++) {
    const next = move(grid, cell, bestAction(brain, cell))
    // Standing still or looping means it has no plan from here.
    if (next === cell || seen.has(next)) return { route, complete: false }
    route.push(next)
    seen.add(next)
    if (next === grid.goal) return { route, complete: true }
    if (grid.cells[next] === LAVA) return { route, complete: false }
    cell = next
  }
  return { route, complete: false }
}

/** Share of the last `window` episodes that reached the goal. */
export function successRate(brain, window = 30) {
  const recent = brain.history.slice(-window)
  if (recent.length === 0) return 0
  return recent.filter((e) => e.success).length / recent.length
}

export const maxAbsQ = (brain) => {
  let max = 0
  for (let i = 0; i < brain.q.length; i++) {
    const abs = Math.abs(brain.q[i])
    if (abs > max) max = abs
  }
  return max || 1
}
