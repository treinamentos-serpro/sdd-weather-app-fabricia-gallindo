import { getWeatherCondition } from '../../../src/lib/weatherCodes';

describe('getWeatherCondition', () => {
  it.each([
    [0, 'Céu limpo'],
    [1, 'Predominantemente limpo'],
    [2, 'Parcialmente nublado'],
    [3, 'Nublado'],
    [45, 'Nevoeiro'],
    [48, 'Nevoeiro com geada'],
    [51, 'Garoa leve'],
    [53, 'Garoa moderada'],
    [55, 'Garoa intensa'],
    [56, 'Garoa congelante leve'],
    [57, 'Garoa congelante intensa'],
    [61, 'Chuva leve'],
    [63, 'Chuva moderada'],
    [65, 'Chuva intensa'],
    [66, 'Chuva congelante leve'],
    [67, 'Chuva congelante intensa'],
    [71, 'Neve leve'],
    [73, 'Neve moderada'],
    [75, 'Neve intensa'],
    [77, 'Grãos de neve'],
    [80, 'Pancadas de chuva leves'],
    [81, 'Pancadas de chuva moderadas'],
    [82, 'Pancadas de chuva intensas'],
    [85, 'Pancadas de neve leves'],
    [86, 'Pancadas de neve intensas'],
    [95, 'Trovoadas'],
    [96, 'Trovoadas com granizo leve'],
    [99, 'Trovoadas com granizo intenso'],
  ])('maps WMO code %s to its condition', (code, label) => {
    expect(getWeatherCondition(code).label).toBe(label);
    expect(getWeatherCondition(code).icon).not.toBe('❔');
  });

  it('distinguishes missing and unknown conditions', () => {
    expect(getWeatherCondition(null)).toEqual({ label: 'Condição indisponível', icon: '❔' });
    expect(getWeatherCondition(999)).toEqual({
      label: 'Condição desconhecida (código 999)',
      icon: '❔',
    });
  });

  it.each([0, 1])('uses a moon only at night for code %s without mutating day icons', (code) => {
    const daytime = getWeatherCondition(code, true);
    expect(getWeatherCondition(code, false).icon).toBe('🌙');
    expect(getWeatherCondition(code, true)).toEqual(daytime);
    expect(getWeatherCondition(code, null).icon).not.toBe('🌙');
  });
});
