import Slider from '../../components/ui/Slider'
import { colors } from '../../theme'

const describe = (t) => {
  if (t <= 0.4) return 'Almost always picks its favourite. Repetitive, safe, a bit boring.'
  if (t <= 0.9) return 'Leans towards likely words but still takes the occasional detour.'
  if (t <= 1.2) return 'Exactly the odds it learned from the text. No thumb on the scale.'
  if (t <= 1.8) return 'Long shots get a real chance. Sentences start to wander.'
  return 'Nearly every word is equally likely. Mostly nonsense — which is the point.'
}

/**
 * Temperature, framed as what it does rather than what it is called: it
 * reshapes the odds before a word is picked. Real chatbots expose this exact
 * dial, usually labelled "creativity".
 */
export default function TemperatureDial({ value, onChange }) {
  return (
    <div>
      <Slider
        label="Creativity (temperature)"
        value={value}
        onChange={onChange}
        min={0.2}
        max={2.2}
        step={0.05}
        accent={colors.charge}
        format={(v) => v.toFixed(2)}
      />
      <p className="mt-2 text-sm leading-relaxed text-mute">{describe(value)}</p>

      <div className="mt-3 flex gap-2">
        {[
          ['Careful', 0.3],
          ['Normal', 1],
          ['Wild', 2],
        ].map(([name, preset]) => (
          <button
            key={name}
            type="button"
            onClick={() => onChange(preset)}
            className={`rounded-panel border px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.14em] transition-colors ${
              Math.abs(value - preset) < 0.03
                ? 'border-charge text-charge'
                : 'border-line text-mute hover:text-ink'
            }`}
          >
            {name}
          </button>
        ))}
      </div>
    </div>
  )
}
