import { formatTemperature } from '../../src/lib/format';
import { convertTemperature } from '../../src/lib/temperature';

describe('convertTemperature', () => {
  it.each([
    [0, 'celsius', 'fahrenheit', 32],
    [100, 'celsius', 'fahrenheit', 212],
    [-40, 'celsius', 'fahrenheit', -40],
    [32, 'fahrenheit', 'celsius', 0],
    [212, 'fahrenheit', 'celsius', 100],
  ] as const)('converts %s from %s to %s', (value, from, to, expected) => {
    expect(convertTemperature(value, from, to)).toBe(expected);
  });

  it.each([
    [18.25, 'celsius', 'fahrenheit', 64.85],
    [64.85, 'fahrenheit', 'celsius', 18.25],
    [-40, 'fahrenheit', 'celsius', -40],
    [-10.25, 'celsius', 'fahrenheit', 13.55],
  ] as const)('preserves precision converting %s from %s to %s', (value, from, to, expected) => {
    expect(convertTemperature(value, from, to)).toBeCloseTo(expected, 10);
  });

  it.each([-40, -2.35, 0, 18.25, 100])(
    'preserves %s Celsius through repeated round trips',
    (value) => {
      let converted = value;
      for (let index = 0; index < 20; index += 1) {
        converted = convertTemperature(
          convertTemperature(converted, 'celsius', 'fahrenheit'),
          'fahrenheit',
          'celsius',
        );
      }
      expect(converted).toBeCloseTo(value, 10);
    },
  );

  it.each(['celsius', 'fahrenheit'] as const)(
    'returns the original value when converting %s to itself',
    (unit) => {
      expect(convertTemperature(18.25, unit, unit)).toBe(18.25);
    },
  );
});

describe('formatTemperature', () => {
  it.each([
    [25.26, 'celsius', '25,3 °C'],
    [25.26, 'fahrenheit', '77,5 °F'],
  ] as const)('rounds %s in %s and includes its symbol', (value, unit, expected) => {
    expect(formatTemperature(value, unit)).toBe(expected);
  });
});
