import { useCallback, useMemo, useState } from 'react'
import LessonShell from '../../components/lesson/LessonShell'
import Panel from '../../components/ui/Panel'
import Button from '../../components/ui/Button'
import Slider from '../../components/ui/Slider'
import Callout from '../../components/ui/Callout'
import { PAINT_MODES } from '../../widgets/grid/GridCanvas'
import SearchView from '../../widgets/grid/SearchView'
import { getLesson } from '../../data/lessons'
import { colors } from '../../theme'
import { ALGORITHMS, getAlgorithm } from '../../lib/pathfinding'
import { EMPTY, LAVA, WALL, clearGrid, makeGrid, presets, setCell } from '../../lib/grid'

const lesson = getLesson('find-the-way-out')

const emptyStats = { expanded: 0, done: false, found: false, length: null }

/** A row of maze presets — also the keyboard route into editing the world. */
function MazePicker({ grid, onPick, onClear }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="rail-label">Maze</span>
      {presets.map((preset) => (
        <button
          key={preset.id}
          type="button"
          onClick={() => onPick(preset.id)}
          title={preset.hint}
          aria-pressed={grid.presetId === preset.id}
          className={`rounded-panel border px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.14em] transition-colors ${
            grid.presetId === preset.id
              ? 'border-charge text-charge'
              : 'border-line text-mute hover:text-ink'
          }`}
        >
          {preset.name}
        </button>
      ))}
      <Button size="sm" variant="quiet" onClick={onClear}>
        Empty it
      </Button>
    </div>
  )
}

function AlgorithmPicker({ value, onChange, accent = colors.charge }) {
  return (
    <div className="flex flex-wrap gap-2">
      {ALGORITHMS.map((algo) => {
        const active = algo.id === value
        return (
          <button
            key={algo.id}
            type="button"
            onClick={() => onChange(algo.id)}
            aria-pressed={active}
            className="rounded-panel border px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.14em] transition-colors"
            style={
              active
                ? { borderColor: accent, color: accent }
                : { borderColor: colors.line, color: colors.mute }
            }
          >
            {algo.name}
          </button>
        )
      })}
    </div>
  )
}

function StatRow({ stats }) {
  return (
    <dl className="grid grid-cols-2 gap-3 font-mono text-[12px]">
      <div>
        <dt className="rail-label">Squares checked</dt>
        <dd className="mt-1 text-lg tabular-nums text-ink">{stats.expanded}</dd>
      </div>
      <div>
        <dt className="rail-label">Route length</dt>
        <dd className="mt-1 text-lg tabular-nums" style={{ color: colors.charge }}>
          {stats.length ?? (stats.done ? 'no route' : '—')}
        </dd>
      </div>
    </dl>
  )
}

