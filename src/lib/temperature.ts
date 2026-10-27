import type { Unit } from '../types/weather';

export function convertTemperature(value: number, from: Unit, to: Unit): number {
  if (from === to) {
    return value;
  }

  return from === 'celsius' ? (value * 9) / 5 + 32 : ((value - 32) * 5) / 9;
}
