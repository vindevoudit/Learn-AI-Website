import { useCallback, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import LessonShell from '../../components/lesson/LessonShell'
import Panel from '../../components/ui/Panel'
import Button from '../../components/ui/Button'
import Slider from '../../components/ui/Slider'
import Callout from '../../components/ui/Callout'
import { getLesson } from '../../data/lessons'
import { colors, spring } from '../../theme'
import { topicById } from '../../data/feed'
import {
  SKIP,
  WATCH,
  bubbleTightness,
  createProfile,
  recommend,
  record,
  sortedScores,
  topicsSeenRecently,
} from '../../lib/recommender'

const lesson = getLesson('your-feed')

function PostCard({ post, onAct }) {
  const topic = topicById[post.topic]
  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.18 }}
      className="flex h-full flex-col rounded-panel border border-line bg-panel p-4"
    >
      <span
        className="font-mono text-[11px] uppercase tracking-[0.18em]"
        style={{ color: topic.hex }}
      >
        {topic.name}
      </span>
      <h4 className="mt-2 line-clamp-2 font-display text-[17px] leading-snug">{post.title}</h4>
      <p className="mt-1.5 line-clamp-3 flex-1 text-sm leading-relaxed text-mute">{post.blurb}</p>
      <div className="mt-4 flex gap-2">
        <Button size="sm" onClick={() => onAct(post, WATCH)}>
          Watch
        </Button>
        <Button size="sm" variant="quiet" onClick={() => onAct(post, SKIP)}>
          Skip
        </Button>
      </div>
    </motion.article>
  )
}

/** What the feed currently believes about you, ranked. */
function ProfileChart({ profile }) {
  const scores = sortedScores(profile)
  return (
    <ul className="space-y-2.5">
      {scores.map((topic) => {
        const positive = topic.score >= 0
        const width = Math.min(Math.abs(topic.score), 1) * 50
        return (
          <li key={topic.id} className="flex items-center gap-3">
            <span className="w-16 shrink-0 text-sm text-mute">{topic.name}</span>
            {/* Centre line: right of it is "likes", left of it is "does not". */}
            <span className="relative h-2.5 flex-1 rounded-full bg-line">
              <span className="absolute inset-y-0 left-1/2 w-px bg-mute/40" />
              <motion.span
                className="absolute inset-y-0 rounded-full"
                animate={{
                  width: `${width}%`,
                  left: positive ? '50%' : `${50 - width}%`,
                }}
                transition={spring.soft}
                style={{ background: positive ? topic.hex : colors.mute }}
              />
            </span>
            <span className="w-10 shrink-0 text-right font-mono text-[11px] tabular-nums text-mute">
              {topic.score >= 0 ? '+' : ''}
              {topic.score.toFixed(2)}
            </span>
          </li>
        )
      })}
    </ul>
  )
}

