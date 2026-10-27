import { convertTemperature } from '../../../src/lib/temperature';

describe('convertTemperature', () => {
  it.each([
    [0, 'celsius', 'fahrenheit', 32],
    [100, 'celsius', 'fahrenheit', 212],
    [32, 'fahrenheit', 'celsius', 0],
    [212, 'fahrenheit', 'celsius', 100],
  ] as const)('converts %s from %s to %s', (value, from, to, expected) => {
    expect(convertTemperature(value, from, to)).toBeCloseTo(expected);
  });

  it('returns the original value when the units match', () => {
    expect(convertTemperature(18.25, 'celsius', 'celsius')).toBe(18.25);
  });
});