export default function FindTheWayOut() {
  const [grid, setGrid] = useState(() => makeGrid('wall'))
  const [algorithmId, setAlgorithmId] = useState('bfs')
  const [speed, setSpeed] = useState(6)
  const [paintMode, setPaintMode] = useState(WALL)
  const [runToken, setRunToken] = useState(1)
  const [stats, setStats] = useState(emptyStats)

  // The race runs two searches on one maze; each reports into its own slot.
  const [leftAlgo, setLeftAlgo] = useState('greedy')
  const [rightAlgo, setRightAlgo] = useState('astar')
  const [raceToken, setRaceToken] = useState(1)
  const [leftStats, setLeftStats] = useState(emptyStats)
  const [rightStats, setRightStats] = useState(emptyStats)

  const paint = useCallback(
    (i) => {
      setGrid((g) => setCell(g, i, paintMode))
      setRunToken((t) => t + 1)
      setRaceToken((t) => t + 1)
    },
    [paintMode],
  )

  const pickMaze = (id) => {
    setGrid(makeGrid(id))
    setRunToken((t) => t + 1)
    setRaceToken((t) => t + 1)
  }

  const emptyIt = () => {
    setGrid((g) => clearGrid(g))
    setRunToken((t) => t + 1)
    setRaceToken((t) => t + 1)
  }

  const algorithm = getAlgorithm(algorithmId)

  const raceDone = leftStats.done && rightStats.done
  const bothFound = leftStats.found && rightStats.found
  // The challenge is won when the hasty search returns a worse route than the
  // clever one — the whole point of the lesson, demonstrated by the student.
  const solved =
    raceDone && bothFound && leftStats.length != null && rightStats.length != null &&
    leftStats.length !== rightStats.length

  const editor = (
    <Panel label="Build the maze" readout={grid.presetId === 'custom' ? 'your own' : 'preset'}>
      <div className="space-y-3">
        <MazePicker grid={grid} onPick={pickMaze} onClear={emptyIt} />
        <div className="flex flex-wrap items-center gap-2">
          <span className="rail-label">Brush</span>
          {PAINT_MODES.filter((m) => m.id !== LAVA).map((mode) => (
            <button
              key={mode.id}
              type="button"
              onClick={() => setPaintMode(mode.id)}
              aria-pressed={paintMode === mode.id}
              className={`rounded-panel border px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.14em] transition-colors ${
                paintMode === mode.id
                  ? 'border-charge text-charge'
                  : 'border-line text-mute hover:text-ink'
              }`}
            >
              {mode.label}
            </button>
          ))}
          <span className="readout">drag on the maze to draw</span>
        </div>
      </div>
    </Panel>
  )

  const playground = (
    <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
      <div className="space-y-4">
        <Panel
          label="The maze"
          readout={stats.done ? (stats.found ? 'route found' : 'no route exists') : 'searching…'}
          bodyClass="p-3"
        >
          <SearchView
            grid={grid}
            algorithmId={algorithmId}
            runToken={runToken}
            speed={speed}
            onStats={setStats}
            onPaint={paint}
            paintMode={paintMode}
            ariaLabel={`${algorithm.name} searching the maze`}
          />
        </Panel>
        {editor}
      </div>

      <div className="space-y-4">
        <Panel label="Strategy" readout={algorithm.formal}>
          <AlgorithmPicker value={algorithmId} onChange={setAlgorithmId} />
          <p className="mt-3 text-[15px] leading-relaxed text-mute">{algorithm.blurb}</p>

          <div className="mt-4 border-t border-line pt-4">
            <StatRow stats={stats} />
          </div>

          <div className="mt-4 space-y-3 border-t border-line pt-4">
            <Slider
              label="Search speed"
              value={speed}
              onChange={setSpeed}
              min={1}
              max={40}
              step={1}
              accent={colors.charge}
              format={(v) => `${v.toFixed(0)} squares / frame`}
            />
            <Button variant="charge" size="sm" onClick={() => setRunToken((t) => t + 1)}>
              Search again
            </Button>
          </div>
        </Panel>

        <Callout title="What the colours mean" tone="charge">
          Dim blue squares have been checked and ruled out. Green is the frontier — the edge of what
          the search knows so far. The bright line at the end is the route it settled on.
        </Callout>
      </div>
    </div>
  )

  const race = (
    <div className="space-y-4">
      <Panel
        label="Head to head · same maze, same moment"
        readout={raceDone ? 'both finished' : 'running…'}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            { algo: leftAlgo, set: setLeftAlgo, stats: leftStats, onStats: setLeftStats, key: 'L' },
            { algo: rightAlgo, set: setRightAlgo, stats: rightStats, onStats: setRightStats, key: 'R' },
          ].map((side) => (
            <div key={side.key} className="space-y-3">
              <AlgorithmPicker value={side.algo} onChange={side.set} />
              <SearchView
                grid={grid}
                algorithmId={side.algo}
                runToken={raceToken}
                speed={speed}
                onStats={side.onStats}
                maxHeight={260}
                ariaLabel={`${getAlgorithm(side.algo).name} searching`}
              />
              <StatRow stats={side.stats} />
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-4">
          <Button variant="charge" size="sm" onClick={() => setRaceToken((t) => t + 1)}>
            Race again
          </Button>
          <MazePicker grid={grid} onPick={pickMaze} onClear={emptyIt} />
        </div>
      </Panel>

      <Panel label="Result" readout={solved ? 'challenge solved' : 'not yet'}>
        {!raceDone ? (
          <p className="text-[15px] leading-relaxed text-mute">Let both searches finish.</p>
        ) : solved ? (
          <p className="text-[15px] leading-relaxed" style={{ color: colors.charge }}>
            There it is. One search checked{' '}
            {Math.abs(leftStats.expanded - rightStats.expanded)} squares fewer than the other, but
            handed back a route {Math.abs(leftStats.length - rightStats.length)} steps longer. Fast
            and right are not the same thing.
          </p>
        ) : (
          <p className="text-[15px] leading-relaxed text-mute">
            Both found routes of the same length here. Try the <strong>Shortcut</strong> or{' '}
            <strong>Four Rooms</strong> maze with <strong>Beeline</strong> against{' '}
            <strong>Smart guess</strong> — or draw a wall that makes the straight-line direction a
            lie.
          </p>
        )}
      </Panel>
    </div>
  )

  const steps = [
    {
      id: 'hook',
      label: 'The idea',
      title: 'Searching is guessing, then checking',
      intro:
        'A computer cannot see a maze the way you do. It stands on one square, looks at the squares next to it, and repeats — thousands of times a second. The only real choice it makes is which square to look at next.',
      content: (
        <div className="grid gap-4 lg:grid-cols-2">
          <Panel label="Three ways to choose" readout="each one is a rule">
            <ol className="space-y-4">
              {ALGORITHMS.map((algo, i) => (
                <li key={algo.id} className="flex gap-4">
                  <span className="mt-0.5 font-mono text-[11px] text-charge">0{i + 1}</span>
                  <div>
                    <p className="font-medium">
                      {algo.name}{' '}
                      <span className="font-mono text-[11px] text-mute">· {algo.formal}</span>
                    </p>
                    <p className="mt-1 text-[15px] leading-relaxed text-mute">{algo.blurb}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Panel>

          <div className="space-y-4">
            <Panel label="Flood fill, checking everything" bodyClass="p-3">
              <SearchView
                grid={grid}
                algorithmId="bfs"
                runToken={runToken}
                speed={4}
                maxHeight={260}
                ariaLabel="A flood-fill search spreading evenly through the maze"
              />
            </Panel>
            <Callout title="This is AI too" tone="charge">
              No neurons, no training, no data. Search came decades before neural networks and still
              runs underneath satnavs, delivery routing and the enemies in most video games.
            </Callout>
          </div>
        </div>
      ),
    },
    {
      id: 'play',
      label: 'Play',
      title: 'Draw a maze and set them loose',
      intro:
        'Swap between the three strategies on the same maze and watch how differently they spread. Draw your own walls at any time — the search restarts the moment you do.',
      content: playground,
    },
    {
      id: 'challenge',
      label: 'Challenge',
      title: 'Catch the hasty one being wrong',
      intro:
        'Beeline always heads for whichever square looks closest to the goal. Find a maze where that instinct betrays it — where it finishes quickly and still hands back a worse route than Smart guess.',
      content: race,
    },
    {
      id: 'recap',
      label: 'Recap',
      title: 'What you just did',
      content: (
        <div className="grid gap-4 sm:grid-cols-3">
          <Callout title="A heuristic is a hunch" tone="charge">
            "Head towards the goal" is a guess about which way is promising. Good guesses save
            enormous amounts of work. Bad ones walk you into a wall.
          </Callout>
          <Callout title="Thorough costs time" tone="charge">
            Flood fill can never be fooled, because it refuses to prefer anything. It pays for that
            with every single square on the board.
          </Callout>
          <Callout title="It knew the map" tone="spark">
            All three cheated: they could see every wall from the start. Next lesson takes the map
            away and drops a robot into this same maze blind.
          </Callout>
        </div>
      ),
    },
  ]

  return <LessonShell lesson={lesson} steps={steps} />
}