export default function YourFeed() {
  const [profile, setProfile] = useState(createProfile)
  const [exploration, setExploration] = useState(0)
  const [taps, setTaps] = useState(0)
  const [everBubbled, setEverBubbled] = useState(false)
  const [escaped, setEscaped] = useState(false)
  const bubbledRef = useRef(false)

  // Only the card you acted on is replaced. Reshuffling all three on every tap
  // reads as the page glitching rather than as a feed responding to you.
  const [visible, setVisible] = useState(() => recommend(profile, 3, 0))

  const tightness = bubbleTightness(profile, 6)
  const variety = topicsSeenRecently(profile, 6)

  // `record` mutates the profile in place, so a tap counter drives the redraw
  // rather than a new object each time.
  const act = useCallback(
    (post, action) => {
      record(profile, post, action)

      // The new card takes the old one's slot. Letting the others slide across
      // would move a card under the reader's cursor mid-tap.
      setVisible((current) => {
        const slot = current.findIndex((p) => p.id === post.id)
        if (slot === -1) return current
        const others = current.filter((p) => p.id !== post.id).map((p) => p.id)
        const [replacement] = recommend(profile, 1, exploration, others)
        if (!replacement) return current
        const next = [...current]
        next[slot] = replacement
        return next
      })

      const tight = bubbleTightness(profile, 6)
      if (tight === 1) {
        bubbledRef.current = true
        setEverBubbled(true)
      } else if (bubbledRef.current && tight <= 0.5 && topicsSeenRecently(profile, 6) >= 4) {
        setEscaped(true)
      }

      setTaps((n) => n + 1)
    },
    [profile, exploration],
  )

  const restart = () => {
    const fresh = createProfile()
    setProfile(fresh)
    setVisible(recommend(fresh, 3, 0))
    setTaps(0)
    setEverBubbled(false)
    setEscaped(false)
    bubbledRef.current = false
  }

  const feed = (
    <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
      <Panel label="Your feed" readout={`${taps} taps`} className="self-start">
        {/* Fixed slots: each card swaps inside its own box, so nothing on the
            page moves while someone is tapping. */}
        <div className="grid gap-3 sm:grid-cols-3">
          {visible.map((post, slot) => (
            <div key={slot} className="h-[206px]">
              <AnimatePresence mode="wait" initial={false}>
                <PostCard key={post.id} post={post} onAct={act} />
              </AnimatePresence>
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-4">
          <Button variant="quiet" size="sm" onClick={restart}>
            Start over with a blank profile
          </Button>
          <span className="readout">nothing here is saved or sent anywhere</span>
        </div>
      </Panel>

      <div className="space-y-4">
        <Panel label="What it thinks you like" readout={`${taps} signals`}>
          <ProfileChart profile={profile} />
          <p className="mt-4 border-t border-line pt-3 text-sm leading-relaxed text-mute">
            Every tap nudges one of these bars. Nothing else about you is used — no age, no name,
            no friends. Just what you tapped.
          </p>
        </Panel>

        <Panel
          label="How narrow your feed is"
          readout={variety ? `${variety} topic${variety === 1 ? '' : 's'} in your last 6` : '—'}
        >
          <div className="h-2.5 overflow-hidden rounded-full bg-line">
            <motion.div
              className="h-full rounded-full"
              animate={{ width: `${tightness * 100}%` }}
              transition={spring.soft}
              style={{ background: tightness > 0.8 ? colors.spark : colors.charge }}
            />
          </div>
          <p className="mt-3 text-[15px] leading-relaxed text-mute">
            {tightness >= 1
              ? 'Every single thing you have been shown recently is one topic. That is a filter bubble, and you built it in a couple of minutes.'
              : tightness > 0.6
                ? 'It is closing in. Most of what you are being offered now is the same thing.'
                : 'Still a mixed feed.'}
          </p>

          <div className="mt-4 border-t border-line pt-4">
            <Slider
              label="How often it shows you something else"
              value={exploration}
              onChange={setExploration}
              min={0}
              max={1}
              step={0.34}
              accent={colors.charge}
              format={(v) => (v === 0 ? 'never' : `${Math.round(v * 3)} of 3 slots`)}
            />
            <p className="mt-2 text-sm leading-relaxed text-mute">
              At <strong>never</strong>, the feed can only ever get narrower — it has no way to find
              out you might like anything else.
            </p>
          </div>
        </Panel>
      </div>
    </div>
  )

  const steps = [
    {
      id: 'hook',
      label: 'The idea',
      title: 'Nobody chose this for you. Something did.',
      intro:
        'A feed is a ranking problem. There is far more to show you than fits on a screen, so a program puts everything in order and hands you the top of the list. The only question is what it sorts by.',
      content: (
        <div className="grid gap-4 lg:grid-cols-2">
          <Panel label="The whole mechanism" readout="3 steps">
            <ol className="space-y-4">
              {[
                ['Watch what you do', 'Not what you say you like. What you actually tapped, and what you scrolled past.'],
                ['Keep a score', 'One number per topic, nudged up every time you engage and down every time you do not.'],
                ['Show the top of the list', 'Sort everything by those scores and serve the winners. Then repeat, with a better score.'],
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
            <p className="mt-5 border-t border-line pt-4 text-[15px] leading-relaxed text-mute">
              The real ones count more signals — how long you watched, whether you rewatched, what
              people like you did. But the shape is this, and this is enough to work you out.
            </p>
          </Panel>

          <div className="space-y-4">
            <Callout title="There is no opinion in it" tone="signal">
              Nothing in this program knows what skating or cooking <em>is</em>. It has a table of
              numbers and a sort function. It cannot be biased against a topic — it can only feed
              back what you already did.
            </Callout>
            <Callout title="Which is the problem" tone="spark">
              A system that only shows you more of what you already picked will make your world
              smaller every single time you use it. Nobody has to intend that for it to happen.
            </Callout>
            <Callout title="Try to notice the moment" tone="charge">
              In the next step, watch for when you stop being offered anything surprising. It comes
              faster than you would expect.
            </Callout>
          </div>
        </div>
      ),
    },
    {
      id: 'play',
      label: 'Play',
      title: 'Tap through it and watch it learn you',
      intro:
        'Watch what you like, skip what you do not. Keep an eye on the bars on the right — they are the entire profile it is building, and there is nothing else behind them.',
      content: feed,
    },
    {
      id: 'challenge',
      label: 'Challenge',
      title: 'Build a bubble, then break out of it',
      intro:
        'First, get every single thing in your last six items to be one topic. Then, without starting over, get back to a feed showing four different topics.',
      content: (
        <div className="space-y-4">
          <Panel
            label="Challenge"
            readout={escaped ? 'both done' : everBubbled ? 'now escape it' : 'build it first'}
            className={escaped ? 'border-charge/60' : undefined}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                ['Trap yourself in one topic', everBubbled],
                ['Get back to four topics', escaped],
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
              {escaped ? (
                <span style={{ color: colors.charge }}>
                  Notice what it took. Tapping differently was not enough on its own — you had to
                  make the feed show you things it had decided you would not want. On a real
                  platform, you do not have that slider.
                </span>
              ) : everBubbled ? (
                'Now try to get out. Skipping your favourite topic helps, but the feed still has to offer you something else before you can pick it — try the slider.'
              ) : (
                'Pick one topic and watch everything from it, skipping the rest. It takes fewer taps than you would think.'
              )}
            </p>
          </Panel>
          {feed}
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
            <Callout title="You trained it" tone="signal">
              Every tap was a label. You were doing the same job you did by hand in lesson 02, except
              this time you were not told that is what was happening.
            </Callout>
            <Callout title="Narrowing is the default" tone="spark">
              Showing you more of what worked last time is the obvious thing to do, and it shrinks
              your world as a side effect. That takes deliberate effort to prevent.
            </Callout>
            <Callout title="Variety has to be built in" tone="charge">
              The only thing that kept the feed wide was a rule forcing it to show you things it
              expected you to skip. Someone has to decide to add that.
            </Callout>
          </div>
          <Callout title="One honest difference" tone="signal">
            This feed sorts by what you seem to like. Most real ones sort by what keeps you there
            longest, which is not the same thing — outrage and cliffhangers hold attention better
            than things you actually enjoy.
          </Callout>
        </div>
      ),
    },
  ]

  return <LessonShell lesson={lesson} steps={steps} />
}
