import PageTransition from '../components/layout/PageTransition'
import Button from '../components/ui/Button'

export default function NotFound() {
  return (
    <PageTransition className="mx-auto flex max-w-2xl flex-col items-start px-4 py-24 sm:px-6">
      <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-spark">
        No signal · 404
      </p>
      <h1 className="mt-4 font-display text-4xl font-bold tracking-tight">
        There's nothing at this address.
      </h1>
      <p className="mt-4 text-lg leading-relaxed text-mute">
        The link may be mistyped, or the page may never have existed. The lessons are all one click
        away.
      </p>
      <div className="mt-8 flex gap-3">
        <Button to="/lessons">See all lessons</Button>
        <Button to="/" variant="ghost">
          Home
        </Button>
      </div>
    </PageTransition>
  )
}
