import { motion } from 'framer-motion'
import { spring } from '../../theme'

/**
 * The four beats of a lesson. Clickable, so a student can jump back to the
 * explanation without losing the state of the widget they were playing with.
 */
export default function StepNav({ steps, current, onChange, accentHex }) {
  return (
    <nav aria-label="Lesson steps" className="panel flex overflow-x-auto">
      {steps.map((step, i) => {
        const active = i === current
        return (
          <button
            key={step.id}
            type="button"
            onClick={() => onChange(i)}
            aria-current={active ? 'step' : undefined}
            className={`relative flex-1 whitespace-nowrap px-4 py-3 text-left transition-colors ${
              active ? 'text-ink' : 'text-mute hover:text-ink'
            }`}
          >
            {active && (
              <motion.span
                layoutId="step-underline"
                transition={spring.snappy}
                className="absolute inset-x-0 bottom-0 h-[2px]"
                style={{ background: accentHex }}
              />
            )}
            <span className="block font-mono text-[10px] uppercase tracking-[0.18em] text-mute">
              {String(i + 1).padStart(2, '0')}
            </span>
            <span className="block text-sm font-medium">{step.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
