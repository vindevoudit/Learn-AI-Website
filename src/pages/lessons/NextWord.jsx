import { useEffect, useMemo, useState } from 'react'
import LessonShell from '../../components/lesson/LessonShell'
import Panel from '../../components/ui/Panel'
import Button from '../../components/ui/Button'
import Callout from '../../components/ui/Callout'
import TokenStream from '../../widgets/next-word/TokenStream'
import ProbabilityBars from '../../widgets/next-word/ProbabilityBars'
import TemperatureDial from '../../widgets/next-word/TemperatureDial'
import { getLesson } from '../../data/lessons'
import { colors } from '../../theme'
import { corpus, seeds } from '../../data/corpus'
import { END, START, buildModel, nextDistribution, sample } from '../../lib/ngram'

const lesson = getLesson('next-word')
const ACCENT = colors.charge

// Counting every word pair in ~60 sentences is instant, and the result never
// changes, so the model is built once for the life of the page.
const model = buildModel(corpus)

const TARGET_WORD = 'sandwich'
const MAX_AUTO_WORDS = 18

const sourceLabel = {
  trigram: 'has seen this exact pair of words before',
  bigram: 'only recognises the last word, not the pair',
  unigram: 'has no idea, so it is falling back to how common each word is overall',
}

export default function NextWord() {
  const [tokens, setTokens] = useState([])
  const [temperature, setTemperature] = useState(1)
  const [auto, setAuto] = useState(false)

  const finished = tokens[tokens.length - 1] === END

  const { dist, source } = useMemo(
    () => nextDistribution(model, [START, START, ...tokens], temperature),
    [tokens, temperature],
  )

  const pick = (word) => {
    setTokens((prev) => [...prev, word])
    if (word === END) setAuto(false)
  }

  const reset = () => {
    setTokens([])
    setAuto(false)
  }

  // "Let it write" — the model choosing for itself, one word at a time, paced
  // so the bars visibly resettle between picks.
  useEffect(() => {
    if (!auto || finished) return
    if (tokens.length >= MAX_AUTO_WORDS) {
      setAuto(false)
      return
    }
    const timer = setTimeout(() => {
      const { dist: current } = nextDistribution(
        model,
        [START, START, ...tokens],
        temperature,
      )
      pick(sample(current))
    }, 480)
    return () => clearTimeout(timer)
  }, [auto, tokens, temperature, finished])

  const sentence = tokens.filter((t) => t !== END).join(' ')
  const reachedTarget = tokens.includes(TARGET_WORD)

  const composer = (
    <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
      <div className="space-y-4">
        <Panel
          label="The sentence so far"
          readout={`${tokens.filter((t) => t !== END).length} words`}
        >
          <TokenStream
            tokens={tokens}
            accentHex={ACCENT}
            onUndo={() => setTokens((prev) => prev.slice(0, -1))}
          />

          {tokens.length === 0 && (
            <div className="mt-4 border-t border-line pt-4">
              <p className="rail-label mb-2">Start with</p>
              <div className="flex flex-wrap gap-2">
                {seeds.map((word) => (
                  <Button key={word} size="sm" variant="ghost" onClick={() => pick(word)}>
                    {word}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4">
            <Button
              variant="charge"
              size="sm"
              onClick={() => setAuto((a) => !a)}
              disabled={finished}
            >
              {auto ? 'Stop' : 'Let it write'}
            </Button>
            <Button variant="quiet" size="sm" onClick={reset} disabled={tokens.length === 0}>
              Clear
            </Button>
          </div>
        </Panel>

        <Panel label="Its memory" readout={source}>
          <p className="text-[15px] leading-relaxed text-mute">
            This model looks at the last two words and nothing else. Right now it is working from{' '}
            <span className="font-display text-ink">
              {tokens.length === 0
                ? 'the start of a sentence'
                : tokens.slice(-2).filter((t) => t !== END).join(' ') || 'the start of a sentence'}
            </span>{' '}
            — and it {sourceLabel[source]}.
          </p>
        </Panel>
      </div>

      <div className="space-y-4">
        <Panel
          label={finished ? 'Sentence finished' : 'What could come next'}
          readout={finished ? '—' : `${dist.length} options`}
        >
          {finished ? (
            <div>
              <p className="text-[15px] leading-relaxed text-mute">
                The model chose to stop there. Your sentence:
              </p>
              <p className="mt-3 font-display text-xl leading-snug">{sentence}</p>
              <Button className="mt-4" size="sm" variant="ghost" onClick={reset}>
                Write another
              </Button>
            </div>
          ) : (
            <ProbabilityBars dist={dist} onPick={pick} accentHex={ACCENT} />
          )}
        </Panel>

        <Panel label="Creativity dial">
          <TemperatureDial value={temperature} onChange={setTemperature} />
        </Panel>
      </div>
    </div>
  )

  const steps = [
    {
      id: 'hook',
      label: 'The idea',
      title: 'A chatbot only ever guesses one word',
      intro:
        'It does not plan a sentence. It looks at what has been written, produces a score for every word it knows, picks one, and then does the whole thing again with that word added.',
      content: (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-4">
            <Callout title="Everything it has ever read" tone="charge">
              This model learned from {model.sentenceCount} sentences and knows{' '}
              {model.vocabSize} different words. That is small enough for you to read all of it in a
              minute — the panel beside this one is the entire training set.
            </Callout>
            <Callout title="The only difference is scale" tone="charge">
              A model like ChatGPT does the same job with far more text and a memory of thousands of
              words instead of two. The step it performs is the one you are about to drive by hand.
            </Callout>
            <Callout title="Why it repeats itself" tone="spark">
              Because it remembers only the last two words, this model loses the plot quickly. Watch
              it drift halfway through a long sentence — that is a memory limit, not stupidity.
            </Callout>
          </div>

          <Panel label="Everything it was trained on" readout={`${model.sentenceCount} sentences`}>
            <div className="max-h-[380px] overflow-y-auto pr-2">
              <ul className="space-y-1.5">
                {corpus.map((line, i) => (
                  <li key={i} className="flex gap-3 text-[15px] leading-relaxed text-mute">
                    <span className="shrink-0 font-mono text-[11px] text-line">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    {line}
                  </li>
                ))}
              </ul>
            </div>
          </Panel>
        </div>
      ),
    },
    {
      id: 'play',
      label: 'Play',
      title: 'Write a sentence together',
      intro:
        'Pick a starting word, then keep choosing from the model\u2019s suggestions. The bars are its real odds. Or press "Let it write" and watch it choose for itself.',
      content: composer,
    },
    {
      id: 'challenge',
      label: 'Challenge',
      title: `Steer it to the word "${TARGET_WORD}"`,
      intro:
        'The model knows this word, but it will rarely land there on its own. Follow the high bars towards the sentence that contains it — you are doing by hand what a prompt does automatically.',
      content: (
        <div className="space-y-4">
          <Panel
            label="Target"
            readout={reachedTarget ? 'reached' : 'not yet'}
            className={reachedTarget ? 'border-charge/60' : undefined}
          >
            <p className="text-[15px] leading-relaxed text-mute">
              {reachedTarget ? (
                <span className="text-charge">
                  Got it. Notice you never typed the word — you only ever picked from what the model
                  offered, and steering the first few words was enough to make it likely.
                </span>
              ) : (
                <>
                  Try starting with <span className="font-display text-ink">the</span>, then follow
                  words about a robot and a kitchen. Lowering the creativity dial makes the model
                  stick to its favourite path, which helps.
                </>
              )}
            </p>
          </Panel>
          {composer}
        </div>
      ),
    },
    {
      id: 'recap',
      label: 'Recap',
      title: 'What you just did',
      content: (
        <div className="grid gap-4 sm:grid-cols-3">
          <Callout title="It predicts, it does not know" tone="charge">
            Every word came out of a ranked list of odds. Nothing in the model checks whether the
            sentence is true — which is exactly why chatbots can be confidently wrong.
          </Callout>
          <Callout title="Context is the whole input" tone="charge">
            Changing the last two words changed every bar on the screen. That is what writing a good
            prompt actually does.
          </Callout>
          <Callout title="Creativity is just maths" tone="spark">
            The creativity dial did not make the model smarter or dumber. It only flattened or
            sharpened the odds before it picked.
          </Callout>
        </div>
      ),
    },
  ]

  return <LessonShell lesson={lesson} steps={steps} />
}
