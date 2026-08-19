import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import LessonShell from '../../components/lesson/LessonShell'
import Panel from '../../components/ui/Panel'
import Button from '../../components/ui/Button'
import Callout from '../../components/ui/Callout'
import TreeView from '../../widgets/tree/TreeView'
import { getLesson } from '../../data/lessons'
import { colors, spring } from '../../theme'
import {
  allAnswers,
  clean,
  countNodes,
  startingTree,
  teach,
  walk,
} from '../../lib/decisionTree'

const lesson = getLesson('twenty-questions')

/** The form shown when it guesses wrong — this is the whole learning step. */
function TeachForm({ wrongGuess, onTeach, onCancel }) {
  const [answer, setAnswer] = useState('')
  const [question, setQuestion] = useState('')
  const [answerIsYes, setAnswerIsYes] = useState(true)

  const ready = clean(answer).length > 1 && clean(question, 60).length > 4

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (!ready) return
        onTeach({
          answer: clean(answer),
          question: clean(question, 60),
          answerIsYes,
        })
      }}
      className="space-y-4"
    >
      <div>
        <label htmlFor="tq-answer" className="rail-label mb-1.5 block">
          What were you thinking of?
        </label>
        <input
          id="tq-answer"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          maxLength={40}
          autoComplete="off"
          placeholder="a penguin"
          className="w-full rounded-panel border border-line bg-panel2 px-3 py-2 text-[15px] text-ink placeholder:text-mute/60"
        />
      </div>

      <div>
        <label htmlFor="tq-question" className="rail-label mb-1.5 block">
          What question tells {answer ? clean(answer) : 'it'} apart from {wrongGuess}?
        </label>
        <input
          id="tq-question"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          maxLength={60}
          autoComplete="off"
          placeholder="Does it live somewhere cold?"
          className="w-full rounded-panel border border-line bg-panel2 px-3 py-2 text-[15px] text-ink placeholder:text-mute/60"
        />
      </div>

      <div>
        <span className="rail-label mb-1.5 block">
          For {answer ? clean(answer) : 'your animal'}, the answer to that is
        </span>
        <div className="flex gap-2">
          {[
            ['Yes', true],
            ['No', false],
          ].map(([label, value]) => (
            <button
              key={label}
              type="button"
              onClick={() => setAnswerIsYes(value)}
              aria-pressed={answerIsYes === value}
              className={`rounded-panel border px-3 py-1.5 text-sm transition-colors ${
                answerIsYes === value
                  ? 'border-signal text-signal'
                  : 'border-line text-mute hover:text-ink'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-t border-line pt-4">
        <Button type="submit" size="sm" disabled={!ready}>
          Teach it
        </Button>
        <Button variant="quiet" size="sm" onClick={onCancel}>
          Never mind
        </Button>
      </div>
    </form>
  )
}

export default function TwentyQuestions() {
  const [tree, setTree] = useState(startingTree)
  const [answers, setAnswers] = useState([])
  const [phase, setPhase] = useState('asking') // asking | guessing | teaching | done
  const [lastTaught, setLastTaught] = useState(null)
  const [newBranchId, setNewBranchId] = useState(null)
  const [taughtCount, setTaughtCount] = useState(0)

  const node = useMemo(() => walk(tree, answers), [tree, answers])
  const counts = useMemo(() => countNodes(tree), [tree])
  const known = useMemo(() => allAnswers(tree), [tree])

  const answerQuestion = (yes) => {
    const next = [...answers, yes]
    setAnswers(next)
    if (walk(tree, next).type === 'leaf') setPhase('guessing')
  }

  const restart = () => {
    setAnswers([])
    setPhase('asking')
    setLastTaught(null)
    setNewBranchId(null)
  }

  const handleTeach = ({ answer, question, answerIsYes }) => {
    const { tree: grown, branchId } = teach(tree, node.id, { answer, question, answerIsYes })
    setTree(grown)
    setNewBranchId(branchId)
    setTaughtCount((n) => n + 1)
    setLastTaught(answer)
    setAnswers([])
    setPhase('done')
  }

  const game = (
    <Panel
      label="The game"
      readout={`${counts.questions} questions · ${counts.answers} animals`}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={`${phase}-${node.id}-${answers.length}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          // Short and linear, not a spring: this is a quickfire yes/no game and
          // a settling spring between every question makes it feel sluggish.
          transition={{ duration: 0.14, ease: 'easeOut' }}
        >
          {phase === 'asking' && node.type === 'branch' && (
            <div>
              <p className="rail-label">Question {answers.length + 1}</p>
              <p className="mt-2 font-display text-2xl leading-snug">{node.question}</p>
              <div className="mt-5 flex gap-2">
                <Button size="lg" onClick={() => answerQuestion(true)}>
                  Yes
                </Button>
                <Button size="lg" variant="ghost" onClick={() => answerQuestion(false)}>
                  No
                </Button>
              </div>
            </div>
          )}

          {phase === 'guessing' && (
            <div>
              <p className="rail-label">Its guess</p>
              <p className="mt-2 font-display text-2xl leading-snug">
                You are thinking of <span className="text-signal">{node.answer}</span>.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Button size="lg" onClick={() => setPhase('done')}>
                  Correct
                </Button>
                <Button size="lg" variant="ghost" onClick={() => setPhase('teaching')}>
                  Wrong — let me teach it
                </Button>
              </div>
            </div>
          )}

          {phase === 'teaching' && (
            <TeachForm
              wrongGuess={node.answer}
              onTeach={handleTeach}
              onCancel={() => setPhase('guessing')}
            />
          )}

          {phase === 'done' && (
            <div>
              <p className="font-display text-2xl leading-snug">
                {lastTaught ? (
                  <>
                    Learned. It knows <span className="text-charge">{lastTaught}</span> now — look
                    at the branch that just appeared.
                  </>
                ) : (
                  'Got you. It only needed a few questions.'
                )}
              </p>
              <p className="mt-3 text-[15px] leading-relaxed text-mute">
                It can name {counts.answers} animals using {counts.questions} questions.
              </p>
              <Button className="mt-5" size="lg" onClick={restart}>
                Play again
              </Button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-line pt-4">
        <Button variant="quiet" size="sm" onClick={restart}>
          Start the round over
        </Button>
        <Button
          variant="quiet"
          size="sm"
          onClick={() => {
            setTree(startingTree())
            setTaughtCount(0)
            restart()
          }}
        >
          Wipe everything it learned
        </Button>
        <span className="readout">you have taught it {taughtCount}</span>
      </div>
    </Panel>
  )

  const mind = (
    <Panel label="Everything it knows" readout={`${counts.questions} questions`}>
      <TreeView
        tree={tree}
        activePath={answers}
        highlightId={phase === 'done' && lastTaught ? newBranchId : null}
      />
      <p className="mt-3 border-t border-line pt-3 text-sm leading-relaxed text-mute">
        Blue marks the path your answers took. Every animal it can name:{' '}
        {known.slice(0, 12).join(', ')}
        {known.length > 12 ? `, and ${known.length - 12} more` : ''}.
      </p>
    </Panel>
  )

  const steps = [
    {
      id: 'hook',
      label: 'The idea',
      title: 'Knowledge you can actually read',
      intro:
        'This machine learns like the drawing classifier in lesson 02 did — from what you tell it. The difference is that you can read every single thing it knows, in English, on this page.',
      content: (
        <div className="grid gap-4 lg:grid-cols-2">
          <Panel label="How it works" readout="3 steps">
            <ol className="space-y-4">
              {[
                ['Ask', 'It walks down a tree of yes/no questions, one branch per answer. Each question cuts the possibilities roughly in half.'],
                ['Guess', 'When it runs out of questions, whatever is at the bottom is its guess.'],
                ['Grow', 'If it is wrong, you give it a question that separates your animal from its guess — and that dead end becomes a new fork.'],
              ].map(([name, body], i) => (
                <li key={name} className="flex gap-4">
                  <span className="mt-0.5 font-mono text-[11px] text-signal">0{i + 1}</span>
                  <div>
                    <p className="font-medium">{name}</p>
                    <p className="mt-1 text-[15px] leading-relaxed text-mute">{body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Panel>

          <div className="space-y-4">
            <Callout title="Two kinds of memory" tone="signal">
              In lesson 02 the model's knowledge was 256 numbers. Nobody, including the people who
              built it, could look at those numbers and say why it thought something was a circle.
              Here you can point at the exact question it learned and read it out loud.
            </Callout>
            <Callout title="Why anyone still cares" tone="charge">
              Readable models are used wherever somebody has to justify a decision — a bank refusing
              a loan, a hospital ranking a waiting list. "The network said so" is not an answer.
            </Callout>
            <Callout title="It cannot generalise" tone="spark">
              Teach it a penguin and it knows a penguin. It will not work out anything about puffins
              on its own. Every single thing it knows, somebody typed in.
            </Callout>
          </div>
        </div>
      ),
    },
    {
      id: 'play',
      label: 'Play',
      title: 'Think of an animal',
      intro:
        'Answer honestly. It only knows a handful of animals to start with, so beating it is easy — and every time you beat it, you have to teach it what it missed.',
      content: (
        <div className="space-y-4">
          {game}
          {mind}
        </div>
      ),
    },
    {
      id: 'challenge',
      label: 'Challenge',
      title: 'Teach it three animals',
      intro:
        'Beat it three times and give it a good question each time. A good question splits the world roughly down the middle — "does it have four legs?" is far more useful than "is it my neighbour\u2019s dog?".',
      content: (
        <div className="space-y-4">
          <Panel
            label="Progress"
            readout={taughtCount >= 3 ? 'challenge solved' : `${taughtCount} of 3 taught`}
            className={taughtCount >= 3 ? 'border-charge/60' : undefined}
          >
            <div className="h-2 overflow-hidden rounded-full bg-line">
              <motion.div
                className="h-full rounded-full"
                animate={{ width: `${Math.min(taughtCount / 3, 1) * 100}%` }}
                transition={spring.soft}
                style={{ background: colors.charge }}
              />
            </div>
            <p className="mt-4 text-[15px] leading-relaxed text-mute">
              {taughtCount >= 3 ? (
                <span style={{ color: colors.charge }}>
                  Done. The tree is deeper than when you started, and every extra fork in it is a
                  sentence you wrote. That is the whole model — there is nothing else in there.
                </span>
              ) : (
                'Notice what happens to the shape of the tree as you teach it. A vague question makes a long, thin, slow branch. A question that splits things evenly keeps it short and quick.'
              )}
            </p>
          </Panel>
          {game}
          {mind}
        </div>
      ),
    },
    {
      id: 'recap',
      label: 'Recap',
      title: 'What you just did',
      content: (
        <div className="grid gap-4 sm:grid-cols-3">
          <Callout title="You were the training data" tone="signal">
            Every question in that tree came from a person. This is exactly how AI systems were
            built for decades — experts writing rules down, one at a time.
          </Callout>
          <Callout title="Good questions split evenly" tone="signal">
            A question that rules out half the options is worth far more than one that rules out a
            single animal. Real decision trees pick their questions on exactly that measure.
          </Callout>
          <Callout title="Readable has a cost" tone="spark">
            This tree can be checked, argued with, and corrected. It also needs a human for every
            single fact — which is why nobody builds a chatbot this way.
          </Callout>
        </div>
      ),
    },
  ]

  return <LessonShell lesson={lesson} steps={steps} />
}
