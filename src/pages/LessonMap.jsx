import PageTransition from '../components/layout/PageTransition'
import Reveal from '../components/motion/Reveal'
import LessonCard from '../components/lesson/LessonCard'
import { lessons } from '../data/lessons'

export default function LessonMap() {
  return (
    <PageTransition className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <header className="max-w-2xl">
        <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-signal">
          The course
        </p>
        <h1 className="mt-4 font-display text-4xl font-bold tracking-tight sm:text-5xl">
          Six lessons, in order
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-mute">
          They build on each other, so lesson 01 first is the easy recommendation. Nothing stops you
          jumping around.
        </p>
      </header>

      <ol className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {lessons.map((lesson, i) => (
          <li key={lesson.id}>
            <Reveal delay={(i % 3) * 0.07} className="h-full">
              <LessonCard lesson={lesson} />
            </Reveal>
          </li>
        ))}
      </ol>
    </PageTransition>
  )
}
