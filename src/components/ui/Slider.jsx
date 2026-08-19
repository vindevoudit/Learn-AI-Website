import { colors } from '../../theme'

/**
 * A range input styled as a lab dial. Keyboard-operable for free (it's a real
 * <input type="range">), with the value always shown as text so the control
 * isn't picture-only.
 */
export default function Slider({
  label,
  value,
  onChange,
  min = -1,
  max = 1,
  step = 0.01,
  accent = colors.signal,
  format = (v) => v.toFixed(2),
  className = '',
  id,
}) {
  const inputId = id || `slider-${label?.replace(/\s+/g, '-').toLowerCase()}`
  // Fill the track up to the thumb so the value is readable at a glance.
  const pct = ((value - min) / (max - min)) * 100

  return (
    <div className={className}>
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <label htmlFor={inputId} className="font-mono text-[11px] tracking-tight text-mute">
          {label}
        </label>
        <span className="font-mono text-[11px] tabular-nums" style={{ color: accent }}>
          {format(value)}
        </span>
      </div>
      <input
        id={inputId}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="slider-input h-6 w-full cursor-pointer appearance-none bg-transparent"
        style={{
          '--pct': `${pct}%`,
          '--accent': accent,
        }}
      />
      <style>{`
        .slider-input::-webkit-slider-runnable-track {
          height: 4px;
          border-radius: 999px;
          background: linear-gradient(
            to right,
            var(--accent) 0%,
            var(--accent) var(--pct),
            ${colors.line} var(--pct),
            ${colors.line} 100%
          );
        }
        .slider-input::-moz-range-track {
          height: 4px;
          border-radius: 999px;
          background: ${colors.line};
        }
        .slider-input::-moz-range-progress {
          height: 4px;
          border-radius: 999px;
          background: var(--accent);
        }
        .slider-input::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 16px;
          height: 16px;
          margin-top: -6px;
          border-radius: 50%;
          background: ${colors.ink};
          border: 3px solid var(--accent);
          box-shadow: 0 0 12px -2px var(--accent);
          transition: transform 0.12s ease;
        }
        .slider-input:active::-webkit-slider-thumb { transform: scale(1.15); }
        .slider-input::-moz-range-thumb {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: ${colors.ink};
          border: 3px solid var(--accent);
        }
      `}</style>
    </div>
  )
}
