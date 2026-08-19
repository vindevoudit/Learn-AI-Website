import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import PageTransition from '../layout/PageTransition'
import StepNav from './StepNav'
import Button from '../ui/Button'
import { accents, duration, ease } from '../../theme'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { lessons } from '../../data/lessons'

/**
 * Every lesson is the same four beats — hook, play, challenge, recap — so the
 * three feel like one product and a fourth lesson is cheap to add.
 *
 * The current step lives in component state only. Nothing is persisted: this
 * site stores nothing about the person using it.
 */
export default function LessonShell({ lesson, steps }) {
  const [current, setCurrent] = useState(0)
  const reduced = useReducedMotion()
  const accent = accents[lesson.accent] ?? accents.signal

  const index = lessons.findIndex((l) => l.id === lesson.id)
  const next = lessons[index + 1]
  const step = steps[current]
  const isLast = current === steps.length - 1

  return (
    <PageTransition className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <Link
        to="/lessons"
        className="inline-flex items-center gap-2 rounded-panel text-sm text-mute transition-colors hover:text-ink"
      >
        <span aria-hidden="true">←</span> All lessons
      </Link>

      <header className="mb-8 mt-5">
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <span
            className="font-mono text-[11px] uppercase tracking-[0.2em]"
            style={{ color: accent.hex }}
          >
            {lesson.number} · {lesson.tagline}
          </span>
          <span className="readout">{lesson.minutes} min</span>
        </div>
        <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
          {lesson.title}
        </h1>
        <p className="mt-3 max-w-2xl text-lg leading-relaxed text-mute">{lesson.question}</p>
      </header>

      <StepNav steps={steps} current={current} onChange={setCurrent} accentHex={accent.hex} />

      <AnimatePresence mode="wait">
        <motion.div
          key={step.id}
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduced ? { opacity: 0 } : { opacity: 0, y: -6 }}
          transition={{ duration: duration.base, ease: ease.out }}
          className="mt-8"
        >
          {step.title && (
            <h2 className="mb-2 font-display text-2xl font-bold tracking-tight">{step.title}</h2>
          )}
          {step.intro && (
            <p className="mb-6 max-w-2xl text-[15px] leading-relaxed text-mute">{step.intro}</p>
          )}
          {step.content}
        </motion.div>
      </AnimatePresence>

      <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6">
        <Button
          variant="ghost"
          onClick={() => setCurrent((c) => Math.max(0, c - 1))}
          disabled={current === 0}
        >
          ← Back
        </Button>

        {isLast ? (
          next ? (
            <Button to={next.path} variant={lesson.accent === 'signal' ? 'primary' : lesson.accent}>
              Next: {next.title} →
            </Button>
          ) : (
            <Button to="/lessons" variant="ghost">
              Back to all lessons
            </Button>
          )
        ) : (
          <Button
            variant={lesson.accent === 'signal' ? 'primary' : lesson.accent}
            onClick={() => setCurrent((c) => Math.min(steps.length - 1, c + 1))}
          >
            {steps[current + 1].label} →
          </Button>
        )}
      </div>
    </PageTransition>
  )
}
