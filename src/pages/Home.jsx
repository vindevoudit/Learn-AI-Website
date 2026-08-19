import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import PageTransition from '../components/layout/PageTransition'
import SignalTrace from '../components/motion/SignalTrace'
import Reveal from '../components/motion/Reveal'
import LessonCard from '../components/lesson/LessonCard'
import Button from '../components/ui/Button'
import { lessons, readyLessons } from '../data/lessons'
import { riseIn, stagger } from '../theme'

// Spelled out reads better in a heading than a digit; the fallback keeps this
// honest if the curriculum grows past the list.
const NUMBER_WORDS = ['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine']
const countWord = (n) => NUMBER_WORDS[n] ?? String(n)

const facts = [
  {
    label: 'No accounts',
    body: 'Nothing to sign up for, nothing to remember. Open a lesson and start.',
  },
  {
    label: 'Nothing saved',
    body: 'Every drawing and every sentence stays in your browser and disappears when you close it.',
  },
  {
    label: 'Real models',
    body: 'The networks here are small, but they are the genuine thing — not videos pretending to be interactive.',
  },
]

export default function Home() {
  return (
    <PageTransition>
      {/* Hero: the thesis is the line itself. */}
      <section className="relative overflow-hidden border-b border-line">
        <div className="mx-auto max-w-6xl px-4 pb-0 pt-16 sm:px-6 sm:pt-24">
          <motion.div variants={stagger(0.05, 0.09)} initial="hidden" animate="show">
            <motion.p
              variants={riseIn}
              className="font-mono text-[11px] uppercase tracking-[0.24em] text-signal"
            >
              Artificial intelligence, taken apart
            </motion.p>

            <motion.h1
              variants={riseIn}
              className="mt-4 max-w-3xl font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl"
            >
              This line is being drawn by a neural network.
            </motion.h1>

            <motion.p
              variants={riseIn}
              className="mt-5 max-w-xl text-lg leading-relaxed text-mute"
            >
              Not a picture of one — an actual network, running in this tab, recalculating the curve
              hundreds of times a second. Move your cursor and you change its numbers.
            </motion.p>

            <motion.div variants={riseIn} className="mt-8 flex flex-wrap gap-3">
              <Button to={readyLessons[0].path} size="lg">
                Start with lesson 01
              </Button>
              <Button to="/lessons" variant="ghost" size="lg">
                See all lessons
              </Button>
            </motion.div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.9, delay: 0.25 }}
          className="mt-10"
        >
          <SignalTrace height={240} />
          <div className="mx-auto max-w-6xl px-4 pb-8 sm:px-6">
            <p className="readout">
              2 inputs → 5 hidden neurons → 1 output · redrawn every frame · cursor shifts the bias
            </p>
          </div>
        </motion.div>
      </section>

      {/* The curriculum. */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <Reveal>
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            {countWord(readyLessons.length)} things to build
          </h2>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-mute">
            Each lesson gives you something to turn, draw, teach or break. Read the explanation if
            you want it — but the point is the machine in the middle of the page.
          </p>
        </Reveal>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {readyLessons.map((lesson, i) => (
            <Reveal key={lesson.id} delay={i * 0.08}>
              <LessonCard lesson={lesson} />
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.1}>
          <p className="mt-6 text-sm text-mute">
            {lessons.length - readyLessons.length} more lessons are on the way —{' '}
            <Link className="text-signal underline underline-offset-4" to="/lessons">
              see what's planned
            </Link>
            .
          </p>
        </Reveal>
      </section>

      {/* Three plain facts, set as instrument readouts rather than feature cards. */}
      <section className="border-t border-line">
        <div className="mx-auto grid max-w-6xl gap-px bg-line sm:grid-cols-3">
          {facts.map((fact, i) => (
            <Reveal key={fact.label} delay={i * 0.06} className="bg-void">
              <div className="h-full px-4 py-8 sm:px-6">
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-charge">
                  {fact.label}
                </p>
                <p className="mt-2 text-[15px] leading-relaxed text-mute">{fact.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>
    </PageTransition>
  )
}
