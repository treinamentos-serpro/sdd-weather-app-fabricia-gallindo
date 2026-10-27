import { useId } from 'react';
import { formatTemperature } from '../lib/format';
import { getWeatherCondition } from '../lib/weatherCodes';
import type { City, CurrentWeather as CurrentWeatherData, Unit } from '../types/weather';

interface CurrentWeatherProps {
  city: City;
  current: CurrentWeatherData;
  unit: Unit;
}

const metricFormatter = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });

function formatMetric(value: number | null, suffix: string): string {
  return typeof value !== 'number' || !Number.isFinite(value)
    ? 'Indisponível'
    : `${metricFormatter.format(value)} ${suffix}`;
}

export default function CurrentWeather({ city, current, unit }: CurrentWeatherProps) {
  const headingId = useId();
  const condition = getWeatherCondition(current.weatherCode, current.isDay);
  const metrics = [
    { label: 'Umidade', value: formatMetric(current.relativeHumidityPercent, '%') },
    { label: 'Vento', value: formatMetric(current.windSpeedKmh, 'km/h') },
    { label: 'Precipitação', value: formatMetric(current.precipitationMm, 'mm') },
    { label: 'Pressão', value: 'Indisponível' },
  ];

  return (
    <section
      aria-labelledby={headingId}
      className="w-full break-words rounded-3xl border border-white/10 bg-white/5 p-6 text-slate-100 shadow-glass backdrop-blur-md sm:p-8"
    >
      <p className="text-sm font-medium text-accent-400">Clima atual</p>
      <h2 className="mt-2 break-words text-2xl font-semibold text-white sm:text-3xl" id={headingId}>
        {city.name}
      </h2>
      <p className="mt-1 text-sm text-slate-300">{city.contextLabel}</p>

      <div className="mt-6 flex flex-wrap items-center gap-6">
        <span aria-hidden="true" className="text-6xl sm:text-7xl">
          {condition.icon}
        </span>
        <div className="min-w-0 max-w-full">
          <p className="sr-only">Temperatura atual</p>
          <p
            className={`font-semibold tracking-tight text-white ${
              current.temperatureC === null ? 'text-2xl sm:text-4xl' : 'text-5xl sm:text-7xl'
            }`}
          >
            {formatTemperature(current.temperatureC, unit)}
          </p>
          <p className="mt-2 text-lg text-slate-200">{condition.label}</p>
        </div>
      </div>
      <p className="mt-4 text-sm text-slate-300">
        Sensação térmica: {formatTemperature(current.apparentTemperatureC, unit)}
      </p>

      <dl className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <div className="rounded-xl border border-white/10 bg-white/5 p-4" key={metric.label}>
            <dt className="text-sm text-slate-300">{metric.label}</dt>
            <dd className="mt-2 text-lg font-semibold text-white">{metric.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
