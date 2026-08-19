import { useMemo, useRef, useState } from 'react'
import LessonShell from '../../components/lesson/LessonShell'
import Panel from '../../components/ui/Panel'
import Button from '../../components/ui/Button'
import Callout from '../../components/ui/Callout'
import DrawPad from '../../widgets/teachable/DrawPad'
import SampleTray from '../../widgets/teachable/SampleTray'
import TrainingChart from '../../widgets/teachable/TrainingChart'
import WeightHeatmap from '../../widgets/teachable/WeightHeatmap'
import PredictionMeter from '../../widgets/teachable/PredictionMeter'
import { useAnimationFrame } from '../../hooks/useAnimationFrame'
import { getLesson } from '../../data/lessons'
import { colors } from '../../theme'
import {
  DIM,
  createModel,
  isBlank,
  predict,
  resetModel,
  smooth,
  trainStep,
} from '../../lib/classifier'
import { shapeMakers } from '../../lib/shapes'

const lesson = getLesson('teachable-machine')

const CLASSES = [
  { label: 0, name: 'Lines', singular: 'line', hex: colors.signal, maker: 'line' },
  { label: 1, name: 'Circles', singular: 'circle', hex: colors.spark, maker: 'circle' },
]

const MAX_EPOCHS = 600
const blankGrid = () => new Float64Array(DIM)

let nextId = 1

