import { formatDayLabel, formatPrecipitationProbability, formatTemperature } from '../lib/format';
import { getWeatherCondition } from '../lib/weatherCodes';
import type { ForecastDay, Unit } from '../types/weather';

interface ForecastCardProps {
  day: ForecastDay;
  unit: Unit;
}

export default function ForecastCard({ day, unit }: ForecastCardProps) {
  const condition = getWeatherCondition(day.weatherCode);

  return (
    <article className="h-full min-w-0 break-words rounded-2xl border border-white/10 bg-white/5 p-4 text-slate-100 backdrop-blur-md">
      <h3 className="text-sm font-semibold text-white">
        <time dateTime={day.date}>{formatDayLabel(day.date)}</time>
      </h3>
      <span aria-hidden="true" className="mt-4 block text-4xl">
        {condition.icon}
      </span>
      <p className="mt-2 text-sm text-slate-300">{condition.label}</p>
      <dl className="mt-4 space-y-3">
        <div>
          <dt className="text-xs text-slate-300">Máxima</dt>
          <dd className="font-semibold text-sun">{formatTemperature(day.temperatureMaxC, unit)}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-300">Mínima</dt>
          <dd className="font-semibold text-slate-100">
            {formatTemperature(day.temperatureMinC, unit)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-slate-300">Probabilidade de chuva</dt>
          <dd className="text-sm text-accent-400">
            {formatPrecipitationProbability(day.precipitationProbabilityPercent)}
          </dd>
        </div>
      </dl>
    </article>
  );
}
