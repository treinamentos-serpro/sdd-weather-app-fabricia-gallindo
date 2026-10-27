import type { Unit } from '../types/weather';

interface UnitToggleProps {
  unit: Unit;
  onChange: (unit: Unit) => void;
}

const options = [
  { value: 'celsius', symbol: '°C', label: 'Celsius' },
  { value: 'fahrenheit', symbol: '°F', label: 'Fahrenheit' },
] as const;

export default function UnitToggle({ unit, onChange }: UnitToggleProps) {
  return (
    <div
      aria-label="Unidade de temperatura"
      className="inline-flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-white/5 p-2 backdrop-blur-md"
      role="group"
    >
      {options.map((option) => (
        <button
          aria-pressed={unit === option.value}
          className={`min-h-12 rounded-lg border px-4 py-2 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400 ${
            unit === option.value
              ? 'border-accent-400 bg-accent-500 text-night-900'
              : 'border-slate-400 bg-white/5 text-slate-200 hover:bg-white/10'
          }`}
          key={option.value}
          onClick={() => onChange(option.value)}
          type="button"
        >
          <span className="text-base font-semibold">{option.symbol}</span> {option.label}
        </button>
      ))}
    </div>
  );
}
