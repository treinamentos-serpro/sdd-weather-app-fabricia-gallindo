import type { Unit } from '../types/weather';
import { convertTemperature } from './temperature';

const dayFormatter = new Intl.DateTimeFormat('pt-BR', {
  weekday: 'short',
  day: '2-digit',
  month: '2-digit',
  timeZone: 'UTC',
});
const temperatureFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});
const probabilityFormatter = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });

export function formatDayLabel(date: string): string {
  const parsedDate = new Date(`${date}T00:00:00Z`);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    Number.isNaN(parsedDate.getTime()) ||
    parsedDate.toISOString().slice(0, 10) !== date
  ) {
    throw new RangeError(`Data de previsão inválida: ${date}`);
  }

  // A data já pertence à cidade; UTC evita reinterpretá-la no fuso do navegador.
  return dayFormatter.format(parsedDate);
}

export function formatTemperature(value: number | null, unit: Unit): string {
  if (value === null) {
    return 'Indisponível';
  }

  const converted = convertTemperature(value, 'celsius', unit);
  return `${temperatureFormatter.format(converted)} ${unit === 'celsius' ? '°C' : '°F'}`;
}

export function formatPrecipitationProbability(value: number | null): string {
  return value === null ? 'Indisponível' : `${probabilityFormatter.format(value)} %`;
}
