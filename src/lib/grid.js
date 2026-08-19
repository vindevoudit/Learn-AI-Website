// The world both maze lessons share.
//
// Lesson 05 searches this grid with full knowledge of it. Lesson 06 drops a
// robot into the same grid that cannot see any of it. Sharing the model is what
// lets the second lesson open in the exact maze the student just solved.

export const EMPTY = 0
export const WALL = 1
export const LAVA = 2

export const COLS = 21
export const ROWS = 13

const CHAR_TO_CELL = { '.': EMPTY, '#': WALL, '~': LAVA, S: EMPTY, G: EMPTY }

/**
 * Mazes are written as pictures because that is how they get edited later.
 * `.` floor  `#` wall  `~` lava  `S` start  `G` goal
 */
export const presets = [
  {
    id: 'wall',
    name: 'The Wall',
    hint: 'A straight run to the goal, blocked by one barrier.',
    layout: [
      '.....................',
      '.....................',
      '.......#######.......',
      '.............#.......',
      '.............#.......',
      'S............#......G',
      '.............#.......',
      '.............#.......',
      '.......#######.......',
      '.....................',
      '.....................',
      '.....................',
      '.....................',
    ],
  },
  {
    id: 'trap',
    name: 'The Shortcut',
    hint: 'One route points straight at the goal. It is not the short one.',
    layout: [
      '#####################',
      '#####################',
      '####...##...##...####',
      '####.#.##.#.##.#.####',
      '####.#.##.#.##.#.####',
      '####.#.##.#.##.#.####',
      'S....#....#....#....G',
      '.###################.',
      '.###################.',
      '.###################.',
      '.###################.',
      '.###################.',
      '.....................',
    ],
  },
  {
    id: 'lava',
    name: 'Lava Run',
    hint: 'Straight across is short and fatal. Around is long and safe.',
    layout: [
      '.....................',
      '.....................',
      '.....................',
      '..........~..........',
      '..........~..........',
      '..........~..........',
      'S.........~.........G',
      '..........~..........',
      '..........~..........',
      '..........~..........',
      '.....................',
      '.....................',
      '.....................',
    ],
  },
  {
    id: 'rooms',
    name: 'Four Rooms',
    hint: 'Four chambers joined by narrow doors.',
    layout: [
      'S.........#..........',
      '..........#..........',
      '..........#..........',
      '.....................',
      '..........#..........',
      '..........#..........',
      '####.###########.####',
      '..........#..........',
      '..........#..........',
      '.....................',
      '..........#..........',
      '..........#..........',
      '..........#.........G',
    ],
  },
]

/** Turns a picture into a grid. Throws loudly on a mis-typed row. */
export function parseGrid(layout) {
  const rows = layout.length
  const cols = layout[0].length

  layout.forEach((row, y) => {
    if (row.length !== cols) {
      throw new Error(`Maze row ${y} is ${row.length} wide, expected ${cols}`)
    }
  })

  const cells = new Uint8Array(cols * rows)
  let start = 0
  let goal = cols * rows - 1

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const char = layout[y][x]
      const cell = CHAR_TO_CELL[char]
      if (cell === undefined) throw new Error(`Unknown maze character "${char}"`)
      const i = y * cols + x
      cells[i] = cell
      if (char === 'S') start = i
      if (char === 'G') goal = i
    }
  }

  return { cols, rows, cells, start, goal }
}

export const makeGrid = (presetId = 'wall') => {
  const preset = presets.find((p) => p.id === presetId) ?? presets[0]
  return { ...parseGrid(preset.layout), presetId: preset.id }
}

export const toXY = (grid, i) => ({ x: i % grid.cols, y: Math.floor(i / grid.cols) })
export const toIndex = (grid, x, y) => y * grid.cols + x
export const inBounds = (grid, x, y) => x >= 0 && y >= 0 && x < grid.cols && y < grid.rows

export const isWall = (grid, i) => grid.cells[i] === WALL
export const isLava = (grid, i) => grid.cells[i] === LAVA

/** The four cardinal neighbours that aren't walls or off the edge. */
export function neighbours(grid, i) {
  const { x, y } = toXY(grid, i)
  const out = []
  // Order matters: it fixes the tie-break, which keeps every search reproducible.
  const deltas = [
    [0, -1],
    [1, 0],
    [0, 1],
    [-1, 0],
  ]
  for (const [dx, dy] of deltas) {
    const nx = x + dx
    const ny = y + dy
    if (!inBounds(grid, nx, ny)) continue
    const n = toIndex(grid, nx, ny)
    if (isWall(grid, n)) continue
    out.push(n)
  }
  return out
}

/** Straight-line-ish distance. This is the guess A* and greedy search rely on. */
export function manhattan(grid, a, b) {
  const p = toXY(grid, a)
  const q = toXY(grid, b)
  return Math.abs(p.x - q.x) + Math.abs(p.y - q.y)
}

/** Immutable paint. Start and goal squares refuse to become walls. */
export function setCell(grid, i, type) {
  if (i === grid.start || i === grid.goal) return grid
  if (grid.cells[i] === type) return grid
  const cells = Uint8Array.from(grid.cells)
  cells[i] = type
  return { ...grid, cells, presetId: 'custom' }
}

export function clearGrid(grid) {
  return { ...grid, cells: new Uint8Array(grid.cells.length), presetId: 'custom' }
}
