import {
  formatDayLabel,
  formatPrecipitationProbability,
  formatTemperature,
} from '../../../src/lib/format';

describe('formatDayLabel', () => {
  it.each([
    ['2026-10-27', 'ter., 27/10'],
    ['2026-11-01', 'dom., 01/11'],
    ['2027-01-01', 'sex., 01/01'],
    ['2028-02-29', 'ter., 29/02'],
  ])('formats %s as a calendar date without timezone shifts', (date, label) => {
    expect(formatDayLabel(date)).toBe(label);
  });

  it.each([
    '',
    'invalid',
    '2026-02-29',
    '2026-04-31',
    '2026-13-01',
    '2026-1-01',
  ])('explicitly rejects an invalid calendar date: %j', (date) => {
    expect(() => formatDayLabel(date)).toThrow(RangeError);
  });
});

describe('formatTemperature', () => {
  it.each([
    [0, 'celsius', '0,0 °C'],
    [0, 'fahrenheit', '32,0 °F'],
    [25.4, 'fahrenheit', '77,7 °F'],
    [-2.35, 'celsius', '-2,4 °C'],
    [null, 'fahrenheit', 'Indisponível'],
  ] as const)('formats %s in %s as %s', (value, unit, expected) => {
    expect(formatTemperature(value, unit)).toBe(expected);
  });
});

describe('formatPrecipitationProbability', () => {
  it.each([
    [0, '0 %'],
    [100, '100 %'],
    [25.5, '25,5 %'],
    [null, 'Indisponível'],
  ] as const)('formats %s as %s', (value, expected) => {
    expect(formatPrecipitationProbability(value)).toBe(expected);
  });
});