export default function TeachableMachine() {
  const [samples, setSamples] = useState([])
  const [draft, setDraft] = useState(blankGrid)
  const [test, setTest] = useState(blankGrid)

  const modelRef = useRef(createModel())
  const [epoch, setEpoch] = useState(0)
  const [history, setHistory] = useState([])
  const [accuracy, setAccuracy] = useState(0)
  const [training, setTraining] = useState(false)

  const counts = CLASSES.map((cls) => samples.filter((s) => s.label === cls.label).length)
  const canTrain = counts.every((n) => n > 0)
  const trained = epoch > 0

  /** Any change to the data invalidates what was learned from it. */
  const invalidate = () => {
    resetModel(modelRef.current)
    setEpoch(0)
    setHistory([])
    setAccuracy(0)
    setTraining(false)
  }

  const addSample = (label, pixels) => {
    if (isBlank(pixels)) return
    const raw = Float64Array.from(pixels)
    setSamples((prev) => [...prev, { id: nextId++, label, raw, pixels: smooth(raw) }])
    invalidate()
  }

  const removeSample = (id) => {
    setSamples((prev) => prev.filter((s) => s.id !== id))
    invalidate()
  }

  const stamp = (maker) => setDraft(shapeMakers[maker]())

  const quickFill = (perClass) => {
    const made = []
    for (const cls of CLASSES) {
      for (let i = 0; i < perClass; i++) {
        const raw = shapeMakers[cls.maker]()
        made.push({ id: nextId++, label: cls.label, raw, pixels: smooth(raw) })
      }
    }
    setSamples(made)
    invalidate()
  }

  const startOver = () => {
    setSamples([])
    setDraft(blankGrid())
    setTest(blankGrid())
    invalidate()
  }

  // The real training loop: several passes per frame, so the curve falls over
  // about a second rather than instantly or not at all.
  useAnimationFrame(() => {
    const model = modelRef.current
    let stats
    for (let i = 0; i < 4; i++) stats = trainStep(model, samples, 0.6)

    setHistory((h) => [...h, { loss: stats.loss }].slice(-200))
    setAccuracy(stats.accuracy)
    setEpoch(model.epoch)
    if (model.epoch >= MAX_EPOCHS) setTraining(false)
  }, training && canTrain)

  const testBlank = isBlank(test)
  const probability = useMemo(
    () => (trained && !testBlank ? predict(modelRef.current, smooth(test)) : 0.5),
    [trained, testBlank, test, epoch],
  )

  const studio = (
    <div className="grid gap-4 lg:grid-cols-3">
      {/* Collect */}
      <Panel label="1 · Give it examples" readout={`${samples.length} total`}>
        <DrawPad pixels={draft} onChange={setDraft} accent={colors.mute} label="Drawing pad" />

        <div className="mt-3 flex flex-wrap gap-2">
          {CLASSES.map((cls) => (
            <Button
              key={cls.label}
              size="sm"
              variant="ghost"
              onClick={() => {
                addSample(cls.label, draft)
                setDraft(blankGrid())
              }}
              disabled={isBlank(draft)}
            >
              Add to {cls.name}
            </Button>
          ))}
          <Button size="sm" variant="quiet" onClick={() => setDraft(blankGrid())}>
            Clear
          </Button>
        </div>

        <div className="mt-4 border-t border-line pt-3">
          <p className="rail-label mb-2">No mouse? Stamp one instead</p>
          <div className="flex flex-wrap gap-2">
            {CLASSES.map((cls) => (
              <Button key={cls.label} size="sm" variant="quiet" onClick={() => stamp(cls.maker)}>
                Stamp a {cls.singular}
              </Button>
            ))}
          </div>
        </div>
      </Panel>

      {/* Train */}
      <Panel
        label="2 · Train"
        readout={training ? 'running' : trained ? `${epoch} passes` : 'not started'}
      >
        <TrainingChart history={history} accuracy={accuracy} epoch={epoch} training={training} />

        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            variant="spark"
            size="sm"
            onClick={() => {
              if (epoch >= MAX_EPOCHS) invalidate()
              setTraining((t) => !t)
            }}
            disabled={!canTrain}
          >
            {training ? 'Pause' : trained ? 'Keep training' : 'Train'}
          </Button>
          <Button variant="quiet" size="sm" onClick={invalidate} disabled={!trained && !training}>
            Forget everything
          </Button>
        </div>

        {!canTrain && (
          <p className="mt-3 text-sm text-mute">
            It needs at least one example of each group before it can learn a difference.
          </p>
        )}
      </Panel>

      {/* Test */}
      <Panel label="3 · Test it" readout={trained ? 'ready' : 'untrained'}>
        <DrawPad pixels={test} onChange={setTest} accent={colors.charge} label="Test pad" />
        <div className="mt-3 flex flex-wrap gap-2">
          {CLASSES.map((cls) => (
            <Button
              key={cls.label}
              size="sm"
              variant="quiet"
              onClick={() => setTest(shapeMakers[cls.maker]())}
            >
              Stamp a {cls.singular}
            </Button>
          ))}
          <Button size="sm" variant="quiet" onClick={() => setTest(blankGrid())}>
            Clear
          </Button>
        </div>

        <div className="mt-4 border-t border-line pt-4">
          <PredictionMeter
            probability={probability}
            classes={CLASSES}
            trained={trained}
            blank={testBlank}
          />
        </div>
      </Panel>

      <div className="lg:col-span-3">
        <Panel label="Its examples" readout="click any to delete it">
          <SampleTray samples={samples} classes={CLASSES} onRemove={removeSample} />
          <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4">
            <Button size="sm" variant="ghost" onClick={() => quickFill(12)}>
              Fill with 12 of each
            </Button>
            <Button size="sm" variant="ghost" onClick={() => quickFill(1)}>
              Only 1 of each
            </Button>
            <Button size="sm" variant="quiet" onClick={startOver}>
              Start over
            </Button>
          </div>
        </Panel>
      </div>
    </div>
  )

  const steps = [
    {
      id: 'hook',
      label: 'The idea',
      title: 'Nobody tells the model what a circle is',
      intro:
        'You will never write down a rule for "circle". You show this model a pile of examples, tell it which group each belongs to, and let it work out the difference on its own.',
      content: (
        <div className="grid gap-4 lg:grid-cols-2">
          <Panel label="How learning actually works" readout="4 steps">
            <ol className="space-y-4">
              {[
                ['Guess', 'The model looks at a drawing and guesses. At the start the guess is worthless, because it knows nothing.'],
                ['Check', 'It compares its guess to the label you gave it. The gap between them is its error.'],
                ['Adjust', 'It nudges all 256 of its weights slightly, each in the direction that would have made the error smaller.'],
                ['Repeat', 'Hundreds of times. Every pass the error shrinks a little. That is all training is.'],
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
          </Panel>

          <div className="space-y-4">
            <Callout title="One weight per pixel" tone="spark">
              This model keeps one dial for each of the 256 squares in the grid, plus one for its
              overall eagerness. Small enough that you can look at every dial at once, which you
              will do two steps from now.
            </Callout>
            <Callout title="It only knows what you show it" tone="charge">
              There is no general knowledge in here. Show it a dozen circles drawn in the top-left
              corner and it may decide a circle simply means something in the top-left corner.
            </Callout>
          </div>
        </div>
      ),
    },
    {
      id: 'play',
      label: 'Train one',
      title: 'Draw, label, train, test',
      intro:
        'Draw a few lines and a few circles, add each to its group, then press Train and watch the error fall. Adding or deleting an example makes it forget: the model belongs to the data it was shown.',
      content: studio,
    },
    {
      id: 'challenge',
      label: 'Challenge',
      title: 'Starve it, then feed it',
      intro:
        'Press "Only 1 of each", train, and test a few stamps. It will claim 100% accuracy and still get new drawings wrong. Then fill it with 12 of each and watch what changes.',
      content: (
        <div className="space-y-4">
          <Callout title="Why 100% can be a lie" tone="spark">
            That accuracy is measured on the examples the model trained on. With one example per
            group it never has to learn what a circle is, because memorising two pictures is enough.
            The only honest test is a drawing it has never seen.
          </Callout>
          {studio}
          <Panel
            label="What it learned"
            readout={trained ? `after ${epoch} passes` : 'train it first'}
          >
            <div className="grid gap-6 sm:grid-cols-[auto_1fr] sm:items-start">
              <WeightHeatmap model={modelRef.current} classes={CLASSES} />
              <div className="space-y-3 text-[15px] leading-relaxed text-mute">
                <p>
                  This is the model's entire mind: 256 numbers, laid back over the grid you drew on.
                </p>
                <p>
                  Trained on one example per group it looks like a photograph of those two drawings,
                  because it memorised them. Trained on a dozen it blurs into something more general:
                  a ring of one colour where circles tend to have ink, a band of the other where
                  lines do.
                </p>
                <p className="text-ink">
                  More examples do not make the model bigger. They make it less certain about
                  accidents and more certain about the pattern.
                </p>
              </div>
            </div>
          </Panel>
        </div>
      ),
    },
    {
      id: 'recap',
      label: 'Recap',
      title: 'What you just did',
      content: (
        <div className="grid gap-4 sm:grid-cols-3">
          <Callout title="Training is repetition" tone="spark">
            Guess, measure the error, nudge the weights, repeat. The falling curve you watched was
            that loop running a few hundred times.
          </Callout>
          <Callout title="Data decides everything" tone="spark">
            You never changed the model, only what you showed it. Lopsided examples produce a
            lopsided model, and that is a problem much bigger than lines and circles.
          </Callout>
          <Callout title="Scale is the only difference" tone="charge">
            Swap 256 weights for a few hundred billion and this same loop is how a chatbot is
            trained. Lesson 03 is what that gets you.
          </Callout>
        </div>
      ),
    },
  ]

  return <LessonShell lesson={lesson} steps={steps} />
}
