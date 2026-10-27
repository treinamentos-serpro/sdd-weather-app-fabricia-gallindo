import { weatherDataMock } from '../../../src/mocks/weather';

describe('weatherDataMock', () => {
  it('provides a city and current conditions for offline UI development', () => {
    expect(weatherDataMock.city.name).toBe('São Paulo');
    expect(weatherDataMock.city.timeZone).toBe('America/Sao_Paulo');
    expect(weatherDataMock.current.temperatureC).toBeTypeOf('number');
    expect(weatherDataMock.current.weatherCode).toBeTypeOf('number');
    expect(Number.isNaN(Date.parse(weatherDataMock.fetchedAt))).toBe(false);
  });

  it('provides exactly five consecutive dates starting on the observation date', () => {
    const observationDate = weatherDataMock.current.time.slice(0, 10);
    const firstDate = Date.parse(`${observationDate}T00:00:00Z`);

    expect(weatherDataMock.forecast).toHaveLength(5);
    expect(weatherDataMock.forecast.map((day) => day.date)).toEqual(
      Array.from({ length: 5 }, (_, index) =>
        new Date(firstDate + index * 86_400_000).toISOString().slice(0, 10),
      ),
    );
  });

  it('provides consistent daily temperature ranges and precipitation probabilities', () => {
    for (const day of weatherDataMock.forecast) {
      expect(day.temperatureMinC).toBeTypeOf('number');
      expect(day.temperatureMaxC).toBeTypeOf('number');
      expect(day.temperatureMinC).toBeLessThanOrEqual(day.temperatureMaxC);
      expect(day.precipitationProbabilityPercent).toBeGreaterThanOrEqual(0);
      expect(day.precipitationProbabilityPercent).toBeLessThanOrEqual(100);
    }
  });
});
