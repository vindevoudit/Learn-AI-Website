import { useCallback, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import LessonShell from '../../components/lesson/LessonShell'
import Panel from '../../components/ui/Panel'
import Button from '../../components/ui/Button'
import Slider from '../../components/ui/Slider'
import Callout from '../../components/ui/Callout'
import PolicyView, { PolicyLegend } from '../../widgets/grid/PolicyView'
import { PAINT_MODES } from '../../widgets/grid/GridCanvas'
import { useAnimationFrame } from '../../hooks/useAnimationFrame'
import { useMotionScale } from '../../hooks/useReducedMotion'
import { getLesson } from '../../data/lessons'
import { colors, spring } from '../../theme'
import { EMPTY, LAVA, WALL, clearGrid, makeGrid, presets, setCell } from '../../lib/grid'
import { createBrain, greedyRoute, runEpisode, successRate } from '../../lib/qlearning'

const lesson = getLesson('learn-the-hard-way')

const EPISODES_PER_FRAME = 6
const DEATH_BUDGET = 30

/** Reward sparkline — one point per episode, the robot's actual score. */
function RewardTrail({ history }) {
  const width = 320
  const height = 70
  const points = history.slice(-160)
  if (points.length < 2) {
    return (
      <div
        className="flex items-center justify-center rounded-panel border border-line bg-panel2/40 text-sm text-mute"
        style={{ height }}
      >
        press Train to start
      </div>
    )
  }

  const values = points.map((p) => p.reward)
  const min = Math.min(...values, -1)
  const max = Math.max(...values, 1)
  const path = points
    .map((p, i) => {
      const x = (i / (points.length - 1)) * width
      const y = height - ((p.reward - min) / (max - min || 1)) * (height - 8) - 4
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`
    })
    .join(' ')

  const zeroY = height - ((0 - min) / (max - min || 1)) * (height - 8) - 4

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full rounded-panel border border-line bg-panel2/40"
      style={{ height }}
      role="img"
      aria-label={`Score for each attempt. Latest ${points[points.length - 1].reward.toFixed(2)}.`}
    >
      <line x1="0" y1={zeroY} x2={width} y2={zeroY} stroke={colors.line} strokeWidth="1" />
      <path d={path} fill="none" stroke={colors.spark} strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  )
}

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
              ? 'border-spark text-spark'
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

export default function LearnTheHardWay() {
  const [grid, setGrid] = useState(() => makeGrid('lava'))
  const [epsilon, setEpsilon] = useState(0.15)
  const [paintMode, setPaintMode] = useState(WALL)
  const [training, setTraining] = useState(false)
  const [version, setVersion] = useState(0)
  const [watching, setWatching] = useState(null)
  const motionScale = useMotionScale()

  const brainRef = useRef(createBrain(grid))
  const [stats, setStats] = useState({ episodes: 0, deaths: 0, rate: 0 })
  const deathsRef = useRef(0)

  const reset = useCallback(
    (nextGrid = grid) => {
      brainRef.current = createBrain(nextGrid)
      deathsRef.current = 0
      setStats({ episodes: 0, deaths: 0, rate: 0 })
      setTraining(false)
      setWatching(null)
      setVersion((v) => v + 1)
    },
    [grid],
  )

  const changeGrid = (next) => {
    setGrid(next)
    reset(next)
  }

  const paint = useCallback(
    (i) => {
      // Changing the world invalidates everything the robot learned about it.
      setGrid((g) => {
        const next = setCell(g, i, paintMode)
        if (next !== g) {
          brainRef.current = createBrain(next)
          deathsRef.current = 0
          setStats({ episodes: 0, deaths: 0, rate: 0 })
          setTraining(false)
        }
        return next
      })
      setVersion((v) => v + 1)
    },
    [paintMode],
  )

  // Fast training: many episodes per frame, with only the picture updating at
  // screen rate. The robot is genuinely re-running the maze each time.
  useAnimationFrame(() => {
    const brain = brainRef.current
    for (let i = 0; i < EPISODES_PER_FRAME; i++) {
      const episode = runEpisode(brain, grid, { epsilon })
      if (episode.outcome === 'died in lava') deathsRef.current++
    }
    setStats({
      episodes: brain.episodes,
      deaths: deathsRef.current,
      rate: successRate(brain, 30),
    })
    setVersion((v) => v + 1)
  }, training && !watching)

  // Watching one attempt at human speed: replay a recorded route step by step.
  useAnimationFrame(
    (delta) => {
      setWatching((w) => {
        if (!w) return w
        const next = w.t + delta * 9 * motionScale
        if (next >= w.trace.length) return null
        return { ...w, t: next }
      })
      setVersion((v) => v + 1)
    },
    Boolean(watching),
  )

  const watchOne = () => {
    setTraining(false)
    const episode = runEpisode(brainRef.current, grid, { epsilon, trace: true })
    if (episode.outcome === 'died in lava') deathsRef.current++
    setStats({
      episodes: brainRef.current.episodes,
      deaths: deathsRef.current,
      rate: successRate(brainRef.current, 30),
    })
    setWatching({ trace: episode.trace, t: 0, outcome: episode.outcome })
  }

  const plan = useMemo(
    () => greedyRoute(brainRef.current, grid),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [version, grid],
  )

  const robotAt = watching ? watching.trace[Math.floor(watching.t)] : null
  const budgetLeft = DEATH_BUDGET - stats.deaths
  const challengeSolved = plan.complete && stats.deaths <= DEATH_BUDGET && stats.rate >= 0.9

  const lab = (
    <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
      <div className="space-y-4">
        <Panel
          label="The maze"
          readout={
            watching ? `watching one attempt · ${watching.outcome}` : `${stats.episodes} attempts`
          }
          bodyClass="p-3"
        >
          <PolicyView
            grid={grid}
            brain={brainRef.current}
            version={version}
            robotAt={robotAt}
            route={watching ? null : plan.complete ? plan.route : null}
            onPaint={paint}
            paintMode={paintMode}
          />
          <div className="mt-3 border-t border-line pt-3">
            <PolicyLegend />
          </div>
        </Panel>

        <Panel label="Build the maze" readout={grid.presetId === 'custom' ? 'your own' : 'preset'}>
          <div className="space-y-3">
            <MazePicker
              grid={grid}
              onPick={(id) => changeGrid(makeGrid(id))}
              onClear={() => changeGrid(clearGrid(grid))}
            />
            <div className="flex flex-wrap items-center gap-2">
              <span className="rail-label">Brush</span>
              {PAINT_MODES.map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setPaintMode(mode.id)}
                  aria-pressed={paintMode === mode.id}
                  title={mode.hint}
                  className={`rounded-panel border px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.14em] transition-colors ${
                    paintMode === mode.id
                      ? 'border-spark text-spark'
                      : 'border-line text-mute hover:text-ink'
                  }`}
                >
                  {mode.label}
                </button>
              ))}
              <span className="readout">editing the maze wipes its memory</span>
            </div>
          </div>
        </Panel>
      </div>

      <div className="space-y-4">
        <Panel label="How it is doing" readout={training ? 'learning…' : 'paused'}>
          <RewardTrail history={brainRef.current.history} />

          <dl className="mt-4 grid grid-cols-3 gap-3">
            <div>
              <dt className="rail-label">Attempts</dt>
              <dd className="mt-1 font-mono text-lg tabular-nums text-ink">{stats.episodes}</dd>
            </div>
            <div>
              <dt className="rail-label">Got there</dt>
              <dd className="mt-1 font-mono text-lg tabular-nums" style={{ color: colors.charge }}>
                {(stats.rate * 100).toFixed(0)}%
              </dd>
            </div>
            <div>
              <dt className="rail-label">Died</dt>
              <dd className="mt-1 font-mono text-lg tabular-nums" style={{ color: colors.spark }}>
                {stats.deaths}
              </dd>
            </div>
          </dl>

          <div className="mt-4 h-2 overflow-hidden rounded-full bg-line">
            <motion.div
              className="h-full rounded-full"
              animate={{ width: `${stats.rate * 100}%` }}
              transition={spring.soft}
              style={{ background: colors.charge }}
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4">
            <Button variant="spark" size="sm" onClick={() => setTraining((t) => !t)}>
              {training ? 'Pause' : stats.episodes ? 'Keep training' : 'Train'}
            </Button>
            <Button variant="ghost" size="sm" onClick={watchOne}>
              Watch one attempt
            </Button>
            <Button variant="quiet" size="sm" onClick={() => reset()}>
              Wipe its memory
            </Button>
          </div>
        </Panel>

        <Panel label="Curiosity" readout={`${(epsilon * 100).toFixed(0)}% random moves`}>
          <Slider
            label="How often it tries something random"
            value={epsilon}
            onChange={setEpsilon}
            min={0}
            max={0.6}
            step={0.01}
            accent={colors.spark}
            format={(v) => `${(v * 100).toFixed(0)}%`}
          />
          <p className="mt-3 text-[15px] leading-relaxed text-mute">
            {epsilon < 0.03
              ? 'It only ever does what already looks best. Cheap, and safe.'
              : epsilon < 0.2
                ? 'Mostly sensible, with the occasional detour to see what happens.'
                : 'Reckless. It will learn eventually, but it is going to walk into a lot of lava first.'}
          </p>
        </Panel>

        <Panel label="Its plan right now" readout={plan.complete ? `${plan.route.length - 1} steps` : 'none yet'}>
          <p className="text-[15px] leading-relaxed text-mute">
            {plan.complete
              ? 'Following only its best-rated move from every square now gets it to the goal. That white line is the plan.'
              : 'Follow its best move from every square and it still does not reach the goal. It needs more attempts.'}
          </p>
        </Panel>
      </div>
    </div>
  )

  const steps = [
    {
      id: 'hook',
      label: 'The idea',
      title: 'Nobody shows it the way out',
      intro:
        'Last lesson the computer could see every wall before it started. This robot sees nothing. It knows which square it is standing on, and it finds out what happens when it moves. That is the entire input.',
      content: (
        <div className="grid gap-4 lg:grid-cols-2">
          <Panel label="The only rules it gets" readout="3 numbers">
            <ol className="space-y-4">
              {[
                ['Reaching the goal is worth +1', 'The one thing it is trying to make happen.'],
                ['Lava is worth −1', 'And the attempt ends there. It does not get told why.'],
                ['Every step costs a little', 'So dawdling is punished and short routes win.'],
              ].map(([name, body], i) => (
                <li key={name} className="flex gap-4">
                  <span className="mt-0.5 font-mono text-[11px] text-spark">0{i + 1}</span>
                  <div>
                    <p className="font-medium">{name}</p>
                    <p className="mt-1 text-[15px] leading-relaxed text-mute">{body}</p>
                  </div>
                </li>
              ))}
            </ol>
            <p className="mt-5 border-t border-line pt-4 text-[15px] leading-relaxed text-mute">
              From those three numbers alone it has to work out a route. It does this by keeping a
              score for every move from every square, and nudging that score every single time it
              moves. Good things raise the score of whatever led to them.
            </p>
          </Panel>

          <div className="space-y-4">
            <Callout title="Why the colours creep backwards" tone="spark">
              At first only squares touching the goal look good. Then squares touching{' '}
              <em>those</em> start to look good, because they lead somewhere promising. Value seeps
              outward from the goal one layer per batch of attempts — you can watch it happen.
            </Callout>
            <Callout title="This is how game AI is trained" tone="charge">
              The same loop, at enormous scale, is what learns to play chess, Go and video games. No
              human ever writes the strategy. It falls out of a score and a great many attempts.
            </Callout>
            <Callout title="It will die a lot" tone="spark">
              That is not a bug in the robot. Dying is the only way it can find out where the lava
              is, because nobody told it.
            </Callout>
          </div>
        </div>
      ),
    },
    {
      id: 'play',
      label: 'Play',
      title: 'Drop it in and let it fail',
      intro:
        'Press Train and watch the arrows fill in. Hit "Watch one attempt" at any point to follow a single run at human speed — early on it is pure flailing, and a few hundred attempts later it walks straight there.',
      content: lab,
    },
    {
      id: 'challenge',
      label: 'Challenge',
      title: `Teach it the lava maze on fewer than ${DEATH_BUDGET} deaths`,
      intro:
        'Wipe its memory, pick the Lava Run maze, and get it to a working plan and a 90% success rate — without killing it more than thirty times. The curiosity dial is the thing to think about.',
      content: (
        <div className="space-y-4">
          <Panel
            label="Challenge"
            readout={challengeSolved ? 'solved' : `${Math.max(0, budgetLeft)} deaths left`}
            className={challengeSolved ? 'border-charge/60' : undefined}
          >
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                ['Plan reaches the goal', plan.complete],
                ['Success rate 90% or better', stats.rate >= 0.9],
                [`Died ${DEATH_BUDGET} times or fewer`, stats.deaths <= DEATH_BUDGET],
              ].map(([label, met]) => (
                <div
                  key={label}
                  className="rounded-panel border px-3 py-2 text-sm"
                  style={{ borderColor: met ? colors.charge : colors.line }}
                >
                  <span style={{ color: met ? colors.charge : colors.mute }}>
                    {met ? '✓ ' : '· '}
                    {label}
                  </span>
                </div>
              ))}
            </div>

            <p className="mt-4 text-[15px] leading-relaxed text-mute">
              {challengeSolved
                ? 'Done — and notice how you did it. Turning curiosity down did not make it learn worse here; it made it learn faster and cheaper, because a fresh robot is already willing to try anything it has not tried.'
                : 'Every random move is a chance to step into lava. Try wiping its memory and running again with curiosity near zero, then compare the death count.'}
            </p>
          </Panel>
          {lab}
        </div>
      ),
    },
    {
      id: 'recap',
      label: 'Recap',
      title: 'What you just did',
      content: (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Callout title="It learned from a score" tone="spark">
              No examples, no answers, no map. One number saying how well that attempt went, and a
              few hundred attempts.
            </Callout>
            <Callout title="Value flows backwards" tone="charge">
              Squares are worth being on because of where they lead. That is why the green spreads
              out from the goal instead of appearing all at once.
            </Callout>
            <Callout title="Curiosity has a price" tone="spark">
              Random moves cost lives and slow it down. In a maze this small it never needed forcing —
              anything it had not tried already looked worth trying.
            </Callout>
          </div>
          <Callout title="Two lessons, one maze" tone="charge">
            The search in lesson 05 solved this maze in a fraction of a second, because it could see
            the whole thing. This robot needed hundreds of attempts to learn less. That is the trade:
            search needs a map, and learning does not.
          </Callout>
        </div>
      ),
    },
  ]

  return <LessonShell lesson={lesson} steps={steps} />
}
