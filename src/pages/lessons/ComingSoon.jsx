import { useParams } from 'react-router-dom'
import PageTransition from '../../components/layout/PageTransition'
import Button from '../../components/ui/Button'
import Panel from '../../components/ui/Panel'
import NotFound from '../NotFound'
import { accents } from '../../theme'
import { getLesson, readyLessons } from '../../data/lessons'

/** Placeholder for planned lessons. Says what's coming rather than teasing. */
export default function ComingSoon() {
  const { id } = useParams()
  const lesson = getLesson(id)

  // An unknown id isn't an upcoming lesson — it's a bad URL.
  if (!lesson) return <NotFound />

  const accent = accents[lesson.accent] ?? accents.signal

  return (
    <PageTransition className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <p
        className="font-mono text-[11px] uppercase tracking-[0.24em]"
        style={{ color: accent.hex }}
      >
        {lesson.number} · {lesson.tagline}
      </p>
      <h1 className="mt-4 font-display text-4xl font-bold tracking-tight sm:text-5xl">
        {lesson.title}
      </h1>
      <p className="mt-4 text-lg leading-relaxed text-mute">{lesson.question}</p>

      <Panel label="Status" readout="not built yet" className="mt-10">
        <p className="text-[15px] leading-relaxed text-mute">{lesson.blurb}</p>
        <p className="mt-4 text-[15px] leading-relaxed text-mute">
          This one is planned but not written. The {readyLessons.length} finished lessons cover
          enough to make it make sense when it lands.
        </p>
      </Panel>

      <div className="mt-8 flex flex-wrap gap-3">
        <Button to={readyLessons[0].path}>Start lesson 01</Button>
        <Button to="/lessons" variant="ghost">
          All lessons
        </Button>
      </div>
    </PageTransition>
  )
}
